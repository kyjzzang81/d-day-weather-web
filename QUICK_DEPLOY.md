# 🚀 빠른 배포 가이드 — Vercel로 5분 안에 배포하기

## 준비물 체크 ✅

- [ ] GitHub 계정
- [ ] Vercel 계정 (GitHub로 로그인)
- [ ] Supabase 프로젝트 URL + anon key

---

## 1단계: GitHub에 푸시

```bash
git add .
git commit -m "deploy"
git push origin main
```

---

## 2단계: Vercel에서 프로젝트 연결

1. [vercel.com/new](https://vercel.com/new) 접속
2. GitHub 저장소 선택
3. 설정 변경:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`

---

## 3단계: 환경 변수 입력

| 변수명 | 값 |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` |
| `VITE_SUPABASE_KEY` | Supabase anon key |

> Supabase 대시보드 → **Project Settings → API** 에서 확인

---

## 4단계: Deploy 클릭 🎉

배포 완료 후 `https://your-project.vercel.app` URL이 발급됩니다.

이후 `git push`만 하면 자동으로 재배포됩니다.

---

## 문제 해결

| 증상 | 해결 |
|---|---|
| 데이터가 안 불러와짐 | 환경 변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` 재확인 |
| 빌드 실패 | Root Directory가 `frontend`로 설정되었는지 확인 |
| 도시 목록이 비어있음 | Supabase `cities` 테이블 RLS 정책 확인 (anon SELECT 허용) |

> 자세한 배포 옵션은 [DEPLOYMENT.md](./DEPLOYMENT.md) 참조
