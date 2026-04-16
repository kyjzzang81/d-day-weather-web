/**
 * D Day Weather - fetch-forecast Edge Function
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const FORECAST_DAYS   = 14;

const HOURLY_PARAMS = [
  "temperature_2m", "apparent_temperature", "relativehumidity_2m",
  "precipitation", "rain", "snowfall", "weathercode",
  "cloudcover", "windspeed_10m", "winddirection_10m", "windgusts_10m",
].join(",");

// =============================================
// 유틸
// =============================================

async function fetchForecast(city: { id: string; lat: number; lon: number }) {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set("latitude",      String(city.lat));
  url.searchParams.set("longitude",     String(city.lon));
  url.searchParams.set("hourly",        HOURLY_PARAMS);
  url.searchParams.set("timezone",      "UTC");
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));

  // 429 Rate Limit 자동 재시도 (최대 3회, 지수 백오프)
  let res: Response | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(url.toString());
    if (res.status !== 429) break;
    const wait = attempt * 1000; // 1s, 2s, 3s
    await new Promise((r) => setTimeout(r, wait));
  }
  if (!res) throw new Error(`Open-Meteo 응답 없음 [${city.id}]`);
  if (!res.ok) throw new Error(`Open-Meteo 오류 [${city.id}]: ${res.status}`);

  const data = await res.json();
  const h    = data?.hourly;
  if (!h?.time?.length) throw new Error(`응답 형식 오류 [${city.id}]`);

  const fetchedAt = new Date().toISOString();

  return h.time.map((t: string, i: number) => ({
    city_id:        city.id,
    timestamp:      new Date(t + "Z").toISOString(),
    temperature:    h.temperature_2m?.[i]        ?? null,
    apparent_temp:  h.apparent_temperature?.[i]  ?? null,
    humidity:       h.relativehumidity_2m?.[i]   != null
                      ? Math.round(h.relativehumidity_2m[i])
                      : null,
    precipitation:  h.precipitation?.[i]         ?? null,
    rain:           h.rain?.[i]                  ?? null,
    snowfall:       h.snowfall?.[i]              ?? null,
    weather_code:   h.weathercode?.[i]           ?? null,
    cloud_cover:    h.cloudcover?.[i]            != null
                      ? Math.round(h.cloudcover[i])
                      : null,
    wind_speed:     h.windspeed_10m?.[i]         ?? null,
    wind_direction: h.winddirection_10m?.[i]     != null
                      ? Math.round(h.winddirection_10m[i])
                      : null,
    wind_gusts:     h.windgusts_10m?.[i]         ?? null,
    fetched_at:     fetchedAt,
  }));
}

// =============================================
// 메인 핸들러
// =============================================

Deno.serve(async () => {
  const log: string[] = [];
  const result = {
    started_at:    new Date().toISOString(),
    finished_at:   "",
    total_cities:  0,
    success_count: 0,
    failed_cities: [] as string[],
    delete_status: "",
    error:         "",
  };

  const step = (msg: string) => {
    console.log(msg);
    log.push(msg);
  };

  try {
    step(`[1] 환경변수 확인 SUPABASE_URL=${!!SUPABASE_URL} KEY=${!!SUPABASE_KEY}`);
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("환경변수 누락");
    }

    step("[2] Supabase 클라이언트 생성");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
      global: {
        headers: { Authorization: `Bearer ${SUPABASE_KEY}` },
      },
    });

    step("[3] 도시 목록 조회");
    const citiesRes  = await supabase.from("cities").select("id, lat, lon");
    step(`[3] 결과: data=${citiesRes?.data?.length} error=${JSON.stringify(citiesRes?.error)}`);

    if (citiesRes?.error) throw new Error(`도시 조회 실패: ${citiesRes.error.message}`);
    const cities = citiesRes?.data ?? [];
    if (!cities.length)  throw new Error("도시 목록 비어 있음");
    result.total_cities = cities.length;

    step(`[4] 예보 수집 시작 (${cities.length}개 도시, 병렬 10개씩)`);

    const CONCURRENCY = 10;
    for (let i = 0; i < cities.length; i += CONCURRENCY) {
      const batch = cities.slice(i, i + CONCURRENCY);
      step(`  배치 ${Math.floor(i / CONCURRENCY) + 1}: ${batch.map((c: { id: string }) => c.id).join(", ")}`);

      await Promise.allSettled(
        batch.map(async (city: { id: string; lat: number; lon: number }) => {
          try {
            const rows = await fetchForecast(city);
            if (!rows.length) return;

            const upsertRes   = await supabase
              .from("forecast_weather")
              .upsert(rows, { onConflict: "city_id,timestamp" });
            const upsertError = upsertRes?.error ?? null;

            if (upsertError) throw new Error(upsertError.message);
            result.success_count++;

          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            step(`  ❌ ${city.id}: ${msg}`);
            result.failed_cities.push(city.id);
          }
        })
      );

      // 배치 사이 딜레이 (API rate limit 방지)
      if (i + CONCURRENCY < cities.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    step(`[5] 예보 수집 완료 성공=${result.success_count} 실패=${result.failed_cities.length}`);

    step("[6] 만료 데이터 삭제");
    try {
      const cutoff     = new Date();
      cutoff.setDate(cutoff.getDate() - FORECAST_DAYS);
      const deleteRes  = await supabase
        .from("forecast_weather")
        .delete()
        .lt("timestamp", cutoff.toISOString());
      const deleteErr  = deleteRes?.error ?? null;

      if (deleteErr) {
        step(`[6] 삭제 실패: ${deleteErr.message}`);
        result.delete_status = `실패: ${deleteErr.message}`;
      } else {
        step("[6] 삭제 완료");
        result.delete_status = "완료";
      }
    } catch (delErr) {
      const msg = delErr instanceof Error ? delErr.message : String(delErr);
      step(`[6] 삭제 에러: ${msg}`);
      result.delete_status = `에러: ${msg}`;
    }

  } catch (err) {
    const msg   = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack    : "";
    step(`[ERROR] ${msg}`);
    step(`[STACK] ${stack}`);
    result.error = msg;
  }

  result.finished_at = new Date().toISOString();
  step(`[완료] ${result.finished_at}`);

  const status = result.error ? 500 : 200;
  return new Response(
    JSON.stringify({ ...result, log }, null, 2),
    { status, headers: { "Content-Type": "application/json" } }
  );
});
