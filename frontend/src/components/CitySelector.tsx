import React, { useState, useEffect } from 'react';
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

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">도시 선택</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 검색 입력 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="도시 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* 도시 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">{error}</div>
          )}

          {!loading && !error && filteredCities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}

          {!loading && !error && filteredCities.length > 0 && (
            <div className="space-y-2">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleSelectCity(city.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    city.id === currentCity
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {city.nameKo} {city.id === currentCity && '✓'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {city.name}, {city.country}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitySelector;
