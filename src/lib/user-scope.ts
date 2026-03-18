export function matchesUserScope(recordUserId: string | undefined, activeUserId?: string): boolean {
  if (activeUserId) {
    return recordUserId === activeUserId;
  }

  return !recordUserId;
}
