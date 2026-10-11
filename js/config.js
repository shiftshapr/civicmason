/**
 * GovHub handoff URLs — single source for meta + fallbacks.
 */
export function getGovhubOrigin() {
  const m = document.querySelector('meta[name="govhub-origin"]');
  return ((m && m.content) || 'https://govhub.live').replace(/\/$/, '');
}

export function onboardingUrl(intent) {
  const o = getGovhubOrigin();
  const base = `${o}/soft-launch/onboarding/`;
  if (!intent) return base;
  return `${base}?intent=${encodeURIComponent(intent)}`;
}

export function monumentUrl() {
  return `${getGovhubOrigin()}/soft-launch/#sl-live-activity`;
}

/** Path keys → intent query (GovHub can ignore until ready). */
export const PATH_INTENTS = {
  community: 'community',
  internet: 'internet',
  cell: 'cell',
};

export const STAGE = {
  THRESHOLD: 'threshold',
  TRANSITION: 'transition',
  VALLEY: 'valley',
  GUIDED: 'guided',
  WALK: 'walk',
  PATHS: 'paths',
};
