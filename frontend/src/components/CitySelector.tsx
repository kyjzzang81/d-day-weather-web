import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { City } from '../types/weather';
import { fetchCities } from '../utils/weatherApi';

interface CitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (cityId: string) => void;
  currentCity: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  isOpen,
  onClose,
  onSelectCity,
  currentCity,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && cities.length === 0) {
      loadCities();
    }
  }, [isOpen]);

  const loadCities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCities();
      setCities(data);
    } catch (err) {
      setError('도시 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = cities.filter(
    (city) =>
      city.nameKo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCity = (cityId: string) => {
    onSelectCity(cityId);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-10 relative z-10">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            도시 선택
          </h2>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white 
                     bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
                     rounded-full transition-all text-2xl font-bold shadow-lg hover:shadow-glow-pink
                     hover:scale-110 active:scale-95"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 검색 입력 */}
        <div className="mb-8 relative z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="도시 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 
                       border-2 border-purple-200/50 rounded-[20px] 
                       focus:outline-none focus:ring-4 focus:ring-purple-300/30 focus:border-purple-400
                       transition-all text-base placeholder-gray-500 font-medium"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          </div>
        </div>

        {/* 도시 목록 */}
        <div className="flex-1 overflow-y-auto relative z-10">
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block relative">
                <div className="w-16 h-16 border-[3px] border-purple-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-[3px] border-transparent border-t-purple-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-gray-600 font-semibold">로딩 중...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">😢</div>
              <p className="text-red-600 font-semibold text-lg">{error}</p>
            </div>
          )}

          {!loading && !error && filteredCities.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 font-semibold text-lg">
                검색 결과가 없습니다.
              </p>
            </div>
          )}

          {!loading && !error && filteredCities.length > 0 && (
            <div className="space-y-3">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleSelectCity(city.id)}
                  className={`w-full text-left px-6 py-5 rounded-[25px] transition-all duration-300
                    ${
                      city.id === currentCity
                        ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-liquid-lg scale-105'
                        : 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200/50 hover:shadow-liquid hover:scale-105'
                    }`}
                >
                  <div className={`font-bold text-lg ${
                    city.id === currentCity ? 'text-white' : 'text-gray-900'
                  }`}>
                    {city.nameKo} {city.id === currentCity && '✨'}
                  </div>
                  <div className={`text-sm mt-1 ${
                    city.id === currentCity ? 'text-white/90' : 'text-gray-600'
                  }`}>
                    {city.name}, {city.country}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end relative z-10">
          <button onClick={onClose} className="btn-secondary">
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CitySelector;
