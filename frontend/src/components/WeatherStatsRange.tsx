import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { WeatherStatistics, HourlyAverage } from "../types/weather";
import {
  analyzeWeather,
  WeatherAnalysis,
  ActivityItem,
  AvoidItem,
  PackingItem,
} from "../utils/weatherRules";

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function getWeatherLottie(stats: WeatherStatistics["statistics"]): string {
  if (stats.avgWindSpeed >= 25) return "/weather-windy.lottie";
  const {
    snowProbability: snowP,
    rainProbability: rainP,
    clearProbability: clearP,
    precipitation,
  } = stats;
  const avg = precipitation.average;
  if (snowP >= 30)
    return avg >= 3
      ? "/weather-heavy-snow.lottie"
      : "/weather-light-snow.lottie";
  if (snowP >= 15) return "/weather-light-snow.lottie";
  if (rainP >= 40)
    return avg >= 5
      ? "/weather-heavy-rain.lottie"
      : "/weather-light-rain.lottie";
  if (rainP >= 20) return "/weather-light-rain.lottie";
  if (clearP >= 55) return "/weather-sunny.lottie";
  if (clearP >= 35) return "/weather-partly-cloudy.lottie";
  return "/weather-foggy.lottie";
}

function getYearlyLottie(d: {
  dominantWeatherCode: number;
  totalRain: number;
  totalSnowfall: number;
  maxWindGust: number;
  totalPrecipitation: number;
}): string {
  if (d.maxWindGust >= 50) return "/weather-windy.lottie";
  if (d.totalSnowfall >= 3) return "/weather-heavy-snow.lottie";
  if (d.totalSnowfall >= 0.5) return "/weather-light-snow.lottie";
  if (d.totalRain >= 10 || d.totalPrecipitation >= 10)
    return "/weather-heavy-rain.lottie";
  if (d.totalRain >= 1 || d.totalPrecipitation >= 1)
    return "/weather-light-rain.lottie";
  const code = d.dominantWeatherCode;
  if ([45, 48].includes(code)) return "/weather-foggy.lottie";
  if (code <= 1) return "/weather-sunny.lottie";
  if (code <= 3) return "/weather-partly-cloudy.lottie";
  return "/weather-partly-cloudy.lottie";
}

function getLottieFromWeatherCode(code: number): string {
  if ([45, 48].includes(code)) return "/weather-foggy.lottie";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return "/weather-light-snow.lottie";
  if (code >= 80 && code <= 82) return "/weather-light-rain.lottie";
  if (code >= 51 && code <= 67) return "/weather-heavy-rain.lottie";
  if (code >= 95) return "/weather-heavy-rain.lottie";
  if (code <= 1) return "/weather-sunny.lottie";
  if (code <= 3) return "/weather-partly-cloudy.lottie";
  return "/weather-partly-cloudy.lottie";
}

interface TimePeriod {
  sky: string;
  temp: number;
  lottie: string;
}

function describeTimePeriod(hours: HourlyAverage[]): TimePeriod {
  if (hours.length === 0)
    return { sky: "맑은", temp: 0, lottie: "/weather-sunny.lottie" };
  const avgTemp = Math.round(
    hours.reduce((s, h) => s + h.avgTemp, 0) / hours.length,
  );
  const avgCloud =
    hours.reduce((s, h) => s + h.avgCloudCover, 0) / hours.length;
  const avgPrecip =
    hours.reduce((s, h) => s + h.avgPrecipitation, 0) / hours.length;
  const hasSnow = hours.some((h) =>
    [71, 73, 75, 77, 85, 86].includes(h.dominantWeatherCode),
  );
  if (hasSnow)
    return avgPrecip >= 0.3
      ? {
          sky: "눈 내리는",
          temp: avgTemp,
          lottie: "/weather-heavy-snow.lottie",
        }
      : { sky: "눈 오는", temp: avgTemp, lottie: "/weather-light-snow.lottie" };
  if (avgPrecip >= 2)
    return {
      sky: "비 오는",
      temp: avgTemp,
      lottie: "/weather-heavy-rain.lottie",
    };
  if (avgPrecip >= 0.3)
    return {
      sky: "비 살짝 오는",
      temp: avgTemp,
      lottie: "/weather-light-rain.lottie",
    };
  if (avgCloud >= 70)
    return { sky: "흐린", temp: avgTemp, lottie: "/weather-foggy.lottie" };
  if (avgCloud >= 40)
    return {
      sky: "구름 낀",
      temp: avgTemp,
      lottie: "/weather-partly-cloudy.lottie",
    };
  return { sky: "맑은", temp: avgTemp, lottie: "/weather-sunny.lottie" };
}

function buildNarrativeTitle(
  city: string,
  m: TimePeriod,
  a: TimePeriod,
  e: TimePeriod,
): string {
  if (m.sky === a.sky && a.sky === e.sky) return `기간 내내 ${m.sky},\n${city}`;
  if (m.sky === a.sky) return `${m.sky} 낮,\n${e.sky} 저녁의 ${city}`;
  if (a.sky === e.sky) return `${m.sky} 아침,\n${a.sky} 오후의 ${city}`;
  return `${m.sky} 아침, ${a.sky} 오후,\n${e.sky} 저녁의 ${city}`;
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>{parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p))}</>
  );
}

function precipImpact(avgMm: number, maxMm: number) {
  if (avgMm < 1)
    return {
      label: "거의 없음",
      desc: "우산 없이도 괜찮아요.",
      colorVar: "--c-primary",
    };
  if (avgMm < 5)
    return {
      label: "가벼운 비",
      desc: "접이식 우산이면 충분합니다.",
      colorVar: "--c-primary",
    };
  if (avgMm < 15)
    return {
      label: "보통",
      desc: "우산은 꼭 챙기세요.",
      colorVar: "--c-negative",
    };
  if (avgMm < 30)
    return {
      label: "다소 많음",
      desc:
        maxMm >= 40
          ? "방수 신발과 우비를 추천합니다."
          : "야외보다 실내 위주로 계획하세요.",
      colorVar: "--c-negative",
    };
  return {
    label: "많음",
    desc: "방수 장비 필수, 야외 일정은 최소화하세요.",
    colorVar: "--c-negative",
  };
}

/** "MM-DD~MM-DD" → startStr, endStr, nights */
function parseDateRange(date: string): {
  startStr: string;
  endStr: string;
  nights: number;
} {
  if (!date.includes("~")) return { startStr: date, endStr: date, nights: 0 };
  const [start, end] = date.split("~");
  const [sm, sd] = start.split("-").map(Number);
  const [em, ed] = end.split("-").map(Number);
  const s = new Date(2024, sm - 1, sd);
  const e = new Date(2024, em - 1, ed);
  const nights = Math.max(
    1,
    Math.round((e.getTime() - s.getTime()) / 86400000),
  );
  return { startStr: `${sm}월 ${sd}일`, endStr: `${em}월 ${ed}일`, nights };
}

// ─── Reel 1: 날씨 요약 (날짜 버전과 구조 통일 + 기간 컨텍스트 추가) ──────────
const RangeReel1: React.FC<{
  statistics: WeatherStatistics;
  analysis: WeatherAnalysis;
}> = ({ statistics, analysis }) => {
  const s = statistics.statistics;
  const ha = s.hourlyAverages;
  const cityName = statistics.city_korean || statistics.city;

  const morning = describeTimePeriod(
    ha.filter((h) => h.hour >= 6 && h.hour < 12),
  );
  const afternoon = describeTimePeriod(
    ha.filter((h) => h.hour >= 12 && h.hour < 18),
  );
  const evening = describeTimePeriod(
    ha.filter((h) => h.hour >= 18 && h.hour < 22),
  );
  const title = buildNarrativeTitle(cityName, morning, afternoon, evening);

  const { startStr, endStr, nights } = parseDateRange(statistics.date);
  const { verdict } = analysis;
  const stars = "⭐".repeat(verdict.stars);

  const pills: { label: string; cls: string }[] = [];
  if (analysis.skyGrade === "CLEAR")
    pills.push({ label: "야외 좋음", cls: "pill-mint" });
  else if (analysis.skyGrade === "PARTLY")
    pills.push({ label: "야외 반반", cls: "pill-blue" });
  else pills.push({ label: "실내 추천", cls: "pill-blue" });
  if (analysis.tempGrade === "COLD")
    pills.push({ label: "방한 필수", cls: "pill-red" });
  else if (analysis.tempGrade === "COOL")
    pills.push({ label: "겉옷 필수", cls: "pill-amber" });
  if (analysis.rainGrade !== "NO_RAIN")
    pills.push({ label: "우산 챙기기", cls: "pill-red" });
  if (analysis.flags.includes("HIGH_DIURNAL"))
    pills.push({ label: "일교차 주의", cls: "pill-amber" });

  return (
    <div className="reel-content">
      {/* 내러티브 타이틀 (날짜 버전과 동일 구조) */}
      <div className="slide-title s1-narrative" style={{ fontSize: 22 }}>
        {title.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </div>

      {/* 기간 배지 (기간 버전 전용) */}
      <div className="range-period-badge">
        <span className="rpb-dates">
          {startStr} ~ {endStr}
        </span>
        <span className="rpb-sep">·</span>
        <span className="rpb-nights">
          {nights}박 {nights + 1}일
        </span>
      </div>

      {/* Lottie */}
      <div className="s1-illust">
        <DotLottieReact
          src={getWeatherLottie(s)}
          loop
          autoplay
          style={{ width: 200, height: 200 }}
        />
      </div>

      {/* 시간대별 날씨 row (날짜 버전과 동일 구조) */}
      {ha.length > 0 && (
        <div className="s1-tl-row">
          {[
            { label: "오전", p: morning },
            { label: "오후", p: afternoon },
            { label: "저녁", p: evening },
          ].map(({ label, p }) => (
            <div key={label} className="s1-tl-cell">
              <DotLottieReact
                src={p.lottie}
                loop
                autoplay
                style={{ width: 32, height: 32 }}
              />
              <div className="s1-tl-temp">{p.temp}°</div>
              <div className="s1-tl-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 통계 row (바람/습도/강수확률 — 날짜 버전과 동일) */}
      <div className="s1-stats">
        <div className="s1-stat">
          <div className="s1-stat-val">{Math.round(s.avgWindSpeed)}km/h</div>
          <div className="s1-stat-key">바람</div>
        </div>
        <div className="s1-stat">
          <div className="s1-stat-val">{Math.round(s.humidity.average)}%</div>
          <div className="s1-stat-key">습도</div>
        </div>
        <div className="s1-stat">
          <div className="s1-stat-val">{Math.round(s.rainProbability)}%</div>
          <div className="s1-stat-key">강수확률</div>
        </div>
      </div>

      {/* 여행 적합도 verdict */}
      <div className="verdict-inline">
        <div className="vi-left">
          {stars && <span className="vi-stars">{stars}</span>}
          <span className="vi-grade">
            {verdict.label.replace(/⭐/g, "").trim()}
          </span>
        </div>
        <div className="vi-title">{verdict.title}</div>
      </div>

      {pills.length > 0 && (
        <div className="v-pills" style={{ marginTop: 8 }}>
          {pills.map((p, i) => (
            <span key={i} className={`v-pill ${p.cls}`}>
              {p.label}
            </span>
          ))}
        </div>
      )}

      <div
        className="slide-desc"
        style={{ marginTop: 10, fontSize: 13, marginBottom: 0 }}
      >
        <BoldText text={analysis.summaryText} />
      </div>
    </div>
  );
};

// ─── Reel 2: 기온 분포 (날짜 버전과 타이틀/라벨 통일) ──────────────────────
const RangeReel2Temp: React.FC<{
  statistics: WeatherStatistics;
  bestTimeText: string;
  onYearlyClick: () => void;
}> = ({ statistics, bestTimeText, onYearlyClick }) => {
  const s = statistics.statistics;
  const { temperature, trend } = s;
  const avg = Math.round(temperature.avg.average);
  const min = Math.round(temperature.min.lowest);
  const max = Math.round(temperature.max.highest);
  const range = max - min || 1;
  const avgPct = ((avg - min) / range) * 100;
  const trendDiff = trend.diff;
  const ha = s.hourlyAverages;
  const validYears = statistics.yearlyData.filter(
    (d) => d.tempMax !== 0 || d.tempMin !== 0,
  );

  return (
    <div className="reel-content">
      <div className="slide-title">어떤 옷을 입어야 하나~</div>

      <div className="temp-headline">
        <div>
          <div className="temp-big">
            {avg}
            <sup>°</sup>
          </div>
          <div className="temp-label-sm">평균 기온</div>
        </div>
      </div>

      {Math.abs(trendDiff) >= 0.5 && (
        <div className={`temp-trend-badge ${trendDiff < 0 ? "down" : ""}`}>
          {trendDiff > 0 ? "📈" : "📉"} 요즘 {Math.abs(trendDiff).toFixed(1)}°C{" "}
          {trendDiff > 0 ? "더 따뜻한" : "더 추운"} 편
        </div>
      )}

      <div className="temp-bar-section">
        <div className="temp-bar-title">기온 분포 범위</div>
        <div className="tbar-wrap">
          <div className="tbar-bg" />
          <div className="tbar-cold" style={{ width: "30%" }} />
          <div className="tbar-avg" style={{ left: "30%", width: "40%" }} />
          <div className="tbar-warm" style={{ left: "70%", width: "30%" }} />
          <div
            className="tbar-dot"
            style={{ left: `${Math.min(92, Math.max(8, avgPct))}%` }}
          />
        </div>
        <div className="tbar-labels">
          <span>{min}° 추운 해</span>
          <span>{avg}° 평균</span>
          <span>{max}° 따뜻한 해</span>
        </div>
      </div>

      {ha.length > 0 && (
        <>
          <div className="temp-bar-title">하루 기온 흐름</div>
          <div className="hourly-mini">
            {ha
              .filter((h) => h.hour % 2 === 0 || h.hour % 3 === 0)
              .filter((_, i) => i < 10)
              .map((h) => (
                <div key={h.hour} className="h-col">
                  <div className="h-time">
                    {String(h.hour).padStart(2, "0")}시
                  </div>
                  <div className={`h-box ${h.isBestHour ? "peak" : ""}`}>
                    <DotLottieReact
                      src={getLottieFromWeatherCode(h.dominantWeatherCode)}
                      loop
                      autoplay
                      style={{ width: 28, height: 28 }}
                    />
                  </div>
                  <div className="h-val">{Math.round(h.avgTemp)}°</div>
                </div>
              ))}
          </div>
          {bestTimeText && (
            <div className="best-time-note">✦ {bestTimeText}</div>
          )}
        </>
      )}

      {validYears.length > 0 && (
        <button className="packing-btn-inline" onClick={onYearlyClick}>
          📊 연도별 실제 기록 보기
        </button>
      )}
    </div>
  );
};

// ─── Reel 3: 강수 (날짜 버전과 타이틀/라벨 통일) ────────────────────────────
const RangeReel3Precip: React.FC<{
  statistics: WeatherStatistics["statistics"];
  analysis: WeatherAnalysis;
  onPackingClick: () => void;
}> = ({ statistics, analysis, onPackingClick }) => {
  const [showPrecipHelp, setShowPrecipHelp] = useState(false);
  const rainPct = Math.round(statistics.rainProbability);
  const snowPct = Math.round(statistics.snowProbability);
  const avgMm = statistics.precipitation.average;
  const maxMm = statistics.precipitation.highest;
  const freq =
    rainPct < 20
      ? "5번 중 1번꼴"
      : rainPct < 30
        ? "4번 중 1번꼴"
        : rainPct < 40
          ? "3번 중 1번꼴"
          : rainPct < 60
            ? "2번 중 1번꼴"
            : "2번 중 1번 이상";
  const noteMsg =
    analysis.rainGrade === "NO_RAIN"
      ? "비 걱정 없이 야외 일정을 즐길 수 있어요."
      : analysis.rainGrade === "LOW_RAIN"
        ? "☂️ 내리더라도 많지 않아요. 접이식 우산이면 충분해요."
        : analysis.rainGrade === "MID_RAIN"
          ? "☔ 비가 올 수 있어요. 우산을 꼭 챙기세요."
          : "🌧️ 비가 올 가능성이 높아요. 우산은 필수예요.";
  const impact = precipImpact(avgMm, maxMm);

  return (
    <div className="reel-content">
      <div className="slide-title">비야 제발 오지 마세요</div>

      <div className="rain-big-row">
        <div className="rain-big-card">
          <div className="rbc-icon">
            <DotLottieReact
              src={
                avgMm >= 5
                  ? "/weather-heavy-rain.lottie"
                  : "/weather-light-rain.lottie"
              }
              loop
              autoplay
              style={{ width: 44, height: 44 }}
            />
          </div>
          <div className="rbc-val" style={{ color: "var(--c-negative)" }}>
            {rainPct}%
          </div>
          <div className="rbc-name">비 올 확률</div>
          <div className="rbc-freq">{freq}</div>
        </div>
        {snowPct > 0 ? (
          <div className="rain-big-card">
            <div className="rbc-icon">
              <DotLottieReact
                src={
                  snowPct >= 30
                    ? "/weather-heavy-snow.lottie"
                    : "/weather-light-snow.lottie"
                }
                loop
                autoplay
                style={{ width: 44, height: 44 }}
              />
            </div>
            <div className="rbc-val" style={{ color: "var(--c-primary)" }}>
              {snowPct}%
            </div>
            <div className="rbc-name">눈 올 확률</div>
            <div className="rbc-freq">
              {snowPct < 10 ? "드물게 있음" : "종종 있음"}
            </div>
          </div>
        ) : (
          <div className="rain-big-card">
            <div className="rbc-icon">
              <DotLottieReact
                src="/weather-sunny.lottie"
                loop
                autoplay
                style={{ width: 44, height: 44 }}
              />
            </div>
            <div className="rbc-val" style={{ color: "var(--c-primary)" }}>
              {Math.round(statistics.clearProbability)}%
            </div>
            <div className="rbc-name">맑을 확률</div>
            <div className="rbc-freq">맑은 날 비율</div>
          </div>
        )}
      </div>

      <div className="rain-insight">{noteMsg}</div>

      {analysis.rainGrade !== "NO_RAIN" && (
        <div className="precip-detail">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--c-text)",
                }}
              >
                💧 예상 강수량
              </span>
              <button
                className="precip-help-btn"
                onClick={() => setShowPrecipHelp((v) => !v)}
                aria-label="강수량 기준 도움말"
              >
                ⓘ
              </button>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 20,
                background: `color-mix(in srgb, var(${impact.colorVar}) 12%, transparent)`,
                color: `var(${impact.colorVar})`,
              }}
            >
              {impact.label}
            </span>
          </div>
          {showPrecipHelp && (
            <div className="precip-help-panel">
              <div className="php-title">강수량 기준 안내</div>
              <div className="php-row">
                <span className="php-val">1mm 미만</span>
                <span className="php-desc">거의 없음 — 우산 불필요</span>
              </div>
              <div className="php-row">
                <span className="php-val">1 ~ 5mm</span>
                <span className="php-desc">가벼운 비 — 접이식 우산</span>
              </div>
              <div className="php-row">
                <span className="php-val">5 ~ 15mm</span>
                <span className="php-desc">보통 비 — 우산 필수</span>
              </div>
              <div className="php-row">
                <span className="php-val">15 ~ 30mm</span>
                <span className="php-desc">다소 많음 — 방수 신발 추천</span>
              </div>
              <div className="php-row">
                <span className="php-val">30mm 이상</span>
                <span className="php-desc">많은 비 — 방수 장비 필수</span>
              </div>
            </div>
          )}
          <div className="precip-row">
            <div className="precip-box">
              <div className="precip-num">
                {avgMm.toFixed(1)}
                <span>mm</span>
              </div>
              <div className="precip-sub">평균</div>
            </div>
            <div className="precip-box warn">
              <div className="precip-num">
                {maxMm.toFixed(1)}
                <span>mm</span>
              </div>
              <div className="precip-sub">최대</div>
            </div>
          </div>
          <div className="precip-impact">🧳 {impact.desc}</div>
        </div>
      )}

      <button className="packing-btn-inline" onClick={onPackingClick}>
        🎒 준비물 확인하기
      </button>
    </div>
  );
};

// ─── Reel 4: 추천 활동 ──────────────────────────────────────────────────────
const RangeReel4Good: React.FC<{ activities: ActivityItem[] }> = ({
  activities,
}) => (
  <div className="reel-content">
    <div className="slide-title">뭘 해볼지 고민이라면?</div>
    <div className="act-panel show">
      {activities.map((a, i) => (
        <div key={i} className="act-card">
          <div className="act-card-icon">{a.icon}</div>
          <div className="act-card-body">
            <div className="act-card-name">{a.name}</div>
            <div className="act-card-why">{a.reason}</div>
          </div>
          <div className={`act-card-tag ${a.isBest ? "tag-best" : "tag-norm"}`}>
            {a.isBest ? `✦ ${a.tag}` : a.tag}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Reel 5: 주의사항 ───────────────────────────────────────────────────────
const RangeReel5Bad: React.FC<{ avoidItems: AvoidItem[] }> = ({
  avoidItems,
}) => (
  <div className="reel-content">
    <div className="slide-title">이건 피하세요🥹</div>
    <div className="act-panel show">
      {avoidItems.length === 0 ? (
        <div className="act-card">
          <div
            className="act-card-body"
            style={{ textAlign: "center", color: "var(--c-dim)", fontSize: 14 }}
          >
            🎉 특별히 피할 것이 없는 좋은 날이에요!
          </div>
        </div>
      ) : (
        avoidItems.map((a, i) => (
          <div key={i} className="act-card">
            <div className="act-card-icon">{a.icon}</div>
            <div className="act-card-body">
              <div
                className="act-card-name"
                style={{ color: "var(--c-negative)" }}
              >
                {a.name}
              </div>
              <div className="act-card-why">{a.reason}</div>
            </div>
            <div className="act-card-tag tag-warn">주의</div>
          </div>
        ))
      )}
    </div>
  </div>
);

// ─── Reel 6: 기후 변화 (날짜 버전과 라벨/타이틀 통일) ──────────────────────
const RangeReel6Climate: React.FC<{
  statistics: WeatherStatistics;
}> = ({ statistics }) => {
  const { trend } = statistics.statistics;
  const { diff, maxDiff, minDiff } = trend;

  const isStable =
    Math.abs(diff) < 0.3 && Math.abs(maxDiff) < 0.3 && Math.abs(minDiff) < 0.3;

  const trendItems = [
    {
      icon: "🌡️",
      label: "평균 기온",
      diff,
      old: trend.olderAvgTemp,
      recent: trend.recentAvgTemp,
    },
    {
      icon: "☀️",
      label: "최고 기온",
      diff: maxDiff,
      old: trend.olderMaxTemp,
      recent: trend.recentMaxTemp,
    },
    {
      icon: "🌙",
      label: "최저 기온",
      diff: minDiff,
      old: trend.olderMinTemp,
      recent: trend.recentMinTemp,
    },
  ];

  const allTemps = trendItems
    .flatMap((t) => [t.old, t.recent])
    .filter((v) => v !== 0);
  const tempMin = allTemps.length > 0 ? Math.min(...allTemps) - 2 : 0;
  const tempMax = allTemps.length > 0 ? Math.max(...allTemps) + 2 : 40;
  const tempRange = tempMax - tempMin || 1;

  return (
    <div className="reel-content">
      <div className="slide-title">이날의 날씨, 달라지고 있어요</div>

      {isStable ? (
        <div className="climate-stable-note">
          최근 5년과 이전 5년의 기온 차이가 거의 없어요.
        </div>
      ) : (
        <div className="climate-hero">
          <div
            className="climate-diff"
            style={{
              color: diff > 0 ? "var(--c-negative)" : "var(--c-primary)",
            }}
          >
            {diff > 0 ? "+" : ""}
            {diff.toFixed(1)}°C
          </div>
          <div className="climate-diff-sub">
            최근 5년 평균이 이전 5년보다 {diff > 0 ? "높아요" : "낮아요"}
          </div>
        </div>
      )}

      <div className="climate-compare">
        <div className="cc-compare-header">
          <span className="cc-era cc-era-old">이전 5년</span>
          <span className="cc-era cc-era-recent">최근 5년</span>
        </div>
        {trendItems.map((item) => {
          if (item.old === 0 && item.recent === 0) return null;
          const oldPct = Math.max(8, ((item.old - tempMin) / tempRange) * 100);
          const recentPct = Math.max(
            8,
            ((item.recent - tempMin) / tempRange) * 100,
          );
          const isWarming = item.diff > 0.2;
          const isCooling = item.diff < -0.2;
          return (
            <div key={item.label} className="cc-compare-row">
              <div className="cc-compare-label">
                <span className="cc-icon">{item.icon}</span>
                <span className="cc-label-text">{item.label}</span>
              </div>
              <div className="cc-bars">
                <div className="cc-bar-row">
                  <div className="cc-bar-bg">
                    <div
                      className="cc-bar cc-bar-old"
                      style={{ width: `${oldPct}%` }}
                    >
                      <span className="cc-bar-val">
                        {Math.round(item.old)}°
                      </span>
                    </div>
                  </div>
                </div>
                <div className="cc-bar-row">
                  <div className="cc-bar-bg">
                    <div
                      className="cc-bar cc-bar-recent"
                      style={{
                        width: `${recentPct}%`,
                        background: isWarming
                          ? "var(--c-negative)"
                          : isCooling
                            ? "var(--c-primary)"
                            : "var(--c-dim)",
                      }}
                    >
                      <span className="cc-bar-val">
                        {Math.round(item.recent)}°
                      </span>
                    </div>
                  </div>
                  {Math.abs(item.diff) >= 0.2 && (
                    <span
                      className="cc-diff-badge"
                      style={{
                        color: isWarming
                          ? "var(--c-negative)"
                          : "var(--c-primary)",
                      }}
                    >
                      {item.diff > 0 ? "+" : ""}
                      {item.diff.toFixed(1)}°
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── 준비물 바텀시트 ─────────────────────────────────────────────────────────
const PackingDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  items: PackingItem[];
  cityKorean: string;
  dateDisplay: string;
}> = ({ isOpen, onClose, items, cityKorean, dateDisplay }) => {
  if (!isOpen) return null;
  return createPortal(
    <div
      className="overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog">
        <div className="dlg-handle" />
        <div className="dlg-title">🎒 준비물 리스트</div>
        <div className="dlg-sub">
          {cityKorean} {dateDisplay} 기준
        </div>
        <div className="pack-list">
          {items.map((item, i) => (
            <div key={i} className="pack-item">
              <div className="pack-emoji">{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="pack-name">{item.name}</div>
                <div className="pack-why">{item.reason}</div>
              </div>
              <div
                className={`pack-tag ${item.priority === "must" ? "t-must" : "t-rec"}`}
              >
                {item.priority === "must" ? "필수" : "권장"}
              </div>
            </div>
          ))}
        </div>
        <button className="dlg-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>,
    document.body,
  );
};

// ─── 연도별 바텀시트 (기간 버전) ─────────────────────────────────────────────
const YearlyRangeDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  statistics: WeatherStatistics;
}> = ({ isOpen, onClose, statistics }) => {
  if (!isOpen) return null;

  const validYears = statistics.yearlyData.filter(
    (d) => d.tempMax !== 0 || d.tempMin !== 0,
  );
  const allMax = Math.max(...validYears.map((d) => d.tempMax), 1);
  const allMin = Math.min(...validYears.map((d) => d.tempMin), 0);
  const yrRange = allMax - allMin || 1;
  const { startStr, endStr, nights } = parseDateRange(statistics.date);

  function barColor(temp: number) {
    const pct = (temp - allMin) / yrRange;
    if (pct > 0.7) return "var(--c-negative)";
    if (pct > 0.4) return "var(--c-primary)";
    return "var(--c-primary)";
  }

  return createPortal(
    <div
      className="overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog">
        <div className="dlg-handle" />
        <div className="dlg-title">📊 연도별 실제 기록</div>
        <div className="dlg-sub">
          {startStr} ~ {endStr} ({nights + 1}일) 기간 평균
        </div>
        <div className="pack-list">
          <div className="yr-chart">
            {[...validYears]
              .sort((a, b) => b.year - a.year)
              .map((d) => {
                const widthPct = Math.max(
                  10,
                  ((d.tempMax - allMin) / yrRange) * 100,
                );
                const precipDesc =
                  d.totalRain >= 10
                    ? `🌧 강한 비 (${d.totalRain.toFixed(1)}mm)`
                    : d.totalRain >= 1
                      ? `🌧 약한 비 (${d.totalRain.toFixed(1)}mm)`
                      : d.totalSnowfall >= 1
                        ? `❄️ 눈 (${d.totalSnowfall.toFixed(1)}cm)`
                        : "☀️ 대체로 맑음";

                return (
                  <div key={d.year} className="yr-card">
                    <div className="yr-header">
                      <DotLottieReact
                        src={getYearlyLottie(d)}
                        loop
                        autoplay
                        style={{ width: 32, height: 32, flexShrink: 0 }}
                      />
                      <div className="yr-year">{d.year}</div>
                      <div className="yr-temps">
                        <span className="yr-hi">{d.tempMax.toFixed(0)}°</span>
                        <span className="yr-sep">/</span>
                        <span className="yr-lo">{d.tempMin.toFixed(0)}°</span>
                      </div>
                    </div>
                    <div className="yr-bar-wrap">
                      <div
                        className="yr-bar"
                        style={{
                          width: `${widthPct}%`,
                          background: barColor(d.tempMax),
                        }}
                      />
                    </div>
                    <div className="yr-detail">{precipDesc}</div>
                  </div>
                );
              })}
          </div>
        </div>
        <button className="dlg-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>,
    document.body,
  );
};

// ─── 메인: 기간 분석 컴포넌트 ───────────────────────────────────────────────
const WeatherStatsRange: React.FC<{ statistics: WeatherStatistics }> = ({
  statistics,
}) => {
  const [packingOpen, setPackingOpen] = useState(false);
  const [yearlyOpen, setYearlyOpen] = useState(false);
  const [activeReel, setActiveReel] = useState(0);
  const reelsRef = useRef<HTMLDivElement>(null);

  const hasData = statistics.yearlyData.some(
    (d) => d.tempMax !== 0 || d.tempMin !== 0 || d.tempAvg !== 0,
  );

  if (!hasData) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "var(--c-dim)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "var(--c-negative)",
            marginBottom: 6,
          }}
        >
          데이터 수집 전
        </div>
        <div style={{ fontSize: 15 }}>
          <strong style={{ color: "var(--c-text)" }}>
            {statistics.city_korean || statistics.city}
          </strong>
          의 데이터가 아직 수집되지 않았습니다.
        </div>
      </div>
    );
  }

  const analysis = analyzeWeather(statistics);
  const { startStr, endStr } = parseDateRange(statistics.date);
  const dateDisplay = `${startStr} ~ ${endStr}`;
  const cityKorean = statistics.city_korean || statistics.city;

  const reels: React.ReactNode[] = [
    <RangeReel1 key="r1" statistics={statistics} analysis={analysis} />,
    <RangeReel2Temp
      key="r2"
      statistics={statistics}
      bestTimeText={analysis.bestTimeText}
      onYearlyClick={() => setYearlyOpen(true)}
    />,
    <RangeReel3Precip
      key="r3"
      statistics={statistics.statistics}
      analysis={analysis}
      onPackingClick={() => setPackingOpen(true)}
    />,
    <RangeReel4Good key="r4" activities={analysis.activities} />,
    <RangeReel5Bad key="r5" avoidItems={analysis.avoidItems} />,
    <RangeReel6Climate key="r6" statistics={statistics} />,
  ];
  const reelLabels = [
    "날씨 요약",
    "기온 & 옷차림",
    "예상 강수량",
    "추천 활동",
    "피할 것들",
    "기후 변화",
  ];

  useEffect(() => {
    const container = reelsRef.current;
    if (!container) return;
    const handleScroll = () => {
      const reelHeight = container.clientHeight;
      if (reelHeight > 0)
        setActiveReel(Math.round(container.scrollTop / reelHeight));
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToReel = (index: number) => {
    const container = reelsRef.current;
    if (!container) return;
    container.scrollTo({
      top: index * container.clientHeight,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="reels-wrap">
        <div className="reels-container" ref={reelsRef}>
          {reels.map((reel, i) => (
            <section key={i} className="reel">
              {reel}
            </section>
          ))}
        </div>
        <div className="reels-dots">
          {reels.map((_, i) => (
            <div
              key={i}
              className={`rdot ${i === activeReel ? "active" : "unactive"}`}
              onClick={() => scrollToReel(i)}
            >
              <span className="rdot-label">{reelLabels[i]}</span>
              <span className="rdot-pip" />
            </div>
          ))}
        </div>
        {activeReel === 0 && (
          <div className="reel-hint" onClick={() => scrollToReel(1)}>
            <span>↓</span>
          </div>
        )}
      </div>

      <PackingDialog
        isOpen={packingOpen}
        onClose={() => setPackingOpen(false)}
        items={analysis.packingItems}
        cityKorean={cityKorean}
        dateDisplay={dateDisplay}
      />
      <YearlyRangeDialog
        isOpen={yearlyOpen}
        onClose={() => setYearlyOpen(false)}
        statistics={statistics}
      />
    </>
  );
};

export default WeatherStatsRange;
