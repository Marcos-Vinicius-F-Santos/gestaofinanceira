export function getLoggedUserId(scope = {}) {
  return scope?.uid || scope?.user?.uid || '';
}

export function getTargetUserId(scope = {}) {
  if (scope?.targetUserId) return scope.targetUserId;
  if (scope?.userId) return scope.userId;
  if (scope?.isAdmin) return '';
  return getLoggedUserId(scope);
}

export function requireOwnerId(scope = {}) {
  const ownerId = getTargetUserId(scope);

  if (!ownerId) {
    throw new Error('Usuario dono do registro nao identificado.');
  }

  return ownerId;
}

export function canAccessDocument(document, scope = {}) {
  if (!document) return false;
  if (scope?.isAdmin) return true;

  const loggedUserId = getLoggedUserId(scope);
  return Boolean(loggedUserId && document.userId === loggedUserId);
}

export function filterByScope(items, scope = {}) {
  if (scope?.isAdmin && !scope?.targetUserId) return items;

  const ownerId = requireOwnerId(scope);
  return items.filter((item) => item.userId === ownerId);
}
