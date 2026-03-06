# D-Day Weather — 아키텍처 문서

## 📋 프로젝트 개요

전세계 138개 이상 도시의 10년치(2016-2025) 시간별 날씨 데이터를 기반으로, 특정 날짜 또는 기간의 날씨 패턴을 분석하고 여행 인사이트를 제공하는 웹/모바일 애플리케이션입니다.

---

## 🏗️ 기술 스택

### Frontend
| 항목 | 기술 |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | CSS 변수 기반 디자인 시스템 (rem 단위, 타이포/스페이싱 토큰) |
| 데이터 조회 | Supabase JS Client (`@supabase/supabase-js`) |
| 애니메이션 | `@lottiefiles/dotlottie-react` |
| 조회 이력 | localStorage |

### 데이터 (Supabase)
| 항목 | 내용 |
|---|---|
| 저장소 | Supabase PostgreSQL |
| 테이블 | `cities`, `hourly_weather`, `home_cards`, `collection_log` |
| Storage | `cities_images` 버킷 (홈 카드 배경 이미지) |
| 데이터 소스 | Open-Meteo Historical Weather API |
| 기간 | 2016-01-01 ~ 2025-12-31 |
| 단위 | 시간별 (최대 24행/일/도시) |

### 모바일 (`capacitor` 브랜치)
| 항목 | 내용 |
|---|---|
| 플랫폼 | Capacitor |
| App ID | `com.ddayweather.app` |
| 지원 OS | iOS, Android |

> 별도의 백엔드 서버가 없으며, 프론트엔드에서 Supabase를 직접 조회합니다.

---

## 📁 파일 구조

```
d-day-weather-web/
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── capacitor.config.ts          # (capacitor 브랜치)
│   ├── ios/                         # (capacitor 브랜치)
│   ├── android/                     # (capacitor 브랜치)
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css                # 디자인 토큰 + 글로벌 스타일
│       ├── lib/
│       │   └── supabase.ts
│       ├── types/
│       │   └── weather.ts
│       ├── utils/
│       │   ├── weatherApi.ts        # Supabase 쿼리 + fetchHomeCards
│       │   ├── weatherRules.ts      # 날씨 규칙 엔진
│       │   └── storage.ts
│       └── components/
│           ├── Home.tsx             # 홈 화면 + 검색 오버레이
│           ├── WeatherStats.tsx     # 단일 날짜 Reels UI
│           └── WeatherStatsRange.tsx# 기간 Reels UI
│
├── supabase/
│   └── home_cards.sql               # home_cards 테이블 생성 SQL
│
└── (문서 파일들)
```

---

## 🔄 데이터 흐름

### 단일 날짜 조회

```
사용자 (도시 + 날짜 선택)
    │
    ▼
Home.tsx — loadSingle(city, month, day)
    │         └── Promise.all([fetch, 1초 최소 대기])
    ▼
weatherApi.ts / fetchWeatherStatistics()
  ├── Supabase: cities → 도시 메타(위도 등) 조회
  ├── Supabase: hourly_weather → ±7일 × 2016-2025 병렬 쿼리
  └── 집계: 날씨 빈도 / 기온 통계 / 강수 확률 / 시간별 평균 / 기후 트렌드 / 인근 날짜
    │
    ▼
weatherRules.ts / analyzeWeather()
  ├── 위도 보정 / 등급 판정 / 플래그 탐지
  ├── 여행 판정 (5단계) / 자연어 요약 / 추천 활동 / 준비물
  └── 인근 날짜 추천
    │
    ▼
WeatherStats.tsx — Reels 슬라이드 UI 렌더링
```

### 기간 조회

```
사용자 (도시 + 시작일 ~ 종료일)
    │
    ▼
Home.tsx — loadRange(city, sm, sd, em, ed)
    │
    ▼
weatherApi.ts / fetchDateRangeStatistics()
  └── 각 날짜별 fetchWeatherStatistics() 병렬 실행 → mergeWeatherStatistics()
    │
    ▼
WeatherStatsRange.tsx — 기간 집계 Reels UI
```

### 홈 기획 카드

```
Home.tsx 마운트
    │
    ▼
fetchHomeCards()
  └── Supabase: home_cards (is_active=true, sort_order 정렬)
      └── image_url → resolveImageUrl() → cities_images Storage URL 변환
    │
    ▼
home-carousel 렌더링 (카드 클릭 → loadSingle / loadRange)
```

---

## 🗄️ Supabase 스키마

### `cities`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | TEXT (PK) | 도시 ID (예: `seoul`, `da-nang`) |
| `name_en` | TEXT | 영문명 |
| `name_ko` | TEXT | 한글명 |
| `country` | TEXT | 국가 코드 |
| `lat` | DOUBLE PRECISION | 위도 |
| `lon` | DOUBLE PRECISION | 경도 |

### `hourly_weather`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `city_id` | TEXT (FK) | cities 참조 |
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

### `home_cards`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | BIGSERIAL (PK) | — |
| `title` | TEXT | 카드 제목 |
| `subtitle` | TEXT | 서브타이틀 |
| `nights_label` | TEXT | 기간 텍스트 (예: "3박 4일") |
| `date_label` | TEXT | 날짜 표시 텍스트 |
| `image_url` | TEXT | `cities_images` 버킷 파일명 또는 전체 URL |
| `city_id` | TEXT (FK) | 클릭 시 로드할 도시 |
| `card_type` | TEXT | `date` / `range` |
| `date_from` | TEXT | MM-DD 형식 |
| `date_to` | TEXT | MM-DD 형식 (range만) |
| `sort_order` | INTEGER | 표시 순서 |
| `is_active` | BOOLEAN | 노출 여부 |

- RLS: anon → SELECT (is_active=true만), authenticated → 전체 CRUD
- 생성 SQL: `supabase/home_cards.sql`

---

## 📱 UI 구성

### 홈 화면 (`Home.tsx`)

```
top-bar-wrap
  └── 상단 탑바 (Vercel 등 외부 링크)
home-screen
  └── home-inner
      ├── home-top-row (로고 + Lottie 태양)
      ├── home-headline ("Discover the Best Day to Travel")
      ├── home-chips (인기 도시 + "다른 도시로 찾기")
      └── home-carousel-wrap (기획 카드 캐러셀)
search-overlay (Portal)
loading-wrap (Portal, homeLoading 시)
```

### Reels UI (`WeatherStats.tsx` / `WeatherStatsRange.tsx`)

| 슬라이드 | 컴포넌트 | 내용 |
|---|---|---|
| 1 | `Reel1Summary` | Lottie 아이콘, 기온, 바람/습도/강수확률 + 도움말 |
| 2 | `Reel2Verdict` | 여행 판정, 추천/비추천 활동 |
| 3 | `Reel3Precip` | 예상 강수량 + 도움말 |
| 4 | `Reel4Packing` | 준비물 확인, 인근 날짜 추천 |
| 5 | `Reel5Timeline` | 시간대별 날씨 타임라인 |
| 6 | `Reel6Years` | 연도별 실제 기록 (바텀 시트) |
| 7 | `Reel7Trend` | 기후 트렌드 |

### 다이얼로그 처리

모든 다이얼로그는 `ReactDOM.createPortal`로 `document.body`에 렌더링:
- `PackingDialog` — 준비물
- `HelpDialog` — 바람/습도/강수확률/예상강수량 도움말
- 연도별 기록 바텀 시트

---

## 🧠 날씨 규칙 엔진 (`weatherRules.ts`)

### 등급 체계
| 등급 | 값 | 기준 |
|---|---|---|
| **TempGrade** | COLD / COOL / MILD / WARM | 위도 보정 평균 기온 |
| **RainGrade** | NO_RAIN / LOW_RAIN / MID_RAIN / HIGH_RAIN | 강수 확률 % |
| **SkyGrade** | CLEAR / PARTLY / CLOUDY | 맑음 확률 % |
| **Season** | SPRING / SUMMER / AUTUMN / WINTER / DRY_SEASON / WET_SEASON | 위도 + 월 |

### 여행 판정 (5단계)
TempGrade × RainGrade 조합 매트릭스:
- ⭐⭐⭐ 최고예요 / ⭐⭐ 좋아요 / ⭐ 무난해요 / ⚠️ 아쉬워요 / ❌ 힘들어요

> 자세한 판정 로직은 [weather-rule-table.md](./weather-rule-table.md) 참조

---

## 📈 쿼리 최적화

- 연도별(2016-2025) 쿼리를 **`Promise.all`로 병렬 실행**
- 대상 날짜의 **±7일 범위** 한 번에 조회 (인근 날짜 통계 동시 수집)
- Supabase 인덱스 `(city_id, timestamp)` 활용

---

**작성일**: 2026-03-06  
**버전**: 3.0
