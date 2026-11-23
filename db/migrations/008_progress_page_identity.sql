ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES lesson_pages(id) ON DELETE SET NULL;

UPDATE lesson_progress progress
SET page_id = page.id
FROM lesson_pages page
WHERE page.lesson_id = progress.lesson_id
  AND page.position = progress.page_index
  AND progress.page_id IS NULL;
