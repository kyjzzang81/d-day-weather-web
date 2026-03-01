import React, { useState, useRef } from 'react';
import { WeatherStatistics, HourlyAverage } from '../types/weather';
import {
  analyzeWeather,
  WeatherAnalysis,
  ActivityItem,
  AvoidItem,
  PackingItem,
  NearbyRec,
} from '../utils/weatherRules';

// ─── 날씨 이모지 ──────────────────────────────────────────────────────────────
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

// ─── 마크다운 bold 처리 ───────────────────────────────────────────────────────
function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i} className="text-ink font-semibold">{p}</strong> : p
      )}
    </>
  );
}

// ─── 섹션 레이블 ──────────────────────────────────────────────────────────────
const SecLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="sec-label">{children}</div>
);

// ─── 요약 카드 ────────────────────────────────────────────────────────────────
const SummaryCard: React.FC<{ text: string }> = ({ text }) => (
  <div className="summary-card">
    <BoldText text={text} />
  </div>
);

// ─── 여행 적합도 카드 ─────────────────────────────────────────────────────────
const VerdictCard: React.FC<{ verdict: WeatherAnalysis['verdict'] }> = ({ verdict }) => (
  <div className="verdict-card">
    <div className="verdict-top">
      <span className="text-xl">✈️</span>
      <div className="verdict-badge">{verdict.label}</div>
    </div>
    <div className="verdict-title">{verdict.title}</div>
    <div className="verdict-desc">
      <BoldText text={verdict.desc} />
    </div>
  </div>
);

// ─── 기온 범위 카드 ───────────────────────────────────────────────────────────
const TempRangeCard: React.FC<{ statistics: WeatherStatistics['statistics'] }> = ({
  statistics,
}) => {
  const { temperature } = statistics;
  const avg = Math.round(temperature.avg.average);
  const min = Math.round(temperature.min.lowest);
  const max = Math.round(temperature.max.highest);
  const avgMax = Math.round(temperature.max.average);
  const avgMin = Math.round(temperature.min.average);

  // 바 차트 계산: min to max 기준으로 range/fill 위치 계산
  const range = max - min || 1;
  const rangeLeft = ((avgMin - min) / range) * 100;
  const rangeWidth = ((avgMax - avgMin) / range) * 100;
  const fillLeft = ((avg - min) / range) * 100;
  const trendDiff = statistics.trend.diff;

  return (
    <div className="card mb-3">
      <div className="temp-top">
        <div>
          <div className="temp-avg">
            {avg}<sup>°</sup>
          </div>
          <div className="temp-sub">평균 기온</div>
        </div>
        {Math.abs(trendDiff) >= 0.5 && (
          <div className="temp-badge">
            {trendDiff > 0 ? '📈' : '📉'} 요즘 {Math.abs(trendDiff).toFixed(1)}° {trendDiff > 0 ? '더 따뜻' : '더 추운'} 편
          </div>
        )}
      </div>
      <div className="bar-wrap">
        <div className="bar-bg" />
        <div
          className="bar-range"
          style={{ left: `${Math.max(0, rangeLeft)}%`, width: `${Math.min(100 - rangeLeft, rangeWidth)}%` }}
        />
        <div
          className="bar-fill"
          style={{ left: `${Math.max(0, fillLeft - 10)}%`, width: '20%' }}
        />
        <div
          className="bar-thumb"
          style={{ left: `${Math.min(90, Math.max(5, fillLeft))}%` }}
        />
      </div>
      <div className="bar-labels">
        <div>
          {min}°<br /><span style={{ fontSize: 10 }}>추운 해</span>
        </div>
        <div className="bar-mid">
          {avg}°<br /><span style={{ fontSize: 10, fontWeight: 400, color: 'var(--ink3)' }}>평균</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          {max}°<br /><span style={{ fontSize: 10 }}>따뜻한 해</span>
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink3)' }}>
        <span>최저 평균 {avgMin}°</span>
        <span>최고 평균 {avgMax}°</span>
      </div>
    </div>
  );
};

// ─── 강수 카드 ────────────────────────────────────────────────────────────────
const PrecipCard: React.FC<{
  statistics: WeatherStatistics['statistics'];
  analysis: WeatherAnalysis;
}> = ({ statistics, analysis }) => {
  const rainPct = Math.round(statistics.rainProbability);
  const snowPct = Math.round(statistics.snowProbability);
  const freq =
    rainPct < 20 ? '5번 중 1번꼴' :
    rainPct < 30 ? '4번 중 1번꼴' :
    rainPct < 40 ? '3번 중 1번꼴' :
    rainPct < 60 ? '2번 중 1번꼴' : '2번 중 1번 이상';
  const noteMsg =
    analysis.rainGrade === 'NO_RAIN' ? '비 걱정 없이 야외 일정을 즐길 수 있어요.' :
    analysis.rainGrade === 'LOW_RAIN' ? '☂️ 내리더라도 많지 않아요. 접이식 우산이면 충분해요.' :
    analysis.rainGrade === 'MID_RAIN' ? '☔ 비가 올 수 있어요. 우산을 꼭 챙기세요.' :
    '🌧️ 비가 올 가능성이 높아요. 우산은 필수예요.';

  return (
    <>
      <div className="rain-row">
        <div className="rain-card">
          <div className="rain-icon">🌧️</div>
          <div className="rain-pct" style={{ color: 'var(--blue-mid)' }}>{rainPct}%</div>
          <div className="rain-name">비 올 확률</div>
          <div className="rain-freq">{freq}</div>
        </div>
        {snowPct > 0 && (
          <div className="rain-card">
            <div className="rain-icon">❄️</div>
            <div className="rain-pct" style={{ color: 'var(--ink3)' }}>{snowPct}%</div>
            <div className="rain-name">눈 올 확률</div>
            <div className="rain-freq">{snowPct < 10 ? '드물게 있음' : '종종 있음'}</div>
          </div>
        )}
      </div>
      <div className="rain-note">{noteMsg}</div>
    </>
  );
};

// ─── 타임라인 카드 ────────────────────────────────────────────────────────────
const TimelineCard: React.FC<{
  hourlyAverages: HourlyAverage[];
  bestTimeText: string;
}> = ({ hourlyAverages, bestTimeText }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="card">
      <div className="tl-scroll" ref={scrollRef}>
        <div className="tl-inner">
          {hourlyAverages
            .filter((h) => h.hour % 2 === 0)
            .map((h) => (
              <div key={h.hour} className="tl-col">
                <div className="tl-time">{h.hour}시</div>
                <div
                  className={`tl-box ${
                    h.isBestHour ? 'best' : h.hour >= 6 && h.hour < 19 ? 'on' : 'off'
                  }`}
                >
                  {weatherEmoji(h.dominantWeatherCode)}
                  {h.isBestHour && <div className="tl-dot" />}
                </div>
                <div className="tl-temp">{Math.round(h.avgTemp)}°</div>
              </div>
            ))}
        </div>
      </div>
      {bestTimeText && <div className="tl-note">✦ {bestTimeText}</div>}
    </div>
  );
};

// ─── 인근 날짜 ────────────────────────────────────────────────────────────────
const NearbyDatesCard: React.FC<{ recs: NearbyRec[] }> = ({ recs }) => {
  if (recs.length === 0) return null;
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="alt-list">
      {recs.map((r) => {
        const dt = new Date(2026, r.month - 1, r.day);
        const dayStr = DAYS[dt.getDay()];
        return (
          <div key={`${r.month}-${r.day}`} className="alt-item">
            <div className="alt-icon">{r.icon}</div>
            <div className="alt-info">
              <div className="alt-date">
                {r.month}월 {r.day}일 · {dayStr}요일
              </div>
              <div className="alt-name">{r.compareSummary}</div>
              <div className="alt-desc">
                맑음 {Math.round(r.clearPct)}% · 강수 {Math.round(r.rainPct)}%
              </div>
            </div>
            <div className="alt-right">
              <div className="alt-hi">{Math.round(r.tempMax)}°</div>
              <div className="alt-lo">{Math.round(r.tempMin)}°</div>
              <div className={`alt-tag ${r.tagColor}`}>{r.tagLabel}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── 활동 가이드 ──────────────────────────────────────────────────────────────
const ActivitiesGuide: React.FC<{
  activities: ActivityItem[];
  avoidItems: AvoidItem[];
}> = ({ activities, avoidItems }) => {
  const [tab, setTab] = useState<'good' | 'bad'>('good');
  return (
    <>
      <div className="toggle-row">
        <button
          className={`toggle-btn ${tab === 'good' ? 'a-good' : ''}`}
          onClick={() => setTab('good')}
        >
          ✅ 하기 좋은 것
        </button>
        <button
          className={`toggle-btn ${tab === 'bad' ? 'a-bad' : ''}`}
          onClick={() => setTab('bad')}
        >
          🚫 피하면 좋은 것
        </button>
      </div>

      {tab === 'good' ? (
        <div className="panel on">
          {activities.map((a, i) => (
            <div key={i} className="act-item">
              <div className="act-icon">{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="act-name">{a.name}</div>
                <div className="act-why">{a.reason}</div>
              </div>
              <div className={`act-tag ${a.isBest ? 'best' : ''}`}>{a.tag}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel on">
          {avoidItems.length === 0 ? (
            <div className="act-item">
              <div style={{ flex: 1, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
                🎉 특별히 피할 것이 없는 좋은 날이에요!
              </div>
            </div>
          ) : (
            avoidItems.map((a, i) => (
              <div key={i} className="avd-item">
                <div className="avd-icon">{a.icon}</div>
                <div>
                  <div className="avd-name">{a.name}</div>
                  <div className="avd-why">{a.reason}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

// ─── 트렌드 카드 ──────────────────────────────────────────────────────────────
const TrendCard: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  return (
    <div className="trend">
      <div className="trend-icon">📈</div>
      <div className="trend-text">
        <BoldText text={text} />
      </div>
    </div>
  );
};

// ─── 연도별 카드 (compact) ────────────────────────────────────────────────────
const TIME_SLOTS = [
  { hour: 0, label: '자정', night: true },
  { hour: 4, label: '새벽', night: true },
  { hour: 8, label: '오전', night: false },
  { hour: 12, label: '낮', night: false },
  { hour: 16, label: '오후', night: false },
  { hour: 20, label: '저녁', night: false },
];

function getNearestHour(hours: WeatherStatistics['yearlyData'][0]['hours'], target: number) {
  if (hours.length === 0) return null;
  return hours.reduce((best, h) =>
    Math.abs(h.hour - target) < Math.abs(best.hour - target) ? h : best
  );
}

const SLOT_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  clear:  { bg: 'bg-amber-50',  border: 'border-amber-200/60',  text: 'text-amber-700'  },
  cloudy: { bg: 'bg-slate-50',  border: 'border-slate-200/60',  text: 'text-slate-600'  },
  rain:   { bg: 'bg-sky-50',    border: 'border-sky-200/60',    text: 'text-sky-700'    },
  snow:   { bg: 'bg-violet-50', border: 'border-violet-200/60', text: 'text-violet-700' },
  fog:    { bg: 'bg-gray-50',   border: 'border-gray-200/60',   text: 'text-gray-500'   },
  storm:  { bg: 'bg-indigo-50', border: 'border-indigo-200/60', text: 'text-indigo-700' },
};
const NIGHT_STYLE = { bg: 'bg-slate-100', border: 'border-slate-200/60', text: 'text-slate-500' };

function categorize(code: number): string {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code === 95 || code === 96 || code === 99) return 'storm';
  if (code >= 51) return 'rain';
  return 'cloudy';
}

function weatherLabel(code: number): string {
  if (code === 0) return '맑음';
  if (code === 1) return '주로 맑음';
  if (code === 2) return '구름 조금';
  if (code === 3) return '흐림';
  if (code === 45 || code === 48) return '안개';
  if (code >= 51 && code <= 55) return '이슬비';
  if (code >= 61 && code <= 65) return '비';
  if (code >= 71 && code <= 73) return '눈';
  if (code >= 80 && code <= 82) return '소나기';
  if (code === 95) return '뇌우';
  return '—';
}

const YearCard: React.FC<{ dayData: WeatherStatistics['yearlyData'][0] }> = ({ dayData }) => {
  const noData = dayData.hours.length === 0;
  const dayHours = dayData.hours.filter((h) => h.hour >= 6 && h.hour < 19);
  const dominantCode = (() => {
    const src = dayHours.length > 0 ? dayHours : dayData.hours;
    if (src.length === 0) return 0;
    const cnt: Record<number, number> = {};
    src.forEach((h) => { cnt[h.weather_code] = (cnt[h.weather_code] ?? 0) + 1; });
    return Number(Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0]);
  })();

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(42,92,230,0.06)' }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-800">{dayData.year}</span>
          {!noData && (
            <span className="text-xs text-gray-400">
              {weatherEmoji(dominantCode)} {weatherLabel(dominantCode)}
            </span>
          )}
        </div>
        {!noData && (
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span className="text-sky-500">{dayData.tempMin.toFixed(0)}°</span>
            <span className="text-gray-300">/</span>
            <span className="text-rose-500">{dayData.tempMax.toFixed(0)}°</span>
            {dayData.totalPrecipitation > 0.1 && (
              <span className="ml-1 text-sky-400 font-medium">
                💧{dayData.totalPrecipitation.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-6 gap-1.5 px-3 pb-3">
        {TIME_SLOTS.map(({ hour, label, night }) => {
          const data = noData ? null : getNearestHour(dayData.hours, hour);
          const cat = data ? categorize(data.weather_code) : 'cloudy';
          const style = night ? NIGHT_STYLE : (SLOT_STYLE[cat] ?? SLOT_STYLE.cloudy);
          return (
            <div
              key={hour}
              className={`flex flex-col items-center py-2 px-0.5 rounded-xl border ${style.bg} ${style.border} text-center`}
            >
              <span className="text-[9px] font-medium text-gray-400 mb-1 leading-none">{label}</span>
              <span className="text-xl leading-none mb-1">
                {data ? weatherEmoji(data.weather_code) : '—'}
              </span>
              <span className={`text-[10px] font-bold leading-none ${data ? style.text : 'text-gray-300'}`}>
                {data ? `${data.temperature.toFixed(0)}°` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── 준비물 다이얼로그 ────────────────────────────────────────────────────────
const PackingDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  items: PackingItem[];
  cityKorean: string;
  date: string;
}> = ({ isOpen, onClose, items, cityKorean, date }) => {
  const [m, d] = date.split('-');
  if (!isOpen) return null;

  return (
    <div
      className="overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dialog">
        <div className="dlg-handle" />
        <div className="dlg-title">🎒 준비물 리스트</div>
        <div className="dlg-sub">
          {cityKorean} {parseInt(m)}월 {parseInt(d)}일 기준
        </div>
        <div className="pack-list">
          {items.map((item, i) => (
            <div key={i} className="pack-item">
              <div className="pack-emoji">{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="pack-name">{item.name}</div>
                <div className="pack-why">{item.reason}</div>
              </div>
              <div className={`pack-tag ${item.priority === 'must' ? 't-must' : 't-rec'}`}>
                {item.priority === 'must' ? '필수' : '권장'}
              </div>
            </div>
          ))}
        </div>
        <button className="dlg-close" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
const WeatherStats: React.FC<{ statistics: WeatherStatistics }> = ({ statistics }) => {
  const [packingOpen, setPackingOpen] = useState(false);
  const validYears = statistics.yearlyData.filter((d) => d.hours.length > 0);
  const hasData = validYears.length > 0;

  if (!hasData) {
    return (
      <div
        className="bg-white rounded-2xl border border-amber-100 p-8 text-center"
        style={{ boxShadow: '0 2px 12px rgba(245,158,11,0.08)' }}
      >
        <div className="text-5xl mb-4">🔄</div>
        <h3 className="text-lg font-bold text-amber-700 mb-1">데이터 수집 전</h3>
        <p className="text-sm text-amber-600">
          <strong>{statistics.city_korean || statistics.city}</strong>의 날씨 데이터가 아직 수집되지 않았습니다.
        </p>
      </div>
    );
  }

  const analysis = analyzeWeather(statistics);

  return (
    <>
      <div className="body">

        {/* 요약 */}
        <SummaryCard text={analysis.summaryText} />

        {/* 여행 적합도 */}
        <VerdictCard verdict={analysis.verdict} />

        {/* 기온 범위 */}
        <SecLabel>기온 범위</SecLabel>
        <TempRangeCard statistics={statistics.statistics} />

        {/* 강수 */}
        <SecLabel>강수</SecLabel>
        <PrecipCard statistics={statistics.statistics} analysis={analysis} />

        {/* 타임라인 */}
        {statistics.statistics.hourlyAverages.length > 0 && (
          <>
            <SecLabel>하루 기온 흐름</SecLabel>
            <TimelineCard
              hourlyAverages={statistics.statistics.hourlyAverages}
              bestTimeText={analysis.bestTimeText}
            />
          </>
        )}

        {/* 인근 날짜 */}
        {analysis.nearbyRecs.length > 0 && (
          <>
            <SecLabel>더 좋은 날짜</SecLabel>
            <NearbyDatesCard recs={analysis.nearbyRecs} />
          </>
        )}

        {/* 활동 가이드 */}
        <SecLabel>활동 가이드</SecLabel>
        <ActivitiesGuide
          activities={analysis.activities}
          avoidItems={analysis.avoidItems}
        />

        {/* 기후 변화 */}
        {analysis.trendText && (
          <>
            <SecLabel>기후 변화</SecLabel>
            <TrendCard text={analysis.trendText} />
          </>
        )}

        {/* 연도별 날씨 */}
        <SecLabel>연도별 날씨 ({validYears.length}년)</SecLabel>
        <div className="space-y-2 mb-4">
          {[...statistics.yearlyData]
            .sort((a, b) => b.year - a.year)
            .map((d) => (
              <YearCard key={d.year} dayData={d} />
            ))}
        </div>

        <div style={{ height: 100 }} />
      </div>

      {/* 준비물 버튼 */}
      <div className="sticky-wrap">
        <button className="sticky-btn" onClick={() => setPackingOpen(true)}>
          🎒 준비물 확인하기
        </button>
      </div>

      {/* 준비물 다이얼로그 */}
      <PackingDialog
        isOpen={packingOpen}
        onClose={() => setPackingOpen(false)}
        items={analysis.packingItems}
        cityKorean={statistics.city_korean || statistics.city}
        date={statistics.date}
      />
    </>
  );
};

export default WeatherStats;
