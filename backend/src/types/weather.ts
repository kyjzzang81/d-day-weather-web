// 날씨 데이터 타입 정의

export interface WeatherData {
  city: string;
  country: string;
  lat: number;
  lon: number;
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
}

export interface TempStat {
  highest: number;
  lowest: number;
  average: number;
}

export interface WeatherStatistics {
  city: string;
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
}
