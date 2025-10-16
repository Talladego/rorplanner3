// Item-related utility helpers

/**
 * Returns true if the provided item type string represents a shield.
 * The API encodes shields with one of these type identifiers and also uses the
 * `armor` field to carry block rating for shields (instead of actual armor).
 */
export function isShieldType(t: string | undefined): boolean {
  return t === 'BASIC_SHIELD' || t === 'SHIELD' || t === 'EXPERT_SHIELD';
}
