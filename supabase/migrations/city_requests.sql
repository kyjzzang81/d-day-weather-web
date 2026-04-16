-- =============================================
-- D Day Weather - city_requests 테이블
-- 사용자 도시 추가 요청
-- =============================================

CREATE TABLE city_requests (
  id            BIGSERIAL PRIMARY KEY,
  city_name     TEXT        NOT NULL,
  country       TEXT,
  requested_by  TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  request_count INTEGER     NOT NULL DEFAULT 1,
  admin_note    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

-- 동일 도시 중복 요청 방지용 인덱스 (city_name 기준 검색)
CREATE INDEX idx_city_requests_name   ON city_requests (LOWER(city_name));
CREATE INDEX idx_city_requests_status ON city_requests (status);

-- =============================================
-- RLS 설정
-- =============================================

ALTER TABLE city_requests ENABLE ROW LEVEL SECURITY;

-- 비로그인 사용자도 요청 가능
CREATE POLICY "anon can insert"
  ON city_requests FOR INSERT
  WITH CHECK (true);

-- 로그인 사용자는 본인 요청만 조회 가능
CREATE POLICY "user can view own requests"
  ON city_requests FOR SELECT
  USING (requested_by = auth.uid()::text);

-- =============================================
-- 동일 도시 재요청 시 request_count +1 처리
-- 앱에서 INSERT 전에 아래 함수 호출
-- =============================================

CREATE OR REPLACE FUNCTION upsert_city_request(
  p_city_name    TEXT,
  p_country      TEXT,
  p_requested_by TEXT
)
RETURNS void AS $$
BEGIN
  -- 동일 도시(대소문자 무시)가 이미 pending 상태면 count만 증가
  IF EXISTS (
    SELECT 1 FROM city_requests
    WHERE LOWER(city_name) = LOWER(p_city_name)
      AND status = 'pending'
  ) THEN
    UPDATE city_requests
    SET request_count = request_count + 1
    WHERE LOWER(city_name) = LOWER(p_city_name)
      AND status = 'pending';
  ELSE
    -- 없으면 새로 삽입
    INSERT INTO city_requests (city_name, country, requested_by)
    VALUES (p_city_name, p_country, p_requested_by);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
