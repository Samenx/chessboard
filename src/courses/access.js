function hideLessonContent(lesson) {
  return {
    ...lesson,
    text: '',
    moves: '',
    note: '',
    fen: null,
    content: [],
  };
}

/** Remove paid lesson material before a catalogue response leaves the server. */
export function projectBookForViewer(book, { isAdmin = false } = {}) {
  const canReadContent = isAdmin || book.owned === true;
  if (canReadContent) return book;
  const lessons = (book.lessons || []).map(hideLessonContent);
  const chapterList = (book.chapterList || []).map(chapter => ({
    ...chapter,
    lessons: (chapter.lessons || []).map(hideLessonContent),
  }));
  return { ...book, lessons, chapterList };
}
