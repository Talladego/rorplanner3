/**
 * Equipment slot hover highlight (A/B paired).
 *
 * CSS transform scale (ScaleToFit) can skip mouseleave, which used to leave
 * leftover `.hover-bright` classes on slots. This module is the single writer
 * for slot highlights: every apply clears all slot leftovers first, then lights
 * only the current trigger plus its opposite-side mirror.
 *
 * Picker rows may also use the `.hover-bright` class name; they are not
 * `data-anchor-key` / `.talisman-slot` nodes, so the sweep leaves them alone.
 */

export const HOVER_BRIGHT_CLASS = 'hover-bright';

/** Slot/talisman nodes that participate in paired hover (not picker rows). */
export const HOVER_BRIGHT_SWEEP_SELECTOR =
  `[data-anchor-key].${HOVER_BRIGHT_CLASS}, .talisman-slot.${HOVER_BRIGHT_CLASS}`;

export type HoverBrightOwner = object;

export type ClassListHost = {
  classList: {
    add: (...tokens: string[]) => void;
    remove: (...tokens: string[]) => void;
    contains?: (token: string) => boolean;
  };
  closest?: (selector: string) => ClassListHost | null;
  contains?: (node: Node) => boolean;
  getAttribute?: (name: string) => string | null;
};

export type SweepRoot = {
  querySelectorAll: (selector: string) => ArrayLike<ClassListHost>;
};

export type QueryAnchor = (key: string) => ClassListHost | null;

let currentOwner: HoverBrightOwner | null = null;
let currentTargets: ClassListHost[] = [];
let pointerGuardInstalled = false;
const POINTER_GUARD_OWNER: HoverBrightOwner = { source: 'pointer-guard' };

function resolveRoot(root?: SweepRoot | null): SweepRoot | null {
  if (root) return root;
  if (typeof document !== 'undefined') return document;
  return null;
}

function sweepSlotHighlights(root?: SweepRoot | null): void {
  const doc = resolveRoot(root);
  if (!doc) return;
  const nodes = doc.querySelectorAll(HOVER_BRIGHT_SWEEP_SELECTOR);
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].classList.remove(HOVER_BRIGHT_CLASS);
  }
}

function removeTrackedTargets(): void {
  for (const el of currentTargets) {
    el.classList.remove(HOVER_BRIGHT_CLASS);
  }
  currentTargets = [];
}

function nodeInsideCurrentTargets(node: Node): boolean {
  for (const el of currentTargets) {
    if (typeof el.contains === 'function' && el.contains(node)) return true;
  }
  return false;
}

/** Drop all slot highlights. Pass `owner` to no-op when another hover owns the pair. */
export function clearSlotHoverBright(owner?: HoverBrightOwner | null, root?: SweepRoot | null): void {
  if (owner && currentOwner !== owner) return;
  sweepSlotHighlights(root);
  removeTrackedTargets();
  currentOwner = null;
}

/** Unconditionally clear slot highlights (pointer left the canvas, modal opened, etc.). */
export function forceClearSlotHoverBright(root?: SweepRoot | null): void {
  sweepSlotHighlights(root);
  removeTrackedTargets();
  currentOwner = null;
}

/**
 * Light `targets` after clearing every leftover slot highlight.
 * Call on pointer enter; the previous pair cannot remain lit.
 */
export function applySlotHoverBright(
  owner: HoverBrightOwner,
  targets: Array<ClassListHost | null | undefined>,
  root?: SweepRoot | null,
): void {
  sweepSlotHighlights(root);
  removeTrackedTargets();
  currentOwner = owner;
  const next: ClassListHost[] = [];
  for (const el of targets) {
    if (!el) continue;
    el.classList.add(HOVER_BRIGHT_CLASS);
    next.push(el);
  }
  currentTargets = next;
}

export function parseAnchorKey(key: string): { side: 'A' | 'B'; slot: string; talismanIndex?: number } | null {
  const match = /^([AB]):([^:]+)(?::t(\d+))?$/.exec(key);
  if (!match) return null;
  return {
    side: match[1] as 'A' | 'B',
    slot: match[2],
    talismanIndex: match[3] !== undefined ? Number(match[3]) : undefined,
  };
}

/** Primary trigger plus opposite-side mirror (and talisman containers when present). */
export function collectPairedHoverTargets(options: {
  trigger: ClassListHost | null | undefined;
  talismanIndex?: number;
  side?: 'A' | 'B';
  slot?: string;
  queryAnchor: QueryAnchor;
}): ClassListHost[] {
  const { trigger, talismanIndex, side, slot, queryAnchor } = options;
  const targets: ClassListHost[] = [];
  if (trigger) {
    targets.push(trigger);
    if (typeof talismanIndex === 'number' && typeof trigger.closest === 'function') {
      const talismanContainer = trigger.closest('[data-talisman-index]');
      if (talismanContainer) targets.push(talismanContainer);
    }
  }
  if (side && slot) {
    const otherSide = side === 'A' ? 'B' : 'A';
    const otherKey = `${otherSide}:${slot}${typeof talismanIndex === 'number' ? `:t${talismanIndex}` : ''}`;
    const other = queryAnchor(otherKey);
    if (other) {
      targets.push(other);
      if (typeof talismanIndex === 'number' && typeof other.closest === 'function') {
        const mirrorTalisman = other.closest('[data-talisman-index]');
        if (mirrorTalisman) targets.push(mirrorTalisman);
      }
    }
  }
  return targets;
}

function queryDocumentAnchor(key: string): ClassListHost | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(`[data-anchor-key="${key}"]`);
}

function isLit(el: ClassListHost | null | undefined): boolean {
  if (!el) return false;
  if (el.classList.contains?.(HOVER_BRIGHT_CLASS)) return true;
  if (typeof el.closest === 'function' && el.closest(`.${HOVER_BRIGHT_CLASS}`)) return true;
  const withQuery = el as ClassListHost & { querySelector?: (selector: string) => unknown };
  if (typeof withQuery.querySelector === 'function' && withQuery.querySelector(`.${HOVER_BRIGHT_CLASS}`)) {
    return true;
  }
  return false;
}

function relatedTargetIsSlot(relatedTarget: EventTarget | null | undefined): boolean {
  const related = relatedTarget instanceof Element ? relatedTarget : null;
  return !!(related && typeof related.closest === 'function' && related.closest('[data-anchor-key]'));
}

/**
 * Leave/unmount cleanup. Moving to another slot does not wipe that slot's pair.
 * Leaving the canvas, a modal, or unmounting while this trigger is still lit always clears.
 */
export function releaseSlotHoverBright(
  owner: HoverBrightOwner,
  trigger?: ClassListHost | null,
  relatedTarget?: EventTarget | null,
  root?: SweepRoot | null,
): void {
  if (relatedTargetIsSlot(relatedTarget)) {
    clearSlotHoverBright(owner, root);
    return;
  }
  if (currentOwner === owner || isLit(trigger)) {
    forceClearSlotHoverBright(root);
    return;
  }
  clearSlotHoverBright(owner, root);
}

/** Apply the pair for a `data-anchor-key` node (used when mouseenter is skipped). */
export function applySlotHoverBrightFromAnchor(anchor: ClassListHost, root?: SweepRoot | null): void {
  const key = typeof anchor.getAttribute === 'function' ? anchor.getAttribute('data-anchor-key') : null;
  if (!key) return;
  const parsed = parseAnchorKey(key);
  if (!parsed) {
    applySlotHoverBright(POINTER_GUARD_OWNER, [anchor], root);
    return;
  }
  const targets = collectPairedHoverTargets({
    trigger: anchor,
    talismanIndex: parsed.talismanIndex,
    side: parsed.side,
    slot: parsed.slot,
    queryAnchor: queryDocumentAnchor,
  });
  applySlotHoverBright(POINTER_GUARD_OWNER, targets, root);
}

function alreadySlotHighlighted(anchor: ClassListHost): boolean {
  if (anchor.classList.contains?.(HOVER_BRIGHT_CLASS)) return true;
  if (typeof anchor.closest === 'function') {
    const parent = anchor.closest(`.${HOVER_BRIGHT_CLASS}`);
    if (parent) return true;
  }
  return false;
}

function onDocumentPointerOver(event: Event): void {
  const raw = event.target;
  const target = raw instanceof Element ? raw : (raw as Node | null)?.parentElement;
  if (!target) return;

  const anchor = typeof target.closest === 'function'
    ? target.closest('[data-anchor-key]')
    : null;
  if (anchor) {
    if (!alreadySlotHighlighted(anchor)) {
      applySlotHoverBrightFromAnchor(anchor);
    }
    return;
  }

  if (nodeInsideCurrentTargets(target)) return;
  forceClearSlotHoverBright();
}

function onDocumentPointerLeave(): void {
  forceClearSlotHoverBright();
}

function onWindowBlur(): void {
  forceClearSlotHoverBright();
}

/**
 * One-time listeners so a missed mouseleave cannot stick: pointerover on a
 * non-slot clears leftovers; pointerover on a slot applies that pair.
 */
export function ensureSlotHoverBrightPointerGuard(): void {
  if (pointerGuardInstalled) return;
  if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  pointerGuardInstalled = true;
  document.addEventListener('pointerover', onDocumentPointerOver, true);
  document.addEventListener('pointerleave', onDocumentPointerLeave);
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('blur', onWindowBlur);
  }
}

/** Test-only: drop owner/target bookkeeping without requiring a DOM. */
export function resetSlotHoverBrightState(): void {
  currentOwner = null;
  currentTargets = [];
}
