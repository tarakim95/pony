-- raw_data: source 단일 컬럼 → (source_type, source_id, source_detail) 3분리 + dedup
-- Phase 0 직후 적용. 데이터 없음 가정 (DROP COLUMN 안전).

ALTER TABLE raw_data
  ADD COLUMN source_type   text,
  ADD COLUMN source_id     text,
  ADD COLUMN source_detail text,
  ADD COLUMN external_id   text;

ALTER TABLE raw_data DROP COLUMN source;

-- dedup: 같은 매체의 같은 기사 중복 수집 방지
CREATE UNIQUE INDEX raw_data_dedup_uniq
  ON raw_data (source_type, source_id, external_id)
  WHERE external_id IS NOT NULL;

-- 매체별 필터 쿼리용
CREATE INDEX raw_data_source_id_idx ON raw_data (source_id);

COMMENT ON COLUMN raw_data.source_type   IS '프로토콜: rss | api | sns | search';
COMMENT ON COLUMN raw_data.source_id     IS '출처 식별자: nyt, hani, yonhap, theverge 등 소문자 약칭';
COMMENT ON COLUMN raw_data.source_detail IS '세부 경로: RSS 섹션 등. nullable';
COMMENT ON COLUMN raw_data.external_id   IS '매체 측 고유 ID. 우선순위: guid → link → sha256(title+pubDate) 16자리';
