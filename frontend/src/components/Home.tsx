import React, { useState, useEffect } from 'react';
import { WeatherStatistics } from '../types/weather';
import { fetchWeatherStatistics } from '../utils/weatherApi';
import { getSearchHistory, saveSearchHistory } from '../utils/storage';
import WeatherStats from './WeatherStats';
import DatePickerDialog from './DatePickerDialog';
import CitySelector from './CitySelector';

// 날씨 이모지
function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code === 1) return '🌤️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

// 대표 날씨 코드 (낮 시간 빈도)
function getDominantCode(statistics: WeatherStatistics): number {
  const freq = statistics.statistics.weatherFrequency;
  const order = ['clear', 'cloudy', 'rain', 'snow'] as const;
  const codeMap: Record<string, number> = { clear: 1, cloudy: 3, rain: 61, snow: 73 };
  const best = order.reduce((top, key) =>
    freq[key] > freq[top] ? key : top
  , 'cloudy' as const);
  return codeMap[best];
}

const Home: React.FC = () => {
  const [statistics, setStatistics] = useState<WeatherStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentCity, setCurrentCity] = useState('seoul');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);

  useEffect(() => {
    const history = getSearchHistory();
    if (history) {
      const [month, day] = history.date.split('-').map(Number);
      const date = new Date(2026, month - 1, day);
      setCurrentCity(history.city);
      setCurrentDate(date);
      loadWeatherData(history.city, month, day);
    } else {
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      loadWeatherData(currentCity, month, day);
    }
  }, []);

  const loadWeatherData = async (city: string, month: number, day: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherStatistics(city, month, day);
      setStatistics(data);
      const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      saveSearchHistory(city, dateStr);
    } catch (err) {
      console.error(err);
      if (city !== 'seoul') {
        setCurrentCity('seoul');
        try {
          const fallback = await fetchWeatherStatistics('seoul', month, day);
          setStatistics(fallback);
          const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          saveSearchHistory('seoul', dateStr);
        } catch {
          setError('날씨 데이터를 불러오는데 실패했습니다.');
        }
      } else {
        setError('날씨 데이터를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (month: number, day: number) => {
    const date = new Date(2026, month - 1, day);
    setCurrentDate(date);
    loadWeatherData(currentCity, month, day);
  };

  const handleCitySelect = (cityId: string) => {
    setCurrentCity(cityId);
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    loadWeatherData(cityId, month, day);
  };

  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const cityKorean = statistics?.city_korean ?? '—';

  // 히어로에 표시할 날씨 요약
  const avgTemp = statistics
    ? Math.round(statistics.statistics.temperature.avg.average)
    : null;
  const avgMax = statistics
    ? Math.round(statistics.statistics.temperature.max.average)
    : null;
  const avgMin = statistics
    ? Math.round(statistics.statistics.temperature.min.average)
    : null;
  const dominantCode = statistics ? getDominantCode(statistics) : null;
  const avgWind = statistics
    ? Math.round(statistics.statistics.avgWindSpeed)
    : null;
  const avgHumidity = statistics
    ? Math.round(statistics.statistics.humidity.average)
    : null;
  const rainPct = statistics
    ? Math.round(statistics.statistics.rainProbability)
    : null;
  const totalYears = statistics
    ? statistics.yearlyData.filter((d) => d.hours.length > 0).length
    : 0;

  return (
    <>
    <div className="phone">
      {/* ── 히어로 영역 ─────────────────────────────────────── */}
      <div className="hero">
        {/* 네비 */}
        <div className="nav">
          <button className="nav-btn" onClick={() => setIsDatePickerOpen(true)}>📅</button>
          <div>
            <div className="nav-city">
              📍 {loading ? '...' : cityKorean}
            </div>
            <div className="nav-date">
              {month}월 {day}일
              {totalYears > 0 ? ` · ${totalYears}년 기준` : ''}
            </div>
          </div>
          <button className="nav-btn" onClick={() => setIsCitySelectorOpen(true)}>🌍</button>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="hero-body">
          <div className="hero-left">
            <div className="hero-label">평균 기온</div>
            {avgTemp !== null ? (
              <>
                <div className="hero-temp">
                  {avgTemp}<sup>°</sup>
                </div>
                <div className="hero-range">
                  최저 {avgMin}° / 최고 {avgMax}°
                </div>
              </>
            ) : (
              <div className="hero-temp" style={{ fontSize: 48, opacity: 0.5 }}>
                {loading ? '...' : '—'}
              </div>
            )}
          </div>
          <div className="hero-icon">
            {dominantCode !== null ? weatherEmoji(dominantCode) : '🌤️'}
          </div>
        </div>

        {/* 스탯 바 */}
        <div className="hero-stats">
          <div className="hstat">
            <div className="hstat-val">
              {avgWind !== null ? `${avgWind}km/h` : '—'}
            </div>
            <div className="hstat-label">바람</div>
          </div>
          <div className="hstat">
            <div className="hstat-val">
              {avgHumidity !== null ? `${avgHumidity}%` : '—'}
            </div>
            <div className="hstat-label">습도</div>
          </div>
          <div className="hstat">
            <div className="hstat-val">
              {rainPct !== null ? `${rainPct}%` : '—'}
            </div>
            <div className="hstat-label">강수확률</div>
          </div>
        </div>
      </div>

      {/* 곡선 전환 */}
      <div className="curve" />

      {/* ── 로딩 ────────────────────────────────────────────── */}
      {loading && (
        <div className="body" style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div
              style={{
                width: 56, height: 56,
                border: '4px solid #EEF4FF',
                borderTop: '4px solid var(--blue-mid)',
                borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
              }}
            />
          </div>
          <p style={{ marginTop: 20, color: 'var(--ink2)', fontWeight: 500 }}>
            날씨 데이터를 불러오는 중...
          </p>
        </div>
      )}

      {/* ── 에러 ────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="body">
          <div
            className="summary-card"
            style={{ background: '#fff5f5', borderLeft: '3px solid #f87171' }}
          >
            <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
          </div>
        </div>
      )}

      {/* ── 날씨 상세 ────────────────────────────────────────── */}
      {!loading && !error && statistics && (
        <WeatherStats statistics={statistics} />
      )}

      {/* 푸터 */}
      {!loading && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--ink3)',
            padding: '12px 0 40px',
          }}
        >
          <p>
            데이터 출처:{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--blue-mid)', fontWeight: 600 }}
            >
              Open-Meteo
            </a>
          </p>
          <p style={{ marginTop: 4 }}>1940-2025년 시간별 날씨 데이터 기반 (Supabase)</p>
        </div>
      )}

    </div>

    {/* ── 다이얼로그 (.phone 바깥에서 렌더링하여 fixed positioning 보장) ── */}
    <DatePickerDialog
      isOpen={isDatePickerOpen}
      onClose={() => setIsDatePickerOpen(false)}
      onSelectDate={handleDateSelect}
      currentDate={currentDate}
    />
    <CitySelector
      isOpen={isCitySelectorOpen}
      onClose={() => setIsCitySelectorOpen(false)}
      onSelectCity={handleCitySelect}
      currentCity={currentCity}
    />
    </>
  );
};

export default Home;
