export type UIUser = {
  id?: string;
  descriptor?: string;
} | null;

/**
 * Temporary package-level UI store hook.
 * Consumers can replace or wrap this with application-specific state.
 */
export function useUIStore(): { currentUser: UIUser } {
  return { currentUser: null };
}