import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { fetchTodayWeather, TodayWeatherData, fetchCities } from '../utils/weatherApi';
import { getTodayCache, setTodayCache } from '../utils/storage';
import { analyzeWeather, WeatherAnalysis } from '../utils/weatherRules';
import { WeatherStatistics, City } from '../types/weather';

// ─── 유틸 함수 ──────────────────────────────────────────────────────────────

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

function getLottieFromWeatherCode(code: number): string {
  if ([45, 48].includes(code)) return '/weather-foggy.lottie';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return '/weather-light-snow.lottie';
  if (code >= 80 && code <= 82) return '/weather-light-rain.lottie';
  if (code >= 51 && code <= 67) return '/weather-heavy-rain.lottie';
  if (code >= 95) return '/weather-heavy-rain.lottie';
  if (code <= 1) return '/weather-sunny.lottie';
  return '/weather-partly-cloudy.lottie';
}

function getHeroBg(code: number): string {
  if (code <= 1)
    return 'linear-gradient(160deg, rgba(78,103,251,0.22) 0%, rgba(78,103,251,0.08) 100%)';
  if (code <= 3)
    return 'linear-gradient(160deg, rgba(78,103,251,0.10) 0%, rgba(78,103,251,0.04) 100%)';
  if (code <= 48)
    return 'linear-gradient(160deg, rgba(107,113,133,0.28) 0%, rgba(107,113,133,0.12) 100%)';
  if (code <= 82)
    return 'linear-gradient(160deg, rgba(255,91,91,0.22) 0%, rgba(255,91,91,0.08) 100%)';
  if (code <= 86)
    return 'linear-gradient(160deg, rgba(235,240,247,0.95) 0%, rgba(78,103,251,0.05) 100%)';
  return 'linear-gradient(160deg, rgba(26,29,40,0.35) 0%, rgba(26,29,40,0.16) 100%)';
}

function getWeatherDesc(code: number): string {
  if (code === 0) return '맑음';
  if (code <= 2) return '구름 조금';
  if (code <= 3) return '흐림';
  if (code <= 48) return '안개';
  if (code <= 57) return '이슬비';
  if (code <= 67) return '비';
  if (code <= 77) return '눈';
  if (code <= 82) return '소나기';
  if (code <= 86) return '눈 소나기';
  return '뇌우';
}

function getClearProb(code: number): number {
  if (code <= 1) return 85;
  if (code <= 3) return 50;
  return 15;
}

function buildFakeStats(data: TodayWeatherData): WeatherStatistics {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  return {
    city: data.city_id,
    city_korean: data.city_korean,
    country: '',
    date: `${mm}-${dd}`,
    cityLat: data.lat,
    cityLon: undefined,
    statistics: {
      weatherFrequency: { clear: 0, cloudy: 0, rain: 0, snow: 0 },
      temperature: {
        max: { highest: data.today.tempMax, lowest: data.today.tempMax, average: data.today.tempMax },
        min: { highest: data.today.tempMin, lowest: data.today.tempMin, average: data.today.tempMin },
        avg: {
          highest: (data.today.tempMax + data.today.tempMin) / 2,
          lowest: (data.today.tempMax + data.today.tempMin) / 2,
          average: (data.today.tempMax + data.today.tempMin) / 2,
        },
      },
      humidity: {
        highest: data.current.humidity,
        lowest: data.current.humidity,
        average: data.current.humidity,
      },
      precipitation: {
        highest: data.today.precipSum,
        average: data.today.precipSum,
      },
      avgApparentTemp: data.current.apparentTemp,
      avgWindSpeed: data.today.windSpeedMax,
      maxWindGust: data.today.windSpeedMax,
      rainProbability: data.today.precipProbMax,
      snowProbability: 0,
      clearProbability: getClearProb(data.today.weatherCode),
      trend: {
        recentAvgTemp: 0, olderAvgTemp: 0, diff: 0,
        recentMaxTemp: 0, olderMaxTemp: 0, maxDiff: 0,
        recentMinTemp: 0, olderMinTemp: 0, minDiff: 0,
      },
      hourlyAverages: [],
    },
    yearlyData: [],
  };
}

function getBestHours(
  hourly: TodayWeatherData['hourly'],
  lat: number
): { label: string; indices: number[] } {
  const MIN_TEMP = lat < 23 ? 18 : lat < 45 ? 8 : 4;
  const candidates = hourly.filter(
    (h) =>
      h.hour >= 7 &&
      h.hour <= 21 &&
      h.precipProb < 25 &&
      h.temperature >= MIN_TEMP &&
      h.weatherCode <= 3
  );

  if (candidates.length === 0) {
    return { label: '오늘은 실내 관광을 추천해요', indices: [] };
  }

  // 연속 구간 중 가장 긴 블록 찾기
  const hours = candidates.map((h) => h.hour).sort((a, b) => a - b);
  let bestStart = hours[0];
  let bestEnd = hours[0];
  let curStart = hours[0];
  let curEnd = hours[0];

  for (let i = 1; i < hours.length; i++) {
    if (hours[i] === hours[i - 1] + 1) {
      curEnd = hours[i];
    } else {
      if (curEnd - curStart > bestEnd - bestStart) {
        bestStart = curStart;
        bestEnd = curEnd;
      }
      curStart = hours[i];
      curEnd = hours[i];
    }
  }
  if (curEnd - curStart > bestEnd - bestStart) {
    bestStart = curStart;
    bestEnd = curEnd;
  }

  const fmt = (h: number) => {
    const period = h < 12 ? '오전' : '오후';
    const display = h <= 12 ? h : h - 12;
    return `${period} ${display}시`;
  };

  return {
    label: `${fmt(bestStart)} – ${fmt(bestEnd)}`,
    indices: hours,
  };
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TodayProps {
  cityId: string;
  onCityChange: (id: string) => void;
  onGotoDday: (cityId: string, month: number, day: number) => void;
}

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────

const Today: React.FC<TodayProps> = ({ cityId, onCityChange, onGotoDday }) => {
  const [data, setData] = useState<TodayWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 ${
    ['일', '월', '화', '수', '목', '금', '토'][now.getDay()]
  }요일`;

  useEffect(() => {
    fetchCities().then(setCities).catch(console.error);
  }, []);

  const load = async (id: string, forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getTodayCache(id);
      if (cached) {
        setData(cached);
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTodayWeather(id);
      setTodayCache(id, result);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '예보를 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(cityId);
  }, [cityId]);

  // 현재 시각 슬롯으로 스크롤
  useEffect(() => {
    if (!data || !timelineRef.current) return;
    const currentHour = now.getHours();
    const slots = timelineRef.current.querySelectorAll<HTMLElement>('.timeline-slot');
    const target = Array.from(slots).find(
      (el) => Number(el.dataset.hour) === currentHour
    );
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [data]);

  const analysis = useMemo<WeatherAnalysis | null>(() => {
    if (!data) return null;
    try {
      return analyzeWeather(buildFakeStats(data));
    } catch {
      return null;
    }
  }, [data]);

  const bestHours = useMemo(() => {
    if (!data) return { label: '', indices: [] };
    return getBestHours(data.hourly, data.lat);
  }, [data]);

  // 7일 예보 판정 (useMemo로 캐싱)
  const forecastAnalyses = useMemo<(WeatherAnalysis | null)[]>(() => {
    if (!data) return [];
    return data.forecast.map((f, i) => {
      if (i === 0) return analysis;
      try {
        const mm = String(new Date(f.dateStr).getMonth() + 1).padStart(2, '0');
        const dd = String(new Date(f.dateStr).getDate()).padStart(2, '0');
        const fakeStats: WeatherStatistics = {
          city: data.city_id,
          city_korean: data.city_korean,
          country: '',
          date: `${mm}-${dd}`,
          cityLat: data.lat,
          statistics: {
            weatherFrequency: { clear: 0, cloudy: 0, rain: 0, snow: 0 },
            temperature: {
              max: { highest: f.tempMax, lowest: f.tempMax, average: f.tempMax },
              min: { highest: f.tempMin, lowest: f.tempMin, average: f.tempMin },
              avg: {
                highest: (f.tempMax + f.tempMin) / 2,
                lowest: (f.tempMax + f.tempMin) / 2,
                average: (f.tempMax + f.tempMin) / 2,
              },
            },
            humidity: { highest: 60, lowest: 60, average: 60 },
            precipitation: { highest: f.precipSum, average: f.precipSum },
            avgApparentTemp: (f.tempMax + f.tempMin) / 2,
            avgWindSpeed: f.windSpeedMax,
            maxWindGust: f.windSpeedMax,
            rainProbability: f.precipProbMax,
            snowProbability: 0,
            clearProbability: getClearProb(f.weatherCode),
            trend: {
              recentAvgTemp: 0, olderAvgTemp: 0, diff: 0,
              recentMaxTemp: 0, olderMaxTemp: 0, maxDiff: 0,
              recentMinTemp: 0, olderMinTemp: 0, minDiff: 0,
            },
            hourlyAverages: [],
          },
          yearlyData: [],
        };
        return analyzeWeather(fakeStats);
      } catch {
        return null;
      }
    });
  }, [data, analysis]);

  const filteredCities = cities.filter(
    (c) =>
      c.nameKo.includes(searchInput) ||
      c.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  const handleCitySelect = (id: string) => {
    onCityChange(id);
    setSearchOpen(false);
    setSearchInput('');
  };

  const selectedCity = cities.find((c) => c.id === cityId);
  const cityLabel = selectedCity ? selectedCity.nameKo : cityId;

  // ─── 로딩 포털 ─────────────────────────────────────────────────────────────

  const LoadingPortal = loading
    ? createPortal(
        <div className="today-loading-overlay">
          <div className="today-loading-inner">
            <div className="loading-spinner" />
            <p className="loading-text">날씨 불러오는 중…</p>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="today-screen">
      {LoadingPortal}

      {/* ── 도시 셀렉터 + 날짜 ── */}
      <div className="today-header">
        <button className="today-city-btn" onClick={() => setSearchOpen(true)}>
          <span className="today-city-name">{cityLabel}</span>
          <span className="today-city-arrow">▾</span>
        </button>
        <span className="today-date-label">{dateLabel}</span>
      </div>

      {/* ── 도시 검색 모달 ── */}
      {searchOpen &&
        createPortal(
          <div className="city-search-overlay" onClick={() => setSearchOpen(false)}>
            <div className="city-search-modal" onClick={(e) => e.stopPropagation()}>
              <div className="city-search-header">
                <input
                  className="city-search-input"
                  placeholder="도시명 검색"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                />
                <button className="city-search-close" onClick={() => setSearchOpen(false)}>
                  ✕
                </button>
              </div>
              <div className="city-search-list">
                {filteredCities.map((c) => (
                  <button
                    key={c.id}
                    className={`city-search-item${c.id === cityId ? ' active' : ''}`}
                    onClick={() => handleCitySelect(c.id)}
                  >
                    <span className="city-search-ko">{c.nameKo}</span>
                    <span className="city-search-en">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── 에러 상태 ── */}
      {error && !loading && (
        <div className="today-error">
          <p>{error}</p>
          <button className="today-retry-btn" onClick={() => load(cityId, true)}>
            다시 시도
          </button>
        </div>
      )}

      {/* ── 본문 ── */}
      {data && !error && (
        <>
          {/* Hero 섹션 */}
          <div
            className="today-hero"
            style={{ background: getHeroBg(data.current.weatherCode) }}
          >
            <div className="today-hero-lottie">
              <DotLottieReact
                src={getLottieFromWeatherCode(data.current.weatherCode)}
                loop
                autoplay
                style={{ width: 100, height: 100 }}
              />
            </div>
            <div className="today-hero-temp">{data.current.temperature}°</div>
            <div className="today-hero-desc">
              {getWeatherDesc(data.current.weatherCode)} · 체감 {data.current.apparentTemp}°
            </div>
            {analysis && (
              <div className="today-verdict-badge">
                {analysis.verdict.badge} {analysis.verdict.label}
              </div>
            )}
            <div className="today-hero-chips">
              <div className="today-chip">
                <span className="today-chip-icon">🌧</span>
                <span className="today-chip-val">{data.today.precipProbMax}%</span>
                <span className="today-chip-label">강수</span>
              </div>
              <div className="today-chip">
                <span className="today-chip-icon">💨</span>
                <span className="today-chip-val">{data.current.windSpeed}km/h</span>
                <span className="today-chip-label">바람</span>
              </div>
              <div className="today-chip">
                <span className="today-chip-icon">💧</span>
                <span className="today-chip-val">{data.current.humidity}%</span>
                <span className="today-chip-label">습도</span>
              </div>
              <div className="today-chip">
                <span className="today-chip-icon">🌡</span>
                <span className="today-chip-val">
                  {data.today.tempMax}° / {data.today.tempMin}°
                </span>
                <span className="today-chip-label">최고/최저</span>
              </div>
            </div>
          </div>

          {/* 인사이트 섹션 */}
          {analysis && (
            <div className="today-section">
              <h2 className="today-section-title">여행자 인사이트</h2>
              <div className="today-insight-cards">
                <div className="today-insight-card">
                  <div className="today-insight-label">한 줄 요약</div>
                  <div className="today-insight-value">{analysis.summaryText}</div>
                </div>
                <div className="today-insight-card">
                  <div className="today-insight-label">베스트 외출 시간</div>
                  <div className="today-insight-value">{bestHours.label}</div>
                </div>
                <div className="today-insight-card">
                  <div className="today-insight-label">오늘 준비물</div>
                  <div className="today-packing-chips">
                    {analysis.packingItems.slice(0, 3).map((item) => (
                      <span key={item.name} className="today-packing-chip">
                        {item.icon} {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 타임라인 섹션 */}
          <div className="today-section">
            <h2 className="today-section-title">시간별 예보</h2>
            <div className="today-timeline" ref={timelineRef}>
              {data.hourly
                .filter((h) => h.hour >= 6 && h.hour <= 22)
                .map((h) => {
                  const isBest = bestHours.indices.includes(h.hour);
                  const isCurrent = h.hour === now.getHours();
                  return (
                    <div
                      key={h.hour}
                      className={`timeline-slot${isBest ? ' best' : ''}${isCurrent ? ' current' : ''}`}
                      data-hour={h.hour}
                    >
                      <span className="timeline-time">
                        {h.hour === 0 ? '자정' : h.hour < 12 ? `${h.hour}시` : h.hour === 12 ? '정오' : `${h.hour}시`}
                      </span>
                      <span className="timeline-emoji">{getWeatherEmoji(h.weatherCode)}</span>
                      <span className="timeline-temp">{h.temperature}°</span>
                      <span className="timeline-precip">{h.precipProb}%</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 추천 활동 섹션 */}
          {analysis && analysis.activities.length > 0 && (
            <div className="today-section">
              <h2 className="today-section-title">추천 활동</h2>
              <div className="today-activities">
                {analysis.activities.slice(0, 4).map((act) => (
                  <div key={act.name} className={`today-activity-chip${act.isBest ? ' best' : ''}`}>
                    <span className="activity-icon">{act.icon}</span>
                    <span className="activity-name">{act.name}</span>
                  </div>
                ))}
              </div>
              {analysis.avoidItems.length > 0 && (
                <div className="today-avoid-row">
                  <span className="today-avoid-label">비추천:</span>
                  {analysis.avoidItems.slice(0, 2).map((item) => (
                    <span key={item.name} className="today-avoid-chip">
                      {item.icon} {item.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7일 예보 섹션 */}
          <div className="today-section">
            <h2 className="today-section-title">7일 예보</h2>
            <div className="today-forecast">
              {data.forecast.map((f, i) => {
                const fa = forecastAnalyses[i];
                const fDate = new Date(f.dateStr);
                return (
                  <div key={f.dateStr} className={`forecast-row${i === 0 ? ' today-row' : ''}`}>
                    <span className="forecast-weekday">{f.weekday}</span>
                    <span className="forecast-emoji">{getWeatherEmoji(f.weatherCode)}</span>
                    <span className="forecast-temps">
                      <span className="forecast-max">{f.tempMax}°</span>
                      <span className="forecast-min"> / {f.tempMin}°</span>
                    </span>
                    {fa && (
                      <span className="forecast-badge">{fa.verdict.badge}</span>
                    )}
                    {i > 0 && (
                      <button
                        className="forecast-dday-btn"
                        onClick={() =>
                          onGotoDday(
                            cityId,
                            fDate.getMonth() + 1,
                            fDate.getDate()
                          )
                        }
                      >
                        D-Day 보기
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Today;
