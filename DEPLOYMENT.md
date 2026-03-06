# 배포 가이드 🚀

"그날의 날씨"는 **백엔드 서버 없이 프론트엔드만 배포**하면 됩니다.  
데이터는 Supabase에서 직접 조회하므로, 정적 웹사이트 호스팅이면 충분합니다.

---

## ✅ 배포 전 준비사항

Supabase 프로젝트 설정:
- `cities`, `hourly_weather`, `home_cards` 테이블 생성 및 데이터 수집 완료
- RLS 정책: anon 키로 SELECT 허용
- `cities_images` Storage 버킷 (Public) 생성

> Supabase 스키마는 [COLLECTION.md](./COLLECTION.md), `home_cards` 테이블은 `supabase/home_cards.sql` 참조

---

## 🎯 방법 1: Vercel (권장) ⭐

### 1단계: GitHub 연결

1. [vercel.com](https://vercel.com) → GitHub 계정으로 로그인
2. **"Add New Project"** → 저장소 선택
3. **Framework Preset**: `Vite`
4. **Root Directory**: `frontend`
5. **Build Command**: `npm run build` (기본값)

### 2단계: 환경 변수 설정

Vercel 프로젝트 → Settings → **Environment Variables**:

| 변수명 | 값 |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_KEY` | Supabase anon public key |

### 3단계: 배포

**"Deploy"** 클릭 → 자동 빌드 후 URL 발급 🎉

이후 GitHub `main` 브랜치에 push하면 자동 재배포됩니다.

---

## 🎯 방법 2: Netlify

```bash
cd frontend
npm install
npm run build
```

1. [app.netlify.com](https://app.netlify.com) → **"Add new site"**
2. Build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. 환경 변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`

---

## 📱 Capacitor 앱 빌드 (`capacitor` 브랜치)

### 사전 요구사항
- iOS: Xcode 15 이상, Apple Developer 계정
- Android: Android Studio, JDK 17 이상

### 빌드 흐름

```bash
git checkout capacitor
cd frontend

# 웹 빌드
npm run build

# 네이티브 프로젝트 동기화
npx cap sync

# IDE 열기
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

### 웹 수정 후 앱 반영

```bash
npm run build && npx cap sync
```

### Capacitor 설정 (`frontend/capacitor.config.ts`)

```typescript
{
  appId: 'com.ddayweather.app',
  appName: 'D-Day Weather',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  ios: { contentInset: 'automatic' }
}
```

---

## 🔒 Supabase 보안 설정

프론트엔드에서는 **anon (public) key**만 사용합니다.

```sql
-- hourly_weather 읽기 허용
CREATE POLICY "anon read" ON hourly_weather
  FOR SELECT TO anon USING (true);

-- cities 읽기 허용
CREATE POLICY "anon read" ON cities
  FOR SELECT TO anon USING (true);

-- home_cards 읽기 허용 (is_active=true만)
CREATE POLICY "home_cards_select_public" ON home_cards
  FOR SELECT USING (is_active = TRUE);
```

---

## 🛠️ 로컬 빌드 확인

```bash
cd frontend
npm run build
npm run preview  # http://localhost:4173
```
