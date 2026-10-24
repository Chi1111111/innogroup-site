import { isWorkflowPath } from './routePaths';

const RELOAD_KEY = 'inno:route-chunk-reload';

export function isRouteChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|Loading (?:CSS )?chunk .+ failed/i.test(error.message);
}

type RecoveryEnvironment = {
  pathname: string;
  online: boolean;
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  reload: () => void;
};

export function recoverRouteChunk(error: unknown, environment: RecoveryEnvironment): boolean {
  if (!isRouteChunkError(error) || !environment.online || isWorkflowPath(environment.pathname)) return false;

  try {
    // Persist before reloading, so a missing release or network fault cannot loop.
    // One automatic attempt per tab; subsequent failures offer a manual retry.
    if (environment.storage.getItem(RELOAD_KEY)) return false;
    environment.storage.setItem(RELOAD_KEY, 'attempted');
  } catch {
    // Without persistent storage we cannot safely guard an automatic reload.
    return false;
  }

  environment.reload();
  return true;
}
