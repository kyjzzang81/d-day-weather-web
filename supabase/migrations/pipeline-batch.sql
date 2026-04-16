-- =============================================
-- D Day Weather - 데이터 파이프라인 배치 SQL
-- 실행 순서: STEP 1 → STEP 2 → STEP 3
-- 데이터 기간: 2016-01-01 ~ 2025-12-31
-- ※ timestamp는 UTC 기준으로 집계
-- =============================================


-- =============================================
-- STEP 1. hourly_weather → daily_weather
-- =============================================
-- 시간별 데이터를 일별로 집계
-- 도시당 ~3,650 rows (10년 × 365일)
-- 초기 1회 실행 후 불변

INSERT INTO daily_weather (
  city_id,
  date,
  temp_avg,
  temp_min,
  temp_max,
  apparent_temp_avg,
  humidity_avg,
  precipitation_sum,
  rain_sum,
  snowfall_sum,
  wind_avg,
  wind_max,
  cloud_cover_avg,
  rain_hours
)
SELECT
  city_id,
  DATE(timestamp)                                        AS date,
  AVG(temperature)                                       AS temp_avg,
  MIN(temperature)                                       AS temp_min,
  MAX(temperature)                                       AS temp_max,
  AVG(apparent_temp)                                     AS apparent_temp_avg,
  AVG(humidity)                                          AS humidity_avg,
  SUM(precipitation)                                     AS precipitation_sum,
  SUM(rain)                                              AS rain_sum,
  SUM(snowfall)                                          AS snowfall_sum,
  AVG(wind_speed)                                        AS wind_avg,
  MAX(wind_speed)                                        AS wind_max,
  AVG(cloud_cover)                                       AS cloud_cover_avg,
  -- 스콜 구분: 1.0mm 이상 비가 온 시간 수 (0~24)
  -- 0.1mm 기준은 이슬비 포함 → 여행 앱 목적에 과대 집계 → 1.0mm 기준 사용
  COUNT(CASE WHEN rain >= 1.0 THEN 1 END)::smallint      AS rain_hours
FROM hourly_weather
GROUP BY city_id, DATE(timestamp)
ON CONFLICT (city_id, date) DO NOTHING;


-- =============================================
-- STEP 2. daily_weather → climate_normals
-- =============================================
-- 10년 데이터 기반 day_of_year 단위 기후 통계
-- 윤년(2월 29일) 처리: DOY > 59인 윤년 날짜는 -1 보정하여 365 기준으로 통일
-- 도시당 365 rows

INSERT INTO climate_normals (
  city_id,
  day_of_year,
  temp_avg,
  temp_min_avg,
  temp_max_avg,
  temp_stddev,
  humidity_avg,
  rain_probability,
  precipitation_avg,
  precipitation_stddev,
  wind_avg,
  wind_stddev,
  snowfall_avg,
  cloud_cover_avg
)
SELECT
  city_id,
  -- 윤년 보정: 2월 29일(DOY=60) 이후 윤년 날짜는 1 감소시켜 365 범위로 통일
  CASE
    WHEN EXTRACT(DOY FROM date)::int > 59
     AND EXTRACT(YEAR FROM date)::int % 4 = 0
     AND (
       EXTRACT(YEAR FROM date)::int % 100 != 0
       OR EXTRACT(YEAR FROM date)::int % 400 = 0
     )
    THEN (EXTRACT(DOY FROM date)::int - 1)::smallint
    ELSE EXTRACT(DOY FROM date)::smallint
  END                                           AS day_of_year,
  AVG(temp_avg)                                 AS temp_avg,
  AVG(temp_min)                                 AS temp_min_avg,
  AVG(temp_max)                                 AS temp_max_avg,
  STDDEV(temp_avg)                              AS temp_stddev,
  AVG(humidity_avg)                             AS humidity_avg,
  -- 강수 확률: 비가 0.1mm 이상 내린 날 / 전체 날수
  AVG(CASE WHEN rain_sum > 0.1 THEN 1.0 ELSE 0.0 END) AS rain_probability,
  AVG(precipitation_sum)                        AS precipitation_avg,
  STDDEV(precipitation_sum)                     AS precipitation_stddev,
  AVG(wind_avg)                                 AS wind_avg,
  STDDEV(wind_avg)                              AS wind_stddev,
  AVG(snowfall_sum)                             AS snowfall_avg,
  AVG(cloud_cover_avg)                          AS cloud_cover_avg
FROM daily_weather
GROUP BY
  city_id,
  CASE
    WHEN EXTRACT(DOY FROM date)::int > 59
     AND EXTRACT(YEAR FROM date)::int % 4 = 0
     AND (
       EXTRACT(YEAR FROM date)::int % 100 != 0
       OR EXTRACT(YEAR FROM date)::int % 400 = 0
     )
    THEN (EXTRACT(DOY FROM date)::int - 1)::smallint
    ELSE EXTRACT(DOY FROM date)::smallint
  END
ON CONFLICT (city_id, day_of_year) DO UPDATE SET
  temp_avg             = EXCLUDED.temp_avg,
  temp_min_avg         = EXCLUDED.temp_min_avg,
  temp_max_avg         = EXCLUDED.temp_max_avg,
  temp_stddev          = EXCLUDED.temp_stddev,
  humidity_avg         = EXCLUDED.humidity_avg,
  rain_probability     = EXCLUDED.rain_probability,
  precipitation_avg    = EXCLUDED.precipitation_avg,
  precipitation_stddev = EXCLUDED.precipitation_stddev,
  wind_avg             = EXCLUDED.wind_avg,
  wind_stddev          = EXCLUDED.wind_stddev,
  snowfall_avg         = EXCLUDED.snowfall_avg,
  cloud_cover_avg      = EXCLUDED.cloud_cover_avg;


-- =============================================
-- STEP 3. daily_weather → monthly_climate
-- =============================================
-- 월 단위 기후 통계
-- rain_days: 연도별 월 강수일수를 평균 → 해당 월의 평균 강수일 수
-- 도시당 12 rows

WITH monthly_per_year AS (
  SELECT
    city_id,
    EXTRACT(YEAR  FROM date)::int   AS year,
    EXTRACT(MONTH FROM date)::smallint AS month,
    AVG(temp_avg)                   AS temp_avg,
    AVG(temp_min)                   AS temp_min_avg,
    AVG(temp_max)                   AS temp_max_avg,
    AVG(humidity_avg)               AS humidity_avg,
    AVG(wind_avg)                   AS wind_avg,
    COUNT(CASE WHEN rain_sum    > 0.1 THEN 1 END) AS rain_days,
    COUNT(CASE WHEN snowfall_sum > 0  THEN 1 END) AS snowfall_days,
    COUNT(*)                        AS total_days
  FROM daily_weather
  GROUP BY city_id, year, month
)
INSERT INTO monthly_climate (
  city_id,
  month,
  temp_avg,
  temp_min_avg,
  temp_max_avg,
  rain_days,
  rain_probability,
  wind_avg,
  humidity_avg,
  snowfall_days
)
SELECT
  city_id,
  month,
  AVG(temp_avg)                                             AS temp_avg,
  AVG(temp_min_avg)                                         AS temp_min_avg,
  AVG(temp_max_avg)                                         AS temp_max_avg,
  AVG(rain_days)                                            AS rain_days,
  AVG(rain_days::float / NULLIF(total_days, 0))             AS rain_probability,
  AVG(wind_avg)                                             AS wind_avg,
  AVG(humidity_avg)                                         AS humidity_avg,
  AVG(snowfall_days)                                        AS snowfall_days
FROM monthly_per_year
GROUP BY city_id, month
ON CONFLICT (city_id, month) DO UPDATE SET
  temp_avg         = EXCLUDED.temp_avg,
  temp_min_avg     = EXCLUDED.temp_min_avg,
  temp_max_avg     = EXCLUDED.temp_max_avg,
  rain_days        = EXCLUDED.rain_days,
  rain_probability = EXCLUDED.rain_probability,
  wind_avg         = EXCLUDED.wind_avg,
  humidity_avg     = EXCLUDED.humidity_avg,
  snowfall_days    = EXCLUDED.snowfall_days;
