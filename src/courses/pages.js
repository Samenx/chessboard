const MAX_PAGES = 200;
const MAX_BLOCKS = 200;

export function normalizeLessonPages(input) {
  const sourcePages = Array.isArray(input?.pages)
    ? input.pages
    : (Array.isArray(input?.content) ? input.content : []).map((block, index) => ({
      title: block?.title || `Sector ${index + 1}`,
      blocks: [block],
    }));

  if (sourcePages.length > MAX_PAGES) throw new Error(`A lesson cannot contain more than ${MAX_PAGES} pages.`);
  let blockCount = 0;
  const pages = sourcePages.map((page, index) => {
    if (!page || typeof page !== 'object' || Array.isArray(page)) throw new Error(`Page ${index + 1} is invalid.`);
    if (typeof page.title !== 'string' || page.title.length > 180) throw new Error(`Page ${index + 1} title must be text up to 180 characters.`);
    if (page.schemaVersion !== undefined && page.schemaVersion !== 1) throw new Error(`Page ${index + 1} uses an unsupported schema version.`);
    if (!Array.isArray(page.blocks)) throw new Error(`Page ${index + 1} blocks must be a list.`);
    blockCount += page.blocks.length;
    return { title: page.title.trim(), position: index, schemaVersion: 1, blocks: page.blocks };
  });
  if (blockCount > MAX_BLOCKS) throw new Error(`A lesson cannot contain more than ${MAX_BLOCKS} content blocks.`);
  return pages;
}

export function flattenLessonPages(pages) {
  return Array.isArray(pages) ? pages.flatMap(page => Array.isArray(page.blocks) ? page.blocks : []) : [];
}

export function readerPagesForLesson(lesson) {
  if (Array.isArray(lesson?.pages) && lesson.pages.length) return lesson.pages;
  return (Array.isArray(lesson?.content) ? lesson.content : []).map((block, index) => ({
    id: block?.id || `legacy-page-${index}`,
    title: block?.title || `Sector ${index + 1}`,
    position: index,
    blocks: [block],
  }));
}
