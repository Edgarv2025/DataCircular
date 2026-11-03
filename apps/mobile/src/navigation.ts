export interface NavigationUser {
  role?: string;
  userType?: string;
}

export const ADMIN_PROFILE_ROUTE = '/(app)/profile' as const;

export type HomeRoute = '/' | '/(app)' | '/(app)/admin' | '/(app)/publish';

export function getHomeRoute(user?: NavigationUser | null): HomeRoute {
  if (user?.role === 'ADMIN') return '/(app)/admin';
  if (user?.userType === 'GENERATOR') return '/(app)/publish';
  if (user) return '/(app)';
  return '/';
}

export function navigateBackOrFallback(
  canGoBack: () => boolean,
  goBack: () => void,
  fallback: () => void
): void {
  if (canGoBack()) {
    goBack();
  } else {
    fallback();
  }
}
