import { WeatherStatistics, City, WeatherData } from '../types/weather';

// 개발 환경에서는 로컬 JSON 파일 사용
const isDev = import.meta.env.DEV;

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

export const fetchWeatherStatistics = async (
  city: string,
  month: number,
  day: number
): Promise<WeatherStatistics> => {
  if (isDev) {
    // 개발 환경: 로컬 JSON 파일 직접 읽기
    try {
      const response = await fetch(`/${city}.json`);
      if (!response.ok) {
        throw new Error(`City ${city} not found`);
      }
      
      const weatherData: WeatherData = await response.json();
      
      // 해당 월-일 데이터 필터링
      const targetDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dailyData = weatherData.daily.filter((daily) => {
        const monthDay = daily.date.substring(5); // MM-DD
        return monthDay === targetDate;
      });
      
      if (dailyData.length === 0) {
        throw new Error(`No data found for ${month}-${day}`);
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
      
      return {
        city: weatherData.city,
        city_korean: weatherData.city_korean,
        country: weatherData.country,
        date: targetDate,
        statistics: {
          weatherFrequency,
          temperature,
          humidity,
          precipitation,
        },
        yearlyData: dailyData,
      };
    } catch (error) {
      throw new Error(`Failed to fetch weather statistics: ${error}`);
    }
  } else {
    // 프로덕션: API 호출
    const response = await fetch(
      `/api/weather/statistics?city=${city}&month=${month}&day=${day}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weather statistics: ${response.statusText}`);
    }
    
    return response.json();
  }
};

export const fetchCities = async (): Promise<City[]> => {
  if (isDev) {
    // 개발 환경: 실제 JSON 파일이 있는 도시만 불러오기
    // public 폴더에 있는 모든 도시 목록 (datas/README.md 기준)
    const allCityIds = [
      // 한국 (12개)
      'seoul', 'incheon', 'suwon', 'yongin', 'seongnam', 'goyang', 
      'jeonju', 'cheongju', 'ulsan', 'geoje', 'tongyeong', 'gunsan',
      'busan', 'daegu', 'daejeon', 'gwangju', 'jeju', 'seogwipo',
      'jinju', 'changwon', 'gyeongju', 'pohang', 'gangneung', 'sokcho',
      'chuncheon', 'wonju', 'sejong', 'yeosu', 'suncheon', 'mokpo',
      
      // 중국 (6개 + 추가)
      'xian', 'guangzhou', 'shenzhen', 'macau', 'weihai', 'dalian',
      'beijing', 'shanghai', 'hangzhou', 'suzhou', 'nanjing', 'qingdao',
      'wuxi', 'guilin', 'yangshuo', 'lijiang', 'shangri-la', 'dunhuang',
      'zhangjiajie', 'harbin',
      
      // 일본 (6개 + 추가)
      'asahikawa', 'nagasaki', 'beppu', 'yufuin', 'ishigaki', 'okinawa-naha',
      'tokyo', 'osaka', 'kyoto', 'fukuoka', 'sapporo', 'hakodate', 'otaru',
      'nara', 'kobe', 'hiroshima', 'okayama', 'takamatsu', 'matsuyama',
      'oita', 'kitakyushu', 'miyakojima',
      
      // 베트남 (1개 + 추가)
      'phu-quoc', 'hanoi', 'halong-bay', 'sapa', 'hue', 'hoi-an', 
      'da-nang', 'nha-trang', 'da-lat', 'mui-ne', 'ho-chi-minh',
      
      // 태국
      'bangkok', 'pattaya', 'phuket', 'krabi', 'koh-samui', 'hua-hin',
      'chiang-mai', 'chiang-rai',
      
      // 싱가포르/말레이시아
      'singapore', 'kuala-lumpur', 'penang', 'langkawi', 'kota-kinabalu',
      
      // 인도네시아/필리핀
      'bali', 'lombok', 'yogyakarta', 'jakarta',
      'manila', 'cebu', 'boracay', 'bohol', 'clark', 'davao',
      
      // 대만/홍콩
      'taipei', 'taichung', 'kaohsiung', 'jiufen', 'hualien',
      'hong-kong',
      
      // 미국/괌/사이판
      'new-york', 'los-angeles', 'san-francisco', 'san-diego', 
      'seattle', 'las-vegas', 'guam', 'saipan', 'honolulu',
      
      // 유럽
      'paris', 'london', 'amsterdam', 'berlin', 'munich', 'zurich', 
      'interlaken', 'vienna', 'budapest', 'prague',
      'barcelona', 'madrid', 'rome', 'florence', 'venice', 'milan',
    ];
    
    const cities: City[] = [];
    
    // 병렬로 도시 데이터 로드 (최대 10개씩)
    const batchSize = 10;
    for (let i = 0; i < allCityIds.length; i += batchSize) {
      const batch = allCityIds.slice(i, i + batchSize);
      const promises = batch.map(async (cityId) => {
        try {
          const response = await fetch(`/${cityId}.json`);
          if (response.ok) {
            const data: WeatherData = await response.json();
            return {
              id: cityId,
              name: data.city,
              nameKo: data.city_korean || data.city,
              country: data.country,
              lat: data.lat || undefined,
              lon: data.lon || undefined,
            } as City;
          }
        } catch (error) {
          // 파일이 없으면 무시
        }
        return null;
      });
      
      const results = await Promise.all(promises);
      cities.push(...results.filter((city): city is City => city !== null && city.id !== undefined));
    }
    
    return cities.sort((a, b) => a.nameKo.localeCompare(b.nameKo, 'ko'));
  } else {
    // 프로덕션: API 호출
    const response = await fetch(`/api/weather/cities`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.cities;
  }
};

export const submitContact = async (email: string, message: string): Promise<void> => {
  const response = await fetch(`/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, message }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to submit contact: ${response.statusText}`);
  }
};
