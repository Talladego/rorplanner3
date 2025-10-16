import { Career, Loadout, LoadoutItem, EquipSlot, LoadoutSide } from '../../types';
import { loadoutStoreAdapter } from '../../store/loadoutStoreAdapter';
import { loadoutService } from '../loadoutService';

class UrlService {
	private navigateCb: ((path: string, options?: { replace?: boolean }) => void) | null = null;
	private suppressUpdates = false;
	private autoUpdateEnabled = false;
	private navigationHandlingEnabled = false;

	setAutoUpdateEnabled(val: boolean) { this.autoUpdateEnabled = val; }
	isAutoUpdateEnabled(): boolean { return this.autoUpdateEnabled; }
	setNavigationHandlingEnabled(val: boolean) { this.navigationHandlingEnabled = val; }
	isNavigationHandlingEnabled(): boolean { return this.navigationHandlingEnabled; }

	setNavigateCallback(_callback: (path: string, options?: { replace?: boolean }) => void) {
		this.navigateCb = _callback;
	}

	getSearchParams(): URLSearchParams {
		const hash = window.location.hash || '';
		const qIndex = hash.indexOf('?');
		if (qIndex >= 0) {
			const qs = hash.substring(qIndex + 1);
			return new URLSearchParams(qs);
		}
		const search = window.location.search || '';
		return new URLSearchParams(search.startsWith('?') ? search.substring(1) : search);
	}

	getParam(key: string): string | null {
		return this.getSearchParams().get(key);
	}

	updateUrl(_params: Record<string, string | null>, _options: { replace?: boolean } = {}) {
		if (this.suppressUpdates || !this.autoUpdateEnabled) return;
		const params = this.getSearchParams();
		Object.entries(_params).forEach(([k, v]) => {
			if (v === null || v === undefined) params.delete(k);
			else params.set(k, v);
		});
		const qs = params.toString();
		const path = `?${qs}`;
		if (this.navigateCb) {
			this.navigateCb(path, _options);
		} else {
			const base = window.location.href.split('#')[0];
			const newHash = `#/${qs ? `?${qs}` : ''}`;
			if (_options.replace) {
				window.history.replaceState(null, '', `${base}${newHash}`);
			} else {
				window.location.hash = `/${qs ? `?${qs}` : ''}`;
			}
		}
	}

	encodeLoadoutToUrl(loadout: Loadout): Record<string, string> {
		const params: Record<string, string> = {};
		if (loadout.career) params.career = loadout.career;
		if (loadout.level !== 40) params.level = String(loadout.level);
		if (loadout.renownRank !== 80) params.renownRank = String(loadout.renownRank);
		Object.entries(loadout.items).forEach(([slot, slotData]: [string, LoadoutItem]) => {
			if (slotData?.item?.id) params[`item.${slot}`] = slotData.item.id;
			if (slotData?.talismans) {
				slotData.talismans.forEach((talisman, index: number) => {
					if (talisman?.id) params[`talisman.${slot}.${index}`] = talisman.id;
				});
			}
		});
		return params;
	}

	encodeLoadoutToUrlWithPrefix(prefix: 'a' | 'b', loadout: Loadout): Record<string, string> {
		const base = this.encodeLoadoutToUrl(loadout);
		const prefixed: Record<string, string> = {};
		Object.entries(base).forEach(([k, v]) => { prefixed[`${prefix}.${k}`] = v; });
		return prefixed;
	}

	decodeLoadoutFromUrlWithPrefix(prefix: 'a' | 'b'): {
		career: Career | null;
		level: number;
		renownRank: number;
		items: Record<string, { item: { id: string } | null; talismans: ({ id: string } | null)[] }>;
	} | null {
		const params = this.getSearchParams();
		const hasAny = Array.from(params.keys()).some((k) => k.startsWith(`${prefix}.`));
		if (!hasAny) return null;
		const loadout = { career: null as Career | null, level: 40, renownRank: 80, items: {} as Record<string, { item: { id: string } | null; talismans: ({ id: string } | null)[] }> };
		const careerParam = params.get(`${prefix}.career`);
		if (careerParam) loadout.career = careerParam as Career;
		const levelParam = params.get(`${prefix}.level`);
		if (levelParam) loadout.level = parseInt(levelParam, 10);
		const renownParam = params.get(`${prefix}.renownRank`);
		if (renownParam) loadout.renownRank = parseInt(renownParam, 10);
		for (const [key, value] of params.entries()) {
			if (key.startsWith(`${prefix}.item.`)) {
				const slot = key.substring(`${prefix}.item.`.length);
				if (!loadout.items[slot]) loadout.items[slot] = { item: null, talismans: [] };
				loadout.items[slot].item = { id: value };
			} else if (key.startsWith(`${prefix}.talisman.`)) {
				const rest = key.substring(`${prefix}.talisman.`.length);
				const parts = rest.split('.');
				if (parts.length === 2) {
					const slot = parts[0];
					const index = parseInt(parts[1], 10);
					if (!loadout.items[slot]) loadout.items[slot] = { item: null, talismans: [] };
					loadout.items[slot].talismans[index] = { id: value };
				}
			}
		}
		return loadout;
	}

	updateUrlWithCompare(aLoadout: Loadout | null, bLoadout: Loadout | null): void {
		if (!this.autoUpdateEnabled) return;
		const params: Record<string, string | null> = {};
		const current = this.getSearchParams();
		for (const key of Array.from(current.keys())) {
			if (key.startsWith('a.') || key.startsWith('b.')) params[key] = null;
		}
		params.loadCharacterA = null;
		params.loadCharacterB = null;
		if (aLoadout) Object.assign(params, this.encodeLoadoutToUrlWithPrefix('a', aLoadout));
		if (bLoadout) Object.assign(params, this.encodeLoadoutToUrlWithPrefix('b', bLoadout));
		this.updateUrl(params, { replace: true });
	}

	async handleCharacterFromUrl(_characterName: string): Promise<void> {
		if (!_characterName) return;
		this.suppressUpdates = true;
		try { await loadoutService.loadFromNamedCharacter(_characterName); } finally { this.suppressUpdates = false; }
	}

	async handleCompareFromUrl(): Promise<void> {
		const params = this.getSearchParams();
		const a = this.decodeLoadoutFromUrlWithPrefix('a');
		const b = this.decodeLoadoutFromUrlWithPrefix('b');
		const charA = params.get('loadCharacterA');
		const charB = params.get('loadCharacterB');
		if (!a && !b && !charA && !charB) return;
		const active = (params.get('activeSide') === 'b' ? 'B' : 'A') as LoadoutSide;
		this.suppressUpdates = true;
		try {
			loadoutService.beginBulkApply();
			const hasA = !!a || !!params.get('loadCharacterA');
			const hasB = !!b || !!params.get('loadCharacterB');
			if (hasA && !hasB) loadoutService.ensureSideLoadout('B');
			else if (hasB && !hasA) loadoutService.ensureSideLoadout('A');
			if (a) {
				const aId = await loadoutService.selectSideForEdit('A');
				loadoutService.assignSideLoadout('A', aId);
				loadoutService.setLevelForLoadout(aId, a.level);
				loadoutService.setRenownForLoadout(aId, a.renownRank);
				loadoutService.setCareerForLoadout(aId, a.career);
				const charAFlag = params.get('loadCharacterA');
				if (charAFlag) loadoutService.setCharacterStatusForLoadout(aId, true, charAFlag);
				const perSlotA = Object.entries(a.items).map(([slotKey, data]) => (async () => {
					const slot = slotKey as unknown as EquipSlot;
					if (data.item?.id) {
						const item = await loadoutService.getItemWithDetails(data.item.id);
						await loadoutService.updateItemForLoadout(aId, slot, item);
					}
					for (let idx = 0; idx < data.talismans.length; idx++) {
						const t = data.talismans[idx];
						if (t?.id) {
							const tal = await loadoutService.getItemWithDetails(t.id);
							await loadoutService.updateTalismanForLoadout(aId, slot, idx, tal);
						}
					}
				})());
				await Promise.all(perSlotA);
			} else if (charA) {
				const aId = await loadoutService.selectSideForEdit('A');
				loadoutService.assignSideLoadout('A', aId);
				await loadoutService.loadFromNamedCharacter(charA);
			}
			if (b) {
				const bId = await loadoutService.selectSideForEdit('B');
				loadoutService.assignSideLoadout('B', bId);
				loadoutService.setLevelForLoadout(bId, b.level);
				loadoutService.setRenownForLoadout(bId, b.renownRank);
				loadoutService.setCareerForLoadout(bId, b.career);
				const charBFlag = params.get('loadCharacterB');
				if (charBFlag) loadoutService.setCharacterStatusForLoadout(bId, true, charBFlag);
				const perSlotB = Object.entries(b.items).map(([slotKey, data]) => (async () => {
					const slot = slotKey as unknown as EquipSlot;
					if (data.item?.id) {
						const item = await loadoutService.getItemWithDetails(data.item.id);
						await loadoutService.updateItemForLoadout(bId, slot, item);
					}
					for (let idx = 0; idx < data.talismans.length; idx++) {
						const t = data.talismans[idx];
						if (t?.id) {
							const tal = await loadoutService.getItemWithDetails(t.id);
							await loadoutService.updateTalismanForLoadout(bId, slot, idx, tal);
						}
					}
				})());
				await Promise.all(perSlotB);
			} else if (charB) {
				const bId = await loadoutService.selectSideForEdit('B');
				loadoutService.assignSideLoadout('B', bId);
				await loadoutService.loadFromNamedCharacter(charB);
			}
			loadoutService.setActiveSide(active);
			const aLoadout = loadoutStoreAdapter.getLoadoutForSide('A');
			const bLoadout = loadoutStoreAdapter.getLoadoutForSide('B');
			if (this.autoUpdateEnabled) this.updateUrlWithCompare(aLoadout, bLoadout);
		} finally {
			this.suppressUpdates = false;
			loadoutService.endBulkApply();
		}
	}

	updateUrlForCurrentLoadout(): void {
		const a = loadoutStoreAdapter.getLoadoutForSide('A');
		const b = loadoutStoreAdapter.getLoadoutForSide('B');
		if (!a && !b) return;
		this.updateUrlWithCompare(a, b);
	}

	clearCharacterFromUrl(): void { return; }

	clearLoadoutFromUrl(): void {
		const params = this.getSearchParams();
		const keys = Array.from(params.keys());
		keys.forEach(k => params.delete(k));
		this.updateUrl(Object.fromEntries(params.entries()), { replace: true });
	}

	clearSideFromUrl(side: LoadoutSide): void {
		const params = this.getSearchParams();
		const prefix = side === 'A' ? 'a.' : 'b.';
		const toDelete: Record<string, string | null> = {};
		for (const key of Array.from(params.keys())) {
			if (key.startsWith(prefix)) toDelete[key] = null;
		}
		if (side === 'A') toDelete.loadCharacterA = null;
		if (side === 'B') toDelete.loadCharacterB = null;
		this.updateUrl(toDelete, { replace: true });
	}

	buildCompareShareUrl(a: Loadout | null, b: Loadout | null): string {
		let base = window.location.href.split('#')[0];
		try {
			const isLocal = /^https?:\/\/localhost[:/]/.test(base) || /^https?:\/\/127\.0\.0\.1[:/]/.test(base);
			const ref = (document && document.referrer) || '';
			if (isLocal && ref && /\.github\.dev\//.test(ref)) base = ref.split('#')[0];
		} catch {
			// ignore referrer access issues
		}
		const params: Record<string, string | null> = {};
		if (a) Object.assign(params, this.encodeLoadoutToUrlWithPrefix('a', a));
		if (b) Object.assign(params, this.encodeLoadoutToUrlWithPrefix('b', b));
		const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]).toString();
		return `${base}#/?${qs}`;
	}
}

export const urlService = new UrlService();
