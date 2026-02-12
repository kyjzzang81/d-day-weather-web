import React from 'react';
import { WeatherStatistics } from '../types/weather';

interface WeatherStatsProps {
  statistics: WeatherStatistics;
}

const WeatherStats: React.FC<WeatherStatsProps> = ({ statistics }) => {
  const { temperature, humidity, precipitation } = statistics.statistics;
  
  // 날씨 레이블에서 아이콘 가져오기
  const getWeatherIcon = (label: string): string => {
    if (label.includes('맑음')) return '☀️';
    if (label.includes('흐림')) return '☁️';
    if (label.includes('구름')) return '⛅';
    if (label.includes('비') || label.includes('이슬비') || label.includes('소나기')) return '🌧️';
    if (label.includes('눈') || label.includes('진눈깨비')) return '❄️';
    if (label.includes('안개')) return '🌫️';
    if (label.includes('뇌우')) return '⛈️';
    return '🌤️';
  };

  // 10년간 데이터 전체 (연도별로 정렬)
  const allYearlyData = statistics.yearlyData.sort((a, b) => a.date.localeCompare(b.date));
  
  // 날짜 포맷 변환 (MM-DD -> M월 D일)
  const formatDateString = (dateStr: string) => {
    const [month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    return `${month}월 ${day}일`;
  };
  
  // 강수량 설명
  const getRainDescription = (mm: number): string => {
    if (mm === 0) return '비가 오지 않았습니다';
    if (mm < 1) return '이슬비 수준의 아주 약한 비';
    if (mm < 5) return '가벼운 비 (우산 필요)';
    if (mm < 15) return '보통 강도의 비';
    if (mm < 30) return '제법 많은 비';
    if (mm < 50) return '상당히 많은 비 (외출 주의)';
    if (mm < 80) return '매우 많은 비 (폭우 수준)';
    return '집중호우 수준의 폭우';
  };

  return (
    <div className="space-y-10">
      {/* 도시명 */}
      <div className="text-center">
        <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          {statistics.city_korean || statistics.city}
        </h2>
      </div>

      {/* AI 총평 */}
      <div className="card">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="text-3xl md:text-4xl animate-float flex-shrink-0">🤖</div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI 날씨 분석
            </h3>
            <div className="text-sm md:text-base text-gray-700 leading-relaxed space-y-3">
              {(() => {
                const { weatherFrequency, temperature, precipitation } = statistics.statistics;
                const totalDays = statistics.yearlyData.length;
                const clearRate = (weatherFrequency.clear / totalDays) * 100;
                const rainRate = (weatherFrequency.rain / totalDays) * 100;
                const avgTemp = temperature.avg.average;
                const tempRange = temperature.max.highest - temperature.min.lowest;
                
                // 여행 추천도 계산
                const isGoodForTravel = clearRate > 40 || (clearRate + weatherFrequency.cloudy / totalDays * 100 > 60 && rainRate < 30);
                
                return (
                  <>
                    <p>
                      {isGoodForTravel ? (
                        <span className="text-green-700 font-semibold">✅ {formatDateString(statistics.date)}은 여행하기 좋은 날입니다!</span>
                      ) : (
                        <span className="text-orange-700 font-semibold">⚠️ {formatDateString(statistics.date)}은 날씨 변동이 있을 수 있는 날입니다.</span>
                      )}
                      {' '}10년간 데이터를 보면 맑은 날이 <strong>{clearRate.toFixed(0)}%</strong>, 
                      비 오는 날이 <strong>{rainRate.toFixed(0)}%</strong> 확률로 나타났습니다.
                    </p>
                    
                    <p>
                      🌡️ 기온은 평균 <strong className="text-indigo-600">{avgTemp.toFixed(1)}°C</strong>로 
                      {avgTemp > 25 ? '더운 날씨' : avgTemp > 20 ? '따뜻하고 쾌적한 날씨' : 
                       avgTemp > 15 ? '선선한 날씨' : avgTemp > 5 ? '쌀쌀한 날씨' : '추운 날씨'}입니다. 
                      {tempRange > 15 ? (
                        <span className="text-orange-600"> 일교차가 {tempRange.toFixed(1)}°C로 크니 <strong>겉옷을 꼭 챙기세요.</strong></span>
                      ) : (
                        <span> 일교차는 {tempRange.toFixed(1)}°C로 안정적입니다.</span>
                      )}
                    </p>
                    
                    {precipitation.highest > 0 ? (
                      <p>
                        ☔ 강수량은 평균 <strong>{precipitation.average.toFixed(1)}mm</strong>이며, 
                        최악의 경우 <strong>{precipitation.highest.toFixed(1)}mm</strong>의 비가 내릴 수 있습니다 
                        ({getRainDescription(precipitation.highest)}). 
                        {rainRate > 50 ? ' 우산은 필수입니다!' : 
                         rainRate > 30 ? ' 우산을 챙기는 것을 추천합니다.' : 
                         ' 접이식 우산 정도면 충분합니다.'}
                      </p>
                    ) : (
                      <p className="text-green-700">
                        ☀️ 강수량이 거의 없어 쾌적한 여행이 가능합니다!
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 10년간 시간대별 날씨 상세 */}
      {allYearlyData.length > 0 && (
        <div className="card">
          <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            10년간 {formatDateString(statistics.date)} 날씨
          </h3>
          <div className="space-y-3 md:space-y-4 relative z-10">
            {allYearlyData.map((day) => {
              const year = day.date.substring(0, 4);
              const hasDetail = !!day.weather_detail;
              
              return (
                <div 
                  key={day.date}
                  className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200/50 hover:scale-[1.01] md:hover:scale-[1.02] transition-transform duration-300"
                >
                  {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    {/* 연도 */}
                    <div className="flex-shrink-0 md:w-20">
                      <div className="text-lg md:text-xl font-bold text-gray-900">{year}년</div>
                    </div>
                    
                    {/* 시간대별 날씨 또는 기본 날씨 */}
                    {hasDetail ? (
                      <>
                        {/* 모바일: 2x2 그리드, 데스크톱: 1x4 그리드 */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                          <div className="text-center p-2 md:p-3 bg-white/70 rounded-xl md:rounded-2xl">
                            <div className="text-[10px] md:text-xs text-gray-600 mb-1">🌙 새벽</div>
                            <div className="text-xl md:text-2xl mb-1 animate-float">{getWeatherIcon(day.weather_detail!.period_summary.dawn)}</div>
                            <div className="text-xs md:text-sm font-semibold">{day.weather_detail!.period_summary.dawn}</div>
                          </div>
                          <div className="text-center p-2 md:p-3 bg-white/70 rounded-xl md:rounded-2xl">
                            <div className="text-[10px] md:text-xs text-gray-600 mb-1">🌅 오전</div>
                            <div className="text-xl md:text-2xl mb-1 animate-float" style={{animationDelay: '0.2s'}}>{getWeatherIcon(day.weather_detail!.period_summary.morning)}</div>
                            <div className="text-xs md:text-sm font-semibold">{day.weather_detail!.period_summary.morning}</div>
                          </div>
                          <div className="text-center p-2 md:p-3 bg-white/70 rounded-xl md:rounded-2xl">
                            <div className="text-[10px] md:text-xs text-gray-600 mb-1">☀️ 오후</div>
                            <div className="text-xl md:text-2xl mb-1 animate-float" style={{animationDelay: '0.4s'}}>{getWeatherIcon(day.weather_detail!.period_summary.afternoon)}</div>
                            <div className="text-xs md:text-sm font-semibold">{day.weather_detail!.period_summary.afternoon}</div>
                          </div>
                          <div className="text-center p-2 md:p-3 bg-white/70 rounded-xl md:rounded-2xl">
                            <div className="text-[10px] md:text-xs text-gray-600 mb-1">🌆 저녁</div>
                            <div className="text-xl md:text-2xl mb-1 animate-float" style={{animationDelay: '0.6s'}}>{getWeatherIcon(day.weather_detail!.period_summary.evening)}</div>
                            <div className="text-xs md:text-sm font-semibold">{day.weather_detail!.period_summary.evening}</div>
                          </div>
                        </div>
                        
                        {/* 요약 및 기온 */}
                        <div className="flex-shrink-0 text-center md:text-right w-full md:w-auto md:min-w-[200px] mt-3 md:mt-0">
                          <div className="text-xs text-indigo-600 font-medium mb-1">{day.weather_detail!.summary}</div>
                          <div className="flex items-center justify-center md:justify-end gap-2 text-xs flex-wrap">
                            <span className="text-red-600 font-semibold">최고 {day.temp.max.toFixed(1)}°</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-blue-600 font-semibold">최저 {day.temp.min.toFixed(1)}°</span>
                          </div>
                          {/* 비 정보 */}
                          {day.weather_detail!.rain_info && (
                            <div className="text-xs text-blue-700 mt-1">
                              ☔ {day.weather_detail!.rain_info.start_hour}~{day.weather_detail!.rain_info.end_hour}시 ({day.weather_detail!.rain_info.hours}h)
                            </div>
                          )}
                          {/* 강수량 */}
                          {day.precipitation_mm > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              💧 {day.precipitation_mm.toFixed(1)}mm
                              <span className="text-gray-500 ml-1">({getRainDescription(day.precipitation_mm)})</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* weather_detail이 없는 경우 4단계로 동일한 날씨 표시 */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                          <div className="text-center p-2 md:p-3 bg-white/70 rounded-xl md:rounded-2xl">
                            <div className="text-[10px] md:text-xs text-gray-600 mb-1">🌙 새벽</div>
                            <div className="text-xl md:text-2xl mb-1 animate-float">{getWeatherIcon(day.weather.label)}</div>
                            <div className="text-xs md:text-sm font-semibold">{day.weather.label}</div>
                          </div>
                          <div className="text-center p-2 md:p-3 bg-white/70 rounded-xl md:rounded-2xl">
                            <div className="text-[10px] md:text-xs text-gray-600 mb-1">🌅 오전</div>
                            <div className="text-xl md:text-2xl mb-1 animate-float" style={{animationDelay: '0.2s'}}>{getWeatherIcon(day.weather.label)}</div>
                            <div className="text-xs md:text-sm font-semibold">{day.weather.label}</div>
                          </div>
                          <div className="text-center p-2 md:p-3 bg-white/70 rounded-xl md:rounded-2xl">
                            <div className="text-[10px] md:text-xs text-gray-600 mb-1">☀️ 오후</div>
                            <div className="text-xl md:text-2xl mb-1 animate-float" style={{animationDelay: '0.4s'}}>{getWeatherIcon(day.weather.label)}</div>
                            <div className="text-xs md:text-sm font-semibold">{day.weather.label}</div>
                          </div>
                          <div className="text-center p-2 md:p-3 bg-white/70 rounded-xl md:rounded-2xl">
                            <div className="text-[10px] md:text-xs text-gray-600 mb-1">🌆 저녁</div>
                            <div className="text-xl md:text-2xl mb-1 animate-float" style={{animationDelay: '0.6s'}}>{getWeatherIcon(day.weather.label)}</div>
                            <div className="text-xs md:text-sm font-semibold">{day.weather.label}</div>
                          </div>
                        </div>
                        
                        {/* 기본 기온 정보 */}
                        <div className="flex-shrink-0 text-center md:text-right w-full md:w-auto md:min-w-[200px] mt-3 md:mt-0">
                          <div className="text-xs text-gray-600 mb-2">하루 종일 {day.weather.label}</div>
                          <div className="flex items-center justify-center md:justify-end gap-2 text-xs flex-wrap">
                            <span className="text-red-600 font-semibold">최고 {day.temp.max.toFixed(1)}°</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-blue-600 font-semibold">최저 {day.temp.min.toFixed(1)}°</span>
                          </div>
                          {/* 강수량 */}
                          {day.precipitation_mm > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              💧 {day.precipitation_mm.toFixed(1)}mm
                              <span className="text-gray-500 ml-1">({getRainDescription(day.precipitation_mm)})</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 기온 통계 */}
      <div className="card">
        <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
          기온 통계 (°C)
        </h3>
        <div className="space-y-6 md:space-y-8 relative z-10">
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
        <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
          습도 통계 (%)
        </h3>
        <div className="relative z-10">
          <StatRow
            label="평균 습도"
            highest={humidity.highest}
            lowest={humidity.lowest}
            average={humidity.average}
            emoji="💧"
          />
        </div>
      </div>

      {/* 강수량 통계 */}
      <div className="card">
        <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
          강수량 통계
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative z-10">
          <div className="text-center p-5 md:p-6 rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200/50 hover:scale-105 transition-transform duration-300">
            <div className="text-xs md:text-sm font-semibold text-blue-600 mb-2 md:mb-3 uppercase tracking-wide">최대 강수량</div>
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              {precipitation.highest.toFixed(1)}
              <span className="text-xl md:text-2xl ml-1">mm</span>
            </div>
            <div className="text-xs md:text-sm text-blue-700 font-medium">
              {getRainDescription(precipitation.highest)}
            </div>
          </div>
          <div className="text-center p-5 md:p-6 rounded-2xl md:rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200/50 hover:scale-105 transition-transform duration-300">
            <div className="text-xs md:text-sm font-semibold text-indigo-600 mb-2 md:mb-3 uppercase tracking-wide">평균 강수량</div>
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {precipitation.average.toFixed(1)}
              <span className="text-xl md:text-2xl ml-1">mm</span>
            </div>
            <div className="text-xs md:text-sm text-indigo-700 font-medium">
              {getRainDescription(precipitation.average)}
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
    <div className="border-b-2 border-gradient-to-r from-purple-200 to-pink-200 last:border-0 pb-6 md:pb-8 last:pb-0">
      <div className="flex items-center mb-4 md:mb-6">
        <span className="text-2xl md:text-3xl mr-3 md:mr-4">{emoji}</span>
        <span className="font-bold text-gray-900 text-base md:text-lg">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 md:gap-8">
        <div className="text-center p-3 md:p-5 rounded-2xl md:rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200/50 hover:scale-105 transition-transform duration-300">
          <div className="text-[10px] md:text-xs font-bold text-red-600 mb-1 md:mb-2 uppercase tracking-wider">최고</div>
          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            {highest.toFixed(1)}°
          </div>
        </div>
        <div className="text-center p-3 md:p-5 rounded-2xl md:rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 hover:scale-105 transition-transform duration-300">
          <div className="text-[10px] md:text-xs font-bold text-purple-600 mb-1 md:mb-2 uppercase tracking-wider">평균</div>
          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {average.toFixed(1)}°
          </div>
        </div>
        <div className="text-center p-3 md:p-5 rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200/50 hover:scale-105 transition-transform duration-300">
          <div className="text-[10px] md:text-xs font-bold text-blue-600 mb-1 md:mb-2 uppercase tracking-wider">최저</div>
          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {lowest.toFixed(1)}°
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherStats;
