import React, { useState, useEffect } from 'react';
import { WeatherStatistics } from '../types/weather';
import { fetchWeatherStatistics } from '../utils/weatherApi';
import { getSearchHistory, saveSearchHistory } from '../utils/storage';
import WeatherStats from './WeatherStats';
import DatePickerDialog from './DatePickerDialog';
import CitySelector from './CitySelector';

const Home: React.FC = () => {
  const [statistics, setStatistics] = useState<WeatherStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentCity, setCurrentCity] = useState('seoul');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);

  useEffect(() => {
    // 초기 로드: 쿠키에서 이전 검색 이력 확인
    const history = getSearchHistory();
    if (history) {
      const [month, day] = history.date.split('-').map(Number);
      const date = new Date(2026, month - 1, day);
      setCurrentCity(history.city);
      setCurrentDate(date);
      loadWeatherData(history.city, month, day);
    } else {
      // 이력 없으면 오늘 날짜 + 서울
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      loadWeatherData(currentCity, month, day);
    }
  }, []);

  const loadWeatherData = async (city: string, month: number, day: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchWeatherStatistics(city, month, day);
      setStatistics(data);
      
      // 쿠키에 저장
      const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      saveSearchHistory(city, dateStr);
    } catch (err) {
      setError('날씨 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (month: number, day: number) => {
    const date = new Date(2026, month - 1, day);
    setCurrentDate(date);
    loadWeatherData(currentCity, month, day);
  };

  const handleCitySelect = (cityId: string) => {
    setCurrentCity(cityId);
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    loadWeatherData(cityId, month, day);
  };

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const getCityName = (cityId: string) => {
    // statistics에서 한글 도시명을 가져오거나, 없으면 기본 매핑 사용
    if (statistics && statistics.city_korean) {
      return statistics.city_korean;
    }
    
    const cityNames: Record<string, string> = {
      seoul: '서울',
      busan: '부산',
      incheon: '인천',
      daegu: '대구',
      daejeon: '대전',
      gwangju: '광주',
      ulsan: '울산',
      jeju: '제주',
      // 필요시 추가
    };
    return cityNames[cityId] || cityId;
  };

  return (
    <div className="min-h-screen py-8 md:py-16 px-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-20 left-10 w-72 md:w-96 h-72 md:h-96 bg-purple-300/30 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 md:w-96 h-72 md:h-96 bg-pink-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 md:w-96 h-72 md:h-96 bg-indigo-300/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* 헤더 */}
        <header className="text-center mb-12 md:mb-16">
          <div className="inline-block mb-4 md:mb-6 animate-float">
            <div className="text-5xl md:text-7xl">🌈</div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent px-4">
            그날의 날씨
          </h1>
          <p className="text-base md:text-xl text-gray-700 font-medium px-4">
            10년간의 날씨 데이터로 보는 특별한 날
          </p>
        </header>

        {/* 날짜 및 도시 선택 */}
        <div className="card mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 relative z-10">
            <div className="text-center md:text-left w-full md:w-auto">
              <div className="text-xs md:text-sm font-semibold text-indigo-600 mb-2 md:mb-3 uppercase tracking-wider">선택한 날짜</div>
              <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-3">
                {formatDate(currentDate)}
              </div>
              <div className="text-base md:text-lg text-gray-700 font-medium">
                {getCityName(currentCity)}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
              <button
                onClick={() => setIsDatePickerOpen(true)}
                className="btn-primary flex items-center justify-center gap-2 md:gap-3 w-full sm:w-auto"
              >
                <span className="text-xl md:text-2xl">📅</span>
                <span className="text-sm md:text-base">날짜 변경</span>
              </button>
              <button
                onClick={() => setIsCitySelectorOpen(true)}
                className="btn-secondary flex items-center justify-center gap-2 md:gap-3 w-full sm:w-auto"
              >
                <span className="text-xl md:text-2xl">🌍</span>
                <span className="text-sm md:text-base">지역 변경</span>
              </button>
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-32">
            <div className="inline-block relative">
              <div className="w-20 h-20 border-[4px] border-purple-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-[4px] border-transparent border-t-purple-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-8 text-xl text-gray-700 font-semibold">날씨 데이터를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="card bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <p className="text-red-700 text-center font-semibold text-lg">{error}</p>
          </div>
        )}

        {/* 날씨 통계 */}
        {!loading && !error && statistics && (
          <WeatherStats statistics={statistics} />
        )}

        {/* 다이얼로그 */}
        <DatePickerDialog
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          onSelectDate={handleDateSelect}
          currentDate={currentDate}
        />

        <CitySelector
          isOpen={isCitySelectorOpen}
          onClose={() => setIsCitySelectorOpen(false)}
          onSelectCity={handleCitySelect}
          currentCity={currentCity}
        />

        {/* 푸터 */}
        <footer className="mt-20 text-center text-sm text-gray-600">
          <p>
            데이터 출처:{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Open-Meteo
            </a>
          </p>
          <p className="mt-2">2016-2025년 날씨 데이터 기반</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
