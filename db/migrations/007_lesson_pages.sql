CREATE TABLE IF NOT EXISTS lesson_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL CHECK (position >= 0),
  schema_version SMALLINT NOT NULL DEFAULT 1 CHECK (schema_version >= 1),
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(blocks) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lesson_id, position)
);

CREATE INDEX IF NOT EXISTS lesson_pages_order_idx ON lesson_pages(lesson_id, position);

INSERT INTO lesson_pages (lesson_id, title, position, blocks)
SELECT l.id,
       COALESCE(NULLIF(item.block->>'title', ''), 'Sector ' || item.ordinality::text),
       (item.ordinality - 1)::integer,
       jsonb_build_array(item.block)
FROM lessons l
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(l.content) = 'array' THEN l.content ELSE '[]'::jsonb END
) WITH ORDINALITY AS item(block, ordinality);
