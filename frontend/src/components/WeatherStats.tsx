import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { WeatherStatistics, HourlyAverage } from '../types/weather';
import {
  analyzeWeather,
  WeatherAnalysis,
  ActivityItem,
  AvoidItem,
  PackingItem,
  NearbyRec,
} from '../utils/weatherRules';

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


function getWeatherLottie(stats: WeatherStatistics['statistics']): string {
  if (stats.avgWindSpeed >= 25) return '/weather-windy.lottie';

  const snowP = stats.snowProbability;
  const rainP = stats.rainProbability;
  const clearP = stats.clearProbability;
  const avgPrecip = stats.precipitation.average;

  if (snowP >= 30) return avgPrecip >= 3 ? '/weather-heavy-snow.lottie' : '/weather-light-snow.lottie';
  if (snowP >= 15) return '/weather-light-snow.lottie';
  if (rainP >= 40) return avgPrecip >= 5 ? '/weather-heavy-rain.lottie' : '/weather-light-rain.lottie';
  if (rainP >= 20) return '/weather-light-rain.lottie';
  if (clearP >= 55) return '/weather-sunny.lottie';
  if (clearP >= 35) return '/weather-partly-cloudy.lottie';
  return '/weather-foggy.lottie';
}

function getYearlyLottie(d: { dominantWeatherCode: number; totalRain: number; totalSnowfall: number; maxWindGust: number; totalPrecipitation: number }): string {
  if (d.maxWindGust >= 50) return '/weather-windy.lottie';

  if (d.totalSnowfall >= 3) return '/weather-heavy-snow.lottie';
  if (d.totalSnowfall >= 0.5) return '/weather-light-snow.lottie';
  if (d.totalRain >= 10 || d.totalPrecipitation >= 10) return '/weather-heavy-rain.lottie';
  if (d.totalRain >= 1 || d.totalPrecipitation >= 1) return '/weather-light-rain.lottie';

  const code = d.dominantWeatherCode;
  if ([45, 48].includes(code)) return '/weather-foggy.lottie';
  if (code <= 1) return '/weather-sunny.lottie';
  if (code <= 3) return '/weather-partly-cloudy.lottie';
  return '/weather-partly-cloudy.lottie';
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i}>{p}</strong> : p
      )}
    </>
  );
}

function precipImpact(avgMm: number, maxMm: number) {
  if (avgMm < 1) return { label: '거의 없음', desc: '우산 없이도 괜찮아요. 야외 일정 자유롭게 잡으세요.', color: '#6FD6A8' };
  if (avgMm < 5) return { label: '가벼운 비', desc: '잠깐 흩뿌리는 정도예요. 접이식 우산이면 충분합니다.', color: '#5B8EFF' };
  if (avgMm < 15) return { label: '보통', desc: '우산은 꼭 챙기세요. 야외 일정은 실내 대안도 준비하면 좋아요.', color: '#FFB547' };
  if (avgMm < 30) return {
    label: '다소 많음',
    desc: maxMm >= 40 ? '많이 내리는 해도 있어요. 방수 신발과 우비를 추천합니다.' : '제법 내릴 수 있어요. 야외보다 실내 위주로 계획하세요.',
    color: '#FF5B5B',
  };
  return { label: '많음', desc: '폭우 가능성이 있어요. 방수 장비 필수, 야외 일정은 최소화하세요.', color: '#FF5B5B' };
}

interface TimePeriod { sky: string; temp: number; lottie: string }

function describeTimePeriod(hours: HourlyAverage[]): TimePeriod {
  if (hours.length === 0) return { sky: '맑은', temp: 0, lottie: '/weather-sunny.lottie' };
  const avgTemp = Math.round(hours.reduce((s, h) => s + h.avgTemp, 0) / hours.length);
  const avgCloud = hours.reduce((s, h) => s + h.avgCloudCover, 0) / hours.length;
  const avgPrecip = hours.reduce((s, h) => s + h.avgPrecipitation, 0) / hours.length;
  const hasSnow = hours.some(h => [71,73,75,77,85,86].includes(h.dominantWeatherCode));

  if (hasSnow) {
    return avgPrecip >= 0.3
      ? { sky: '눈 내리는', temp: avgTemp, lottie: '/weather-heavy-snow.lottie' }
      : { sky: '눈 오는', temp: avgTemp, lottie: '/weather-light-snow.lottie' };
  }
  if (avgPrecip >= 2) return { sky: '비 오는', temp: avgTemp, lottie: '/weather-heavy-rain.lottie' };
  if (avgPrecip >= 0.3) return { sky: '비 살짝 오는', temp: avgTemp, lottie: '/weather-light-rain.lottie' };
  if (avgCloud >= 70) return { sky: '흐린', temp: avgTemp, lottie: '/weather-foggy.lottie' };
  if (avgCloud >= 40) return { sky: '구름 낀', temp: avgTemp, lottie: '/weather-partly-cloudy.lottie' };
  return { sky: '맑은', temp: avgTemp, lottie: '/weather-sunny.lottie' };
}

function buildNarrativeTitle(
  city: string,
  m: TimePeriod, a: TimePeriod, e: TimePeriod,
): string {
  if (m.sky === a.sky && a.sky === e.sky) return `하루 종일 ${m.sky},\n${city}`;
  if (m.sky === a.sky) return `${m.sky} 낮,\n${e.sky} 저녁의 ${city}`;
  if (a.sky === e.sky) return `${m.sky} 아침,\n${a.sky} 오후의 ${city}`;
  return `${m.sky} 아침, ${a.sky} 오후,\n${e.sky} 저녁의 ${city}`;
}

// ─── Slide 1: 요약 ───────────────────────────────────────────────────────────
const Slide1Summary: React.FC<{
  statistics: WeatherStatistics;
  analysis: WeatherAnalysis;
}> = ({ statistics, analysis }) => {
  const s = statistics.statistics;
  const ha = s.hourlyAverages;
  const morning = describeTimePeriod(ha.filter(h => h.hour >= 6 && h.hour < 12));
  const afternoon = describeTimePeriod(ha.filter(h => h.hour >= 12 && h.hour < 18));
  const evening = describeTimePeriod(ha.filter(h => h.hour >= 18 && h.hour < 22));

  const cityName = statistics.city_korean || statistics.city;
  const title = buildNarrativeTitle(cityName, morning, afternoon, evening);

  return (
    <div className="slide">
      <div className="slide-label">01 / 날씨 요약</div>
      <div className="slide-title s1-narrative">
        {title.split('\n').map((line, i) => (
          <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
        ))}
      </div>

      <div className="s1-illust">
        <DotLottieReact
          src={getWeatherLottie(s)}
          loop
          autoplay
          style={{ width: 140, height: 140 }}
        />
      </div>

      <div className="s1-tl-row">
        {[
          { label: '오전', p: morning },
          { label: '오후', p: afternoon },
          { label: '저녁', p: evening },
        ].map(({ label, p }) => (
          <div key={label} className="s1-tl-cell">
            <DotLottieReact src={p.lottie} loop autoplay style={{ width: 38, height: 38 }} />
            <div className="s1-tl-temp">{p.temp}°</div>
            <div className="s1-tl-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="slide-desc" style={{ marginTop: 16 }}>
        <BoldText text={analysis.summaryText} />
      </div>

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
    </div>
  );
};

// ─── Slide 2: 여행 적합도 ────────────────────────────────────────────────────
const Slide2Verdict: React.FC<{ analysis: WeatherAnalysis }> = ({ analysis }) => {
  const { verdict } = analysis;
  const stars = '⭐'.repeat(verdict.stars);

  const pills: { label: string; cls: string }[] = [];
  if (analysis.skyGrade === 'CLEAR') pills.push({ label: '야외 좋음', cls: 'pill-mint' });
  else if (analysis.skyGrade === 'PARTLY') pills.push({ label: '야외 반반', cls: 'pill-blue' });
  else pills.push({ label: '실내 추천', cls: 'pill-blue' });

  if (analysis.tempGrade === 'COLD') pills.push({ label: '방한 필수', cls: 'pill-red' });
  else if (analysis.tempGrade === 'COOL') pills.push({ label: '겉옷 필수', cls: 'pill-amber' });

  if (analysis.rainGrade !== 'NO_RAIN') pills.push({ label: '우산 챙기기', cls: 'pill-red' });
  if (analysis.flags.includes('HIGH_DIURNAL')) pills.push({ label: '일교차 주의', cls: 'pill-amber' });

  return (
    <div className="slide">
      <div className="slide-label">02 / 여행 적합도</div>
      <div className="slide-title">이 날짜,<br />여행하기 어때요?</div>

      <div className="verdict-big">
        {stars && <div className="v-stars">{stars}</div>}
        <div className="v-grade">{verdict.label.replace(/⭐/g, '').trim()}</div>
        <div className="v-subtitle">{verdict.title}</div>
      </div>

      {pills.length > 0 && (
        <div className="v-pills">
          {pills.map((p, i) => (
            <span key={i} className={`v-pill ${p.cls}`}>{p.label}</span>
          ))}
        </div>
      )}

      <div className="v-desc-box">
        <BoldText text={verdict.desc} />
      </div>
    </div>
  );
};

// ─── Slide 3: 기온 ──────────────────────────────────────────────────────────
const Slide3Temp: React.FC<{
  statistics: WeatherStatistics['statistics'];
  hourlyAverages: HourlyAverage[];
  bestTimeText: string;
}> = ({ statistics, hourlyAverages, bestTimeText }) => {
  const { temperature, trend } = statistics;
  const avg = Math.round(temperature.avg.average);
  const min = Math.round(temperature.min.lowest);
  const max = Math.round(temperature.max.highest);
  const range = max - min || 1;
  const avgPct = ((avg - min) / range) * 100;
  const trendDiff = trend.diff;

  return (
    <div className="slide">
      <div className="slide-label">03 / 기온 분포</div>
      <div className="slide-title">온도는 어느<br />범위에 있나요?</div>

      <div className="temp-headline">
        <div>
          <div className="temp-big">{avg}<sup>°</sup></div>
          <div className="temp-label-sm">평균 기온</div>
        </div>
      </div>

      {Math.abs(trendDiff) >= 0.5 && (
        <div className={`temp-trend-badge ${trendDiff < 0 ? 'down' : ''}`}>
          {trendDiff > 0 ? '📈' : '📉'} 요즘 {Math.abs(trendDiff).toFixed(1)}°C {trendDiff > 0 ? '더 따뜻한' : '더 추운'} 편
        </div>
      )}

      <div className="temp-bar-section">
        <div className="temp-bar-title">기온 분포 범위</div>
        <div className="tbar-wrap">
          <div className="tbar-bg" />
          <div className="tbar-cold" style={{ width: '30%' }} />
          <div className="tbar-avg" style={{ left: '30%', width: '40%' }} />
          <div className="tbar-warm" style={{ left: '70%', width: '30%' }} />
          <div className="tbar-dot" style={{ left: `${Math.min(92, Math.max(8, avgPct))}%` }} />
        </div>
        <div className="tbar-labels">
          <span>{min}° 추운 해</span>
          <span>{avg}° 평균</span>
          <span>{max}° 따뜻한 해</span>
        </div>
      </div>

      {hourlyAverages.length > 0 && (
        <>
          <div className="temp-bar-title">하루 기온 흐름</div>
          <div className="hourly-mini">
            {hourlyAverages
              .filter((h) => h.hour % 2 === 0 || h.hour % 3 === 0)
              .filter((_, i) => i < 10)
              .map((h) => (
                <div key={h.hour} className="h-col">
                  <div className="h-time">{String(h.hour).padStart(2, '0')}시</div>
                  <div className={`h-box ${h.isBestHour ? 'peak' : ''}`}>
                    {weatherEmoji(h.dominantWeatherCode)}
                  </div>
                  <div className="h-val">{Math.round(h.avgTemp)}°</div>
                </div>
              ))}
          </div>
          {bestTimeText && <div className="best-time-note">✦ {bestTimeText}</div>}
        </>
      )}
    </div>
  );
};

// ─── Slide 4: 강수 ──────────────────────────────────────────────────────────
const Slide4Precip: React.FC<{
  statistics: WeatherStatistics['statistics'];
  analysis: WeatherAnalysis;
}> = ({ statistics, analysis }) => {
  const rainPct = Math.round(statistics.rainProbability);
  const snowPct = Math.round(statistics.snowProbability);
  const avgMm = statistics.precipitation.average;
  const maxMm = statistics.precipitation.highest;
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

  const impact = precipImpact(avgMm, maxMm);

  return (
    <div className="slide">
      <div className="slide-label">04 / 강수 · 눈</div>
      <div className="slide-title">비나 눈이<br />올 수 있나요?</div>

      <div className="rain-big-row">
        <div className="rain-big-card">
          <div className="rbc-icon">🌧️</div>
          <div className="rbc-val" style={{ color: 'var(--c-acc1)' }}>{rainPct}%</div>
          <div className="rbc-name">비 올 확률</div>
          <div className="rbc-freq">{freq}</div>
        </div>
        {snowPct > 0 ? (
          <div className="rain-big-card">
            <div className="rbc-icon">🌨️</div>
            <div className="rbc-val" style={{ color: 'var(--c-acc5)' }}>{snowPct}%</div>
            <div className="rbc-name">눈 올 확률</div>
            <div className="rbc-freq">{snowPct < 10 ? '드물게 있음' : '종종 있음'}</div>
          </div>
        ) : (
          <div className="rain-big-card">
            <div className="rbc-icon">☀️</div>
            <div className="rbc-val" style={{ color: 'var(--c-acc3)' }}>
              {Math.round(statistics.clearProbability)}%
            </div>
            <div className="rbc-name">맑을 확률</div>
            <div className="rbc-freq">맑은 날 비율</div>
          </div>
        )}
      </div>

      <div className="rain-insight">
        {noteMsg}
      </div>

      {analysis.rainGrade !== 'NO_RAIN' && (
        <div className="precip-detail">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>💧 예상 강수량</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
              background: `${impact.color}22`, color: impact.color,
            }}>{impact.label}</span>
          </div>
          <div className="precip-row">
            <div className="precip-box">
              <div className="precip-num">{avgMm.toFixed(1)}<span>mm</span></div>
              <div className="precip-sub">평균</div>
            </div>
            <div className="precip-box warn">
              <div className="precip-num">{maxMm.toFixed(1)}<span>mm</span></div>
              <div className="precip-sub">최대</div>
            </div>
          </div>
          <div className="precip-impact">🧳 {impact.desc}</div>
        </div>
      )}
    </div>
  );
};

// ─── Slide 5: 활동 가이드 ───────────────────────────────────────────────────
const Slide5Activities: React.FC<{
  activities: ActivityItem[];
  avoidItems: AvoidItem[];
}> = ({ activities, avoidItems }) => {
  const [tab, setTab] = useState<'go' | 'bad'>('go');

  return (
    <div className="slide">
      <div className="slide-label">05 / 활동 가이드</div>
      <div className="slide-title">뭘 하고,<br />뭘 피해야 할까요?</div>

      <div className="act-tabs">
        <button className={`act-tab ${tab === 'go' ? 'go-active' : ''}`} onClick={() => setTab('go')}>
          ✅ 하기 좋은 것
        </button>
        <button className={`act-tab ${tab === 'bad' ? 'bad-active' : ''}`} onClick={() => setTab('bad')}>
          🚫 피하면 좋은 것
        </button>
      </div>

      <div className={`act-panel ${tab === 'go' ? 'show' : ''}`}>
        {activities.map((a, i) => (
          <div key={i} className="act-card">
            <div className="act-card-icon">{a.icon}</div>
            <div className="act-card-body">
              <div className="act-card-name">{a.name}</div>
              <div className="act-card-why">{a.reason}</div>
            </div>
            <div className={`act-card-tag ${a.isBest ? 'tag-best' : 'tag-norm'}`}>{a.tag}</div>
          </div>
        ))}
      </div>

      <div className={`act-panel ${tab === 'bad' ? 'show' : ''}`}>
        {avoidItems.length === 0 ? (
          <div className="act-card">
            <div className="act-card-body" style={{ textAlign: 'center', color: 'var(--c-dim)', fontSize: 14 }}>
              🎉 특별히 피할 것이 없는 좋은 날이에요!
            </div>
          </div>
        ) : (
          avoidItems.map((a, i) => (
            <div key={i} className="act-card">
              <div className="act-card-icon">{a.icon}</div>
              <div className="act-card-body">
                <div className="act-card-name" style={{ color: 'var(--c-acc4)' }}>{a.name}</div>
                <div className="act-card-why">{a.reason}</div>
              </div>
              <div className="act-card-tag tag-warn">주의</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Slide 6: 인근 날짜 ─────────────────────────────────────────────────────
const Slide6Nearby: React.FC<{ recs: NearbyRec[] }> = ({ recs }) => {
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  return (
    <div className="slide">
      <div className="slide-label">06 / 날짜 추천</div>
      <div className="slide-title">더 좋은 날짜가<br />있을까요?</div>
      <div className="slide-desc">±7일 기준, 날씨 점수가 높은 날을 골랐어요.</div>

      <div className="alt-cards">
        {recs.map((r) => {
          const dt = new Date(2026, r.month - 1, r.day);
          const dayStr = DAYS[dt.getDay()];
          const badgeCls = r.tag === 'best' ? 'badge-best' : r.tag === 'good' ? 'badge-rec' : 'badge-ref';
          return (
            <div key={`${r.month}-${r.day}`} className={`alt-card ${r.tag === 'best' ? 'best' : ''}`}>
              <div className="alt-emo">{r.icon}</div>
              <div className="alt-body">
                <div className="alt-d">{r.month}월 {r.day}일 · {dayStr}요일</div>
                <div className="alt-n">{r.compareSummary}</div>
                <div className="alt-s">맑음 {Math.round(r.clearPct)}% · 강수 {Math.round(r.rainPct)}%</div>
              </div>
              <div className="alt-r">
                <div className="alt-hi">{Math.round(r.tempMax)}°</div>
                <div className="alt-lo">{Math.round(r.tempMin)}°</div>
                <div className={`alt-badge ${badgeCls}`}>{r.tagLabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function describeYearWeather(hours: { hour: number; weather_code: number; precipitation: number; rain: number; snowfall: number; cloud_cover: number }[]): string {
  if (hours.length === 0) return '';
  const parts: string[] = [];

  const rainHours = hours.filter((h) => h.rain > 0);
  if (rainHours.length > 0) {
    const totalRain = rainHours.reduce((s, h) => s + h.rain, 0);
    const from = Math.min(...rainHours.map((h) => h.hour));
    const to = Math.max(...rainHours.map((h) => h.hour));
    const amount = totalRain < 2 ? '약한 비' : totalRain < 10 ? '보통 비' : '강한 비';
    parts.push(`🌧 ${from}시~${to}시 ${amount}(${totalRain.toFixed(1)}mm)`);
  }

  const snowHours = hours.filter((h) => h.snowfall > 0);
  if (snowHours.length > 0) {
    const totalSnow = snowHours.reduce((s, h) => s + h.snowfall, 0);
    const from = Math.min(...snowHours.map((h) => h.hour));
    const to = Math.max(...snowHours.map((h) => h.hour));
    const amount = totalSnow < 1 ? '가벼운 눈' : totalSnow < 5 ? '보통 눈' : '많은 눈';
    parts.push(`❄️ ${from}시~${to}시 ${amount}(${totalSnow.toFixed(1)}cm)`);
  }

  if (parts.length === 0) {
    const cloudyHours = hours.filter((h) => h.cloud_cover > 70);
    if (cloudyHours.length >= 6) {
      const from = Math.min(...cloudyHours.map((h) => h.hour));
      const to = Math.max(...cloudyHours.map((h) => h.hour));
      parts.push(`☁️ ${from}시~${to}시 흐림`);
    } else {
      const clearHours = hours.filter((h) => h.cloud_cover < 30);
      if (clearHours.length >= 6) {
        parts.push('☀️ 대체로 맑음');
      } else {
        parts.push('⛅ 구름 조금');
      }
    }
  }

  return parts.join(' / ');
}

// ─── Slide 7: 연도별 ────────────────────────────────────────────────────────
const Slide7Years: React.FC<{ statistics: WeatherStatistics }> = ({ statistics }) => {
  const validYears = statistics.yearlyData.filter((d) => d.hours.length > 0);
  const allMax = Math.max(...validYears.map((d) => d.tempMax), 1);
  const allMin = Math.min(...validYears.map((d) => d.tempMin), 0);
  const range = allMax - allMin || 1;

  function barColor(temp: number) {
    const pct = (temp - allMin) / range;
    if (pct > 0.7) return 'var(--c-acc2)';
    if (pct > 0.4) return 'var(--c-acc1)';
    return 'var(--c-acc5)';
  }

  return (
    <div className="slide">
      <div className="slide-label">07 / 연도별 기록</div>
      <div className="slide-title">최근 {validYears.length}년,<br />실제 날씨는요?</div>
      <div className="slide-desc">이날의 실제 기온과 날씨 기록이에요.</div>

      <div className="yr-chart">
        {[...validYears].sort((a, b) => b.year - a.year).map((d) => {
          const widthPct = Math.max(10, ((d.tempMax - allMin) / range) * 100);
          const detail = describeYearWeather(d.hours);

          return (
            <div key={d.year} className="yr-card">
              <div className="yr-header">
                <DotLottieReact
                  src={getYearlyLottie(d)}
                  loop autoplay
                  style={{ width: 36, height: 36, flexShrink: 0 }}
                />
                <div className="yr-year">{d.year}</div>
                <div className="yr-temps">
                  <span className="yr-hi">{d.tempMax.toFixed(0)}°</span>
                  <span className="yr-sep">/</span>
                  <span className="yr-lo">{d.tempMin.toFixed(0)}°</span>
                </div>
              </div>
              <div className="yr-bar-wrap">
                <div className="yr-bar" style={{ width: `${widthPct}%`, background: barColor(d.tempMax) }} />
              </div>
              <div className="yr-detail">{detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Slide 8: 기후변화 ──────────────────────────────────────────────────────
const Slide8Climate: React.FC<{
  statistics: WeatherStatistics;
  analysis: WeatherAnalysis;
}> = ({ statistics, analysis }) => {
  const { trend } = statistics.statistics;
  const diff = trend.diff;
  const oldAvg = Math.round(trend.olderAvgTemp);
  const recentAvg = Math.round(trend.recentAvgTemp);
  const cityName = statistics.city_korean || statistics.city;

  if (Math.abs(diff) < 0.3 && !analysis.trendText) return (
    <div className="slide">
      <div className="slide-label">08 / 기후 변화</div>
      <div className="slide-title">이날의 기후는<br />안정적이에요</div>
      <div className="slide-desc">최근 5년과 이전 5년의 기온 차이가 거의 없어요.</div>
    </div>
  );

  return (
    <div className="slide">
      <div className="slide-label">08 / 기후 변화</div>
      <div className="slide-title">이날의 날씨,<br />달라지고 있어요</div>

      <div className="climate-hero">
        <div className="climate-diff">{diff > 0 ? '+' : ''}{diff.toFixed(1)}°C</div>
        <div className="climate-diff-sub">
          최근 5년 평균이 이전 5년보다 {diff > 0 ? '높아요' : '낮아요'}
        </div>
        <div className="climate-bar">
          <div className="cb-past" />
          <div className="cb-recent" />
        </div>
        <div className="cb-labels">
          <span>이전 5년 평균 {oldAvg}°C</span>
          <span>최근 {recentAvg}°C</span>
        </div>
      </div>

      <div className="climate-cards">
        <div className="climate-card">
          <div className="cc-icon">🌡️</div>
          <div>
            <div className="cc-title">{cityName} 이날의 기온 추세</div>
            <div className="cc-desc">
              이전 평균 {oldAvg}°C에서 최근 {recentAvg}°C로{' '}
              {diff > 0 ? '올라가는' : '내려가는'} 추세예요.
            </div>
          </div>
        </div>
        {analysis.flags.includes('TREND_UP') && (
          <div className="climate-card">
            <div className="cc-icon">📈</div>
            <div>
              <div className="cc-title">따뜻해지는 추세</div>
              <div className="cc-desc">최근 5년 평균이 이전보다 {diff.toFixed(1)}°C 높아요.</div>
            </div>
          </div>
        )}
        {analysis.flags.includes('TREND_DOWN') && (
          <div className="climate-card">
            <div className="cc-icon">📉</div>
            <div>
              <div className="cc-title">추워지는 추세</div>
              <div className="cc-desc">최근 5년 평균이 이전보다 {Math.abs(diff).toFixed(1)}°C 낮아요.</div>
            </div>
          </div>
        )}
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
  date: string;
}> = ({ isOpen, onClose, items, cityKorean, date }) => {
  const [m, d] = date.split('-');
  if (!isOpen) return null;

  return createPortal(
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog">
        <div className="dlg-handle" />
        <div className="dlg-title">🎒 준비물 리스트</div>
        <div className="dlg-sub">{cityKorean} {parseInt(m)}월 {parseInt(d)}일 기준</div>
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
    </div>,
    document.body
  );
};

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────
const WeatherStats: React.FC<{ statistics: WeatherStatistics }> = ({ statistics }) => {
  const [packingOpen, setPackingOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const validYears = statistics.yearlyData.filter((d) => d.hours.length > 0);

  if (validYears.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--c-dim)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--c-acc2)', marginBottom: 6, letterSpacing: '-0.02em' }}>데이터 수집 전</div>
        <div style={{ fontSize: 15 }}>
          <strong style={{ color: 'var(--c-text)' }}>{statistics.city_korean || statistics.city}</strong>의 데이터가 아직 수집되지 않았습니다.
        </div>
      </div>
    );
  }

  const analysis = analyzeWeather(statistics);

  const slides: React.ReactNode[] = [
    <Slide1Summary key="s1" statistics={statistics} analysis={analysis} />,
    <Slide2Verdict key="s2" analysis={analysis} />,
    <Slide3Temp key="s3" statistics={statistics.statistics} hourlyAverages={statistics.statistics.hourlyAverages} bestTimeText={analysis.bestTimeText} />,
    <Slide4Precip key="s4" statistics={statistics.statistics} analysis={analysis} />,
    <Slide5Activities key="s5" activities={analysis.activities} avoidItems={analysis.avoidItems} />,
  ];

  if (analysis.nearbyRecs.length > 0) {
    slides.push(<Slide6Nearby key="s6" recs={analysis.nearbyRecs} />);
  }
  slides.push(<Slide7Years key="s7" statistics={statistics} />);
  slides.push(<Slide8Climate key="s8" statistics={statistics} analysis={analysis} />);

  const TOTAL = slides.length;

  const goSlide = useCallback((n: number) => {
    const clamped = Math.max(0, Math.min(TOTAL - 1, n));
    setCurrentSlide(clamped);
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${clamped * 100}%)`;
    }
  }, [TOTAL]);

  useEffect(() => {
    goSlide(0);
  }, [statistics, goSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) goSlide(currentSlide + (dx < 0 ? 1 : -1));
  };

  return (
    <>
      {/* 진행 도트 */}
      <div className="slide-dots">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`sdot ${i === currentSlide ? 'active' : ''}`}
            onClick={() => goSlide(i)}
          />
        ))}
      </div>

      {/* 슬라이드 */}
      <div className="slides-wrap">
        <div
          className="slides-track"
          ref={trackRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides}
        </div>
      </div>

      {/* 하단 화살표 */}
      <div className="slide-arrows">
        <button className="arr-btn" onClick={() => goSlide(currentSlide - 1)} disabled={currentSlide === 0}>←</button>
        <div className="arr-progress">{currentSlide + 1} / {TOTAL}</div>
        <button className="arr-btn" onClick={() => goSlide(currentSlide + 1)} disabled={currentSlide === TOTAL - 1}>→</button>
      </div>

      {/* 준비물 버튼 */}
      <div className="packing-bar">
        <button className="packing-btn" onClick={() => setPackingOpen(true)}>
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
