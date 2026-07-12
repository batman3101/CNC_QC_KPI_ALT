/**
 * Network reachability.
 *
 * Lives here, not in offlineSyncService, so that managementService can ask "are
 * we online?" without importing the sync service - which imports
 * managementService right back.
 */
export function isOnline(): boolean {
  return navigator.onLine
}
