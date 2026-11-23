export function canManageCourse(user, createdBy) {
  return user?.role === 'admin' || (user?.role === 'instructor' && Boolean(user.id) && user.id === createdBy);
}

export function canIncludeCourseDrafts(user) {
  return ['admin', 'instructor'].includes(user?.role);
}
