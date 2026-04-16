"""
D Day Weather - climate_normals & monthly_climate 일괄 생성 스크립트
daily_weather → climate_normals / monthly_climate 집계를 도시별로 순차 처리

사전 준비:
    1. Supabase SQL Editor에서 아래 함수 2개 생성
       - build_climate_normals_for_city(p_city_id TEXT)
       - build_monthly_climate_for_city(p_city_id TEXT)
    2. pip install supabase tqdm
    3. 실행: python build_climate.py
"""

import time
from supabase import create_client
from tqdm import tqdm

# =============================================
# 설정
# =============================================

SUPABASE_URL = "https://nisxyhqxihbharxnmmdw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pc3h5aHF4aWhiaGFyeG5tbWR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUwMDYxNCwiZXhwIjoyMDg3MDc2NjE0fQ.moHO-RQqsAKNgLAlZFky9vNfvxxKI-LRuOAoUi7K5c4"

MAX_RETRY  = 2
RETRY_WAIT = 3


# =============================================
# 유틸
# =============================================

def get_all_cities(client):
    res = client.table("cities").select("id").order("id").execute()
    return [row["id"] for row in res.data]


def get_done_cities(client, table, key_col):
    """이미 데이터가 있는 도시 목록 반환"""
    res = client.table(table).select(key_col).execute()
    return {row[key_col] for row in res.data}


def run_with_retry(client, fn_name, params, label):
    """RPC 호출 + 재시도 처리. 성공 여부 반환"""
    for attempt in range(1, MAX_RETRY + 2):
        try:
            client.rpc(fn_name, params).execute()
            return True
        except Exception as e:
            tqdm.write(f"  ❌ [{label}] {fn_name} 에러: {e} (시도 {attempt})")
            if attempt <= MAX_RETRY:
                time.sleep(RETRY_WAIT)
    return False


def process_table(client, all_cities, done_cities, fn_name, table_label):
    """단일 테이블 도시별 처리"""
    todo   = [c for c in all_cities if c not in done_cities]
    skip   = len(all_cities) - len(todo)
    failed = []

    print(f"\n  [{table_label}]")
    print(f"  전체: {len(all_cities)}개 | 완료(스킵): {skip}개 | 처리 예정: {len(todo)}개")

    if not todo:
        print(f"  🎉 {table_label} 이미 완료!")
        return []

    for city_id in tqdm(todo, desc=f"  {table_label}", unit="city"):
        success = run_with_retry(
            client,
            fn_name,
            {"p_city_id": city_id},
            city_id
        )
        if not success:
            failed.append(city_id)

    return failed


# =============================================
# 메인
# =============================================

def main():
    print("=" * 55)
    print("  D Day Weather - climate 데이터 빌드 시작")
    print("=" * 55)

    # Supabase 연결
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase 연결 성공")
    except Exception as e:
        print(f"❌ 연결 실패: {e}")
        return

    all_cities = get_all_cities(client)
    print(f"전체 도시: {len(all_cities)}개\n")

    # ── climate_normals ──────────────────────
    done_normals = get_done_cities(client, "climate_normals", "city_id")
    failed_normals = process_table(
        client, all_cities, done_normals,
        fn_name="build_climate_normals_for_city",
        table_label="climate_normals"
    )

    # ── monthly_climate ──────────────────────
    done_monthly = get_done_cities(client, "monthly_climate", "city_id")
    failed_monthly = process_table(
        client, all_cities, done_monthly,
        fn_name="build_monthly_climate_for_city",
        table_label="monthly_climate"
    )

    # ── 최종 요약 ────────────────────────────
    print("\n" + "=" * 55)
    print("  최종 결과 요약")
    print("=" * 55)

    for label, failed in [("climate_normals", failed_normals), ("monthly_climate", failed_monthly)]:
        status = "🎉 완료" if not failed else f"⚠️ {len(failed)}개 실패"
        print(f"  {label:25s} : {status}")
        if failed:
            for c in failed:
                print(f"    - {c}")

    print("=" * 55)


if __name__ == "__main__":
    main()
