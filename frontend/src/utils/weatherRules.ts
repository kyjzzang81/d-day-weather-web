/**
 * weather-rule-table.md 기반 날씨 규칙 엔진
 * 날씨 통계 → 상황 판정 → 콘텐츠 매핑
 */
import { WeatherStatistics, NearbyDateStats } from '../types/weather';

// ─── 등급 타입 ──────────────────────────────────────────────────────────────
export type TempGrade = 'COLD' | 'COOL' | 'MILD' | 'WARM';
export type RainGrade = 'NO_RAIN' | 'LOW_RAIN' | 'MID_RAIN' | 'HIGH_RAIN';
export type SkyGrade = 'CLEAR' | 'PARTLY' | 'CLOUDY';
export type Season =
  | 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER'
  | 'DRY_SEASON' | 'WET_SEASON';

// ─── 콘텐츠 타입 ────────────────────────────────────────────────────────────
export interface VerdictInfo {
  label: string;    // "무난해요"
  title: string;    // "준비하면 충분히 즐길 수 있어요"
  desc: string;
  stars: number;    // 0-3
  badge: string;    // emoji badge
}

export interface ActivityItem {
  icon: string;
  name: string;
  reason: string;
  tag: string;
  isBest: boolean;
}

export interface AvoidItem {
  icon: string;
  name: string;
  reason: string;
}

export interface PackingItem {
  icon: string;
  name: string;
  reason: string;
  priority: 'must' | 'rec';
}

export interface NearbyRec {
  month: number;
  day: number;
  score: number;
  scoreDiff: number;     // vs target
  avgTemp: number;
  tempMax: number;
  tempMin: number;
  clearPct: number;
  rainPct: number;
  dominantWeatherCode: number;
  compareSummary: string;  // "살짝 더 따뜻해요"
  tag: 'best' | 'good' | 'ref';
  tagLabel: string;
  tagColor: string;
  icon: string;
}

export interface WeatherAnalysis {
  tempGrade: TempGrade;
  rainGrade: RainGrade;
  skyGrade: SkyGrade;
  season: Season;
  flags: string[];
  verdict: VerdictInfo;
  summaryText: string;
  bestTimeText: string;
  activities: ActivityItem[];
  avoidItems: AvoidItem[];
  packingItems: PackingItem[];
  trendText: string;
  nearbyRecs: NearbyRec[];
}

// ─── 위도 보정 ───────────────────────────────────────────────────────────────
function latCorrection(lat: number): number {
  const absLat = Math.abs(lat);
  if (absLat <= 23) return 5;
  if (absLat <= 45) return 0;
  if (absLat <= 66) return -3;
  return -8;
}

// ─── 기온 등급 ───────────────────────────────────────────────────────────────
function getTempGrade(avgApparentTemp: number, lat?: number): TempGrade {
  const correction = lat !== undefined ? latCorrection(lat) : 0;
  const corrected = avgApparentTemp - correction;
  if (corrected < 5) return 'COLD';
  if (corrected < 12) return 'COOL';
  if (corrected < 20) return 'MILD';
  return 'WARM';
}

// ─── 강수 등급 ───────────────────────────────────────────────────────────────
function getRainGrade(rainProbability: number): RainGrade {
  if (rainProbability < 10) return 'NO_RAIN';
  if (rainProbability < 25) return 'LOW_RAIN';
  if (rainProbability < 50) return 'MID_RAIN';
  return 'HIGH_RAIN';
}

// ─── 하늘 등급 ───────────────────────────────────────────────────────────────
function getSkyGrade(clearProbability: number): SkyGrade {
  if (clearProbability >= 60) return 'CLEAR';
  if (clearProbability >= 30) return 'PARTLY';
  return 'CLOUDY';
}

// ─── 계절 판정 ───────────────────────────────────────────────────────────────
function getSeason(month: number, lat: number, avgDailyPrecip?: number): Season {
  const absLat = Math.abs(lat);
  if (absLat < 23) {
    // 열대: 건기/우기
    return (avgDailyPrecip ?? 0) >= 3 ? 'WET_SEASON' : 'DRY_SEASON';
  }
  // 온대/냉대: 4계절. 남반구는 반전
  const isNorthern = lat >= 0;
  const adjustedMonth = isNorthern ? month : ((month + 5) % 12) + 1;
  if (adjustedMonth >= 3 && adjustedMonth <= 5) return 'SPRING';
  if (adjustedMonth >= 6 && adjustedMonth <= 8) return 'SUMMER';
  if (adjustedMonth >= 9 && adjustedMonth <= 11) return 'AUTUMN';
  return 'WINTER';
}

// ─── 특수 플래그 ─────────────────────────────────────────────────────────────
const WINDY_THRESHOLD: Record<TempGrade, number> = {
  COLD: 15, COOL: 18, MILD: 22, WARM: 25,
};

function getFlags(
  stats: WeatherStatistics['statistics'],
  tempGrade: TempGrade
): string[] {
  const flags: string[] = [];
  const { temperature, snowProbability, avgWindSpeed, trend } = stats;
  const diurnal = temperature.max.average - temperature.min.average;

  if (snowProbability >= 15) flags.push('SNOW');
  if (diurnal >= 10) flags.push('HIGH_DIURNAL');
  if (avgWindSpeed >= WINDY_THRESHOLD[tempGrade]) flags.push('WINDY');
  if (trend.diff >= 1.5) flags.push('TREND_UP');
  if (trend.diff <= -1.5) flags.push('TREND_DOWN');
  return flags;
}

// ─── 여행 적합도 ─────────────────────────────────────────────────────────────
function getVerdict(
  tempGrade: TempGrade,
  rainGrade: RainGrade,
  flags: string[]
): VerdictInfo {
  // 특수 조합 오버라이드
  if (flags.includes('WINDY') && tempGrade === 'COLD') {
    return {
      label: '여행하기 힘든 날이에요',
      title: '일정 재고를 권장해요',
      desc: '날씨 조건이 좋지 않아요. 가능하다면 인근 날짜로 변경을 고려해보세요.',
      stars: 0, badge: '😰',
    };
  }
  if (flags.includes('SNOW') && rainGrade !== 'NO_RAIN') {
    // 한 단계 하향 처리됨 (아래 매트릭스에서 별도 처리)
  }

  // 기온 × 강수 매트릭스
  const matrix: Record<TempGrade, Record<RainGrade, VerdictInfo>> = {
    WARM: {
      NO_RAIN:   { label: '최고예요 ⭐⭐⭐', title: '여행하기 딱 좋은 날이에요', desc: '맑고 따뜻해서 야외 활동 마음껏 즐길 수 있어요. 종일 야외 일정으로 채워도 좋아요.', stars: 3, badge: '🌟' },
      LOW_RAIN:  { label: '좋아요 ⭐⭐',    title: '꽤 괜찮은 날이에요', desc: '날씨가 좋은 편이에요. 야외 위주로 일정을 짜도 충분해요.', stars: 2, badge: '😊' },
      MID_RAIN:  { label: '무난해요 ⭐',    title: '준비하면 충분히 즐길 수 있어요', desc: '완벽한 날씨는 아니지만, 낮 시간을 잘 활용하면 괜찮아요. 야외와 실내를 반반 섞은 일정이 잘 맞아요.', stars: 1, badge: '🙂' },
      HIGH_RAIN: { label: '비 오는 날이에요', title: '실내 중심으로 짜세요', desc: '비가 올 가능성이 높아요. 실내 명소 위주로 여유롭게 즐기세요.', stars: 0, badge: '🌧️' },
    },
    MILD: {
      NO_RAIN:   { label: '좋아요 ⭐⭐',    title: '꽤 괜찮은 날이에요', desc: '날씨가 좋은 편이에요. 야외 위주로 일정을 짜도 충분해요.', stars: 2, badge: '😊' },
      LOW_RAIN:  { label: '좋아요 ⭐⭐',    title: '꽤 괜찮은 날이에요', desc: '날씨가 좋은 편이에요. 우산 하나 챙기면 안심이에요.', stars: 2, badge: '😊' },
      MID_RAIN:  { label: '무난해요 ⭐',    title: '준비하면 충분히 즐길 수 있어요', desc: '완벽한 날씨는 아니지만, 낮 시간을 잘 활용하면 괜찮아요. 야외와 실내를 반반 섞은 일정이 잘 맞아요.', stars: 1, badge: '🙂' },
      HIGH_RAIN: { label: '비 오는 날이에요', title: '실내 중심으로 짜세요', desc: '비가 올 가능성이 높아요. 실내 명소 위주로 여유롭게 즐기세요.', stars: 0, badge: '🌧️' },
    },
    COOL: {
      NO_RAIN:   { label: '무난해요 ⭐',    title: '준비하면 충분히 즐길 수 있어요', desc: '맑지만 쌀쌀해요. 낮 시간대를 잘 활용하면 괜찮아요.', stars: 1, badge: '🙂' },
      LOW_RAIN:  { label: '무난해요 ⭐',    title: '준비하면 충분히 즐길 수 있어요', desc: '완벽한 날씨는 아니지만, 낮 시간을 잘 활용하면 괜찮아요.', stars: 1, badge: '🙂' },
      MID_RAIN:  { label: '쌀쌀하고 비 올 수도', title: '실내 위주로 계획하세요', desc: '춥고 비까지 올 수 있어서 야외 일정은 최소화하는 게 좋아요.', stars: 0, badge: '🌦️' },
      HIGH_RAIN: { label: '춥고 비 오는 날이에요', title: '실내 위주로 계획하세요', desc: '춥고 비까지 올 수 있어서 야외 일정은 최소화하는 게 좋아요.', stars: 0, badge: '🌧️' },
    },
    COLD: {
      NO_RAIN:   { label: '많이 추운 날이에요', title: '방한 준비를 단단히 하세요', desc: '매우 추운 날이에요. 야외 활동은 짧게, 실내를 메인으로 계획하세요.', stars: 0, badge: '🥶' },
      LOW_RAIN:  { label: '많이 추운 날이에요', title: '방한 준비를 단단히 하세요', desc: '매우 추운 날이에요. 야외 활동은 짧게, 실내를 메인으로 계획하세요.', stars: 0, badge: '🥶' },
      MID_RAIN:  { label: '춥고 비 올 수도', title: '실내 위주로 계획하세요', desc: '날씨 조건이 좋지 않아요. 실내 위주로 여유 있게 즐기세요.', stars: 0, badge: '❄️' },
      HIGH_RAIN: { label: '여행하기 힘든 날이에요', title: '일정 재고를 권장해요', desc: '날씨 조건이 좋지 않아요. 가능하다면 인근 날짜로 변경을 고려해보세요.', stars: 0, badge: '😰' },
    },
  };

  const v = matrix[tempGrade][rainGrade];
  // SNOW 플래그 → 한 단계 하향
  if (flags.includes('SNOW') && v.stars > 0) {
    return { ...v, stars: v.stars - 1, label: v.label + ' (눈 주의)' };
  }
  return v;
}

// ─── 요약 문구 ───────────────────────────────────────────────────────────────
function getSummaryText(
  tempGrade: TempGrade,
  skyGrade: SkyGrade,
  rainGrade: RainGrade,
  flags: string[],
  season: Season,
  stats: WeatherStatistics['statistics']
): string {
  const maxTemp = Math.round(stats.temperature.max.average);
  const minTemp = Math.round(stats.temperature.min.average);
  const rainPct = Math.round(stats.rainProbability);
  const diurnal = Math.round(stats.temperature.max.average - stats.temperature.min.average);

  const skyText: Record<TempGrade, Record<SkyGrade, string>> = {
    COLD: {
      CLEAR:  '꽤 추운 날이에요.',
      PARTLY: '꽤 추운 날이에요.',
      CLOUDY: '꽤 추운 날이에요.',
    },
    COOL: {
      CLEAR:  `맑지만 **쌀쌀한** 날이에요. 낮엔 **${maxTemp}°C**까지 올라요.`,
      PARTLY: `구름이 오가는 날이에요. 낮엔 **${maxTemp}°C**까지 올라도 아침저녁은 **쌀쌀**해요.`,
      CLOUDY: `흐린 날이 조금 더 많고, 낮엔 **${maxTemp}°C**까지 올라요. 아침저녁은 **쌀쌀**해요.`,
    },
    MILD: {
      CLEAR:  `맑고 **포근한** 날이에요. 낮엔 **${maxTemp}°C**까지 올라요.`,
      PARTLY: `구름이 오가지만 **선선하게** 걷기 좋은 날이에요. 낮 기온은 **${maxTemp}°C** 내외예요.`,
      CLOUDY: `흐리지만 **선선하게** 걷기 좋은 날이에요. 낮 기온은 **${maxTemp}°C** 내외예요.`,
    },
    WARM: {
      CLEAR:  `**따뜻하고** 활동하기 좋은 날이에요. 낮엔 **${maxTemp}°C**까지 올라요.`,
      PARTLY: `**따뜻하고** 활동하기 좋은 날이에요. 낮엔 **${maxTemp}°C**까지 올라요.`,
      CLOUDY: `**따뜻하고** 활동하기 좋은 날이에요. 낮엔 **${maxTemp}°C**까지 올라요.`,
    },
  };

  const rainText: Record<RainGrade, string> = {
    NO_RAIN:   '',
    LOW_RAIN:  ' 비나 눈 올 확률은 낮지만, 우산 하나 챙겨두면 안심이에요.',
    MID_RAIN:  ` 비나 눈 올 확률도 **약 ${rainPct}%** 있어요.`,
    HIGH_RAIN: ' 비가 올 가능성이 높아요. 우산은 필수예요.',
  };

  let text = skyText[tempGrade][skyGrade] + rainText[rainGrade];

  if (flags.includes('HIGH_DIURNAL'))
    text += ` 일교차가 **${diurnal}°C**로 큰 편이에요. 겉옷을 꼭 챙기세요.`;
  if (flags.includes('SNOW'))
    text += ' 눈이 올 수도 있으니 방수 신발을 추천해요.';
  if (flags.includes('WINDY'))
    text += ' 바람이 강해 체감온도는 더 낮게 느껴질 수 있어요.';

  const seasonSuffix: Partial<Record<Season, string>> = {
    SPRING:     ' 꽃샘추위가 있을 수 있어요.',
    SUMMER:     ' 시원한 실내 명소도 함께 챙기세요.',
    AUTUMN:     ' 선선하고 걷기 좋은 계절이에요.',
    WINTER:     ' 방한 준비를 단단히 하세요.',
    DRY_SEASON: ' 건기라 맑고 활동하기 좋은 시기예요.',
    WET_SEASON: ' 우기철이에요. 스콜성 비가 짧게 자주 내려요.',
  };
  if (seasonSuffix[season]) text += seasonSuffix[season];

  return text;
}

// ─── 베스트 시간대 ─────────────────────────────────────────────────────────
function getBestTimeText(hourlyAverages: WeatherStatistics['statistics']['hourlyAverages']): string {
  const best = hourlyAverages.filter((h) => h.isBestHour);
  if (best.length === 0) return '낮 시간대가 활동하기 가장 좋아요.';
  const start = Math.min(...best.map((h) => h.hour));
  const end = Math.max(...best.map((h) => h.hour));
  return `야외 일정은 오전 ${start}시 – 오후 ${end > 12 ? end - 12 : end}시가 가장 좋아요.`;
}

// ─── 활동 가이드 ─────────────────────────────────────────────────────────────
function getActivities(
  tempGrade: TempGrade,
  skyGrade: SkyGrade,
  rainGrade: RainGrade,
  flags: string[]
): ActivityItem[] {
  type ActivityDef = { icon: string; name: string; reason: string; tag: string; isBest: boolean };
  const A: Record<string, ActivityDef> = {
    outdoor_sightseeing: { icon: '🏛️', name: '야외 관광지 · 역사 명소', reason: '낮 시간 맑은 시간대에 딱 맞아요', tag: '낮 추천', isBest: false },
    walking:             { icon: '🚶', name: '동네 걷기 · 골목 산책', reason: '짧게 걷기 좋고, 비 오면 바로 실내로', tag: '낮 추천', isBest: false },
    cafe:                { icon: '☕', name: '카페 · 브런치', reason: '흐리거나 추울 때 쉬어가기 좋아요', tag: '언제든', isBest: false },
    museum:              { icon: '🎨', name: '미술관 · 박물관', reason: '날씨 무관, 비 올 때 완벽한 대안이에요', tag: '언제든', isBest: false },
    shopping:            { icon: '🛍️', name: '쇼핑 · 실내 시장', reason: '오후 흐려지는 시간 또는 비 오는 날 최적', tag: '오후 추천', isBest: false },
    outdoor_active:      { icon: '🚵', name: '하이킹 · 자전거', reason: '맑고 선선한 날에 최적이에요', tag: '낮 추천', isBest: false },
    picnic:              { icon: '🧺', name: '피크닉 · 공원 나들이', reason: '맑고 따뜻한 날에 딱이에요', tag: '낮 추천', isBest: false },
    night_view:          { icon: '🌃', name: '야경 · 루프탑', reason: '맑은 저녁이라면 야경도 좋아요', tag: '저녁 추천', isBest: false },
    spa:                 { icon: '🛁', name: '스파 · 찜질방', reason: '춥고 비 오는 날 최고의 선택이에요', tag: '언제든', isBest: false },
  };

  const isHighRain = rainGrade === 'HIGH_RAIN';

  const mapping: Record<string, { best: string[]; normal: string[] }> = {
    'WARM+CLEAR':  { best: ['picnic', 'outdoor_active', 'outdoor_sightseeing'], normal: ['walking', 'night_view', 'cafe'] },
    'WARM+PARTLY': { best: ['outdoor_sightseeing', 'walking'], normal: ['cafe', 'museum', 'shopping'] },
    'WARM+CLOUDY': { best: ['outdoor_sightseeing', 'walking'], normal: ['cafe', 'museum', 'shopping'] },
    'MILD+CLEAR':  { best: ['outdoor_sightseeing', 'walking', 'outdoor_active'], normal: ['cafe', 'picnic', 'night_view'] },
    'MILD+PARTLY': { best: ['outdoor_sightseeing', 'cafe', 'museum'], normal: ['shopping', 'walking'] },
    'MILD+CLOUDY': { best: ['outdoor_sightseeing', 'cafe', 'museum'], normal: ['shopping', 'walking'] },
    'COOL+CLEAR':  { best: ['outdoor_sightseeing', 'walking'], normal: ['cafe', 'museum', 'shopping'] },
    'COOL+PARTLY': { best: ['cafe', 'museum'], normal: ['outdoor_sightseeing', 'shopping'] },
    'COOL+CLOUDY': { best: ['cafe', 'museum'], normal: ['outdoor_sightseeing', 'shopping'] },
    'COLD+any':    { best: ['museum', 'shopping', 'spa', 'cafe'], normal: ['outdoor_sightseeing'] },
  };

  const key =
    tempGrade === 'COLD'
      ? 'COLD+any'
      : isHighRain
      ? `${tempGrade}+CLOUDY`
      : `${tempGrade}+${skyGrade}`;

  const map = mapping[key] ?? { best: ['museum', 'cafe', 'shopping'], normal: [] };

  const result: ActivityItem[] = [];
  map.best.forEach((id) => result.push({ ...A[id], isBest: true }));
  map.normal.forEach((id) => result.push({ ...A[id], isBest: false }));
  return result;
}

// ─── 피하면 좋은 것 ─────────────────────────────────────────────────────────
function getAvoidItems(
  tempGrade: TempGrade,
  rainGrade: RainGrade,
  flags: string[],
  stats: WeatherStatistics['statistics']
): AvoidItem[] {
  const minTemp = Math.round(stats.temperature.min.average);
  const rainPct = Math.round(stats.rainProbability);
  const freq = rainPct < 20 ? '5번 중 1번꼴' : rainPct < 30 ? '4번 중 1번꼴' : rainPct < 40 ? '3번 중 1번꼴' : '2번 중 1번꼴';

  const all: Record<string, AvoidItem> = {
    long_outdoor: { icon: '⛺', name: '장시간 야외 체류', reason: `아침저녁 ${minTemp}°C까지 내려가요. 체온 관리가 어려워요.` },
    no_umbrella:  { icon: '🌂', name: '우산 없이 종일 야외 일정', reason: `${rainPct}% 확률로 비가 와요. ${freq}은 비를 맞을 수 있어요.` },
    open_event:   { icon: '🎡', name: '오픈형 야외 행사 · 축제', reason: '흐리고 바람 불면 체감온도가 훨씬 낮아져요.' },
    water_sports: { icon: '🌊', name: '수상 스포츠 · 야외 수영', reason: '기온과 수온 모두 낮아요. 이 시기엔 완전히 피하세요.' },
    rooftop:      { icon: '🏙️', name: '루프탑 · 옥외 카페', reason: '바람이 강해 실내보다 훨씬 춥게 느껴져요.' },
    icy_road:     { icon: '🧊', name: '빙판 주의 (야간 이동)', reason: '기온이 0°C 아래로 내려가 결빙이 생길 수 있어요.' },
  };

  const items: AvoidItem[] = [];
  if (tempGrade === 'COLD') {
    items.push(all.long_outdoor, all.open_event, all.water_sports);
    if (flags.includes('SNOW')) items.push(all.icy_road);
  }
  if (tempGrade === 'COOL' && (rainGrade === 'MID_RAIN' || rainGrade === 'HIGH_RAIN')) {
    items.push(all.no_umbrella, all.open_event);
  }
  if (tempGrade === 'COOL' && rainGrade === 'NO_RAIN') {
    items.push(all.water_sports);
  }
  if (rainGrade === 'HIGH_RAIN') {
    if (!items.some((i) => i.icon === all.no_umbrella.icon)) items.push(all.no_umbrella);
    if (!items.some((i) => i.icon === all.open_event.icon)) items.push(all.open_event);
    if (!items.some((i) => i.icon === all.long_outdoor.icon)) items.push(all.long_outdoor);
  }
  if (flags.includes('WINDY')) {
    items.push(all.rooftop);
  }

  return items;
}

// ─── 준비물 ─────────────────────────────────────────────────────────────────
function getPackingItems(
  tempGrade: TempGrade,
  rainGrade: RainGrade,
  skyGrade: SkyGrade,
  flags: string[],
  stats: WeatherStatistics['statistics']
): PackingItem[] {
  const minTemp = Math.round(stats.temperature.min.average);
  const rainPct = Math.round(stats.rainProbability);

  const all: Record<string, PackingItem> = {
    heavy_coat:       { icon: '🧥', name: '두꺼운 외투', reason: `아침저녁 ${minTemp}°C까지 내려가요`, priority: 'must' },
    light_jacket:     { icon: '🧣', name: '가벼운 겉옷', reason: '일교차가 있어 겉옷 하나는 챙기세요', priority: 'must' },
    umbrella:         { icon: '☂️', name: '접이식 우산', reason: `강수 확률 ${rainPct}%, 챙겨두면 안심이에요`, priority: 'must' },
    scarf:            { icon: '🧣', name: '목도리', reason: '바람 불면 체감온도가 더 내려가요', priority: 'rec' },
    gloves:           { icon: '🧤', name: '장갑', reason: '아침 이동 시 손이 시려워요', priority: 'rec' },
    hotpack:          { icon: '🔥', name: '핫팩', reason: '야외 일정이 있다면 하나쯤 챙기세요', priority: 'rec' },
    thick_socks:      { icon: '🧦', name: '두꺼운 양말', reason: '바닥에서 올라오는 냉기를 차단해요', priority: 'rec' },
    sunscreen:        { icon: '🧴', name: '선크림', reason: '맑은 날 자외선 지수가 높아요', priority: 'must' },
    moisturizer:      { icon: '🧴', name: '보습 크림', reason: '건조한 날씨, 피부 관리하세요', priority: 'rec' },
    waterproof_shoes: { icon: '👟', name: '방수 신발', reason: '눈이나 비에 발이 젖을 수 있어요', priority: 'rec' },
    sunglasses:       { icon: '🕶️', name: '선글라스', reason: '맑고 눈부신 날이에요', priority: 'rec' },
  };

  const items: PackingItem[] = [];
  if (tempGrade === 'COLD') {
    items.push(all.heavy_coat, all.scarf, all.gloves);
    items.push(all.hotpack, all.thick_socks);
  } else if (tempGrade === 'COOL') {
    items.push(all.heavy_coat);
    items.push(all.scarf, all.gloves, all.hotpack);
  } else if (tempGrade === 'MILD') {
    items.push(all.light_jacket);
    items.push(all.moisturizer);
  }
  if (rainGrade !== 'NO_RAIN') items.push(all.umbrella);
  if (flags.includes('SNOW')) {
    if (!items.some((i) => i.name === '접이식 우산')) items.push(all.umbrella);
    items.push(all.waterproof_shoes);
    if (!items.some((i) => i.name === '장갑')) items.push(all.gloves);
  }
  if (flags.includes('WINDY')) {
    if (!items.some((i) => i.name === '목도리')) items.push(all.scarf);
    if (!items.some((i) => i.name === '장갑')) items.push(all.gloves);
  }
  if ((skyGrade === 'CLEAR' || skyGrade === 'PARTLY') &&
      (tempGrade === 'WARM' || tempGrade === 'MILD')) {
    if (!items.some((i) => i.name === '선크림')) items.push(all.sunscreen);
    items.push(all.sunglasses);
  }
  if (flags.includes('HIGH_DIURNAL')) {
    if (!items.some((i) => i.priority === 'must' && i.name.includes('겉옷'))) {
      items.push(all.light_jacket);
    }
  }

  // must 먼저, 중복 제거
  const seen = new Set<string>();
  const sorted = [...items].sort((a, b) =>
    a.priority === b.priority ? 0 : a.priority === 'must' ? -1 : 1
  );
  return sorted.filter((i) => {
    if (seen.has(i.name)) return false;
    seen.add(i.name);
    return true;
  });
}

// ─── 트렌드 문구 ─────────────────────────────────────────────────────────────
function getTrendText(
  trend: WeatherStatistics['statistics']['trend'],
  cityKorean: string
): string {
  const { diff } = trend;
  if (Math.abs(diff) < 0.5) return '';
  const dir = diff > 0 ? '더 따뜻해졌어요' : '더 추워졌어요';
  const oldAvg = Math.round(trend.olderAvgTemp);
  const recentAvg = Math.round(trend.recentAvgTemp);
  return `최근 5년, ${cityKorean}는 이날 **${Math.abs(diff).toFixed(1)}°C ${dir}.**\n이전 평균 ${oldAvg}°C → 요즘 ${recentAvg}°C 수준이에요.`;
}

// ─── 인근 날짜 추천 ─────────────────────────────────────────────────────────
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

function buildNearbyRecs(
  nearbyDates: NearbyDateStats[] | undefined,
  targetStats: WeatherStatistics['statistics'],
  targetMonth: number,
  targetDay: number,
  cityLat: number | undefined
): NearbyRec[] {
  if (!nearbyDates || nearbyDates.length === 0) return [];

  const targetAp = targetStats.avgApparentTemp;
  const targetScore = (() => {
    const tg = getTempGrade(targetAp, cityLat);
    return (tg === 'MILD' ? 30 : tg === 'WARM' ? 25 : tg === 'COOL' ? 20 : 0) +
      targetStats.clearProbability * 0.3 - targetStats.rainProbability * 0.5;
  })();

  const TARGET = new Date(2000, targetMonth - 1, targetDay);

  return nearbyDates
    .filter((d) => {
      const dt = new Date(2000, d.month - 1, d.day);
      return Math.abs(dt.getTime() - TARGET.getTime()) / 86400000 > 0.5;
    })
    .map((d): NearbyRec => {
      const scoreDiff = d.score - targetScore;
      const avgDiff = d.avgTemp - targetStats.temperature.avg.average;

      let compareSummary: string;
      let icon: string;
      if (avgDiff >= 5) { compareSummary = '눈에 띄게 포근해요'; icon = '☀️'; }
      else if (avgDiff >= 2 && d.clearPct > targetStats.clearProbability) { compareSummary = '살짝 더 따뜻하고 맑아요'; icon = '🌸'; }
      else if (avgDiff >= 2) { compareSummary = '조금 더 따뜻해요'; icon = '🌤️'; }
      else if (d.rainPct < targetStats.rainProbability - 10) { compareSummary = '비 걱정이 덜해요'; icon = '☁️'; }
      else if (avgDiff <= -2) { compareSummary = `${targetDay}일보다 추워요`; icon = '❄️'; }
      else { compareSummary = '날씨가 비슷한 날이에요'; icon = '📅'; }

      const tag: NearbyRec['tag'] =
        scoreDiff >= 10 ? 'best' : scoreDiff >= 5 ? 'good' : 'ref';
      const tagLabel = tag === 'best' ? '강추' : tag === 'good' ? '추천' : '참고';
      const tagColor =
        tag === 'best' ? 'bg-emerald-100 text-emerald-700' :
        tag === 'good' ? 'bg-sky-100 text-sky-700' :
        'bg-gray-100 text-gray-500';

      return {
        ...d, scoreDiff, compareSummary, icon, tag, tagLabel, tagColor,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ─── 메인 분석 함수 ─────────────────────────────────────────────────────────
export function analyzeWeather(stats: WeatherStatistics): WeatherAnalysis {
  const { statistics: s, cityLat, nearbyDates } = stats;
  const [mm, dd] = stats.date.split('-').map(Number);

  const tempGrade = getTempGrade(s.avgApparentTemp, cityLat);
  const rainGrade = getRainGrade(s.rainProbability);
  const skyGrade = getSkyGrade(s.clearProbability);
  const season = getSeason(mm, cityLat ?? 37, s.precipitation.average);
  const flags = getFlags(s, tempGrade);
  const verdict = getVerdict(tempGrade, rainGrade, flags);
  const summaryText = getSummaryText(tempGrade, skyGrade, rainGrade, flags, season, s);
  const bestTimeText = getBestTimeText(s.hourlyAverages);
  const activities = getActivities(tempGrade, skyGrade, rainGrade, flags);
  const avoidItems = getAvoidItems(tempGrade, rainGrade, flags, s);
  const packingItems = getPackingItems(tempGrade, rainGrade, skyGrade, flags, s);
  const trendText = getTrendText(s.trend, stats.city_korean || stats.city);
  const nearbyRecs = buildNearbyRecs(nearbyDates, s, mm, dd, cityLat);

  return {
    tempGrade, rainGrade, skyGrade, season, flags,
    verdict, summaryText, bestTimeText,
    activities, avoidItems, packingItems,
    trendText, nearbyRecs,
  };
}
