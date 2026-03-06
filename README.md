# 그날의 날씨 ☀️

특정 날짜 또는 기간을 선택하면 과거 10년(2016-2025)간의 날씨 데이터를 분석하여 여행 정보와 날씨 인사이트를 제공하는 웹/모바일 애플리케이션입니다.

## 📋 프로젝트 개요

"그날의 날씨"는 전세계 138개 이상의 도시 시간별 날씨 데이터를 기반으로 날씨 패턴을 분석하고, 여행 적합성 판단 / 추천 활동 / 준비물 리스트 / 기후 트렌드 등 다양한 인사이트를 제공합니다.

### 주요 기능

- 📅 **날짜/기간 선택**: 단일 날짜 또는 최대 14일 기간 선택
- 🌍 **도시 선택**: 전세계 138개 이상 도시 지원
- 📱 **Instagram Reels 스타일 UI**: 세로 스크롤 스냅 슬라이드 (7개 슬라이드)
- 🎬 **Lottie 애니메이션**: 날씨 상태별 애니메이션 아이콘
- 🌡️ **기온 분석**: 평균·최고·최저 기온 및 기후 트렌드
- 💧 **강수/바람/습도 분석**: 도움말 포함 상세 데이터
- 🕐 **시간대별 타임라인**: 시간별 날씨 이모지 타임라인
- 📆 **인근 날짜 추천**: 날씨가 더 좋은 ±7일 내 날짜 추천
- ✅ **여행 판정**: 여행 적합성 등급 및 이유 설명
- 🏃 **추천 활동 / 피할 것**: 날씨 기반 맞춤 활동 추천
- 🎒 **준비물 리스트**: 상황에 맞는 바텀 시트 다이얼로그
- 🏠 **홈 화면 기획 카드**: 관리자가 편집하는 여행 추천 캐러셀 (Supabase 연동)

## 🏗️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **Supabase JS Client** (데이터 조회, Storage 이미지)
- **Lottie** (`@lottiefiles/dotlottie-react`)
- **CSS 변수 기반 디자인 시스템** (rem 단위, 타이포그래피/스페이싱 토큰)

### 데이터 (Supabase)
| 테이블 | 설명 |
|---|---|
| `cities` | 도시 메타 (ID, 한글명, 위도/경도 등) |
| `hourly_weather` | 시간별 날씨 데이터 (2016-2025) |
| `home_cards` | 홈 화면 기획 카드 (관리자 편집용) |
| `collection_log` | 데이터 수집 이력 |

- **Storage**: `cities_images` 버킷 (카드 배경 이미지)
- **데이터 출처**: [Open-Meteo Historical Weather API](https://open-meteo.com/)

### 모바일 앱 (`capacitor` 브랜치)
- **Capacitor** — 웹앱을 iOS/Android 앱으로 래핑
- App ID: `com.ddayweather.app`

## 📁 프로젝트 구조

```
d-day-weather-web/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.tsx              # 홈 화면, 검색 오버레이, 로딩
│   │   │   ├── WeatherStats.tsx      # 단일 날짜 날씨 상세 (Reels UI)
│   │   │   └── WeatherStatsRange.tsx # 기간 날씨 상세 (Reels UI)
│   │   ├── utils/
│   │   │   ├── weatherApi.ts         # Supabase 쿼리 + fetchHomeCards
│   │   │   ├── weatherRules.ts       # 날씨 규칙 엔진
│   │   │   └── storage.ts            # 조회 이력 (localStorage)
│   │   ├── lib/
│   │   │   └── supabase.ts           # Supabase 클라이언트
│   │   ├── types/
│   │   │   └── weather.ts            # TypeScript 타입 정의
│   │   └── index.css                 # 글로벌 스타일 (디자인 토큰)
│   ├── public/
│   │   └── favicon.png
│   ├── index.html
│   ├── capacitor.config.ts           # (capacitor 브랜치)
│   ├── ios/                          # (capacitor 브랜치)
│   └── android/                      # (capacitor 브랜치)
│
├── supabase/
│   └── home_cards.sql                # home_cards 테이블 생성 SQL
│
├── ARCHITECTURE.md
├── COLLECTION.md
├── DEPLOYMENT.md
└── README.md
```

## 🌿 브랜치 구조

| 브랜치 | 설명 |
|---|---|
| `main` | 웹 프로덕션 (Vercel 배포) |
| `onlyWeb` | 웹 전용 스냅샷 |
| `capacitor` | iOS/Android 앱 개발 |

## 🚀 로컬 개발 시작하기

### 환경 변수 설정

`frontend/.env` 파일:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key
```

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Capacitor 앱 빌드 (`capacitor` 브랜치)

```bash
cd frontend
npm run build
npx cap sync
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

## 📚 참고 문서

- [아키텍처 문서](./ARCHITECTURE.md)
- [날씨 규칙 스펙](./weather-rule-table.md)
- [Supabase 스키마 / 수집 가이드](./COLLECTION.md)
- [배포 가이드](./DEPLOYMENT.md)

---

**데이터 출처**: [Open-Meteo](https://open-meteo.com/)  
**데이터 기간**: 2016-01-01 ~ 2025-12-31  
**마지막 업데이트**: 2026-03-06
