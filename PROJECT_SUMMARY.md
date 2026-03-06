# 프로젝트 현황 요약

## 🎯 현재 구현 상태

**상태**: ✅ 운영 중 (Vercel 배포)  
**마지막 업데이트**: 2026-03-06

---

## 📦 파일 목록

### 📄 문서
- ✅ `README.md` — 프로젝트 소개 및 실행 가이드
- ✅ `ARCHITECTURE.md` — 아키텍처 상세 (데이터 흐름, 컴포넌트 구조)
- ✅ `COLLECTION.md` — Supabase 스키마 및 데이터 수집 가이드
- ✅ `weather-rule-table.md` — 날씨 규칙 엔진 설계 스펙
- ✅ `DEPLOYMENT.md` — 배포 가이드 (Vercel)
- ✅ `QUICK_DEPLOY.md` — 5분 배포 가이드
- ✅ `supabase/home_cards.sql` — home_cards 테이블 생성 SQL

### 🎨 Frontend (`frontend/src/`)

#### 진입점
- ✅ `main.tsx` — React 앱 진입점
- ✅ `App.tsx` — 루트 컴포넌트
- ✅ `index.css` — 글로벌 스타일 (CSS 변수, rem 디자인 토큰)

#### 컴포넌트
- ✅ `components/Home.tsx` — 홈 화면 (기획 카드 캐러셀, 검색 오버레이, 로딩 화면)
- ✅ `components/WeatherStats.tsx` — 단일 날짜 날씨 상세 (Reels 슬라이드 7종)
- ✅ `components/WeatherStatsRange.tsx` — 기간 날씨 상세 (Reels 슬라이드 7종)

#### 유틸리티
- ✅ `utils/weatherApi.ts` — Supabase 쿼리 + 데이터 집계 + fetchHomeCards
- ✅ `utils/weatherRules.ts` — 날씨 규칙 엔진 (판정·추천·콘텐츠)
- ✅ `utils/storage.ts` — 조회 이력 (localStorage)
- ✅ `lib/supabase.ts` — Supabase 클라이언트 초기화

#### 타입
- ✅ `types/weather.ts` — 모든 TypeScript 타입 정의

#### 에셋
- ✅ `public/favicon.png` — 앱 파비콘 (태양 아이콘)
- ✅ `public/*.lottie` — 날씨별 Lottie 애니메이션 파일

---

## ✅ 구현된 기능

### 홈 화면
- Lottie 태양 애니메이션 + "Discover the Best Day to Travel" 헤드라인
- 인기 도시 칩 (7개) + "다른 도시로 찾기" 버튼
- **기획 카드 캐러셀**: Supabase `home_cards` 테이블 연동, `cities_images` Storage 이미지
- 로딩 화면: Supabase Storage 로고 PNG + pulse 애니메이션 + 최소 1초 유지
- 검색 오버레이: 날짜/기간 토글, 도시 검색

### 날씨 데이터 조회
- 단일 날짜: `fetchWeatherStatistics()` — ±7일 범위 × 2016-2025 병렬 쿼리
- 날짜 범위: `fetchDateRangeStatistics()` — 최대 14일 구간 집계
- 홈 기획 카드: `fetchHomeCards()` — is_active 필터, sort_order 정렬

### Reels UI (Instagram 스타일 세로 스크롤)
| 슬라이드 | 내용 |
|---|---|
| Slide 1 | 날씨 요약 (Lottie 아이콘, 기온, 바람/습도/강수확률 + 도움말) |
| Slide 2 | 여행 판정 + 추천/비추천 활동 |
| Slide 3 | 예상 강수량 상세 |
| Slide 4 | 준비물 확인 + 인근 날짜 추천 |
| Slide 5 | 시간대별 날씨 타임라인 |
| Slide 6 | 연도별 실제 기록 |
| Slide 7 | 기후 트렌드 |

### 다이얼로그
- `PackingDialog` — 준비물 바텀 시트 (Portal)
- `HelpDialog` — 바람/습도/강수확률/예상강수량 도움말 (Portal)
- 연도별 실제 기록 — 바텀 시트 (Portal)

### 날씨 규칙 엔진 (`weatherRules.ts`)
- 위도 기반 온도 보정
- 등급 판정: TempGrade / RainGrade / SkyGrade / Season
- 특수 플래그: SNOW / HIGH_DIURNAL / WINDY / TREND_UP / TREND_DOWN
- 여행 판정 매트릭스 (5단계)
- 자연어 요약 / 베스트 시간대 / 추천 활동 / 준비물

---

## 🌿 브랜치 구조

| 브랜치 | 설명 |
|---|---|
| `main` | 웹 프로덕션 |
| `onlyWeb` | 웹 전용 스냅샷 |
| `capacitor` | iOS/Android 앱 개발 (Capacitor) |

---

## 🔧 환경 변수

| 변수 | 설명 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_KEY` | Supabase anon (public) key |

---

## 📊 데이터 현황

| 항목 | 내용 |
|---|---|
| 저장소 | Supabase PostgreSQL |
| 수집 기간 | 2016-01-01 ~ 2025-12-31 |
| 도시 수 | 138개 이상 |
| 데이터 단위 | 시간별 |
| Storage 버킷 | `cities_images` (카드 배경 이미지) |

---

## 🚀 배포

- **플랫폼**: Vercel (`main` 브랜치 자동 배포)
- **빌드 명령**: `cd frontend && npm install && npm run build`
- **환경 변수**: Vercel 대시보드에서 설정
- 자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md) 참조
