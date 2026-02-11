# Weather Data Collection

전세계 138개 주요 도시의 10년간(2016-2025) 일일 날씨 데이터입니다.

## 📊 데이터 개요

- **수집 기간**: 2016-01-01 ~ 2025-12-31 (10년, 3,653일)
- **도시 수**: 138개 (한국 30개, 일본 22개, 중국 22개, 기타 64개)
- **데이터 소스**: [Open-Meteo Historical Weather API](https://open-meteo.com/)
- **수집 일자**: 2026년 2월 2일
- **총 데이터량**: 504,114일 분량

## 📁 파일 구조

```
output/
├── seoul.json          # 서울
├── busan.json          # 부산
├── tokyo.json          # 도쿄
├── beijing.json        # 베이징
└── ... (총 138개 파일)
```

### 파일 네이밍 규칙
- 형식: `{city_id}.json`
- city_id: 소문자 영문, 하이픈 구분 (예: `new-york`, `hong-kong`)
- 한 파일당 약 900KB

## 📋 JSON 스키마

### 파일 구조

```json
{
  "city": "Seoul",              // 도시명 (영문)
  "country": "KR",              // 국가 코드 (ISO 3166-1 alpha-2)
  "lat": 37.5665,               // 위도
  "lon": 126.978,               // 경도
  "source": "open-meteo",       // 데이터 소스
  "range": {
    "start": "2016-01-01",      // 시작일
    "end": "2025-12-31"         // 종료일
  },
  "daily": [                    // 일일 데이터 배열 (3,653개)
    {
      "date": "2016-01-01",     // 날짜 (YYYY-MM-DD)
      "temp": {
        "max": 4.7,             // 최고 기온 (°C)
        "min": -4.0,            // 최저 기온 (°C)
        "avg": 0.5              // 평균 기온 (°C)
      },
      "humidity": 77,           // 평균 상대습도 (%)
      "precipitation_mm": 0.0,  // 강수량 (mm)
      "weather": {
        "code": 3,              // WMO weather code (0-99)
        "label": "흐림"         // 한글 날씨 설명
      }
    }
    // ... (3,652개 더)
  ]
}
```

## 🌤️ 날씨 코드 (WMO Weather Code)

| 코드 | 날씨 |
|-----|------|
| 0 | 맑음 |
| 1 | 대체로 맑음 |
| 2 | 구름 조금 |
| 3 | 흐림 |
| 45, 48 | 안개 |
| 51, 53, 55 | 이슬비 |
| 56, 57 | 진눈깨비 |
| 61, 63, 65 | 비 |
| 66, 67 | 진눈깨비 |
| 71, 73, 75 | 눈 |
| 77 | 진눈깨비 |
| 80, 81, 82 | 소나기 |
| 85, 86 | 눈 |
| 95, 96, 99 | 뇌우 |

전체 코드 매핑: `../config/wmo_weather_codes.json` 참조

## 🌍 수집 도시 목록

### 한국 (30개)
서울, 부산, 인천, 대구, 대전, 광주, 울산, 세종, 수원, 고양, 용인, 창원, 성남, 청주, 전주, 천안, 안산, 부천, 안양, 남양주, 포항, 진주, 여수, 순천, 제주, 서귀포, 춘천, 강릉, 속초, 원주

### 일본 (22개)
도쿄, 오사카, 교토, 요코하마, 나고야, 삿포로, 후쿠오카, 고베, 히로시마, 센다이, 니가타, 가나자와, 나하, 나라, 하코다테, 오타루, 아사히카와, 벳푸, 다카마쓰, 마쓰야마, 기타큐슈, 후지산

### 중국 (22개)
베이징, 상하이, 홍콩, 광저우, 선전, 청두, 항저우, 시안, 충칭, 난징, 우한, 텐진, 쑤저우, 우시, 난창, 샤먼, 칭다오, 마카오, 구이린, 장자제, 황산, 라싸

### 동남아시아 (39개)
방콕, 싱가포르, 쿠알라룸푸르, 하노이, 호치민, 발리, 푸켓, 세부, 마닐라, 등 (베트남 11, 태국 8, 필리핀 6, 말레이시아 4, 인도네시아 4, 대만 5, 싱가포르 1개)

### 미국·유럽 (25개)
뉴욕, 로스앤젤레스, 샌프란시스코, 라스베가스, 시애틀, 하와이, 괌, 사이판, 파리, 런던, 로마, 밀라노, 바르셀로나, 마드리드, 프라하, 비엔나, 베를린, 암스테르담, 부다페스트, 취리히, 제네바 등

전체 목록: `../config/cities.json` 참조

## ✨ 데이터 품질

- **완성도**: 100% (결측값 없음)
- **정확도**: Open-Meteo의 검증된 관측 데이터 사용
- **일관성**: 모든 도시 동일한 포맷 및 기간

### 검증 완료 항목
✅ 날씨 상태(weather): 100% 완전  
✅ 강수량(precipitation): 100% 완전  
✅ 온도(temp): 100% 완전  
✅ 습도(humidity): 100% 완전  

## 🔧 사용 예시

### Python

```python
import json
from pathlib import Path

# 데이터 로드
with open('output/seoul.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 기본 정보
print(f"도시: {data['city']} ({data['country']})")
print(f"기간: {data['range']['start']} ~ {data['range']['end']}")
print(f"총 일수: {len(data['daily'])}일")

# 특정 날짜 조회
for day in data['daily']:
    if day['date'] == '2024-01-01':
        print(f"2024년 1월 1일 서울")
        print(f"  최고 기온: {day['temp']['max']}°C")
        print(f"  최저 기온: {day['temp']['min']}°C")
        print(f"  날씨: {day['weather']['label']}")
        print(f"  강수량: {day['precipitation_mm']}mm")
        break

# 월별 평균 기온 계산
from collections import defaultdict

monthly_temps = defaultdict(list)
for day in data['daily']:
    month = day['date'][:7]  # YYYY-MM
    monthly_temps[month].append(day['temp']['avg'])

for month, temps in sorted(monthly_temps.items()):
    avg_temp = sum(temps) / len(temps)
    print(f"{month}: {avg_temp:.1f}°C")
```

### JavaScript (Node.js)

```javascript
const fs = require('fs');

// 데이터 로드
const data = JSON.parse(fs.readFileSync('output/seoul.json', 'utf-8'));

// 기본 정보
console.log(`도시: ${data.city} (${data.country})`);
console.log(`기간: ${data.range.start} ~ ${data.range.end}`);
console.log(`총 일수: ${data.daily.length}일`);

// 특정 날짜 조회
const day = data.daily.find(d => d.date === '2024-01-01');
if (day) {
  console.log('2024년 1월 1일 서울');
  console.log(`  최고 기온: ${day.temp.max}°C`);
  console.log(`  최저 기온: ${day.temp.min}°C`);
  console.log(`  날씨: ${day.weather.label}`);
  console.log(`  강수량: ${day.precipitation_mm}mm`);
}

// 연도별 평균 기온
const yearlyTemps = {};
data.daily.forEach(day => {
  const year = day.date.substring(0, 4);
  if (!yearlyTemps[year]) yearlyTemps[year] = [];
  yearlyTemps[year].push(day.temp.avg);
});

Object.keys(yearlyTemps).sort().forEach(year => {
  const avgTemp = yearlyTemps[year].reduce((a, b) => a + b) / yearlyTemps[year].length;
  console.log(`${year}: ${avgTemp.toFixed(1)}°C`);
});
```

### TypeScript 타입 정의

```typescript
interface WeatherData {
  city: string;
  country: string;
  lat: number;
  lon: number;
  source: string;
  range: {
    start: string;  // YYYY-MM-DD
    end: string;    // YYYY-MM-DD
  };
  daily: DailyWeather[];
}

interface DailyWeather {
  date: string;  // YYYY-MM-DD
  temp: {
    max: number;   // °C
    min: number;   // °C
    avg: number;   // °C
  };
  humidity: number;           // %
  precipitation_mm: number;   // mm
  weather: {
    code: number;             // WMO code (0-99)
    label: string;            // 한글 날씨
  };
}
```

## 📌 주의사항

1. **시간대 (Timezone)**
   - 모든 날짜는 해당 도시의 **로컬 시간대** 기준
   - UTC가 아닌 각 도시의 현지 시간

2. **윤년 처리**
   - 2016년, 2020년, 2024년: 366일 (윤년)
   - 나머지 연도: 365일

3. **결측값**
   - 현재 데이터에는 결측값이 없음
   - 만약 결측이 있다면 `null`로 표시됨

4. **파일 크기**
   - 전체 138개 파일: 약 122MB
   - 개별 파일: 약 900KB

5. **데이터 갱신**
   - 정적 데이터 (2016-2025년 고정)
   - 실시간 날씨가 아닌 과거 관측 데이터

## 📖 추가 문서

- 프로젝트 상세: `../my-project.md`
- 도시 목록: `../config/cities.json`
- 날씨 코드: `../config/wmo_weather_codes.json`
- 수집 스크립트: `../scripts/`

## 📄 라이센스

이 데이터는 [Open-Meteo](https://open-meteo.com/)의 오픈 데이터를 기반으로 수집되었습니다.

## 🔗 관련 링크

- [Open-Meteo API Documentation](https://open-meteo.com/en/docs)
- [WMO Weather Code](https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM)

---

**수집 일자**: 2026-02-02  
**데이터 버전**: 1.0
