import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'fs/promises';
import { join } from 'path';

// 날씨 데이터 타입
interface DailyWeather {
  date: string;
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

interface WeatherData {
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

// 날씨 코드를 카테고리로 분류
function categorizeWeather(code: number): 'clear' | 'cloudy' | 'rain' | 'snow' {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 80 && code <= 82) return 'rain';
  return 'cloudy';
}

// 온도 통계 계산
function calculateTempStat(values: number[]) {
  if (values.length === 0) {
    return { highest: 0, lowest: 0, average: 0 };
  }
  return {
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: values.reduce((a, b) => a + b, 0) / values.length,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { city, month, day } = req.query;
    
    if (!city || !month || !day) {
      return res.status(400).json({
        error: 'Missing required parameters: city, month, day',
      });
    }
    
    const monthNum = parseInt(month as string, 10);
    const dayNum = parseInt(day as string, 10);
    
    if (isNaN(monthNum) || isNaN(dayNum)) {
      return res.status(400).json({
        error: 'Invalid month or day format',
      });
    }
    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: 'Month must be between 1 and 12',
      });
    }
    
    if (dayNum < 1 || dayNum > 31) {
      return res.status(400).json({
        error: 'Day must be between 1 and 31',
      });
    }
    
    // 날씨 데이터 로드
    const filePath = join(process.cwd(), 'datas', `${city}.json`);
    const content = await readFile(filePath, 'utf-8');
    const weatherData: WeatherData = JSON.parse(content);
    
    // 해당 월-일 데이터 필터링
    const targetDate = `${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dailyData = weatherData.daily.filter((daily) => {
      const monthDay = daily.date.substring(5); // MM-DD
      return monthDay === targetDate;
    });
    
    if (dailyData.length === 0) {
      return res.status(404).json({
        error: `No data found for ${monthNum}-${dayNum}`,
      });
    }
    
    // 날씨 빈도 계산
    const weatherFrequency = {
      clear: 0,
      cloudy: 0,
      rain: 0,
      snow: 0,
    };
    
    dailyData.forEach((daily) => {
      const category = categorizeWeather(daily.weather.code);
      weatherFrequency[category]++;
    });
    
    // 온도 통계 계산
    const maxTemps = dailyData.map((d) => d.temp.max);
    const minTemps = dailyData.map((d) => d.temp.min);
    const avgTemps = dailyData.map((d) => d.temp.avg);
    
    const temperature = {
      max: calculateTempStat(maxTemps),
      min: calculateTempStat(minTemps),
      avg: calculateTempStat(avgTemps),
    };
    
    // 습도 통계 계산
    const humidities = dailyData.map((d) => d.humidity);
    const humidity = {
      highest: Math.max(...humidities),
      lowest: Math.min(...humidities),
      average: humidities.reduce((a, b) => a + b, 0) / humidities.length,
    };
    
    // 강수량 통계 계산
    const precipitations = dailyData.map((d) => d.precipitation_mm);
    const precipitation = {
      highest: Math.max(...precipitations),
      average: precipitations.reduce((a, b) => a + b, 0) / precipitations.length,
    };
    
    // 결과 반환
    res.status(200).json({
      city: weatherData.city,
      country: weatherData.country,
      date: targetDate,
      statistics: {
        weatherFrequency,
        temperature,
        humidity,
        precipitation,
      },
      yearlyData: dailyData,
    });
  } catch (error) {
    console.error('Error:', error);
    
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}
