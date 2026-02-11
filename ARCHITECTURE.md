# D-Day Weather Web - 프로젝트 아키텍처

## 📋 프로젝트 개요

2026년의 특정 날짜를 선택하면, 지난 10년간(2016-2025) 해당 날짜의 날씨 데이터를 분석하여 보여주는 웹 애플리케이션입니다.

### 주요 기능
- 특정 날짜의 10년간 날씨 통계 (맑음/흐림/비/눈 빈도)
- 최고/최저/평균 기온, 평균 습도, 강수량 표시
- 전세계 138개 도시 지원
- 조회 이력 저장 (쿠키 기반)

## 🏗️ 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Hooks (useState, useEffect)
- **Storage**: Cookie (조회 이력 저장)
- **Date Picker**: React Date Picker (또는 Shadcn/ui Calendar)

### Backend
- **Framework**: Express.js + TypeScript
- **Runtime**: Node.js 18+
- **Data Source**: Static JSON files (`/datas`)
- **API**: RESTful API

### Future Enhancement
- Supabase DB 연동 (사용자 조회 이력 영구 저장)

## 📁 프로젝트 구조

```
d-day-weather-web/
├── frontend/                    # React + Vite Frontend
│   ├── public/                  # 정적 파일
│   ├── src/
│   │   ├── components/          # React 컴포넌트
│   │   │   ├── Home.tsx         # 홈 화면
│   │   │   ├── WeatherDetail.tsx # 날씨 상세 화면
│   │   │   ├── DatePicker.tsx   # 날짜 선택 다이얼로그
│   │   │   ├── CitySelector.tsx # 도시 선택 다이얼로그
│   │   │   └── WeatherStats.tsx # 날씨 통계 컴포넌트
│   │   ├── types/               # TypeScript 타입 정의
│   │   │   └── weather.ts
│   │   ├── utils/               # 유틸리티 함수
│   │   │   ├── weatherApi.ts    # API 호출
│   │   │   └── storage.ts       # 쿠키 관리
│   │   ├── App.tsx              # 메인 App 컴포넌트
│   │   ├── main.tsx             # 엔트리 포인트
│   │   └── index.css            # 글로벌 스타일
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                     # Express Backend
│   ├── src/
│   │   ├── routes/              # API 라우트
│   │   │   ├── weather.ts       # 날씨 데이터 조회 API
│   │   │   └── contact.ts       # 문의 API
│   │   ├── services/            # 비즈니스 로직
│   │   │   └── weatherService.ts # 날씨 데이터 처리
│   │   ├── types/               # TypeScript 타입
│   │   │   └── weather.ts
│   │   ├── utils/               # 유틸리티
│   │   │   └── dataLoader.ts    # JSON 파일 로더
│   │   └── server.ts            # Express 서버 설정
│   ├── package.json
│   └── tsconfig.json
│
├── datas/                       # 날씨 데이터 (138개 도시)
│   ├── seoul.json
│   ├── busan.json
│   └── ...
│
├── ARCHITECTURE.md              # 이 문서
└── README.md                    # 프로젝트 설명
```

## 🎨 화면 구성

### 1. 홈 화면 (`/`)
**기능:**
- 오늘 날짜 기준, 서울의 10년간 날씨 데이터 자동 표시
- "그날의 날씨" 버튼 → 날짜 선택 다이얼로그 표시
- "지역 변경" 버튼 → 도시 선택 다이얼로그 표시

**표시 데이터:**
- 선택된 날짜 (MM월 DD일)
- 10년간 날씨 빈도 (맑음 X회, 흐림 X회, 비 X회, 눈 X회)
- 최고 기온 (최고값, 최저값, 평균)
- 최저 기온 (최고값, 최저값, 평균)
- 평균 기온 (최고값, 최저값, 평균)
- 평균 습도 (최고값, 최저값, 평균)
- 강수량 (최고값, 평균)

### 2. 날씨 상세 화면 (미래 확장)
**기능:**
- 10년간의 연도별 상세 데이터 표시 (테이블 또는 차트)
- 뒤로가기 버튼

## 🔌 API 설계

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. 특정 날짜의 10년간 날씨 통계
```
GET /weather/statistics
```

**Query Parameters:**
- `city` (required): 도시 ID (예: `seoul`, `busan`)
- `month` (required): 월 (1-12)
- `day` (required): 일 (1-31)

**Response:**
```json
{
  "city": "Seoul",
  "country": "KR",
  "date": "02-11",
  "statistics": {
    "weatherFrequency": {
      "clear": 3,      // 맑음 (code: 0, 1)
      "cloudy": 4,     // 흐림 (code: 2, 3)
      "rain": 2,       // 비 (code: 51-65, 80-82)
      "snow": 1        // 눈 (code: 71-77, 85-86)
    },
    "temperature": {
      "max": { "highest": 15.5, "lowest": -2.3, "average": 7.8 },
      "min": { "highest": 3.2, "lowest": -8.1, "average": -1.5 },
      "avg": { "highest": 9.1, "lowest": -5.2, "average": 3.2 }
    },
    "humidity": {
      "highest": 85,
      "lowest": 45,
      "average": 65
    },
    "precipitation": {
      "highest": 12.5,
      "average": 1.2
    }
  },
  "yearlyData": [  // 연도별 상세 (미래 확장용)
    {
      "year": 2016,
      "date": "2016-02-11",
      "temp": { "max": 5.2, "min": -3.1, "avg": 1.0 },
      "humidity": 70,
      "precipitation_mm": 0.0,
      "weather": { "code": 3, "label": "흐림" }
    },
    // ... 2017-2025
  ]
}
```

#### 2. 도시 목록 조회
```
GET /weather/cities
```

**Response:**
```json
{
  "cities": [
    { "id": "seoul", "name": "Seoul", "nameKo": "서울", "country": "KR" },
    { "id": "busan", "name": "Busan", "nameKo": "부산", "country": "KR" },
    // ...
  ]
}
```

#### 3. 문의 접수 (기본 구현)
```
POST /contact
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "message": "문의 내용"
}
```

**Response:**
```json
{
  "success": true,
  "message": "문의가 접수되었습니다."
}
```

## 📊 데이터 모델

### TypeScript 타입 정의

```typescript
// 날씨 데이터 파일 구조
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
    max: number;
    min: number;
    avg: number;
  };
  humidity: number;
  precipitation_mm: number;
  weather: {
    code: number;
    label: string;
  };
}

// API 응답 타입
interface WeatherStatistics {
  city: string;
  country: string;
  date: string;  // MM-DD
  statistics: {
    weatherFrequency: {
      clear: number;
      cloudy: number;
      rain: number;
      snow: number;
    };
    temperature: {
      max: TempStat;
      min: TempStat;
      avg: TempStat;
    };
    humidity: {
      highest: number;
      lowest: number;
      average: number;
    };
    precipitation: {
      highest: number;
      average: number;
    };
  };
  yearlyData: DailyWeather[];
}

interface TempStat {
  highest: number;
  lowest: number;
  average: number;
}
```

## 🔄 데이터 흐름

### 1. 초기 로딩
```
User → Frontend → Cookie 확인
                 → 최근 조회 이력 있으면 해당 데이터 로드
                 → 없으면 오늘 날짜 + 서울 데이터 로드
      ↓
Frontend → Backend API (/weather/statistics?city=seoul&month=2&day=11)
      ↓
Backend → JSON 파일 읽기 (datas/seoul.json)
        → 해당 날짜(02-11)의 10년간 데이터 필터링
        → 통계 계산
        → 응답 반환
      ↓
Frontend → 데이터 표시
        → 쿠키에 조회 이력 저장
```

### 2. 날짜/도시 변경
```
User → 날짜 선택 다이얼로그 또는 도시 선택 다이얼로그
     ↓
Frontend → API 호출 (새로운 city, month, day)
         → 쿠키 업데이트
     ↓
Backend → 통계 계산 및 응답
     ↓
Frontend → 화면 업데이트
```

## 🍪 조회 이력 관리

### Cookie 구조
```typescript
interface SearchHistory {
  city: string;        // 마지막 조회 도시
  date: string;        // 마지막 조회 날짜 (MM-DD)
  timestamp: number;   // 조회 시간
}
```

### Cookie 정책
- **이름**: `weather-history`
- **유효기간**: 30일
- **저장 내용**: 마지막 조회 1건만 저장
- **미래 확장**: Supabase DB로 전체 조회 이력 저장

## 🎨 UI/UX 고려사항

### 디자인 원칙
- **심플**: 데이터 중심의 깔끔한 UI
- **직관적**: 버튼과 액션이 명확
- **반응형**: 모바일, 태블릿, 데스크톱 대응

### 주요 컴포넌트
1. **WeatherCard**: 날씨 통계를 시각적으로 표현
2. **DatePickerDialog**: 캘린더 기반 날짜 선택
3. **CitySelectorDialog**: 도시 목록 (검색 기능 포함)
4. **StatRow**: 통계 데이터 행 (레이블 + 값)

### 색상 테마 (TailwindCSS)
- **Primary**: blue-600 (버튼, 액센트)
- **Background**: gray-50 (배경)
- **Card**: white (카드 배경)
- **Text**: gray-900 (주요 텍스트), gray-600 (보조 텍스트)

### 날씨 아이콘
- ☀️ 맑음 (clear)
- ☁️ 흐림 (cloudy)
- 🌧️ 비 (rain)
- ❄️ 눈 (snow)

## 🚀 실행 방법

### 개발 환경 실행

**1. Backend 실행**
```bash
cd backend
npm install
npm run dev  # http://localhost:3000
```

**2. Frontend 실행**
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### 프로덕션 빌드

**Frontend**
```bash
cd frontend
npm run build
# 결과물: dist/
```

**Backend**
```bash
cd backend
npm run build
# 결과물: dist/
```

## 📝 개발 순서

### Phase 1: 기본 구조 (현재)
- [x] 프로젝트 구조 설계
- [ ] Frontend 초기 설정 (React + Vite + TailwindCSS)
- [ ] Backend 초기 설정 (Express + TypeScript)
- [ ] 타입 정의 작성
- [ ] 기본 API 구현 (/weather/statistics)
- [ ] 홈 화면 구현

### Phase 2: 핵심 기능
- [ ] 날짜 선택 다이얼로그
- [ ] 도시 선택 다이얼로그
- [ ] 날씨 통계 계산 로직
- [ ] 쿠키 기반 조회 이력 저장
- [ ] 반응형 디자인

### Phase 3: 개선 및 최적화
- [ ] 로딩 상태 표시
- [ ] 에러 핸들링
- [ ] 도시 검색 기능
- [ ] 애니메이션 추가
- [ ] 성능 최적화 (메모이제이션)

### Phase 4: 미래 확장
- [ ] 연도별 상세 화면
- [ ] 차트 시각화 (Recharts 또는 Chart.js)
- [ ] Supabase 연동 (조회 이력 DB 저장)
- [ ] 다국어 지원 (i18n)

## 🔧 개발 환경 요구사항

- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **TypeScript**: 5.x
- **브라우저**: Chrome, Safari, Firefox 최신 버전

## 📚 참고 자료

- [날씨 데이터 상세](./datas/README.md)
- [Open-Meteo API](https://open-meteo.com/)
- [WMO Weather Codes](https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM)
- [React 공식 문서](https://react.dev/)
- [Vite 공식 문서](https://vitejs.dev/)
- [TailwindCSS 공식 문서](https://tailwindcss.com/)
- [Express 공식 문서](https://expressjs.com/)

---

**작성일**: 2026-02-11  
**버전**: 1.0
