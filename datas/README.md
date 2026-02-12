# Weather Data Collection (Enhanced with Hourly Analysis)

전세계 주요 도시의 10년간(2016-2025) 일일 날씨 데이터 + 시간별 분석 정보입니다.

## 📊 데이터 개요

- **수집 기간**: 2016-01-01 ~ 2025-12-31 (10년, 3,653일)
- **데이터 소스**: [Open-Meteo Historical Weather API](https://open-meteo.com/)
- **수집 일자**: 2026년 2월 12일
- **현재 상태**: 25개 도시 수집 완료 (113개 도시는 API Rate Limit으로 재수집 대기 중)

## 🆕 새로운 기능

### 시간별 날씨 분석
각 날짜마다 24시간 데이터를 분석하여 다음 정보를 제공합니다:

- **시간대별 날씨 요약**: 새벽(0-6시), 오전(6-12시), 오후(12-18시), 저녁(18-24시)
- **비 오는 시간 정보**: 비가 몇 시간 동안 내렸는지, 언제 시작해서 언제 끝났는지
- **하루 날씨 요약**: "오전 맑다가 오후 비", "하루 종일 흐림" 등 자동 생성

### 한글 도시명
모든 도시에 한글명(`city_korean`) 필드가 추가되었습니다.

## 📁 파일 구조

```
output/
├── seoul.json          # 서울 (약 1.9MB)
├── busan.json          # 부산
├── tokyo.json          # 도쿄
└── ... (총 138개 예정, 현재 25개)
```

### 파일 네이밍 규칙
- 형식: `{city_id}.json`
- city_id: 소문자 영문, 하이픈 구분 (예: `new-york`, `hong-kong`)
- 한 파일당 약 1.9MB (시간별 분석 포함)

## 📋 JSON 스키마

### 파일 구조

```json
{
  "city": "Seoul",              // 도시명 (영문)
  "city_korean": "서울",        // 도시명 (한글) ✨ NEW
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
      "precipitation_mm": 0.0,  // 강수량 (mm, 하루 전체 누적)
      "weather": {
        "code": 3,              // WMO weather code (0-99)
        "label": "흐림"         // 한글 날씨 설명
      },
      "weather_detail": {       // ✨ NEW: 시간별 분석
        "period_summary": {
          "dawn": "맑음",       // 새벽 (0-6시)
          "morning": "구름 조금", // 오전 (6-12시)
          "afternoon": "흐림",  // 오후 (12-18시)
          "evening": "흐림"     // 저녁 (18-24시)
        },
        "rain_info": null,      // 비 정보 (비가 없으면 null)
        "summary": "오전 구름 조금, 오후 흐림"  // 하루 날씨 요약
      }
    }
  ]
}
```

### 비 오는 날 예시

```json
{
  "date": "2024-07-02",
  "precipitation_mm": 57.6,
  "weather": {
    "code": 61,
    "label": "비"
  },
  "weather_detail": {
    "period_summary": {
      "dawn": "흐림",
      "morning": "비",
      "afternoon": "비",
      "evening": "이슬비"
    },
    "rain_info": {
      "hours": 14,           // 비 온 시간: 14시간
      "start_hour": 9,       // 시작: 오전 9시
      "end_hour": 23         // 종료: 오후 11시
    },
    "summary": "오전부터 저녁까지 비"
  }
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

## 🌍 수집 완료 도시 (25개)

### 한국 (12개)
서울, 인천, 수원, 용인, 성남, 고양, 전주, 청주, 울산, 거제, 통영, 군산

### 중국 (6개)
시안, 광저우, 선전, 마카오, 위해, 대련

### 일본 (6개)
아사히카와, 나가사키, 벳푸, 유후인, 이시가키, 오키나와(나하)

### 베트남 (1개)
푸꾸옥

## ⏳ 수집 예정 (113개)

나머지 도시들은 API Rate Limit으로 인해 재수집 대기 중입니다.

### 재수집 방법
```bash
# 내일 다시 실행 (10초 간격으로 안전하게 수집)
./scripts/retry_failed_cities.sh
```

실패한 도시 목록: `failed_cities_retry.txt` 참조

## ✨ 데이터 품질

- **완성도**: 수집된 도시는 100% (결측값 없음)
- **정확도**: Open-Meteo의 검증된 관측 데이터 사용
- **일관성**: 모든 도시 동일한 포맷 및 기간

### 검증 완료 항목
✅ 날씨 상태(weather): 100% 완전  
✅ 강수량(precipitation): 100% 완전  
✅ 온도(temp): 100% 완전  
✅ 습도(humidity): 100% 완전  
✅ 시간별 분석(weather_detail): 100% 완전 ✨ NEW  

## 🔧 사용 예시

### Python

```python
import json

# 데이터 로드
with open('output/seoul.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 기본 정보
print(f"도시: {data['city_korean']} ({data['city']})")
print(f"기간: {data['range']['start']} ~ {data['range']['end']}")

# 특정 날짜 조회
for day in data['daily']:
    if day['date'] == '2024-07-02':
        print(f"\n2024년 7월 2일 {data['city_korean']}")
        print(f"  기온: {day['temp']['min']}°C ~ {day['temp']['max']}°C")
        print(f"  강수량: {day['precipitation_mm']}mm")
        print(f"  날씨 요약: {day['weather_detail']['summary']}")
        
        # 시간대별 날씨
        periods = day['weather_detail']['period_summary']
        print(f"  새벽: {periods['dawn']}")
        print(f"  오전: {periods['morning']}")
        print(f"  오후: {periods['afternoon']}")
        print(f"  저녁: {periods['evening']}")
        
        # 비 정보
        if day['weather_detail']['rain_info']:
            rain = day['weather_detail']['rain_info']
            print(f"  비: {rain['hours']}시간 ({rain['start_hour']}시~{rain['end_hour']}시)")
        break
```

### JavaScript (Node.js)

```javascript
const fs = require('fs');

// 데이터 로드
const data = JSON.parse(fs.readFileSync('output/seoul.json', 'utf-8'));

// 기본 정보
console.log(`도시: ${data.city_korean} (${data.city})`);
console.log(`기간: ${data.range.start} ~ ${data.range.end}`);

// 비 오는 날만 필터링
const rainyDays = data.daily.filter(d => {
  const rain = d.weather_detail?.rain_info;
  return rain && rain.hours >= 5;  // 5시간 이상 비
});

console.log(`\n5시간 이상 비가 온 날: ${rainyDays.length}일`);

rainyDays.slice(0, 5).forEach(day => {
  const rain = day.weather_detail.rain_info;
  console.log(`${day.date}: ${day.precipitation_mm}mm, ${rain.hours}시간`);
  console.log(`  → ${day.weather_detail.summary}`);
});
```

### TypeScript 타입 정의

```typescript
interface WeatherData {
  city: string;
  city_korean: string;  // ✨ NEW
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
  precipitation_mm: number;   // mm (하루 전체 누적)
  weather: {
    code: number;             // WMO code (0-99)
    label: string;            // 한글 날씨
  };
  weather_detail?: {          // ✨ NEW
    period_summary: {
      dawn: string;           // 새벽 날씨
      morning: string;        // 오전 날씨
      afternoon: string;      // 오후 날씨
      evening: string;        // 저녁 날씨
    };
    rain_info: {
      hours: number;          // 비 온 시간 수
      start_hour: number;     // 시작 시간 (0-23)
      end_hour: number;       // 종료 시간 (0-23)
    } | null;
    summary: string;          // 하루 날씨 요약
  };
}
```

## 📌 주의사항

1. **시간대 (Timezone)**
   - 모든 날짜는 해당 도시의 **로컬 시간대** 기준
   - UTC가 아닌 각 도시의 현지 시간

2. **강수량**
   - `precipitation_mm`: 하루 전체 누적 강수량 (시간당 아님!)
   - 예: 15.0mm = 그 날 하루 동안 총 15mm의 비

3. **시간별 분석**
   - `weather_detail`는 24시간 데이터를 분석하여 자동 생성
   - 시간대 구분: 새벽(0-6시), 오전(6-12시), 오후(12-18시), 저녁(18-24시)

4. **윤년 처리**
   - 2016년, 2020년, 2024년: 366일 (윤년)
   - 나머지 연도: 365일

5. **파일 크기**
   - 개별 파일: 약 1.9MB (시간별 분석 포함)
   - 완료 예정 전체 크기: 약 260MB (138개 도시)
   - 현재 수집 완료: 약 50MB (25개 도시)

6. **데이터 갱신**
   - 정적 데이터 (2016-2025년 고정)
   - 실시간 날씨가 아닌 과거 관측 데이터

## 🚀 API Rate Limit 정보

Open-Meteo API는 다음과 같은 제한이 있습니다:
- **무료 플랜**: 하루 10,000 requests
- **권장 호출 간격**: 10초 이상 (시간별 데이터 포함 시)

시간별 데이터를 포함하면 한 번의 요청으로 약 87,672개의 시간 데이터를 받아오므로,
요청 간격을 충분히 두는 것이 중요합니다.

## 📖 추가 문서

- 프로젝트 상세: `../my-project.md`
- 도시 목록: `../config/cities.json`
- 날씨 코드: `../config/wmo_weather_codes.json`
- 수집 스크립트: `../scripts/`
- 재수집 스크립트: `../scripts/retry_failed_cities.sh`

## 📄 라이센스

이 데이터는 [Open-Meteo](https://open-meteo.com/)의 오픈 데이터를 기반으로 수집되었습니다.

## 🔗 관련 링크

- [Open-Meteo API Documentation](https://open-meteo.com/en/docs)
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- [WMO Weather Code](https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM)

---

**수집 일자**: 2026-02-12  
**데이터 버전**: 2.0 (Enhanced with Hourly Analysis)  
**현재 상태**: 25/138 도시 완료 (나머지 재수집 예정)
