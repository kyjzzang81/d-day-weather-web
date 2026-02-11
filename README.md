# 그날의 날씨 🌤️

특정 날짜를 선택하면 지난 10년간(2016-2025) 해당 날짜의 날씨 데이터를 분석하여 보여주는 웹 애플리케이션입니다.

## 📋 프로젝트 개요

"그날의 날씨"는 전세계 138개 도시의 10년간 날씨 데이터를 기반으로, 특정 날짜(MM-DD)의 날씨 패턴을 분석하여 보여줍니다.

### 주요 기능

- 📅 **날짜 선택**: 캘린더에서 원하는 날짜 선택
- 🌍 **도시 선택**: 전세계 138개 도시 지원 (서울, 부산, 도쿄, 뉴욕 등)
- 📊 **날씨 통계**: 10년간 맑음/흐림/비/눈 빈도 표시
- 🌡️ **기온 분석**: 최고/최저/평균 기온의 최고값, 최저값, 평균 표시
- 💧 **습도 & 강수량**: 평균 습도 및 강수량 통계
- 🍪 **조회 이력**: 마지막 조회 이력을 쿠키에 저장

## 🏗️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **TailwindCSS** (스타일링)
- **React DatePicker** (날짜 선택)
- **js-cookie** (쿠키 관리)

### Backend
- **Express.js** + **TypeScript**
- **Node.js 18+**
- JSON 기반 데이터 (138개 도시, 10년치)

### 데이터
- **출처**: [Open-Meteo Historical Weather API](https://open-meteo.com/)
- **기간**: 2016-01-01 ~ 2025-12-31 (10년, 3,653일)
- **도시 수**: 138개
- **총 데이터량**: 504,114일 분량

## 📁 프로젝트 구조

```
d-day-weather-web/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── types/         # TypeScript 타입
│   │   ├── utils/         # 유틸리티 함수
│   │   └── ...
│   └── package.json
│
├── backend/               # Express 백엔드
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직
│   │   ├── types/         # TypeScript 타입
│   │   └── ...
│   └── package.json
│
├── datas/                 # 날씨 데이터 (138개 도시)
│   ├── seoul.json
│   ├── busan.json
│   └── ...
│
├── ARCHITECTURE.md        # 아키텍처 문서
└── README.md             # 이 문서
```

## 🌐 온라인 배포

프로젝트를 온라인에 배포하려면:

👉 **[빠른 배포 가이드](./QUICK_DEPLOY.md)** - 5분 안에 Vercel로 배포하기  
📚 **[상세 배포 가이드](./DEPLOYMENT.md)** - 모든 배포 옵션 (Vercel, Netlify, Render 등)

**가장 쉬운 방법**: GitHub에 푸시 → Vercel 연결 → 자동 배포! ✨

---

## 🚀 로컬 개발 시작하기

### 사전 요구사항

- **Node.js** 18.x 이상
- **npm** 9.x 이상

### 설치 및 실행

#### 1. 백엔드 실행

```bash
cd backend
npm install
npm run dev
```

백엔드 서버가 `http://localhost:3000`에서 실행됩니다.

#### 2. 프론트엔드 실행 (새 터미널)

```bash
cd frontend
npm install
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

#### 3. 브라우저에서 확인

브라우저에서 `http://localhost:5173`을 열면 앱을 사용할 수 있습니다.

## 🎨 사용 방법

1. **홈 화면**: 오늘 날짜 기준 서울의 10년간 날씨 데이터가 표시됩니다.
2. **날짜 변경**: "📅 날짜 변경" 버튼을 클릭하여 원하는 날짜를 선택합니다.
3. **지역 변경**: "🌍 지역 변경" 버튼을 클릭하여 다른 도시를 선택합니다.
4. **통계 확인**: 선택한 날짜의 10년간 날씨 통계를 확인합니다.

## 🌐 API 엔드포인트

### 1. 날씨 통계 조회

```http
GET /api/weather/statistics?city=seoul&month=2&day=11
```

**응답 예시:**
```json
{
  "city": "Seoul",
  "country": "KR",
  "date": "02-11",
  "statistics": {
    "weatherFrequency": {
      "clear": 3,
      "cloudy": 4,
      "rain": 2,
      "snow": 1
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
  "yearlyData": [...]
}
```

### 2. 도시 목록 조회

```http
GET /api/weather/cities
```

### 3. 문의 접수

```http
POST /api/contact
Content-Type: application/json

{
  "email": "user@example.com",
  "message": "문의 내용"
}
```

## 📊 지원 도시

### 한국 (30개)
서울, 부산, 인천, 대구, 대전, 광주, 울산, 세종, 수원, 고양, 용인, 창원, 성남, 청주, 전주, 포항, 진주, 여수, 순천, 제주, 서귀포, 춘천, 강릉, 속초, 원주 등

### 일본 (22개)
도쿄, 오사카, 교토, 후쿠오카, 삿포로, 히로시마, 나고야, 고베 등

### 중국 (22개)
베이징, 상하이, 홍콩, 광저우, 선전, 청두, 항저우, 시안 등

### 동남아시아 (39개)
방콕, 싱가포르, 쿠알라룸푸르, 하노이, 호치민, 발리, 푸켓, 세부, 마닐라 등

### 미국·유럽 (25개)
뉴욕, 로스앤젤레스, 샌프란시스코, 파리, 런던, 로마, 바르셀로나 등

**전체 목록**: `datas/README.md` 참조

## 🛠️ 개발 스크립트

### Frontend

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # 린트 검사
```

### Backend

```bash
npm run dev      # 개발 서버 실행 (hot reload)
npm run build    # TypeScript 컴파일
npm start        # 프로덕션 서버 실행
npm run lint     # 린트 검사
```

## 📝 향후 계획

- [ ] 연도별 상세 화면
- [ ] 차트 시각화 (Recharts)
- [ ] Supabase 연동 (조회 이력 DB 저장)
- [ ] 다국어 지원 (i18n)
- [ ] PWA 지원 (오프라인 사용)
- [ ] 공유 기능 (SNS 공유)

## 📚 참고 문서

- [아키텍처 문서](./ARCHITECTURE.md)
- [날씨 데이터 상세](./datas/README.md)
- [Open-Meteo API](https://open-meteo.com/)

## 📄 라이센스

MIT

## 👨‍💻 개발자

Developed with ❤️ by Yongjin

---

**데이터 출처**: [Open-Meteo](https://open-meteo.com/)  
**수집 일자**: 2026-02-02  
**데이터 기간**: 2016-01-01 ~ 2025-12-31
