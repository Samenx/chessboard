CREATE TABLE IF NOT EXISTS course_enrollments (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS course_enrollments_book_idx ON course_enrollments(book_id, enrolled_at);
