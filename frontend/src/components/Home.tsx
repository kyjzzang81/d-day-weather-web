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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            그날의 날씨 🌤️
          </h1>
          <p className="text-gray-600">
            10년간의 날씨 데이터로 보는 특별한 날
          </p>
        </header>

        {/* 날짜 및 도시 선택 */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="text-sm text-gray-500 mb-1">선택한 날짜</div>
              <div className="text-3xl font-bold text-gray-900">
                {formatDate(currentDate)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {getCityName(currentCity)}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDatePickerOpen(true)}
                className="btn-primary"
              >
                📅 날짜 변경
              </button>
              <button
                onClick={() => setIsCitySelectorOpen(true)}
                className="btn-secondary"
              >
                🌍 지역 변경
              </button>
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">날씨 데이터를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="card bg-red-50 border border-red-200">
            <p className="text-red-700 text-center">{error}</p>
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
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            데이터 출처:{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Open-Meteo
            </a>
          </p>
          <p className="mt-1">2016-2025년 날씨 데이터 기반</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
