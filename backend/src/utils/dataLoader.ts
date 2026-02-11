import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WeatherData } from '../types/weather.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// datas 폴더의 절대 경로
const DATAS_DIR = join(__dirname, '../../../datas');

/**
 * 특정 도시의 날씨 데이터를 로드합니다.
 */
export async function loadWeatherData(cityId: string): Promise<WeatherData> {
  const filePath = join(DATAS_DIR, `${cityId}.json`);
  
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as WeatherData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`City not found: ${cityId}`);
    }
    throw error;
  }
}

/**
 * 특정 월-일에 해당하는 10년간 데이터를 필터링합니다.
 */
export function filterByMonthDay(
  weatherData: WeatherData,
  month: number,
  day: number
) {
  const targetDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return weatherData.daily.filter((daily) => {
    const dateStr = daily.date; // YYYY-MM-DD
    const monthDay = dateStr.substring(5); // MM-DD
    return monthDay === targetDate;
  });
}
