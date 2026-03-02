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
      <div className="dialog-content" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--c-text)' }}>
            도시 선택
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--c-surf)', border: '1px solid var(--c-line)',
              color: 'var(--c-dim)', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* 검색 */}
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <input
            type="text"
            placeholder="도시 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '13px 16px',
              background: 'var(--c-surf)', border: '1px solid var(--c-line)',
              borderRadius: 12, fontSize: 14, color: 'var(--c-white)',
              fontFamily: 'var(--font-sans)', outline: 'none',
            }}
          />
        </div>

        {/* 도시 목록 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div
                style={{
                  width: 40, height: 40, margin: '0 auto',
                  border: '3px solid var(--c-surf)',
                  borderTop: '3px solid var(--c-acc1)',
                  borderRadius: '50%',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <p style={{ marginTop: 16, color: 'var(--c-dim)', fontSize: 13 }}>로딩 중...</p>
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>😢</div>
              <p style={{ color: 'var(--c-acc4)', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {!loading && !error && filteredCities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
              <p style={{ color: 'var(--c-dim)', fontSize: 14 }}>검색 결과가 없습니다.</p>
            </div>
          )}

          {!loading && !error && filteredCities.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredCities.map((city) => {
                const isSelected = city.id === currentCity;
                return (
                  <button
                    key={city.id}
                    onClick={() => handleSelectCity(city.id)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                      border: isSelected ? '1px solid rgba(91,142,255,0.5)' : '1px solid var(--c-line)',
                      background: isSelected ? 'rgba(91,142,255,0.15)' : 'var(--c-surf)',
                      transition: 'all 0.15s',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: isSelected ? 'var(--c-acc1)' : 'var(--c-white)',
                    }}>
                      {city.nameKo} {isSelected && '✦'}
                    </div>
                    <div style={{
                      fontSize: 11, marginTop: 2,
                      color: isSelected ? 'rgba(91,142,255,0.7)' : 'var(--c-muted)',
                    }}>
                      {city.name}, {city.country}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">닫기</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CitySelector;
