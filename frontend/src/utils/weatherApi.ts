import { supabase } from '../lib/supabase';
import {
  WeatherStatistics,
  City,
  HourlyWeatherRow,
  HourlyDataPoint,
  YearlyDayData,
  TempStat,
  HourlyAverage,
  NearbyDateStats,
} from '../types/weather';

const YEAR_START = 2016;
const YEAR_END = 2025;
const NEARBY_DAYS = 7;

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function categorizeWeather(code: number): 'clear' | 'cloudy' | 'rain' | 'snow' {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code === 95 || code === 96 || code === 99
  ) return 'rain';
  return 'cloudy';
}

function calcTempStat(values: number[]): TempStat {
  if (values.length === 0) return { highest: 0, lowest: 0, average: 0 };
  return {
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: values.reduce((a, b) => a + b, 0) / values.length,
  };
}

function getDominantCode(codes: number[]): number {
  if (codes.length === 0) return 0;
  const cnt: Record<number, number> = {};
  codes.forEach((c) => { cnt[c] = (cnt[c] || 0) + 1; });
  return Number(Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0]);
}

function rowToHourlyPoint(row: HourlyWeatherRow): HourlyDataPoint {
  return {
    hour: new Date(row.timestamp).getUTCHours(),
    temperature: row.temperature,
    apparent_temp: row.apparent_temp,
    humidity: row.humidity,
    precipitation: row.precipitation,
    rain: row.rain,
    snowfall: row.snowfall,
    weather_code: row.weather_code,
    cloud_cover: row.cloud_cover,
    wind_speed: row.wind_speed,
    wind_gusts: row.wind_gusts,
  };
}

function buildYearlyDayData(
  year: number,
  date: string,
  rows: HourlyWeatherRow[]
): YearlyDayData {
  if (rows.length === 0) {
    return {
      year, date, hours: [],
      tempMax: 0, tempMin: 0, tempAvg: 0,
      totalPrecipitation: 0, totalRain: 0, totalSnowfall: 0,
      avgWindSpeed: 0, maxWindGust: 0, avgApparentTemp: 0,
      dominantWeatherCode: 0,
    };
  }

  const hours = rows.map(rowToHourlyPoint).sort((a, b) => a.hour - b.hour);
  const temps = rows.map((r) => r.temperature);
  const totalPrecipitation = rows.reduce((s, r) => s + r.precipitation, 0);
  const totalRain = rows.reduce((s, r) => s + r.rain, 0);
  const totalSnowfall = rows.reduce((s, r) => s + r.snowfall, 0);
  const avgWindSpeed = rows.reduce((s, r) => s + r.wind_speed, 0) / rows.length;
  const maxWindGust = Math.max(...rows.map((r) => r.wind_gusts));

  // 주간(6-18시 UTC) 체감온도 평균
  const daytime = rows.filter((r) => {
    const h = new Date(r.timestamp).getUTCHours();
    return h >= 6 && h < 18;
  });
  const apparentSrc = daytime.length > 0 ? daytime : rows;
  const avgApparentTemp =
    apparentSrc.reduce((s, r) => s + r.apparent_temp, 0) / apparentSrc.length;

  return {
    year, date, hours,
    tempMax: Math.max(...temps),
    tempMin: Math.min(...temps),
    tempAvg: temps.reduce((a, b) => a + b, 0) / temps.length,
    totalPrecipitation, totalRain, totalSnowfall,
    avgWindSpeed, maxWindGust, avgApparentTemp,
    dominantWeatherCode: getDominantCode(rows.map((r) => r.weather_code)),
  };
}

// ─── 메인 함수 ────────────────────────────────────────────────────────────────

export const fetchWeatherStatistics = async (
  cityId: string,
  month: number,
  day: number
): Promise<WeatherStatistics> => {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const years = Array.from(
    { length: YEAR_END - YEAR_START + 1 },
    (_, i) => YEAR_START + i
  );

  // 연도별 ±7일 범위 계산
  const yearRanges = years.map((year) => {
    const target = new Date(Date.UTC(year, month - 1, day));
    const start = new Date(target);
    start.setUTCDate(start.getUTCDate() - NEARBY_DAYS);
    const end = new Date(target);
    end.setUTCDate(end.getUTCDate() + NEARBY_DAYS + 1);
    return {
      year,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      targetDate: target.toISOString().split('T')[0],
    };
  });

  // 병렬 조회: 도시 정보 + 연도별 ±7일 데이터
  const [cityResult, ...yearResults] = await Promise.all([
    supabase
      .from('cities')
      .select('id, name_en, name_ko, country, lat, lon')
      .eq('id', cityId)
      .single(),
    ...yearRanges.map(({ startDate, endDate }) =>
      supabase
        .from('hourly_weather')
        .select(
          'city_id, timestamp, temperature, apparent_temp, humidity, precipitation, rain, snowfall, weather_code, cloud_cover, wind_speed, wind_direction, wind_gusts'
        )
        .eq('city_id', cityId)
        .gte('timestamp', startDate)
        .lt('timestamp', endDate)
        .order('timestamp')
    ),
  ]);

  const city = cityResult.data ?? {
    name_en: cityId,
    name_ko: cityId,
    country: '',
    lat: null,
    lon: null,
  };

  // 연도별 데이터 구성 + 인근 날짜 수집
  const yearlyData: YearlyDayData[] = [];
  const nearbyMap = new Map<
    string,
    { rows: HourlyWeatherRow[]; year: number }[]
  >();

  yearRanges.forEach(({ year, targetDate }, i) => {
    const allRows = (yearResults[i].data as HourlyWeatherRow[]) || [];

    // UTC 날짜별 그룹화
    const byDate = new Map<string, HourlyWeatherRow[]>();
    allRows.forEach((row) => {
      const d = row.timestamp.split('T')[0];
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(row);
    });

    // 목표 날짜
    const targetRows = byDate.get(targetDate) || [];
    yearlyData.push(buildYearlyDayData(year, targetDate, targetRows));

    // 인근 날짜 수집
    byDate.forEach((rows, dateStr) => {
      if (dateStr === targetDate) return;
      const key = dateStr.slice(5); // MM-DD
      if (!nearbyMap.has(key)) nearbyMap.set(key, []);
      nearbyMap.get(key)!.push({ rows, year });
    });
  });

  const validYears = yearlyData.filter((d) => d.hours.length > 0);
  const totalYears = validYears.length;

  // 빈 결과 처리
  const emptyStats = {
    weatherFrequency: { clear: 0, cloudy: 0, rain: 0, snow: 0 },
    temperature: {
      max: { highest: 0, lowest: 0, average: 0 },
      min: { highest: 0, lowest: 0, average: 0 },
      avg: { highest: 0, lowest: 0, average: 0 },
    },
    humidity: { highest: 0, lowest: 0, average: 0 },
    precipitation: { highest: 0, average: 0 },
    avgApparentTemp: 0,
    avgWindSpeed: 0,
    maxWindGust: 0,
    rainProbability: 0,
    snowProbability: 0,
    clearProbability: 0,
    trend: { recentAvgTemp: 0, olderAvgTemp: 0, diff: 0, recentMaxTemp: 0, olderMaxTemp: 0, maxDiff: 0, recentMinTemp: 0, olderMinTemp: 0, minDiff: 0 },
    hourlyAverages: [],
  };

  if (totalYears === 0) {
    return {
      city: city.name_en,
      city_korean: city.name_ko,
      country: city.country,
      date: `${mm}-${dd}`,
      cityLat: city.lat ?? undefined,
      cityLon: city.lon ?? undefined,
      statistics: emptyStats,
      yearlyData,
    };
  }

  // ─── 통계 계산 ────────────────────────────────────────────────────────────

  const weatherFrequency = { clear: 0, cloudy: 0, rain: 0, snow: 0 };
  validYears.forEach((d) => {
    weatherFrequency[categorizeWeather(d.dominantWeatherCode)]++;
  });

  const allHours = validYears.flatMap((d) => d.hours);
  const humidities = allHours.map((h) => h.humidity);

  const rainDayCount = validYears.filter(
    (d) => d.totalRain > 1 || d.totalPrecipitation > 1
  ).length;
  const snowDayCount = validYears.filter((d) => d.totalSnowfall > 0).length;

  // 트렌드: 전반(2016-2020) vs 후반(2021-2025)
  const mid = Math.floor(years.length / 2);
  const olderValid = validYears.filter((d) => years.indexOf(d.year) < mid);
  const recentValid = validYears.filter((d) => years.indexOf(d.year) >= mid);
  const olderAvgTemp =
    olderValid.length > 0
      ? olderValid.reduce((s, d) => s + d.tempAvg, 0) / olderValid.length
      : 0;
  const recentAvgTemp =
    recentValid.length > 0
      ? recentValid.reduce((s, d) => s + d.tempAvg, 0) / recentValid.length
      : 0;
  const olderMaxTemp =
    olderValid.length > 0
      ? olderValid.reduce((s, d) => s + d.tempMax, 0) / olderValid.length
      : 0;
  const recentMaxTemp =
    recentValid.length > 0
      ? recentValid.reduce((s, d) => s + d.tempMax, 0) / recentValid.length
      : 0;
  const olderMinTemp =
    olderValid.length > 0
      ? olderValid.reduce((s, d) => s + d.tempMin, 0) / olderValid.length
      : 0;
  const recentMinTemp =
    recentValid.length > 0
      ? recentValid.reduce((s, d) => s + d.tempMin, 0) / recentValid.length
      : 0;

  // 시간대별 평균
  const hourlyAverages: HourlyAverage[] = [];
  for (let h = 0; h < 24; h++) {
    const pts = validYears.flatMap((d) => d.hours.filter((p) => p.hour === h));
    if (pts.length === 0) continue;
    const avgTemp = pts.reduce((s, p) => s + p.temperature, 0) / pts.length;
    const avgApparentTemp =
      pts.reduce((s, p) => s + p.apparent_temp, 0) / pts.length;
    const avgCloudCover =
      pts.reduce((s, p) => s + p.cloud_cover, 0) / pts.length;
    const avgPrecipitation =
      pts.reduce((s, p) => s + p.precipitation, 0) / pts.length;
    const dominantWeatherCode = getDominantCode(pts.map((p) => p.weather_code));
    hourlyAverages.push({
      hour: h,
      avgTemp,
      avgApparentTemp,
      avgCloudCover,
      dominantWeatherCode,
      avgPrecipitation,
      isBestHour: false,
    });
  }

  // 베스트 시간대: 낮(8-17시) 중 구름 적고 기온 높은 구간
  const daytimeHours = hourlyAverages.filter(
    (h) => h.hour >= 8 && h.hour <= 17
  );
  if (daytimeHours.length > 0) {
    const minCloud = Math.min(...daytimeHours.map((h) => h.avgCloudCover));
    const maxTemp = Math.max(...daytimeHours.map((h) => h.avgTemp));
    daytimeHours.forEach((h) => {
      h.isBestHour =
        h.avgCloudCover <= minCloud + 15 && h.avgTemp >= maxTemp - 3;
    });
  }

  // ─── 인근 날짜 ────────────────────────────────────────────────────────────

  const targetScore = (() => {
    const ap = validYears.reduce((s, d) => s + d.avgApparentTemp, 0) / totalYears;
    const tempGradeScore = ap >= 20 ? 25 : ap >= 12 ? 30 : ap >= 5 ? 20 : 0;
    return (
      tempGradeScore +
      (weatherFrequency.clear / totalYears) * 100 * 0.3 -
      ((rainDayCount / totalYears) * 100) * 0.5
    );
  })();

  const nearbyDates: NearbyDateStats[] = [];
  nearbyMap.forEach((yearEntries, key) => {
    const [m, d] = key.split('-').map(Number);
    if (yearEntries.length < 3) return; // 데이터 부족한 날짜 제외
    const allRows = yearEntries.flatMap((e) => e.rows);
    if (allRows.length === 0) return;

    const temps = allRows.map((r) => r.temperature);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const clearCount = yearEntries.filter(
      ({ rows }) => categorizeWeather(getDominantCode(rows.map((r) => r.weather_code))) === 'clear'
    ).length;
    const rainCount = yearEntries.filter(
      ({ rows }) => categorizeWeather(getDominantCode(rows.map((r) => r.weather_code))) === 'rain'
    ).length;
    const n = yearEntries.length;
    const clearPct = (clearCount / n) * 100;
    const rainPct = (rainCount / n) * 100;
    const avgPrecipitation =
      yearEntries.reduce(
        (s, { rows }) => s + rows.reduce((rs, r) => rs + r.precipitation, 0),
        0
      ) / n;
    const dominantWeatherCode = getDominantCode(allRows.map((r) => r.weather_code));

    const ap = allRows.reduce((s, r) => s + r.apparent_temp, 0) / allRows.length;
    const tempGradeScore = ap >= 20 ? 25 : ap >= 12 ? 30 : ap >= 5 ? 20 : 0;
    const score = tempGradeScore + clearPct * 0.3 - rainPct * 0.5;

    nearbyDates.push({
      month: m,
      day: d,
      score,
      avgTemp,
      tempMax: Math.max(...temps),
      tempMin: Math.min(...temps),
      clearPct,
      rainPct,
      avgPrecipitation,
      dominantWeatherCode,
    });
  });

  // 목표 날짜보다 점수 높은 날짜만, 거리순 정렬 후 상위 3개
  const targetMonthDay = new Date(2000, month - 1, day);
  const betterDates = nearbyDates
    .filter((d) => d.score > targetScore - 5)
    .sort((a, b) => {
      const da = Math.abs(new Date(2000, a.month - 1, a.day).getTime() - targetMonthDay.getTime());
      const db = Math.abs(new Date(2000, b.month - 1, b.day).getTime() - targetMonthDay.getTime());
      return da - db;
    })
    .slice(0, 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    city: city.name_en,
    city_korean: city.name_ko,
    country: city.country,
    date: `${mm}-${dd}`,
    cityLat: city.lat ?? undefined,
    cityLon: city.lon ?? undefined,
    statistics: {
      weatherFrequency,
      temperature: {
        max: calcTempStat(validYears.map((d) => d.tempMax)),
        min: calcTempStat(validYears.map((d) => d.tempMin)),
        avg: calcTempStat(validYears.map((d) => d.tempAvg)),
      },
      humidity: {
        highest: Math.max(...humidities),
        lowest: Math.min(...humidities),
        average: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      },
      precipitation: {
        highest: Math.max(...validYears.map((d) => d.totalPrecipitation)),
        average:
          validYears.reduce((s, d) => s + d.totalPrecipitation, 0) / totalYears,
      },
      avgApparentTemp:
        validYears.reduce((s, d) => s + d.avgApparentTemp, 0) / totalYears,
      avgWindSpeed:
        validYears.reduce((s, d) => s + d.avgWindSpeed, 0) / totalYears,
      maxWindGust: Math.max(...validYears.map((d) => d.maxWindGust)),
      rainProbability: (rainDayCount / totalYears) * 100,
      snowProbability: (snowDayCount / totalYears) * 100,
      clearProbability: (weatherFrequency.clear / totalYears) * 100,
      trend: {
        recentAvgTemp, olderAvgTemp, diff: recentAvgTemp - olderAvgTemp,
        recentMaxTemp, olderMaxTemp, maxDiff: recentMaxTemp - olderMaxTemp,
        recentMinTemp, olderMinTemp, minDiff: recentMinTemp - olderMinTemp,
      },
      hourlyAverages,
    },
    yearlyData,
    nearbyDates: betterDates,
  };
};

// ─── 기간 분석 ───────────────────────────────────────────────────────────────

/** 두 날짜 사이의 모든 월/일 목록 생성 (최대 14일) */
function generateDateRange(
  startMonth: number, startDay: number,
  endMonth: number, endDay: number
): Array<{ month: number; day: number }> {
  const dates: Array<{ month: number; day: number }> = [];
  const start = new Date(2024, startMonth - 1, startDay);
  const end = new Date(2024, endMonth - 1, endDay);
  if (end < start) return [{ month: startMonth, day: startDay }];
  const current = new Date(start);
  while (current <= end && dates.length < 14) {
    dates.push({ month: current.getMonth() + 1, day: current.getDate() });
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** 여러 날의 WeatherStatistics를 하나로 합산 */
function mergeWeatherStatistics(
  list: WeatherStatistics[],
  startMonth: number, startDay: number,
  endMonth: number, endDay: number
): WeatherStatistics {
  const first = list[0];
  const sts = list.map((s) => s.statistics);

  // 시간대별 평균 통합 (hour별로 합산)
  const hourMap = new Map<number, HourlyAverage[]>();
  sts.forEach((s) => {
    s.hourlyAverages.forEach((h) => {
      if (!hourMap.has(h.hour)) hourMap.set(h.hour, []);
      hourMap.get(h.hour)!.push(h);
    });
  });
  const mergedHourly: HourlyAverage[] = [];
  hourMap.forEach((hs, hour) => {
    mergedHourly.push({
      hour,
      avgTemp: avg(hs.map((h) => h.avgTemp)),
      avgApparentTemp: avg(hs.map((h) => h.avgApparentTemp)),
      avgCloudCover: avg(hs.map((h) => h.avgCloudCover)),
      dominantWeatherCode: getDominantCode(hs.map((h) => h.dominantWeatherCode)),
      avgPrecipitation: avg(hs.map((h) => h.avgPrecipitation)),
      isBestHour: false,
    });
  });
  mergedHourly.sort((a, b) => a.hour - b.hour);
  // 베스트 시간대 재계산
  const dayHours = mergedHourly.filter((h) => h.hour >= 8 && h.hour <= 17);
  if (dayHours.length > 0) {
    const minCloud = Math.min(...dayHours.map((h) => h.avgCloudCover));
    const maxTemp = Math.max(...dayHours.map((h) => h.avgTemp));
    dayHours.forEach((h) => {
      h.isBestHour = h.avgCloudCover <= minCloud + 15 && h.avgTemp >= maxTemp - 3;
    });
  }

  // yearlyData: 연도별로 그룹 → 평균
  const yearMap = new Map<number, YearlyDayData[]>();
  list.forEach((s) => {
    s.yearlyData.filter((d) => d.hours.length > 0).forEach((d) => {
      if (!yearMap.has(d.year)) yearMap.set(d.year, []);
      yearMap.get(d.year)!.push(d);
    });
  });
  const mergedYearly: YearlyDayData[] = [];
  yearMap.forEach((days, year) => {
    mergedYearly.push({
      year,
      date: `${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
      hours: [],
      tempMax: avg(days.map((d) => d.tempMax)),
      tempMin: avg(days.map((d) => d.tempMin)),
      tempAvg: avg(days.map((d) => d.tempAvg)),
      totalPrecipitation: avg(days.map((d) => d.totalPrecipitation)),
      totalRain: avg(days.map((d) => d.totalRain)),
      totalSnowfall: avg(days.map((d) => d.totalSnowfall)),
      avgWindSpeed: avg(days.map((d) => d.avgWindSpeed)),
      maxWindGust: Math.max(...days.map((d) => d.maxWindGust)),
      avgApparentTemp: avg(days.map((d) => d.avgApparentTemp)),
      dominantWeatherCode: getDominantCode(days.map((d) => d.dominantWeatherCode)),
    });
  });

  const mm1 = String(startMonth).padStart(2, '0');
  const dd1 = String(startDay).padStart(2, '0');
  const mm2 = String(endMonth).padStart(2, '0');
  const dd2 = String(endDay).padStart(2, '0');

  return {
    city: first.city,
    city_korean: first.city_korean,
    country: first.country,
    date: `${mm1}-${dd1}~${mm2}-${dd2}`,
    cityLat: first.cityLat,
    cityLon: first.cityLon,
    statistics: {
      weatherFrequency: {
        clear: avg(sts.map((s) => s.weatherFrequency.clear)),
        cloudy: avg(sts.map((s) => s.weatherFrequency.cloudy)),
        rain: avg(sts.map((s) => s.weatherFrequency.rain)),
        snow: avg(sts.map((s) => s.weatherFrequency.snow)),
      },
      temperature: {
        max: {
          highest: Math.max(...sts.map((s) => s.temperature.max.highest)),
          lowest: Math.min(...sts.map((s) => s.temperature.max.lowest)),
          average: avg(sts.map((s) => s.temperature.max.average)),
        },
        min: {
          highest: Math.max(...sts.map((s) => s.temperature.min.highest)),
          lowest: Math.min(...sts.map((s) => s.temperature.min.lowest)),
          average: avg(sts.map((s) => s.temperature.min.average)),
        },
        avg: {
          highest: Math.max(...sts.map((s) => s.temperature.avg.highest)),
          lowest: Math.min(...sts.map((s) => s.temperature.avg.lowest)),
          average: avg(sts.map((s) => s.temperature.avg.average)),
        },
      },
      humidity: {
        highest: Math.max(...sts.map((s) => s.humidity.highest)),
        lowest: Math.min(...sts.map((s) => s.humidity.lowest)),
        average: avg(sts.map((s) => s.humidity.average)),
      },
      precipitation: {
        highest: Math.max(...sts.map((s) => s.precipitation.highest)),
        average: avg(sts.map((s) => s.precipitation.average)),
      },
      avgApparentTemp: avg(sts.map((s) => s.avgApparentTemp)),
      avgWindSpeed: avg(sts.map((s) => s.avgWindSpeed)),
      maxWindGust: Math.max(...sts.map((s) => s.maxWindGust)),
      rainProbability: avg(sts.map((s) => s.rainProbability)),
      snowProbability: avg(sts.map((s) => s.snowProbability)),
      clearProbability: avg(sts.map((s) => s.clearProbability)),
      trend: {
        recentAvgTemp: avg(sts.map((s) => s.trend.recentAvgTemp)),
        olderAvgTemp: avg(sts.map((s) => s.trend.olderAvgTemp)),
        diff: avg(sts.map((s) => s.trend.diff)),
        recentMaxTemp: avg(sts.map((s) => s.trend.recentMaxTemp)),
        olderMaxTemp: avg(sts.map((s) => s.trend.olderMaxTemp)),
        maxDiff: avg(sts.map((s) => s.trend.maxDiff)),
        recentMinTemp: avg(sts.map((s) => s.trend.recentMinTemp)),
        olderMinTemp: avg(sts.map((s) => s.trend.olderMinTemp)),
        minDiff: avg(sts.map((s) => s.trend.minDiff)),
      },
      hourlyAverages: mergedHourly,
    },
    yearlyData: mergedYearly,
    nearbyDates: [],
  };
}

export const fetchDateRangeStatistics = async (
  cityId: string,
  startMonth: number, startDay: number,
  endMonth: number, endDay: number,
): Promise<WeatherStatistics> => {
  const dates = generateDateRange(startMonth, startDay, endMonth, endDay);
  const statsList = await Promise.all(
    dates.map(({ month, day }) => fetchWeatherStatistics(cityId, month, day))
  );
  return mergeWeatherStatistics(statsList, startMonth, startDay, endMonth, endDay);
};

export const fetchCities = async (): Promise<City[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name_en, name_ko, country, lat, lon')
    .order('name_ko');

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    name: c.name_en,
    nameKo: c.name_ko,
    country: c.country,
    lat: c.lat ?? undefined,
    lon: c.lon ?? undefined,
  }));
};

// ─── 홈 캐러셀 카드 ────────────────────────────────────────────────────────────

const HOME_CARD_BUCKET = 'cities_images';

/** Storage 경로(파일명)를 public URL로 변환. 이미 http로 시작하면 그대로 사용 */
const resolveImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from(HOME_CARD_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export interface HomeCard {
  id: number;
  title: string;
  subtitle: string | null;
  nightsLabel: string | null;
  dateLabel: string | null;
  imageUrl: string | null;
  cityId: string | null;
  cardType: 'date' | 'range';
  dateFrom: string | null; // MM-DD
  dateTo: string | null;   // MM-DD, range일 때만
  sortOrder: number;
}

export const fetchHomeCards = async (): Promise<HomeCard[]> => {
  const { data, error } = await supabase
    .from('home_cards')
    .select('id, title, subtitle, nights_label, date_label, image_url, city_id, card_type, date_from, date_to, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle ?? null,
    nightsLabel: c.nights_label ?? null,
    dateLabel: c.date_label ?? null,
    imageUrl: resolveImageUrl(c.image_url),
    cityId: c.city_id ?? null,
    cardType: c.card_type as 'date' | 'range',
    dateFrom: c.date_from ?? null,
    dateTo: c.date_to ?? null,
    sortOrder: c.sort_order,
  }));
};

export const submitContact = async (
  email: string,
  message: string
): Promise<void> => {
  const response = await fetch(`/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, message }),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit contact: ${response.statusText}`);
  }
};
