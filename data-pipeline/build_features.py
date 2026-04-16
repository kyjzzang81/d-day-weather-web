"""
D Day Weather - Feature Engine 일괄 생성 스크립트
climate_normals → Feature 테이블 4개 집계를 도시별로 순차 처리

대상 테이블:
    - best_travel_week
    - rain_risk_calendar
    - weather_stability_index
    - activity_weather_score (beach / hiking / city_sightseeing)

사전 준비:
    1. Supabase SQL Editor에서 함수 4개 생성
       - build_best_travel_week_for_city(p_city_id TEXT)
       - build_rain_risk_for_city(p_city_id TEXT)
       - build_stability_for_city(p_city_id TEXT)
       - build_activity_score_for_city(p_city_id TEXT)
    2. pip install supabase tqdm
    3. 실행: python build_features.py
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

# 처리할 Feature 테이블 목록 (순서대로 실행)
FEATURES = [
    {
        "fn":    "build_best_travel_week_for_city",
        "table": "best_travel_week",
        "label": "best_travel_week",
    },
    {
        "fn":    "build_rain_risk_for_city",
        "table": "rain_risk_calendar",
        "label": "rain_risk_calendar",
    },
    {
        "fn":    "build_stability_for_city",
        "table": "weather_stability_index",
        "label": "weather_stability_index",
    },
    {
        "fn":    "build_activity_score_for_city",
        "table": "activity_weather_score",
        "label": "activity_weather_score",
    },
]


# =============================================
# 유틸
# =============================================

def get_all_cities(client):
    res = client.table("cities").select("id").order("id").execute()
    return [row["id"] for row in res.data]


def get_done_cities(client, table):
    res = client.table(table).select("city_id").execute()
    return {row["city_id"] for row in res.data}


def run_with_retry(client, fn_name, city_id):
    for attempt in range(1, MAX_RETRY + 2):
        try:
            client.rpc(fn_name, {"p_city_id": city_id}).execute()
            return True
        except Exception as e:
            tqdm.write(f"  ❌ [{city_id}] {fn_name} 에러: {e} (시도 {attempt})")
            if attempt <= MAX_RETRY:
                time.sleep(RETRY_WAIT)
    return False


def process_feature(client, all_cities, feature):
    fn    = feature["fn"]
    table = feature["table"]
    label = feature["label"]

    done_cities = get_done_cities(client, table)
    todo        = [c for c in all_cities if c not in done_cities]
    skip        = len(all_cities) - len(todo)
    failed      = []

    print(f"\n  [{label}]")
    print(f"  전체: {len(all_cities)}개 | 완료(스킵): {skip}개 | 처리 예정: {len(todo)}개")

    if not todo:
        print(f"  🎉 이미 완료!")
        return []

    for city_id in tqdm(todo, desc=f"  {label}", unit="city"):
        if not run_with_retry(client, fn, city_id):
            failed.append(city_id)

    return failed


# =============================================
# 메인
# =============================================

def main():
    print("=" * 55)
    print("  D Day Weather - Feature Engine 빌드 시작")
    print("=" * 55)

    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase 연결 성공")
    except Exception as e:
        print(f"❌ 연결 실패: {e}")
        return

    all_cities = get_all_cities(client)
    print(f"전체 도시: {len(all_cities)}개")

    all_failed = {}

    for feature in FEATURES:
        failed = process_feature(client, all_cities, feature)
        if failed:
            all_failed[feature["label"]] = failed

    # 최종 요약
    print("\n" + "=" * 55)
    print("  최종 결과 요약")
    print("=" * 55)
    for feature in FEATURES:
        label  = feature["label"]
        failed = all_failed.get(label, [])
        status = "🎉 완료" if not failed else f"⚠️  {len(failed)}개 실패"
        print(f"  {label:30s} : {status}")
        if failed:
            for c in failed:
                print(f"    - {c}")
    print("=" * 55)


if __name__ == "__main__":
    main()
