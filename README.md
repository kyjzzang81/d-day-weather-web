# 그날의 날씨 🌤️

특정 날짜를 선택하면 지난 86년간(1940-2025) 해당 날짜의 날씨 데이터를 분석하여 여행 정보와 날씨 인사이트를 제공하는 웹 애플리케이션입니다.

## 📋 프로젝트 개요

"그날의 날씨"는 전세계 138개 도시의 시간별 날씨 데이터를 기반으로 날씨 패턴을 분석하고, 여행 적합성 판단 / 추천 활동 / 준비물 리스트 / 기후 트렌드 등 다양한 인사이트를 제공합니다.

### 주요 기능

- 📅 **날짜 선택**: 캘린더에서 원하는 날짜 선택
- 🌍 **도시 선택**: 전세계 138개 도시 지원 (서울, 부산, 도쿄, 뉴욕 등)
- 🌡️ **기온 분석**: 평균·최고·최저 기온 및 기후 트렌드 (최근 5년 vs 과거 5년)
- 💧 **강수 분석**: 강수 확률, 강설 확률, 맑음 확률
- 🕐 **시간대별 타임라인**: 시간별 날씨 이모지 타임라인 (베스트 시간대 표시)
- 📆 **인근 날짜 추천**: 날씨가 더 좋은 ±7일 내 날짜 추천
- ✅ **여행 판정**: 여행 적합성 등급 및 이유 설명
- 🏃 **추천 활동 / 피할 것**: 날씨 기반 맞춤 활동 추천
- 🎒 **준비물 리스트**: 상황에 맞는 챙겨야 할 물건 목록
- 📈 **기후 트렌드**: 최근 5년 기온 변화 추이

## 🏗️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **TailwindCSS** (스타일링)
- **React DatePicker** (날짜 선택)
- **Supabase JS Client** (데이터 조회)

### 데이터
- **저장소**: [Supabase](https://supabase.com/) PostgreSQL (`hourly_weather`, `cities` 테이블)
- **출처**: [Open-Meteo Historical Weather API](https://open-meteo.com/)
- **기간**: 1940-01-01 ~ 2025-12-31 (86년)
- **도시 수**: 138개
- **단위**: 시간별 (1시간 단위)

> ⚠️ 별도의 백엔드 서버 없이 프론트엔드에서 Supabase를 직접 조회합니다.

## 📁 프로젝트 구조

```
d-day-weather-web/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.tsx         # 히어로 영역, 검색 오버레이, 메인 레이아웃
│   │   │   └── WeatherStats.tsx # 날씨 상세 정보 (카드 모음)
│   │   ├── types/
│   │   │   └── weather.ts       # TypeScript 타입 정의
│   │   ├── utils/
│   │   │   ├── weatherApi.ts    # Supabase 쿼리 및 데이터 집계
│   │   │   ├── weatherRules.ts  # 날씨 규칙 엔진 (판정/추천/콘텐츠 생성)
│   │   │   └── storage.ts       # 조회 이력 (localStorage)
│   │   ├── lib/
│   │   │   └── supabase.ts      # Supabase 클라이언트 초기화
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css            # 글로벌 스타일 (CSS 변수 + 커스텀 테마)
│   ├── index.html
│   └── package.json
│
├── COLLECTION.md                # Supabase 스키마 및 데이터 수집 가이드
├── weather-rule-table.md        # 날씨 규칙 엔진 설계 스펙
├── ARCHITECTURE.md              # 아키텍처 상세 문서
└── README.md                    # 이 문서
```

## 🚀 로컬 개발 시작하기

### 사전 요구사항

- **Node.js** 18.x 이상
- **npm** 9.x 이상
- **Supabase 프로젝트** (데이터베이스 접속 필요)

### 1. 환경 변수 설정

`frontend/.env.local` 파일 생성:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key
```

### 2. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 🎨 사용 방법

1. **홈 화면**: 기본값으로 오늘 날짜 기준 서울의 날씨 분석이 표시됩니다.
2. **날짜 변경**: 상단 📅 버튼을 클릭하여 날짜를 선택합니다.
3. **지역 변경**: 상단 🌍 버튼을 클릭하여 도시를 선택합니다.
4. **상세 분석**: 스크롤하여 기온 그래프, 시간대별 타임라인, 추천 활동 등을 확인합니다.
5. **준비물 확인**: 하단 고정 버튼 "🎒 준비물 확인하기"를 누르면 짐 목록이 표시됩니다.

## 🌐 지원 도시 (138개)

| 지역 | 대표 도시 |
|---|---|
| 한국 (30개) | 서울, 부산, 인천, 대구, 제주 등 |
| 일본 (22개) | 도쿄, 오사카, 교토, 삿포로 등 |
| 중국 (22개) | 베이징, 상하이, 홍콩, 광저우 등 |
| 동남아시아 (39개) | 방콕, 싱가포르, 발리, 푸켓, 하노이 등 |
| 미국·유럽 (25개) | 뉴욕, 파리, 런던, 로마 등 |

## 🛠️ 개발 스크립트

```bash
cd frontend
npm run dev      # 개발 서버 실행 (http://localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # 린트 검사
```

## 📚 참고 문서

- [아키텍처 문서](./ARCHITECTURE.md) — 데이터 흐름 및 컴포넌트 구조
- [날씨 규칙 스펙](./weather-rule-table.md) — 판정·추천 로직 기준표
- [Supabase 스키마 / 수집 가이드](./COLLECTION.md) — DB 스키마 및 데이터 수집 방법
- [Open-Meteo API](https://open-meteo.com/)

## 📄 라이센스

MIT

---

**데이터 출처**: [Open-Meteo](https://open-meteo.com/)  
**데이터 기간**: 1940-01-01 ~ 2025-12-31  
**마지막 수집**: 2026-02-19
