import { Career, Loadout, LoadoutItem, EquipSlot, LoadoutSide } from '../../types';
import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
import { loadoutService } from './loadoutService';

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
		// Career compact code
		if (loadout.career) params.c = this.encodeCareer(loadout.career);
		// Always include level and renownRank per requirement (compact keys)
		params.l = String(loadout.level);
		params.r = String(loadout.renownRank);
		// Pack renown abilities into a compact string if any > 0
		const ra = loadout.renownAbilities || ({} as NonNullable<Loadout['renownAbilities']>);
		const raPacked = this.packRenownAbilities(ra);
		if (raPacked) params.ra = raPacked;
		// Compact slot moniker mapping to reduce URL length
		const SLOT_TO_MONIKER: Record<string, string> = {
			MAIN_HAND: 'mh',
			OFF_HAND: 'oh',
			RANGED_WEAPON: 'rw',
			EITHER_HAND: 'eh',
			BODY: 'bd',
			GLOVES: 'gl',
			BOOTS: 'bt',
			HELM: 'hm',
			SHOULDER: 'sh',
			POCKET1: 'p1',
			POCKET2: 'p2',
			BACK: 'bk',
			BELT: 'bl',
			JEWELLERY1: 'j1',
			JEWELLERY2: 'j2',
			JEWELLERY3: 'j3',
			JEWELLERY4: 'j4',
			STANDARD: 'st',
			EVENT: 'ev',
		};
		Object.entries(loadout.items).forEach(([slot, slotData]: [string, LoadoutItem]) => {
			// Skip trophy slots entirely in share URLs
			if (slot.startsWith('TROPHY')) return;
			const keySlot = SLOT_TO_MONIKER[slot] || slot;
			// Use compact prefixes
			if (slotData?.item?.id) params[`i.${keySlot}`] = slotData.item.id;
			if (slotData?.talismans) {
				slotData.talismans.forEach((talisman, index: number) => {
					if (talisman?.id) params[`t.${keySlot}.${index}`] = talisman.id;
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
		renownAbilities: NonNullable<Loadout['renownAbilities']>;
		items: Record<string, { item: { id: string } | null; talismans: ({ id: string } | null)[] }>;
	} | null {
		const params = this.getSearchParams();
		const hasAny = Array.from(params.keys()).some((k) => k.startsWith(`${prefix}.`));
		if (!hasAny) return null;
		const loadout = { career: null as Career | null, level: 40, renownRank: 80, renownAbilities: {
			might: 0, bladeMaster: 0, marksman: 0, impetus: 0, acumen: 0, resolve: 0, fortitude: 0, vigor: 0,
			opportunist: 0, spiritualRefinement: 0, regeneration: 0,
			reflexes: 0, defender: 0, deftDefender: 0, hardyConcession: 0, futileStrikes: 0, trivialBlows: 0,
		} as NonNullable<Loadout['renownAbilities']>, items: {} as Record<string, { item: { id: string } | null; talismans: ({ id: string } | null)[] }> };
		const MONIKER_TO_SLOT: Record<string, string> = {
			mh: 'MAIN_HAND',
			oh: 'OFF_HAND',
			rw: 'RANGED_WEAPON',
			eh: 'EITHER_HAND',
			bd: 'BODY',
			gl: 'GLOVES',
			bt: 'BOOTS',
			hm: 'HELM',
			sh: 'SHOULDER',
			p1: 'POCKET1',
			p2: 'POCKET2',
			bk: 'BACK',
			bl: 'BELT',
			j1: 'JEWELLERY1',
			j2: 'JEWELLERY2',
			j3: 'JEWELLERY3',
			j4: 'JEWELLERY4',
			st: 'STANDARD',
			ev: 'EVENT',
		};
		// Career: compact 'c' or legacy 'career'
		const careerCode = params.get(`${prefix}.c`);
		const careerParam = params.get(`${prefix}.career`);
		if (careerCode) {
			const c = this.decodeCareer(careerCode);
			if (c) loadout.career = c;
		} else if (careerParam) {
			loadout.career = careerParam as Career;
		}
		// Level/Renown: compact 'l'/'r' or legacy 'level'/'renownRank'
		const levelParam = params.get(`${prefix}.l`) || params.get(`${prefix}.level`);
		if (levelParam) loadout.level = parseInt(levelParam, 10);
		const renownParam = params.get(`${prefix}.r`) || params.get(`${prefix}.renownRank`);
		if (renownParam) loadout.renownRank = parseInt(renownParam, 10);
		// Renown abilities: packed 'ra' or legacy 'renown.*'
		const raPacked = params.get(`${prefix}.ra`);
		if (raPacked) {
			const decoded = this.unpackRenownAbilities(raPacked);
			Object.assign(loadout.renownAbilities, decoded);
		}
		for (const [key, value] of params.entries()) {
			if (key.startsWith(`${prefix}.item.`) || key.startsWith(`${prefix}.i.`)) {
				const base = key.startsWith(`${prefix}.item.`) ? `${prefix}.item.` : `${prefix}.i.`;
				const slotKey = key.substring(base.length);
				const slot = MONIKER_TO_SLOT[slotKey] || slotKey;
				// Ignore trophy slots from URL decoding
				if (slot.startsWith('TROPHY')) continue;
				if (!loadout.items[slot]) loadout.items[slot] = { item: null, talismans: [] };
				loadout.items[slot].item = { id: value };
			} else if (key.startsWith(`${prefix}.talisman.`) || key.startsWith(`${prefix}.t.`)) {
				const base = key.startsWith(`${prefix}.talisman.`) ? `${prefix}.talisman.` : `${prefix}.t.`;
				const rest = key.substring(base.length);
				const parts = rest.split('.');
				if (parts.length === 2) {
					const slotKey = parts[0];
					const slot = MONIKER_TO_SLOT[slotKey] || slotKey;
					// Ignore trophy slots from URL decoding
					if (slot.startsWith('TROPHY')) continue;
					const index = parseInt(parts[1], 10);
					if (!loadout.items[slot]) loadout.items[slot] = { item: null, talismans: [] };
					loadout.items[slot].talismans[index] = { id: value };
				}
			} else if (key.startsWith(`${prefix}.renown.`)) {
				const rKey = key.substring(`${prefix}.renown.`.length) as keyof NonNullable<Loadout['renownAbilities']>;
				const n = Math.max(0, Math.min(5, Math.trunc(parseInt(value, 10) || 0)));
				// Only set if value is > 0 to keep distinction; remaining will be zeroed during apply
				if (n > 0) (loadout.renownAbilities as Record<string, number>)[rKey as string] = n;
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
				// Apply renown abilities from URL (reset first to avoid residue)
				loadoutService.resetRenownAbilitiesForLoadout(aId);
				Object.entries(a.renownAbilities || {}).forEach(([rk, lvl]) => {
					const n = Math.max(0, Math.min(5, Math.trunc(Number(lvl) || 0)));
					if (n > 0) loadoutService.setRenownAbilityLevelForLoadout(aId, rk as keyof NonNullable<Loadout['renownAbilities']>, n);
				});
				const charAFlag = params.get('loadCharacterA');
				if (charAFlag) loadoutService.setCharacterStatusForLoadout(aId, true, charAFlag);
				const perSlotA = Object.entries(a.items)
					.filter(([slotKey]) => !slotKey.startsWith('TROPHY'))
					.map(([slotKey, data]) => (async () => {
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
				// Apply renown abilities from URL (reset first to avoid residue)
				loadoutService.resetRenownAbilitiesForLoadout(bId);
				Object.entries(b.renownAbilities || {}).forEach(([rk, lvl]) => {
					const n = Math.max(0, Math.min(5, Math.trunc(Number(lvl) || 0)));
					if (n > 0) loadoutService.setRenownAbilityLevelForLoadout(bId, rk as keyof NonNullable<Loadout['renownAbilities']>, n);
				});
				const charBFlag = params.get('loadCharacterB');
				if (charBFlag) loadoutService.setCharacterStatusForLoadout(bId, true, charBFlag);
				const perSlotB = Object.entries(b.items)
					.filter(([slotKey]) => !slotKey.startsWith('TROPHY'))
					.map(([slotKey, data]) => (async () => {
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

	buildCompareShareUrl(a: Loadout | null, b: Loadout | null, options?: { includeBaseStats?: boolean; includeRenownStats?: boolean; includeDerivedStats?: boolean }): string {
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
		// Include stats panel toggle state as single bitmask 's' (0-7)
		if (options) {
			let mask = 0;
			if (options.includeBaseStats) mask |= 1; // bit0
			if (options.includeRenownStats) mask |= 2; // bit1
			if (options.includeDerivedStats) mask |= 4; // bit2
			params['s'] = String(mask);
		}
		const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]).toString();
		return `${base}#/?${qs}`;
	}

	// ===== Compact helpers =====
	private careersList: Career[] = [
		'IRON_BREAKER', 'SLAYER', 'RUNE_PRIEST', 'ENGINEER',
		'BLACK_ORC', 'CHOPPA', 'SHAMAN', 'SQUIG_HERDER',
		'WITCH_HUNTER', 'KNIGHT_OF_THE_BLAZING_SUN', 'BRIGHT_WIZARD', 'WARRIOR_PRIEST',
		'CHOSEN', 'MARAUDER', 'ZEALOT', 'MAGUS',
		'SWORD_MASTER', 'SHADOW_WARRIOR', 'WHITE_LION', 'ARCHMAGE',
		'BLACK_GUARD', 'WITCH_ELF', 'DISCIPLE_OF_KHAINE', 'SORCERER',
	] as unknown as Career[];

	private encodeCareer(c: Career): string {
		const idx = this.careersList.indexOf(c);
		return idx >= 0 ? idx.toString(36) : c; // fallback to full name
	}

	private decodeCareer(code: string): Career | null {
		const n = parseInt(code, 36);
		if (Number.isFinite(n) && n >= 0 && n < this.careersList.length) return this.careersList[n];
		return null;
	}

	private packRenownAbilities(ra: NonNullable<Loadout['renownAbilities']>): string | '' {
		// Order of keys must be stable
		const keys: (keyof NonNullable<Loadout['renownAbilities']>)[] = [
			'might','bladeMaster','marksman','impetus','acumen','resolve','fortitude','vigor',
			'opportunist','spiritualRefinement','regeneration','reflexes','defender','deftDefender','hardyConcession','futileStrikes','trivialBlows',
		];
		const vals = keys.map(k => Math.max(0, Math.min(5, Math.trunc(Number(ra[k] as number || 0)))));
		if (vals.every(v => v === 0)) return '';
		// Pack 3 bits per value into a byte array
		let bitBuf = 0; let bitCount = 0; const bytes: number[] = [];
		for (const v of vals) {
			bitBuf |= (v & 0x7) << bitCount;
			bitCount += 3;
			while (bitCount >= 8) {
				bytes.push(bitBuf & 0xFF);
				bitBuf >>= 8; bitCount -= 8;
			}
		}
		if (bitCount > 0) bytes.push(bitBuf & 0xFF);
		// Convert to base64url
			const bin = new Uint8Array(bytes);
			// Convert bytes to base64
				const b64 = (() => {
					type BufferLike = { from(input: string | Uint8Array, enc?: string): { toString(enc: string): string } | Uint8Array };
				if (typeof btoa === 'function') {
					const binStr = Array.from(bin).map(b => String.fromCharCode(b)).join('');
					return btoa(binStr);
				}
					// Fallback: use Buffer if available (Node polyfill)
					const Buf = (globalThis as unknown as { Buffer?: BufferLike }).Buffer;
					if (Buf) {
						return (Buf.from(bin) as unknown as { toString(enc: string): string }).toString('base64');
				}
				// Very rare case in strict environments: return empty
				return '';
			})();
		return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}

	private unpackRenownAbilities(packed: string): NonNullable<Loadout['renownAbilities']> {
		const res = {
			might: 0, bladeMaster: 0, marksman: 0, impetus: 0, acumen: 0, resolve: 0, fortitude: 0, vigor: 0,
			opportunist: 0, spiritualRefinement: 0, regeneration: 0, reflexes: 0, defender: 0, deftDefender: 0, hardyConcession: 0, futileStrikes: 0, trivialBlows: 0,
		} as NonNullable<Loadout['renownAbilities']>;
		try {
			const b64 = packed.replace(/-/g, '+').replace(/_/g, '/');
							const bytes: number[] = (() => {
						if (typeof atob === 'function') {
							const binStr = atob(b64);
							return Array.from(binStr).map(ch => ch.charCodeAt(0));
						}
								const Buf = (globalThis as unknown as { Buffer?: { from(input: string, enc: string): Uint8Array } }).Buffer;
								if (Buf) {
									return Array.from(Buf.from(b64, 'base64'));
						}
						return [];
					})();
			const keys: (keyof NonNullable<Loadout['renownAbilities']>)[] = [
				'might','bladeMaster','marksman','impetus','acumen','resolve','fortitude','vigor',
				'opportunist','spiritualRefinement','regeneration','reflexes','defender','deftDefender','hardyConcession','futileStrikes','trivialBlows',
			];
					let bitBuf = 0; let bitCount = 0; let bi = 0;
			for (let i = 0; i < keys.length; i++) {
				while (bitCount < 3) {
					const byte = bytes[bi++];
					if (byte === undefined) break;
					bitBuf |= byte << bitCount; bitCount += 8;
				}
				const v = bitBuf & 0x7; bitBuf >>= 3; bitCount -= 3;
						(res)[keys[i]] = v;
			}
		} catch {
			// ignore malformed packed data, leave zeros
		}
		return res;
	}
}

export const urlService = new UrlService();
