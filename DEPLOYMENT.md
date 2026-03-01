# 배포 가이드 🚀

"그날의 날씨"는 **백엔드 서버 없이 프론트엔드만 배포**하면 됩니다.  
데이터는 Supabase에서 직접 조회하므로, 정적 웹사이트 호스팅 서비스면 충분합니다.

## ✅ 배포 전 준비사항

Supabase 프로젝트가 설정되어 있어야 합니다:
- `cities` 테이블 + `hourly_weather` 테이블 생성
- 데이터 수집 완료
- RLS 정책: anon 키로 SELECT 허용

> Supabase 스키마 및 데이터 수집 방법은 [COLLECTION.md](./COLLECTION.md) 참조

---

## 🎯 방법 1: Vercel (권장) ⭐

### 1단계: GitHub에 코드 푸시

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-username/d-day-weather-web.git
git push -u origin main
```

### 2단계: Vercel 연결

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 로그인
2. **"Add New Project"** 클릭
3. 저장소 선택
4. **Framework Preset**: `Vite` 선택
5. **Root Directory**: `frontend` 로 변경

### 3단계: 환경 변수 설정

Vercel 프로젝트 설정 → **Environment Variables**:

| 변수명 | 값 |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_KEY` | Supabase 프로젝트의 anon public key |

### 4단계: 배포

**"Deploy"** 클릭 → 자동 빌드 후 URL 발급 완료 🎉

이후 GitHub main 브랜치에 push할 때마다 자동 재배포됩니다.

---

## 🎯 방법 2: Netlify

### 1단계: 빌드

```bash
cd frontend
npm install
npm run build
# 결과물: frontend/dist/
```

### 2단계: Netlify 배포

1. [app.netlify.com](https://app.netlify.com) 접속
2. **"Add new site"** → **"Import an existing project"** 또는 `dist` 폴더 드래그앤드롭
3. Build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### 3단계: 환경 변수

Site settings → **Environment variables**:

| 변수명 | 값 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_KEY` | Supabase anon key |

---

## 🎯 방법 3: GitHub Pages

```bash
cd frontend
npm install
npm run build
```

`frontend/dist/` 내용을 `gh-pages` 브랜치에 푸시하거나, GitHub Actions로 자동화합니다.

> ⚠️ SPA 라우팅 설정이 필요할 수 있습니다 (`404.html` 처리).

---

## 🔒 Supabase 보안 설정

프론트엔드에서는 **anon (public) key**만 사용합니다.

Supabase 대시보드 → **Authentication → Policies**에서 `hourly_weather`, `cities` 테이블에 대해 anon 키 SELECT 허용 RLS 정책이 활성화되어 있는지 확인하세요:

```sql
-- hourly_weather 읽기 허용
CREATE POLICY "anon read" ON hourly_weather
  FOR SELECT TO anon USING (true);

-- cities 읽기 허용
CREATE POLICY "anon read" ON cities
  FOR SELECT TO anon USING (true);
```

---

## 🛠️ 로컬 빌드 확인

배포 전 로컬에서 프로덕션 빌드를 테스트하려면:

```bash
cd frontend
cp .env.local .env  # 또는 환경 변수 직접 설정
npm run build
npm run preview     # http://localhost:4173
```
