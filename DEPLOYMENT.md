# 배포 가이드 🚀

이 문서는 "그날의 날씨" 웹 애플리케이션을 온라인에 배포하는 다양한 방법을 설명합니다.

## 📋 배포 방법 비교

| 방법 | 난이도 | 비용 | 장점 | 단점 |
|------|--------|------|------|------|
| **Vercel (권장)** | ⭐ 쉬움 | 무료 | 가장 빠르고 쉬움, Git 연동, 자동 배포 | 백엔드는 Serverless로 변환 필요 |
| **Netlify + Render** | ⭐⭐ 보통 | 무료 | 프론트 배포 쉬움, 백엔드 별도 관리 | 두 곳에 배포 필요 |
| **Railway** | ⭐⭐ 보통 | $5/월~ | 풀스택 한 곳에 배포, 설정 간단 | 무료 티어 제한적 |
| **Render** | ⭐⭐ 보통 | 무료/$7/월~ | 풀스택 지원, 무료 티어 있음 | 무료는 느림 (cold start) |
| **AWS/GCP** | ⭐⭐⭐⭐ 어려움 | 종량제 | 확장성, 커스터마이징 | 설정 복잡, 비용 예측 어려움 |

---

## 🎯 추천 방법 1: Vercel (가장 쉽고 빠름) ⭐

Vercel은 Vite/React 프로젝트를 위한 최고의 배포 플랫폼입니다. 프론트엔드와 백엔드 API를 함께 배포할 수 있습니다.

### 📝 준비 작업

#### 1. 백엔드를 Vercel Serverless Functions로 변환

백엔드를 `/api` 디렉토리로 이동하고 Vercel Serverless Functions 형식으로 변환합니다.

```bash
# 프로젝트 루트에 api 폴더 생성
mkdir -p api
```

**api/weather/statistics.ts** (새로 생성):
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWeatherStatistics } from '../../backend/src/services/weatherService';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { city, month, day } = req.query;
    
    if (!city || !month || !day) {
      return res.status(400).json({
        error: 'Missing required parameters: city, month, day',
      });
    }
    
    const monthNum = parseInt(month as string, 10);
    const dayNum = parseInt(day as string, 10);
    
    if (isNaN(monthNum) || isNaN(dayNum)) {
      return res.status(400).json({
        error: 'Invalid month or day format',
      });
    }
    
    const statistics = await getWeatherStatistics(
      city as string,
      monthNum,
      dayNum
    );
    
    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

**api/weather/cities.ts** (새로 생성):
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCities } from '../../backend/src/services/weatherService';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cities = await getCities();
    res.status(200).json({ cities });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

**api/contact.ts** (새로 생성):
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, message } = req.body;
    
    if (!email || !message) {
      return res.status(400).json({
        error: 'Missing required fields: email, message',
      });
    }
    
    console.log('Contact received:', { email, message });
    
    res.status(200).json({
      success: true,
      message: '문의가 접수되었습니다.',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### 2. vercel.json 설정 파일 생성

**프로젝트 루트에 `vercel.json` 생성**:
```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/api/weather/statistics",
      "destination": "/api/weather/statistics"
    },
    {
      "source": "/api/weather/cities",
      "destination": "/api/weather/cities"
    },
    {
      "source": "/api/contact",
      "destination": "/api/contact"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

### 🚀 Vercel 배포 단계

#### 방법 A: Vercel CLI 사용 (권장)

1. **Vercel CLI 설치**
```bash
npm install -g vercel
```

2. **로그인**
```bash
vercel login
```

3. **배포**
```bash
# 프로젝트 루트에서
vercel

# 프로덕션 배포
vercel --prod
```

#### 방법 B: GitHub 연동 (더 쉬움)

1. **GitHub에 저장소 생성 및 푸시**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/d-day-weather-web.git
git push -u origin main
```

2. **Vercel 웹사이트에서 배포**
   - https://vercel.com 접속
   - "Add New Project" 클릭
   - GitHub 저장소 연결
   - "Import" 클릭
   - 자동으로 배포 시작!

3. **배포 완료**
   - 배포 완료되면 자동으로 URL 생성 (예: `https://your-project.vercel.app`)
   - 이후 Git push할 때마다 자동으로 재배포됨

---

## 🎯 추천 방법 2: Netlify (프론트) + Render (백엔드)

프론트엔드와 백엔드를 분리해서 배포하는 방법입니다.

### 📱 Frontend - Netlify 배포

1. **netlify.toml 생성** (프로젝트 루트):
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://YOUR_BACKEND_URL/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **배포**
   - https://netlify.com 접속
   - "Add new site" → "Import from Git"
   - GitHub 저장소 연결
   - Build settings는 자동으로 감지됨
   - "Deploy" 클릭

### ⚙️ Backend - Render 배포

1. **render.yaml 생성** (프로젝트 루트):
```yaml
services:
  - type: web
    name: d-day-weather-backend
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

2. **배포**
   - https://render.com 접속
   - "New" → "Web Service"
   - GitHub 저장소 연결
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - "Create Web Service" 클릭

3. **Netlify에서 백엔드 URL 설정**
   - Render에서 생성된 URL 복사 (예: `https://your-backend.onrender.com`)
   - Netlify의 `netlify.toml`에서 `YOUR_BACKEND_URL` 수정
   - 재배포

---

## 🎯 추천 방법 3: Railway (풀스택 한 번에)

Railway는 프론트엔드와 백엔드를 함께 쉽게 배포할 수 있습니다.

### 🚂 Railway 배포

1. **railway.json 생성** (프로젝트 루트):
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:all",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **package.json에 스크립트 추가** (프로젝트 루트):
```json
{
  "name": "d-day-weather-web",
  "scripts": {
    "install:all": "cd backend && npm install && cd ../frontend && npm install",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "build:all": "npm run install:all && npm run build:backend && npm run build:frontend",
    "start:all": "cd backend && npm start"
  }
}
```

3. **frontend 빌드를 backend에서 서빙하도록 설정**

**backend/src/server.ts 수정**:
```typescript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... 기존 코드 ...

// Production: 프론트엔드 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// ... 기존 코드 ...
```

4. **배포**
   - https://railway.app 접속
   - "New Project" → "Deploy from GitHub repo"
   - 저장소 선택
   - 자동으로 빌드 및 배포

---

## 🎯 추천 방법 4: Render (무료 티어 있음)

### 🎨 Render 풀스택 배포

1. **render.yaml 생성** (프로젝트 루트):
```yaml
services:
  # 백엔드 서비스
  - type: web
    name: d-day-weather-api
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
    
  # 프론트엔드 정적 사이트
  - type: web
    name: d-day-weather-web
    env: static
    region: oregon
    plan: free
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    routes:
      - type: rewrite
        source: /api/*
        destination: https://d-day-weather-api.onrender.com/api/*
```

2. **배포**
   - https://render.com 접속
   - "New" → "Blueprint"
   - GitHub 저장소 연결
   - `render.yaml` 자동 감지
   - "Apply" 클릭

---

## 🌐 도메인 연결 (선택사항)

### 커스텀 도메인 설정

배포 플랫폼에서 제공하는 무료 도메인 대신 본인 도메인을 사용할 수 있습니다.

#### Vercel
1. Vercel 대시보드 → Settings → Domains
2. 도메인 입력 (예: `weather.yourdomain.com`)
3. DNS 레코드 추가 (Vercel이 안내)

#### Netlify
1. Netlify 대시보드 → Domain settings
2. "Add custom domain"
3. DNS 설정 (Netlify가 안내)

#### Render/Railway
1. 대시보드에서 "Custom Domain" 설정
2. DNS CNAME 레코드 추가

---

## 📊 배포 후 확인 사항

### ✅ 체크리스트

- [ ] 프론트엔드가 정상적으로 로드되는가?
- [ ] API 엔드포인트가 작동하는가?
  - [ ] `/api/weather/statistics?city=seoul&month=2&day=11`
  - [ ] `/api/weather/cities`
- [ ] 날씨 데이터가 정상적으로 표시되는가?
- [ ] 날짜 선택이 작동하는가?
- [ ] 도시 선택이 작동하는가?
- [ ] 쿠키가 정상적으로 저장되는가?
- [ ] 모바일에서도 잘 작동하는가?

### 🐛 트러블슈팅

#### 1. API 요청 실패 (CORS 에러)
백엔드에 CORS 설정이 제대로 되어있는지 확인:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

#### 2. 빌드 실패
- `package.json`의 dependencies와 devDependencies 확인
- Node.js 버전 확인 (18.x 이상)
- 빌드 로그 확인

#### 3. 정적 파일 404 에러
- 빌드 output 디렉토리 확인 (`frontend/dist`)
- Routing 설정 확인 (SPA fallback)

---

## 💰 비용 비교

### 무료 티어

| 플랫폼 | 무료 제공 | 제한사항 |
|--------|----------|----------|
| **Vercel** | ✅ 무제한 | Bandwidth: 100GB/월 |
| **Netlify** | ✅ 무제한 | Bandwidth: 100GB/월 |
| **Render** | ✅ 제한적 | 750시간/월, Cold start 있음 |
| **Railway** | ❌ ($5/월~) | 무료 크레딧 $5 |

### 권장 사항
- **개인 프로젝트/포트폴리오**: Vercel 또는 Netlify + Render (무료)
- **실제 서비스**: Vercel Pro ($20/월) 또는 Railway ($5/월~)

---

## 🎉 완료!

배포가 완료되면:
1. 생성된 URL 저장
2. README.md에 라이브 데모 링크 추가
3. 소셜 미디어/포트폴리오에 공유

**예시 URL**:
- Vercel: `https://d-day-weather.vercel.app`
- Netlify: `https://d-day-weather.netlify.app`
- Render: `https://d-day-weather.onrender.com`

---

## 📞 추가 도움

각 플랫폼의 공식 문서:
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app/)

Happy Deploying! 🚀
