ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS completed_exercises JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(completed_exercises) = 'array');
