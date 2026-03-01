# D-Day Weather Web — 아키텍처 문서

## 📋 프로젝트 개요

전세계 138개 도시의 86년치(1940-2025) 시간별 날씨 데이터를 기반으로, 특정 날짜의 날씨 패턴을 분석하고 여행 인사이트를 제공하는 웹 애플리케이션입니다.

---

## 🏗️ 기술 스택

### Frontend
| 항목 | 기술 |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | TailwindCSS + CSS 변수 (커스텀 블루 테마) |
| 데이터 조회 | Supabase JS Client (`@supabase/supabase-js`) |
| 날짜 선택 | react-datepicker |
| 조회 이력 | localStorage |

### 데이터
| 항목 | 내용 |
|---|---|
| 저장소 | Supabase PostgreSQL |
| 테이블 | `cities`, `hourly_weather`, `collection_log` |
| 데이터 소스 | Open-Meteo Historical Weather API |
| 기간 | 1940-01-01 ~ 2025-12-31 (86년) |
| 단위 | 시간별 (최대 24행/일/도시) |
| 도시 수 | 138개 |

> 별도의 백엔드 서버가 없으며, 프론트엔드에서 Supabase를 직접 조회합니다.

---

## 📁 파일 구조

```
d-day-weather-web/
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx                 # React 앱 진입점
│       ├── App.tsx                  # 루트 컴포넌트 (Home 렌더링)
│       ├── index.css                # 글로벌 스타일 (CSS 변수, 커스텀 테마)
│       │
│       ├── lib/
│       │   └── supabase.ts          # Supabase 클라이언트 (anon key)
│       │
│       ├── types/
│       │   └── weather.ts           # 모든 TypeScript 인터페이스 정의
│       │
│       ├── utils/
│       │   ├── weatherApi.ts        # Supabase 쿼리 + 데이터 집계 로직
│       │   ├── weatherRules.ts      # 날씨 규칙 엔진 (판정/추천/콘텐츠)
│       │   └── storage.ts           # 조회 이력 (localStorage)
│       │
│       └── components/
│           ├── Home.tsx             # 히어로 영역 + 전체 레이아웃
│           ├── WeatherStats.tsx     # 날씨 상세 카드 모음
│           ├── DatePickerDialog.tsx # 날짜 선택 다이얼로그 (Portal)
│           └── CitySelector.tsx    # 도시 선택 다이얼로그 (Portal)
│
├── COLLECTION.md                    # Supabase 스키마 및 데이터 수집 가이드
├── weather-rule-table.md            # 날씨 규칙 엔진 설계 스펙
├── ARCHITECTURE.md                  # 이 문서
└── README.md                        # 프로젝트 소개
```

---

## 🔄 데이터 흐름

```
사용자 (날짜 + 도시 선택)
    │
    ▼
Home.tsx
  └── loadWeatherData(city, month, day)
        │
        ▼
weatherApi.ts / fetchWeatherStatistics()
  ├── Supabase: cities 테이블에서 도시 메타(위도 등) 조회
  ├── Supabase: hourly_weather에서 ±7일 범위 × 2016-2025년 병렬 쿼리
  │     → 각 연도별 대상 날짜 ±7일의 시간별 데이터 수집
  └── 집계 계산:
        ├── 날씨 빈도 (맑음/흐림/비/눈)
        ├── 기온 통계 (최고/최저/평균 × TempStat)
        ├── 강수 확률 / 강설 확률 / 맑음 확률
        ├── 평균 풍속 / 최대 돌풍
        ├── 시간별 평균 (hourlyAverages: 0~23시)
        ├── 기후 트렌드 (2021-2025 vs 2016-2020 평균 비교)
        └── 인근 날짜 통계 (nearbyDates: ±7일 각각의 요약)
        │
        ▼
WeatherStatistics (타입) 반환
        │
        ▼
weatherRules.ts / analyzeWeather()
  ├── 위도 보정 온도 계산
  ├── 등급 판정: TempGrade / RainGrade / SkyGrade / Season
  ├── 플래그 탐지: SNOW / HIGH_DIURNAL / WINDY / TREND_UP / TREND_DOWN
  ├── 여행 판정 (Verdict): 매트릭스 기반 1-5단계
  ├── 요약 텍스트 / 베스트 시간대 텍스트 / 트렌드 텍스트 생성
  ├── 추천 활동 / 피할 것 / 준비물 목록 생성
  └── 인근 날짜 추천 (buildNearbyRecs)
        │
        ▼
WeatherAnalysis (타입) 반환
        │
        ▼
WeatherStats.tsx (카드 UI 렌더링)
```

---

## 🗄️ Supabase 스키마

### `cities` — 도시 메타

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | TEXT (PK) | 도시 ID (`seoul`, `tokyo` 등) |
| `name_en` | TEXT | 영문명 |
| `name_ko` | TEXT | 한글명 |
| `country` | TEXT | 국가 코드 |
| `lat` | DOUBLE PRECISION | 위도 |
| `lon` | DOUBLE PRECISION | 경도 |

### `hourly_weather` — 시간별 날씨 (핵심)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `city_id` | TEXT (FK) | 도시 참조 |
| `timestamp` | TIMESTAMPTZ | UTC 기준 시각 |
| `temperature` | REAL | 기온 °C |
| `apparent_temp` | REAL | 체감온도 °C |
| `humidity` | SMALLINT | 습도 % |
| `precipitation` | REAL | 강수량 mm |
| `rain` | REAL | 비 mm |
| `snowfall` | REAL | 눈 cm |
| `weather_code` | SMALLINT | WMO 코드 (0-99) |
| `cloud_cover` | SMALLINT | 구름 % |
| `wind_speed` | REAL | 풍속 km/h |
| `wind_gusts` | REAL | 돌풍 km/h |

- **UNIQUE**: `(city_id, timestamp)`
- **INDEX**: `(city_id, timestamp)`, `(timestamp)`

> 자세한 스키마 및 수집 방법은 [COLLECTION.md](./COLLECTION.md) 참조

---

## 🧠 날씨 규칙 엔진 (`weatherRules.ts`)

`weather-rule-table.md` 스펙을 기반으로 구현된 규칙 엔진입니다.

### 등급 체계

| 등급 종류 | 값 | 기준 |
|---|---|---|
| **TempGrade** | COLD / COOL / MILD / WARM | 위도 보정 평균 기온 |
| **RainGrade** | NO_RAIN / LOW_RAIN / MID_RAIN / HIGH_RAIN | 강수 확률 % |
| **SkyGrade** | CLEAR / PARTLY / CLOUDY | 맑음 확률 % |
| **Season** | SPRING / SUMMER / AUTUMN / WINTER / DRY_SEASON / WET_SEASON | 위도 + 월 |

### 특수 플래그

| 플래그 | 조건 |
|---|---|
| `SNOW` | 강설 확률 > 20% |
| `HIGH_DIURNAL` | 일교차 > 12°C |
| `WINDY` | 평균 풍속 > 20km/h |
| `TREND_UP` | 최근 5년 vs 과거 5년 기온 +0.5°C 이상 상승 |
| `TREND_DOWN` | 최근 5년 vs 과거 5년 기온 -0.5°C 이상 하락 |

### 여행 판정 (Verdict)

TempGrade × RainGrade 조합 매트릭스로 5단계 판정:
- ⭐⭐⭐ 최고예요
- ⭐⭐ 좋아요
- ⭐ 무난해요
- ⚠️ 아쉬워요
- ❌ 힘들어요

> 자세한 판정 로직은 [weather-rule-table.md](./weather-rule-table.md) 참조

---

## 🎨 UI 구성 (`WeatherStats.tsx`)

| 카드 | 내용 |
|---|---|
| **SummaryCard** | 날씨 한 줄 요약 텍스트 |
| **VerdictCard** | 여행 적합성 등급 + 설명 |
| **TempRangeCard** | 기온 범위 시각화 + 기후 트렌드 |
| **PrecipCard** | 강수/강설 확률 |
| **TimelineCard** | 시간별 날씨 이모지 타임라인 (베스트 시간대 표시) |
| **NearbyDatesCard** | ±7일 내 날씨 좋은 날 추천 |
| **ActivitiesGuide** | 추천 활동 / 피할 것 (토글) |
| **TrendCard** | 기후 변화 트렌드 |
| **YearCard** | 연도별 날씨 요약 (시간별 이모지) |
| **PackingDialog** | 준비물 바텀 시트 (Portal) |

### 다이얼로그 처리

`DatePickerDialog`와 `CitySelector`는 `ReactDOM.createPortal`을 사용하여 `document.body`에 직접 렌더링합니다. 이는 `.phone` 컨테이너의 `overflow: hidden`이 `position: fixed` 동작에 영향을 미치는 것을 방지합니다.

---

## 🔧 환경 변수

| 변수 | 설명 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_KEY` | Supabase anon (public) key |

`.env.local` 파일에 설정 (`.gitignore`에 포함됨).

---

## 📈 쿼리 최적화 전략

- 연도별(2016-2025) 쿼리를 **`Promise.all`로 병렬 실행**하여 총 대기 시간 최소화
- 대상 날짜의 **±7일 범위**를 한 번에 조회하여 인근 날짜 통계까지 한 번에 수집
- Supabase 인덱스 `(city_id, timestamp)` 활용으로 고속 조회

---

**작성일**: 2026-02-19  
**버전**: 2.0
