// 날씨 데이터 타입 정의

export interface WeatherData {
  city: string;
  city_korean?: string;  // ✨ NEW: 한글 도시명 (optional)
  country: string;
  lat?: number;
  lon?: number;
  source: string;
  range: {
    start: string;
    end: string;
  };
  daily: DailyWeather[];
}

export interface DailyWeather {
  date: string; // YYYY-MM-DD
  temp: {
    max: number;
    min: number;
    avg: number;
  };
  humidity: number;
  precipitation_mm: number;
  weather: {
    code: number;
    label: string;
  };
  weather_detail?: {  // ✨ NEW: 시간별 분석
    period_summary: {
      dawn: string;       // 새벽 날씨
      morning: string;    // 오전 날씨
      afternoon: string;  // 오후 날씨
      evening: string;    // 저녁 날씨
    };
    rain_info: {
      hours: number;      // 비 온 시간 수
      start_hour: number; // 시작 시간 (0-23)
      end_hour: number;   // 종료 시간 (0-23)
    } | null;
    summary: string;      // 하루 날씨 요약
  };
}

export interface TempStat {
  highest: number;
  lowest: number;
  average: number;
}

export interface WeatherStatistics {
  city: string;
  city_korean?: string;  // ✨ NEW: 한글 도시명 (optional)
  country: string;
  date: string; // MM-DD
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
  };
  yearlyData: DailyWeather[];
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
  date: string; // MM-DD
  timestamp: number;
}
