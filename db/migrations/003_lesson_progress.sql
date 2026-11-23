ALTER TABLE course_progress
  ADD COLUMN IF NOT EXISTS last_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_page_index INTEGER NOT NULL DEFAULT 0 CHECK (last_page_index >= 0);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  page_index INTEGER NOT NULL DEFAULT 0 CHECK (page_index >= 0),
  completed_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS lesson_progress_book_idx ON lesson_progress(user_id, book_id, completed_at);
