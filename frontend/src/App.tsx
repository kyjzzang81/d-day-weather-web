import React, { useState } from 'react';
import Home from './components/Home';
import Today from './components/Today';

type AppTab = 'today' | 'dday' | 'theday';

const NAV_ITEMS: { id: AppTab; label: string; emoji: string }[] = [
  { id: 'today', label: 'Today', emoji: '🌤' },
  { id: 'dday', label: 'D-Day', emoji: '📅' },
  { id: 'theday', label: 'TheDay', emoji: '🗓' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [sharedCityId, setSharedCityId] = useState('seoul');
  const [ddayPreset, setDdayPreset] = useState<{ month: number; day: number } | null>(null);

  const handleGotoDday = (cityId: string, month: number, day: number) => {
    setSharedCityId(cityId);
    setDdayPreset({ month, day });
    setActiveTab('dday');
  };

  return (
    <div className="phone">
      <div className="tab-content">
        {activeTab === 'today' && (
          <Today
            cityId={sharedCityId}
            onCityChange={setSharedCityId}
            onGotoDday={handleGotoDday}
          />
        )}
        {activeTab === 'dday' && (
          <Home
            cityId={sharedCityId}
            onCityChange={setSharedCityId}
            ddayPreset={ddayPreset}
          />
        )}
        {activeTab === 'theday' && (
          <div className="tab-placeholder">
            <span>🗓</span>
            <p>TheDay 화면은 곧 추가될 예정이에요.</p>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`bottom-nav-item${activeTab === item.id ? ' active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-emoji">{item.emoji}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
