"""
D Day Weather - daily_weather 일괄 생성 스크립트
hourly_weather → daily_weather 집계를 도시 × 연도별로 순차 처리

사전 준비:
    1. Supabase SQL Editor에서 build_daily_weather_for_city_year() 함수 생성
    2. pip install supabase tqdm
    3. 아래 SUPABASE_URL, SUPABASE_KEY 입력 후 실행:
       python build_daily_weather.py
"""

import time
from supabase import create_client
from tqdm import tqdm

# =============================================
# 설정
# =============================================

SUPABASE_URL = "https://nisxyhqxihbharxnmmdw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pc3h5aHF4aWhiaGFyeG5tbWR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUwMDYxNCwiZXhwIjoyMDg3MDc2NjE0fQ.moHO-RQqsAKNgLAlZFky9vNfvxxKI-LRuOAoUi7K5c4"

# 처리할 연도 범위
YEARS = list(range(2016, 2026))  # 2016 ~ 2025

# 재시도 횟수 및 대기 시간
MAX_RETRY  = 2
RETRY_WAIT = 3


# =============================================
# 유틸
# =============================================

def get_all_cities(client):
    res = client.table("cities").select("id").order("id").execute()
    return [row["id"] for row in res.data]


def get_done_pairs(client):
    """daily_weather에 이미 있는 (city_id, year) 조합 반환 (재시작 시 스킵용)"""
    res = (
        client.table("daily_weather")
        .select("city_id, date")
        .execute()
    )
    done = set()
    for row in res.data:
        year = int(row["date"][:4])
        done.add((row["city_id"], year))
    return done


def process(client, city_id, year):
    client.rpc(
        "build_daily_weather_for_city_year",
        {"p_city_id": city_id, "p_year": year}
    ).execute()


# =============================================
# 메인
# =============================================

def main():
    print("=" * 55)
    print("  D Day Weather - daily_weather 빌드 시작")
    print(f"  대상 연도: {YEARS[0]} ~ {YEARS[-1]}")
    print("=" * 55)

    # Supabase 연결
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase 연결 성공\n")
    except Exception as e:
        print(f"❌ 연결 실패: {e}")
        return

    # 전체 작업 목록 생성
    all_cities = get_all_cities(client)
    print(f"전체 도시: {len(all_cities)}개")
    print("완료된 작업 확인 중...")

    done_pairs = get_done_pairs(client)
    todo = [
        (city_id, year)
        for city_id in all_cities
        for year in YEARS
        if (city_id, year) not in done_pairs
    ]

    total     = len(all_cities) * len(YEARS)
    skipped   = total - len(todo)
    print(f"전체 작업 : {total}개  ({len(all_cities)}도시 × {len(YEARS)}년)")
    print(f"이미 완료 : {skipped}개  (스킵)")
    print(f"처리 예정 : {len(todo)}개\n")

    if not todo:
        print("🎉 모든 작업이 완료된 상태입니다.")
        return

    # 도시 × 연도별 처리
    failed = []

    for city_id, year in tqdm(todo, desc="처리중", unit="job"):
        success = False

        for attempt in range(1, MAX_RETRY + 2):
            try:
                process(client, city_id, year)
                success = True
                break

            except Exception as e:
                tqdm.write(f"  ❌ [{city_id} / {year}] 에러: {e} (시도 {attempt})")
                if attempt <= MAX_RETRY:
                    time.sleep(RETRY_WAIT)

        if not success:
            failed.append((city_id, year))

    # 결과 요약
    print("\n" + "=" * 55)
    print(f"  완료  : {len(todo) - len(failed)}개")
    print(f"  실패  : {len(failed)}개")
    if failed:
        print("\n  실패 목록:")
        for city_id, year in failed:
            print(f"    - {city_id} / {year}")
    print("=" * 55)


if __name__ == "__main__":
    main()
