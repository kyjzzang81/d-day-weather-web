# 🚀 빠른 배포 가이드

## ✨ 가장 쉬운 방법: Vercel로 5분 안에 배포하기

### 준비 완료! ✅

다음 파일들이 자동으로 생성되었습니다:
- ✅ `vercel.json` - Vercel 설정
- ✅ `api/` 폴더 - Serverless API Functions
- ✅ `package.json` - 루트 의존성

### 📋 배포 단계

#### 방법 1: GitHub 연동 (가장 쉬움, 권장) ⭐

1. **GitHub에 저장소 생성**
   - https://github.com/new 접속
   - 저장소 이름: `d-day-weather-web` (또는 원하는 이름)
   - Public 또는 Private 선택
   - "Create repository" 클릭

2. **코드 푸시**
   ```bash
   # Git 초기화 (아직 안했다면)
   git init
   
   # 모든 파일 추가
   git add .
   
   # 커밋
   git commit -m "Initial commit - D-Day Weather Web"
   
   # GitHub 저장소 연결 (YOUR_USERNAME을 본인 계정으로 변경)
   git remote add origin https://github.com/YOUR_USERNAME/d-day-weather-web.git
   
   # 푸시
   git branch -M main
   git push -u origin main
   ```

3. **Vercel에서 배포**
   - https://vercel.com 접속
   - "Sign up" 또는 GitHub로 로그인
   - "Add New Project" 클릭
   - "Import Git Repository" → 방금 만든 저장소 선택
   - "Import" 클릭
   - **자동으로 빌드 및 배포 시작!** 🎉

4. **완료!**
   - 2-3분 후 배포 완료
   - 자동으로 생성된 URL 확인 (예: `https://d-day-weather-web.vercel.app`)
   - 이제부터 Git push할 때마다 자동 재배포!

---

#### 방법 2: Vercel CLI 사용 (더 빠름)

1. **Vercel CLI 설치**
   ```bash
   npm install -g vercel
   ```

2. **로그인**
   ```bash
   vercel login
   ```

3. **배포 (한 줄!)**
   ```bash
   vercel --prod
   ```

4. **완료!**
   - 터미널에 배포 URL 표시됨
   - 1-2분 만에 완료!

---

## 🎯 다른 배포 옵션

### Netlify (프론트엔드만)
```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로그인
netlify login

# 배포
cd frontend
netlify deploy --prod
```

### Render (풀스택)
1. https://render.com 접속
2. "New" → "Web Service"
3. GitHub 저장소 연결
4. 설정:
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`

---

## ✅ 배포 후 확인

배포가 완료되면 다음을 확인하세요:

1. **프론트엔드 로드**: 메인 페이지가 보이는지
2. **API 작동**: 날씨 데이터가 표시되는지
3. **날짜 선택**: 달력이 작동하는지
4. **도시 선택**: 도시 목록이 로드되는지
5. **모바일**: 모바일 브라우저에서도 확인

### 테스트 URL
배포 후 다음 URL들을 테스트해보세요:
- `https://YOUR_URL.vercel.app/`
- `https://YOUR_URL.vercel.app/api/weather/cities`
- `https://YOUR_URL.vercel.app/api/weather/statistics?city=seoul&month=2&day=11`

---

## 🐛 문제 해결

### "Build failed" 에러
→ Vercel 대시보드에서 빌드 로그 확인
→ `frontend/package.json`의 dependencies 확인

### API가 404 에러
→ `vercel.json`의 rewrites 설정 확인
→ `api/` 폴더가 제대로 푸시되었는지 확인

### CORS 에러
→ 이미 설정되어 있음, 캐시 삭제 후 재시도

---

## 🎊 배포 완료 후

### README에 라이브 데모 추가
```markdown
## 🌐 Live Demo

👉 [https://your-project.vercel.app](https://your-project.vercel.app)
```

### 공유하기
- 포트폴리오에 추가
- LinkedIn에 프로젝트 공유
- Twitter/X에 트윗
- 친구들에게 자랑! 😎

---

## 💰 비용

**Vercel 무료 티어**:
- ✅ 무제한 프로젝트
- ✅ 무제한 배포
- ✅ 100GB Bandwidth/월
- ✅ Serverless Functions
- ✅ 자동 HTTPS
- ✅ 글로벌 CDN

→ **개인 프로젝트는 완전 무료!**

---

## 📞 도움이 필요하신가요?

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)
- [상세 배포 가이드](./DEPLOYMENT.md)

**Happy Deploying! 🚀**
