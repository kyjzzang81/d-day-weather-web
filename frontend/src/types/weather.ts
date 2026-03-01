// Supabase DB row 타입 (hourly_weather 테이블)
export interface HourlyWeatherRow {
  city_id: string;
  timestamp: string;
  temperature: number;
  apparent_temp: number;
  humidity: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed: number;
  wind_direction: number;
  wind_gusts: number;
}

// 시간별 데이터 포인트 (UI 표시용)
export interface HourlyDataPoint {
  hour: number;
  temperature: number;
  apparent_temp: number;
  humidity: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed: number;
  wind_gusts: number;
}

// 특정 날짜(YYYY-MM-DD)의 연도별 데이터
export interface YearlyDayData {
  year: number;
  date: string;
  hours: HourlyDataPoint[];
  tempMax: number;
  tempMin: number;
  tempAvg: number;
  totalPrecipitation: number;
  totalRain: number;
  totalSnowfall: number;
  avgWindSpeed: number;
  maxWindGust: number;
  avgApparentTemp: number;    // 주간(6-18시) 체감온도 평균
  dominantWeatherCode: number;
}

// 시간대별 평균 (타임라인 표시용)
export interface HourlyAverage {
  hour: number;
  avgTemp: number;
  avgApparentTemp: number;
  avgCloudCover: number;
  dominantWeatherCode: number;
  avgPrecipitation: number;
  isBestHour: boolean;
}

// 인근 날짜 통계
export interface NearbyDateStats {
  month: number;
  day: number;
  score: number;
  avgTemp: number;
  tempMax: number;
  tempMin: number;
  clearPct: number;
  rainPct: number;
  avgPrecipitation: number;
  dominantWeatherCode: number;
}

export interface TempStat {
  highest: number;
  lowest: number;
  average: number;
}

export interface WeatherStatistics {
  city: string;
  city_korean?: string;
  country: string;
  date: string; // MM-DD
  cityLat?: number;
  cityLon?: number;
  statistics: {
    weatherFrequency: {
      clear: number;
      cloudy: number;
      rain: number;
      snow: number;
    };
    temperature: {
      max: TempStat;
      min: TempStat;
      avg: TempStat;
    };
    humidity: {
      highest: number;
      lowest: number;
      average: number;
    };
    precipitation: {
      highest: number;
      average: number;
    };
    avgApparentTemp: number;
    avgWindSpeed: number;
    maxWindGust: number;
    rainProbability: number;   // 0-100
    snowProbability: number;   // 0-100
    clearProbability: number;  // 0-100
    trend: {
      recentAvgTemp: number;
      olderAvgTemp: number;
      diff: number;
    };
    hourlyAverages: HourlyAverage[];
  };
  yearlyData: YearlyDayData[];
  nearbyDates?: NearbyDateStats[];
}

export interface City {
  id: string;
  name: string;
  nameKo: string;
  country: string;
  lat?: number;
  lon?: number;
}

export interface SearchHistory {
  city: string;
  date: string;
  timestamp: number;
}
