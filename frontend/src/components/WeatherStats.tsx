import React from 'react';
import { WeatherStatistics } from '../types/weather';

interface WeatherStatsProps {
  statistics: WeatherStatistics;
}

const WeatherStats: React.FC<WeatherStatsProps> = ({ statistics }) => {
  const { weatherFrequency, temperature, humidity, precipitation } = statistics.statistics;

  const weatherIcons: Record<string, string> = {
    clear: '☀️',
    cloudy: '☁️',
    rain: '🌧️',
    snow: '❄️',
  };

  return (
    <div className="space-y-6">
      {/* 날씨 빈도 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">10년간 날씨 빈도</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">{weatherIcons.clear}</div>
            <div className="text-sm text-gray-600">맑음</div>
            <div className="text-2xl font-bold text-primary-600">{weatherFrequency.clear}회</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">{weatherIcons.cloudy}</div>
            <div className="text-sm text-gray-600">흐림</div>
            <div className="text-2xl font-bold text-gray-600">{weatherFrequency.cloudy}회</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">{weatherIcons.rain}</div>
            <div className="text-sm text-gray-600">비</div>
            <div className="text-2xl font-bold text-blue-600">{weatherFrequency.rain}회</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">{weatherIcons.snow}</div>
            <div className="text-sm text-gray-600">눈</div>
            <div className="text-2xl font-bold text-cyan-600">{weatherFrequency.snow}회</div>
          </div>
        </div>
      </div>

      {/* 기온 통계 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">기온 통계 (°C)</h3>
        <div className="space-y-4">
          <StatRow
            label="최고 기온"
            highest={temperature.max.highest}
            lowest={temperature.max.lowest}
            average={temperature.max.average}
            emoji="🌡️"
          />
          <StatRow
            label="최저 기온"
            highest={temperature.min.highest}
            lowest={temperature.min.lowest}
            average={temperature.min.average}
            emoji="🥶"
          />
          <StatRow
            label="평균 기온"
            highest={temperature.avg.highest}
            lowest={temperature.avg.lowest}
            average={temperature.avg.average}
            emoji="🌤️"
          />
        </div>
      </div>

      {/* 습도 통계 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">습도 통계 (%)</h3>
        <StatRow
          label="평균 습도"
          highest={humidity.highest}
          lowest={humidity.lowest}
          average={humidity.average}
          emoji="💧"
        />
      </div>

      {/* 강수량 통계 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">강수량 통계 (mm)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">최대 강수량</div>
            <div className="text-2xl font-bold text-blue-600">
              {precipitation.highest.toFixed(1)} mm
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">평균 강수량</div>
            <div className="text-2xl font-bold text-gray-700">
              {precipitation.average.toFixed(1)} mm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatRowProps {
  label: string;
  highest: number;
  lowest: number;
  average: number;
  emoji: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, highest, lowest, average, emoji }) => {
  return (
    <div className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
      <div className="flex items-center mb-2">
        <span className="text-xl mr-2">{emoji}</span>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xs text-gray-500 mb-1">최고</div>
          <div className="text-lg font-semibold text-red-600">{highest.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">평균</div>
          <div className="text-lg font-semibold text-gray-700">{average.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">최저</div>
          <div className="text-lg font-semibold text-blue-600">{lowest.toFixed(1)}°</div>
        </div>
      </div>
    </div>
  );
};

export default WeatherStats;
