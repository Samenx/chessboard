export function completedLessonIds(progress) {
  return Array.isArray(progress?.completedLessonIds) ? progress.completedLessonIds : [];
}

export function courseCompletionPercent(totalLessons, lessonIds) {
  if (!Number.isInteger(totalLessons) || totalLessons <= 0 || !Array.isArray(lessonIds)) return 0;
  return Math.round(Math.min(totalLessons, new Set(lessonIds).size) / totalLessons * 100);
}

export function recordLessonCompletion(progress, lessonId, totalLessons) {
  if (!lessonId) return { ...progress, completedLessonIds: completedLessonIds(progress) };
  const ids = [...new Set([...completedLessonIds(progress), lessonId])];
  return { ...progress, completedLessonIds: ids, progress: courseCompletionPercent(totalLessons, ids) };
}

export function lessonIsComplete(progress, lessonId) {
  return Boolean(lessonId && completedLessonIds(progress).includes(lessonId));
}
