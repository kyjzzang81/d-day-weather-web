import { DailyWeather, WeatherStatistics, TempStat, City } from '../types/weather.js';
import { loadWeatherData, filterByMonthDay } from '../utils/dataLoader.js';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATAS_DIR = join(__dirname, '../../../datas');

/**
 * 날씨 코드를 카테고리로 분류합니다.
 */
function categorizeWeather(code: number): 'clear' | 'cloudy' | 'rain' | 'snow' {
  if (code <= 1) return 'clear'; // 0, 1: 맑음
  if (code <= 3) return 'cloudy'; // 2, 3: 흐림
  if (code >= 71 && code <= 77) return 'snow'; // 눈
  if (code >= 85 && code <= 86) return 'snow'; // 눈
  if (code >= 51 && code <= 67) return 'rain'; // 비/이슬비
  if (code >= 80 && code <= 82) return 'rain'; // 소나기
  return 'cloudy'; // 기타
}

/**
 * 온도 통계를 계산합니다.
 */
function calculateTempStat(values: number[]): TempStat {
  if (values.length === 0) {
    return { highest: 0, lowest: 0, average: 0 };
  }
  
  return {
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: values.reduce((a, b) => a + b, 0) / values.length,
  };
}

/**
 * 특정 날짜의 10년간 날씨 통계를 계산합니다.
 */
export async function getWeatherStatistics(
  cityId: string,
  month: number,
  day: number
): Promise<WeatherStatistics> {
  // 1. 날씨 데이터 로드
  const weatherData = await loadWeatherData(cityId);
  
  // 2. 해당 월-일 데이터 필터링
  const dailyData = filterByMonthDay(weatherData, month, day);
  
  if (dailyData.length === 0) {
    throw new Error(`No data found for ${month}-${day}`);
  }
  
  // 3. 날씨 빈도 계산
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
  
  // 4. 온도 통계 계산
  const maxTemps = dailyData.map((d) => d.temp.max);
  const minTemps = dailyData.map((d) => d.temp.min);
  const avgTemps = dailyData.map((d) => d.temp.avg);
  
  const temperature = {
    max: calculateTempStat(maxTemps),
    min: calculateTempStat(minTemps),
    avg: calculateTempStat(avgTemps),
  };
  
  // 5. 습도 통계 계산
  const humidities = dailyData.map((d) => d.humidity);
  const humidity = {
    highest: Math.max(...humidities),
    lowest: Math.min(...humidities),
    average: humidities.reduce((a, b) => a + b, 0) / humidities.length,
  };
  
  // 6. 강수량 통계 계산
  const precipitations = dailyData.map((d) => d.precipitation_mm);
  const precipitation = {
    highest: Math.max(...precipitations),
    average: precipitations.reduce((a, b) => a + b, 0) / precipitations.length,
  };
  
  // 7. 결과 반환
  const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return {
    city: weatherData.city,
    country: weatherData.country,
    date: dateStr,
    statistics: {
      weatherFrequency,
      temperature,
      humidity,
      precipitation,
    },
    yearlyData: dailyData,
  };
}

/**
 * 도시 목록을 반환합니다.
 */
export async function getCities(): Promise<City[]> {
  const files = await readdir(DATAS_DIR);
  const jsonFiles = files.filter((file) => file.endsWith('.json') && file !== 'README.md');
  
  // 도시 ID와 한글 이름 매핑 (일부)
  const cityNameMap: Record<string, string> = {
    seoul: '서울',
    busan: '부산',
    incheon: '인천',
    daegu: '대구',
    daejeon: '대전',
    gwangju: '광주',
    ulsan: '울산',
    sejong: '세종',
    suwon: '수원',
    goyang: '고양',
    yongin: '용인',
    changwon: '창원',
    seongnam: '성남',
    cheongju: '청주',
    jeonju: '전주',
    pohang: '포항',
    jinju: '진주',
    yeosu: '여수',
    suncheon: '순천',
    jeju: '제주',
    seogwipo: '서귀포',
    chuncheon: '춘천',
    gangneung: '강릉',
    sokcho: '속초',
    wonju: '원주',
    tokyo: '도쿄',
    osaka: '오사카',
    kyoto: '교토',
    fukuoka: '후쿠오카',
    sapporo: '삿포로',
    beijing: '베이징',
    shanghai: '상하이',
    'hong-kong': '홍콩',
    taipei: '타이페이',
    bangkok: '방콕',
    singapore: '싱가포르',
    'kuala-lumpur': '쿠알라룸푸르',
    hanoi: '하노이',
    'ho-chi-minh': '호치민',
    bali: '발리',
    phuket: '푸켓',
    cebu: '세부',
    manila: '마닐라',
    paris: '파리',
    london: '런던',
    rome: '로마',
    barcelona: '바르셀로나',
    'new-york': '뉴욕',
    'los-angeles': '로스앤젤레스',
    'san-francisco': '샌프란시스코',
    honolulu: '호놀룰루',
  };
  
  const cities: City[] = [];
  
  for (const file of jsonFiles) {
    const cityId = file.replace('.json', '');
    
    try {
      const data = await loadWeatherData(cityId);
      const nameKo = cityNameMap[cityId] || data.city;
      
      cities.push({
        id: cityId,
        name: data.city,
        nameKo,
        country: data.country,
      });
    } catch (error) {
      console.error(`Failed to load city: ${cityId}`, error);
    }
  }
  
  return cities;
}
