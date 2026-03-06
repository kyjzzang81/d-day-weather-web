-- ============================================================
-- home_cards: 홈 화면 캐러셀 콘텐츠 (관리자가 기획적으로 편집)
-- ============================================================

CREATE TABLE IF NOT EXISTS home_cards (
  id           BIGSERIAL PRIMARY KEY,

  -- 카드에 표시되는 정보
  title        TEXT NOT NULL,          -- 카드 제목 (예: "방콕", "도쿄 벚꽃 여행")
  subtitle     TEXT,                   -- 서브타이틀 (예: "태국 여름 추천", nullable)
  nights_label TEXT,                   -- 기간 텍스트 (예: "3박 4일", "날짜 조회")
  date_label   TEXT,                   -- 날짜 표시 텍스트 (예: "2026.07.15", "7월 15일 ~ 7월 20일")
  image_url    TEXT,                   -- 배경 이미지 URL (nullable)

  -- 클릭 시 날씨 데이터 로드용
  city_id      TEXT REFERENCES cities(id) ON DELETE SET NULL,
  card_type    TEXT NOT NULL DEFAULT 'date' CHECK (card_type IN ('date', 'range')),
  date_from    TEXT,                   -- MM-DD 형식 (예: "07-15")
  date_to      TEXT,                   -- MM-DD 형식, card_type='range'일 때만 사용

  -- 관리
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 노출 순서용 인덱스
CREATE INDEX IF NOT EXISTS home_cards_sort_idx ON home_cards (is_active, sort_order);

-- ─── 샘플 데이터 ────────────────────────────────────────────
-- city_id는 cities 테이블에 실제로 존재하는 값이어야 합니다.
-- 아래 쿼리로 사용 가능한 city_id를 먼저 확인하세요:
--   SELECT id, name_ko FROM cities ORDER BY name_ko;
-- city_id가 없는 경우 NULL로 두면 클릭 동작이 비활성화됩니다.

INSERT INTO home_cards (title, subtitle, nights_label, date_label, city_id, card_type, date_from, date_to, sort_order)
SELECT '방콕', '태국 여름 추천', '날짜 조회', '2026.07.15',              id, 'date',  '07-15', NULL,    1 FROM cities WHERE id = 'bangkok'
UNION ALL
SELECT '도쿄', '벚꽃 시즌',     '3박 4일',   '2026.04.01 - 2026.04.04', id, 'range', '04-01', '04-04', 2 FROM cities WHERE id = 'tokyo'
UNION ALL
SELECT '다낭', '여름 휴양',     '날짜 조회', '2026.06.20',              id, 'date',  '06-20', NULL,    3 FROM cities WHERE id = 'da-nang'
UNION ALL
SELECT '파리', '가을 여행',     '5박 6일',   '2026.09.10 - 2026.09.15', id, 'range', '09-10', '09-15', 4 FROM cities WHERE id = 'paris'
UNION ALL
SELECT '서울', '도심 여행',     '날짜 조회', '2026.08.15',              id, 'date',  '08-15', NULL,    5 FROM cities WHERE id = 'seoul';

-- ─── RLS (Row Level Security) ─────────────────────────────
-- anon 사용자는 읽기만 가능, 수정은 authenticated (관리자) 전용
ALTER TABLE home_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "home_cards_select_public"
  ON home_cards FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "home_cards_all_authenticated"
  ON home_cards FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);
