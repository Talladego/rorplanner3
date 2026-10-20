import { deflateSync, inflateSync } from 'fflate';
import { Career, Loadout, LoadoutItem, EquipSlot, LoadoutSide } from '../../types';
import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
import { loadoutService } from './loadoutService';
import { emptyRenownAbilities, isActiveRenownAbilityKey, RENOWN_PACK_KEYS } from './renownConfig';

export interface DecodedShareLoadout {
	career: Career | null;
	level: number;
	renownRank: number;
	renownAbilities: NonNullable<Loadout['renownAbilities']>;
	items: Record<string, { item: { id: string } | null; talismans: ({ id: string } | null)[] }>;
}

export interface DecodedCompareShare {
	a: DecodedShareLoadout | null;
	b: DecodedShareLoadout | null;
	activeSide: LoadoutSide;
}

class UrlService {
	private navigateCb: ((path: string, options?: { replace?: boolean }) => void) | null = null;
	private suppressUpdates = false;
	private autoUpdateEnabled = false;
	private navigationHandlingEnabled = false;
	/** Bump only when the packed layout itself becomes incompatible. */
	private readonly SHARE_PACK_VERSION = 1;
	private readonly SHARE_PACKED_PARAM = 'p';
	/**
	 * Marks a deflated payload. `~` is percent-encoded as `%7E` by
	 * `URLSearchParams`; `.` is left as-is.
	 */
	private readonly SHARE_PACK_COMPRESSED_PREFIX = '.';
	/**
	 * Decoded packed-payload cap. A real loadout is a few hundred bytes;
	 * 64 KiB stays well above that and is also the inflate output limit,
	 * so a crafted `p=` cannot expand to megabytes.
	 */
	private readonly MAX_PACKED_BYTES = 64 * 1024;
	private readonly MAX_RENOWN_BYTES = 64;
	private readonly MAX_TALISMANS = 32;
	private readonly MAX_ID_BYTES = 256;
	/**
	 * Equipment order inside one packed side. Trophy slots are omitted.
	 * Append-only for a given SHARE_PACK_VERSION: each side is a fixed
	 * sequence, so inserting or reordering a slot needs a new version.
	 * Renown keys are different — see RENOWN_PACK_KEYS. Their block is
	 * length-prefixed, so appending a key does not shift later fields.
	 */
	private readonly SHARE_SLOT_ORDER: EquipSlot[] = [
		EquipSlot.MAIN_HAND,
		EquipSlot.OFF_HAND,
		EquipSlot.RANGED_WEAPON,
		EquipSlot.EITHER_HAND,
		EquipSlot.BODY,
		EquipSlot.GLOVES,
		EquipSlot.BOOTS,
		EquipSlot.HELM,
		EquipSlot.SHOULDER,
		EquipSlot.POCKET1,
		EquipSlot.POCKET2,
		EquipSlot.BACK,
		EquipSlot.BELT,
		EquipSlot.JEWELLERY1,
		EquipSlot.JEWELLERY2,
		EquipSlot.JEWELLERY3,
		EquipSlot.JEWELLERY4,
		EquipSlot.STANDARD,
		EquipSlot.EVENT,
	];

	setAutoUpdateEnabled(val: boolean) { this.autoUpdateEnabled = val; }
	isAutoUpdateEnabled(): boolean { return this.autoUpdateEnabled; }
	setNavigationHandlingEnabled(val: boolean) { this.navigationHandlingEnabled = val; }
	isNavigationHandlingEnabled(): boolean { return this.navigationHandlingEnabled; }

	setNavigateCallback(callback: ((path: string, options?: { replace?: boolean }) => void) | null) {
		this.navigateCb = callback;
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

	decodeLoadoutFromUrlWithPrefix(prefix: 'a' | 'b'): DecodedShareLoadout | null {
		const params = this.getSearchParams();
		const hasAny = Array.from(params.keys()).some((k) => k.startsWith(`${prefix}.`));
		if (!hasAny) return null;
		const loadout = { career: null as Career | null, level: 40, renownRank: 80, renownAbilities: emptyRenownAbilities(), items: {} as Record<string, { item: { id: string } | null; talismans: ({ id: string } | null)[] }> };
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
				const rKey = key.substring(`${prefix}.renown.`.length);
				const n = Math.max(0, Math.min(5, Math.trunc(parseInt(value, 10) || 0)));
				// Skip retired Regeneration and unknown keys; remaining zeros are filled by emptyRenownAbilities
				if (n > 0 && isActiveRenownAbilityKey(rKey)) {
					(loadout.renownAbilities as Record<string, number>)[rKey] = n;
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
			if (key.startsWith('a.') || key.startsWith('b.') || key === this.SHARE_PACKED_PARAM) params[key] = null;
		}
		params.loadCharacterA = null;
		params.loadCharacterB = null;
		// `s` (stats toggles) and `activeSide` stay as their own query params.
		if (aLoadout || bLoadout) {
			const activeSide: LoadoutSide = current.get('activeSide') === 'b' ? 'B' : 'A';
			params[this.SHARE_PACKED_PARAM] = this.packCompareState(aLoadout, bLoadout, { activeSide });
		} else {
			params[this.SHARE_PACKED_PARAM] = null;
		}
		this.updateUrl(params, { replace: true });
	}

	async handleCharacterFromUrl(_characterName: string): Promise<void> {
		if (!_characterName) return;
		this.suppressUpdates = true;
		try { await loadoutService.loadFromNamedCharacter(_characterName); } finally { this.suppressUpdates = false; }
	}

	/**
	 * Read compare state from the current URL.
	 * A valid `p=` wins. A missing or corrupt `p=` is ignored and legacy
	 * `a.*` / `b.*` params are used instead. Returns null when neither
	 * form describes a loadout. Does not read `s` (stats toggles).
	 */
	decodeCompareShare(): DecodedCompareShare | null {
		const params = this.getSearchParams();
		const packed = params.get(this.SHARE_PACKED_PARAM);
		if (packed) {
			const decoded = this.unpackCompareState(packed);
			if (decoded) return decoded;
		}
		const a = this.decodeLoadoutFromUrlWithPrefix('a');
		const b = this.decodeLoadoutFromUrlWithPrefix('b');
		if (!a && !b) return null;
		const activeSide: LoadoutSide = params.get('activeSide') === 'b' ? 'B' : 'A';
		return { a, b, activeSide };
	}

	async handleCompareFromUrl(): Promise<void> {
		const params = this.getSearchParams();
		const decoded = this.decodeCompareShare();
		const a = decoded?.a ?? null;
		const b = decoded?.b ?? null;
		const charA = params.get('loadCharacterA');
		const charB = params.get('loadCharacterB');
		if (!a && !b && !charA && !charB) return;
		const active = (decoded?.activeSide ?? (params.get('activeSide') === 'b' ? 'B' : 'A')) as LoadoutSide;
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
					if (!isActiveRenownAbilityKey(rk)) return;
					const n = Math.max(0, Math.min(5, Math.trunc(Number(lvl) || 0)));
					if (n > 0) loadoutService.setRenownAbilityLevelForLoadout(aId, rk, n);
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
					if (!isActiveRenownAbilityKey(rk)) return;
					const n = Math.max(0, Math.min(5, Math.trunc(Number(lvl) || 0)));
					if (n > 0) loadoutService.setRenownAbilityLevelForLoadout(bId, rk, n);
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

	clearLoadoutFromUrl(): void {
		const params = this.getSearchParams();
		const toDelete: Record<string, string | null> = {};
		for (const k of Array.from(params.keys())) toDelete[k] = null;
		this.updateUrl(toDelete, { replace: true });
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

		if (params.has(this.SHARE_PACKED_PARAM)) {
			const a = side === 'A' ? null : loadoutStoreAdapter.getLoadoutForSide('A');
			const b = side === 'B' ? null : loadoutStoreAdapter.getLoadoutForSide('B');
			const activeSide: LoadoutSide = params.get('activeSide') === 'b' ? 'B' : 'A';
			toDelete[this.SHARE_PACKED_PARAM] = (a || b) ? this.packCompareState(a, b, { activeSide }) : null;
		}

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
		// Loadouts live in `p=`. Stats toggles stay in `s=` so StatsComparePanel
		// can keep reading that param on its own.
		const query = new URLSearchParams();
		if (a || b) query.set(this.SHARE_PACKED_PARAM, this.packCompareState(a, b));
		if (options) {
			let mask = 0;
			if (options.includeBaseStats) mask |= 1; // bit0
			if (options.includeRenownStats) mask |= 2; // bit1
			if (options.includeDerivedStats) mask |= 4; // bit2
			query.set('s', String(mask));
		}
		const qs = query.toString();
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
		const bin = this.packRenownAbilitiesToBytes(ra);
		if (!bin) return '';
		return this.bytesToBase64Url(bin);
	}

	private unpackRenownAbilities(packed: string): NonNullable<Loadout['renownAbilities']> {
		return this.unpackRenownAbilitiesFromBytes(this.base64UrlToBytes(packed));
	}

	// ===== Packed compare share encoding =====
	// Layout (version 1):
	//   u8 version
	//   u8 flags: bit0 hasA, bit1 hasB, bit5 activeSide B. Bits 2-4 and 6-7 are reserved.
	//   Stats toggles are NOT in this payload; they stay in the `s` query param.
	//   For each present side: career varint, level varint, renownRank varint,
	//   renown byte-length varint, renown bytes (RENOWN_PACK_KEYS, 3 bits each),
	//   then every SHARE_SLOT_ORDER entry as tagged item id + talisman list.
	private packCompareState(
		a: Loadout | null,
		b: Loadout | null,
		options?: { activeSide?: LoadoutSide },
	): string {
		const bytes: number[] = [];
		bytes.push(this.SHARE_PACK_VERSION);
		let flags = 0;
		if (a) flags |= 1;
		if (b) flags |= 2;
		if ((options?.activeSide ?? 'A') === 'B') flags |= 1 << 5;
		bytes.push(flags & 0xFF);
		if (a) this.writePackedLoadout(bytes, a);
		if (b) this.writePackedLoadout(bytes, b);
		return this.encodePackedBytes(new Uint8Array(bytes));
	}

	private unpackCompareState(packed: string): DecodedCompareShare | null {
		try {
			const bin = this.decodePackedBytes(packed);
			if (bin.length < 2) return null;
			if (bin[0] !== this.SHARE_PACK_VERSION) return null;
			const flags = bin[1];
			const hasA = (flags & 1) !== 0;
			const hasB = (flags & 2) !== 0;
			const activeSide: LoadoutSide = (flags & (1 << 5)) !== 0 ? 'B' : 'A';
			const ref = { i: 2 };
			const a = hasA ? this.readPackedLoadout(bin, ref) : null;
			const b = hasB ? this.readPackedLoadout(bin, ref) : null;
			if (ref.i !== bin.length) return null;
			return { a, b, activeSide };
		} catch {
			return null;
		}
	}

	private writePackedLoadout(out: number[], loadout: Loadout): void {
		const careerIdx = loadout.career ? this.careersList.indexOf(loadout.career) : -1;
		this.writeVarint(out, careerIdx >= 0 ? careerIdx + 1 : 0);
		this.writeVarint(out, Math.max(0, Math.trunc(Number(loadout.level) || 0)));
		this.writeVarint(out, Math.max(0, Math.trunc(Number(loadout.renownRank) || 0)));
		// Length-prefixed so appending a key to RENOWN_PACK_KEYS only grows this block.
		const ra = loadout.renownAbilities ?? emptyRenownAbilities();
		const raBytes = this.packRenownAbilitiesToBytes(ra);
		if (!raBytes) {
			this.writeVarint(out, 0);
		} else {
			this.writeVarint(out, raBytes.length);
			for (const b of raBytes) out.push(b);
		}
		for (const slot of this.SHARE_SLOT_ORDER) {
			const slotData: LoadoutItem | undefined = loadout.items?.[slot];
			this.writeTaggedId(out, slotData?.item?.id);
			const talismans = slotData?.talismans ?? [];
			let count = talismans.length;
			while (count > 0 && !talismans[count - 1]?.id) count--;
			this.writeVarint(out, count);
			for (let i = 0; i < count; i++) this.writeTaggedId(out, talismans[i]?.id);
		}
	}

	private readPackedLoadout(bytes: Uint8Array, ref: { i: number }): DecodedShareLoadout {
		const careerCode = this.readVarint(bytes, ref);
		const career = careerCode > 0 && careerCode <= this.careersList.length ? this.careersList[careerCode - 1] : null;
		const level = this.readVarint(bytes, ref);
		const renownRank = this.readVarint(bytes, ref);
		const raLen = this.readVarint(bytes, ref);
		if (raLen > this.MAX_RENOWN_BYTES) throw new Error('Renown block too large');
		if (ref.i + raLen > bytes.length) throw new Error('Truncated renown');
		const raBytes = bytes.subarray(ref.i, ref.i + raLen);
		ref.i += raLen;
		const renownAbilities = this.unpackRenownAbilitiesFromBytes(raBytes);
		const items: DecodedShareLoadout['items'] = {};
		for (const slot of this.SHARE_SLOT_ORDER) {
			const itemId = this.readTaggedId(bytes, ref);
			const talCount = this.readVarint(bytes, ref);
			if (talCount > this.MAX_TALISMANS) throw new Error('Too many talismans');
			const talismans: ({ id: string } | null)[] = [];
			for (let i = 0; i < talCount; i++) {
				const tid = this.readTaggedId(bytes, ref);
				talismans[i] = tid ? { id: tid } : null;
			}
			const hasAnyTal = talismans.some((t) => !!t?.id);
			if (itemId || hasAnyTal) items[slot] = { item: itemId ? { id: itemId } : null, talismans };
		}
		return { career, level, renownRank, renownAbilities, items };
	}

	// ===== Byte helpers =====
	private packRenownAbilitiesToBytes(ra: NonNullable<Loadout['renownAbilities']>): Uint8Array | null {
		// Same positions as RENOWN_PACK_KEYS. Retired regeneration is always 0.
		const vals = RENOWN_PACK_KEYS.map((k) => {
			if (k === 'regeneration') return 0;
			const n = Number((ra as Record<string, number | undefined>)[k] || 0);
			return Math.max(0, Math.min(5, Math.trunc(n)));
		});
		if (vals.every((v) => v === 0)) return null;
		let bitBuf = 0;
		let bitCount = 0;
		const bytes: number[] = [];
		for (const v of vals) {
			bitBuf |= (v & 0x7) << bitCount;
			bitCount += 3;
			while (bitCount >= 8) {
				bytes.push(bitBuf & 0xFF);
				bitBuf >>= 8;
				bitCount -= 8;
			}
		}
		if (bitCount > 0) bytes.push(bitBuf & 0xFF);
		return new Uint8Array(bytes);
	}

	private unpackRenownAbilitiesFromBytes(bytes: Uint8Array): NonNullable<Loadout['renownAbilities']> {
		const res = emptyRenownAbilities();
		try {
			let bitBuf = 0;
			let bitCount = 0;
			let bi = 0;
			// Only known keys are consumed. Extra trailing bits (a newer key list)
			// are ignored; missing trailing bits (an older payload) stay 0.
			for (let i = 0; i < RENOWN_PACK_KEYS.length; i++) {
				while (bitCount < 3) {
					const byte = bytes[bi++];
					if (byte === undefined) break;
					bitBuf |= byte << bitCount;
					bitCount += 8;
				}
				const v = bitBuf & 0x7;
				bitBuf >>= 3;
				bitCount -= 3;
				const key = RENOWN_PACK_KEYS[i];
				if (key !== 'regeneration' && isActiveRenownAbilityKey(key)) {
					res[key] = v;
				}
			}
		} catch {
			// ignore malformed packed data, leave zeros
		}
		return res;
	}

	private writeTaggedId(out: number[], id: string | null | undefined): void {
		if (id == null || id === '') {
			this.writeVarint(out, 0);
			return;
		}
		const raw = String(id);
		if (/^\d+$/.test(raw)) {
			const n = Number(raw);
			// The stored tag is n + 2. An id next to MAX_SAFE_INTEGER would
			// make that tag unsafe and fail the whole link, so it is written
			// as a string. Leading zeros must stay strings too: "0123" is not
			// the same id as 123.
			if (n >= 0 && Number.isSafeInteger(n + 2) && String(n) === raw) {
				this.writeVarint(out, n + 2);
				return;
			}
		}
		this.writeVarint(out, 1);
		const utf8 = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(raw) : new Uint8Array();
		this.writeVarint(out, utf8.length);
		for (const b of utf8) out.push(b);
	}

	private readTaggedId(bytes: Uint8Array, ref: { i: number }): string | null {
		const tag = this.readVarint(bytes, ref);
		if (tag === 0) return null;
		if (tag === 1) {
			const len = this.readVarint(bytes, ref);
			if (len > this.MAX_ID_BYTES) throw new Error('Id string too long');
			const end = ref.i + len;
			if (end > bytes.length) throw new Error('Truncated string');
			const slice = bytes.subarray(ref.i, end);
			ref.i = end;
			if (typeof TextDecoder === 'undefined') return null;
			return new TextDecoder().decode(slice);
		}
		if (!Number.isSafeInteger(tag - 2) || tag < 2) throw new Error('Bad id tag');
		return String(tag - 2);
	}

	private writeVarint(out: number[], n: number): void {
		let v = Math.max(0, Math.trunc(Number(n) || 0));
		while (v >= 0x80) {
			out.push((v % 0x80) | 0x80);
			v = Math.floor(v / 0x80);
		}
		out.push(v);
	}

	private readVarint(bytes: Uint8Array, ref: { i: number }): number {
		let result = 0;
		let factor = 1;
		for (let n = 0; n < 8; n++) {
			if (ref.i >= bytes.length) throw new Error('Truncated varint');
			const b = bytes[ref.i++];
			result += (b & 0x7f) * factor;
			if ((b & 0x80) === 0) {
				if (!Number.isSafeInteger(result)) throw new Error('Varint too large');
				return result;
			}
			factor *= 128;
		}
		throw new Error('Varint too large');
	}

	private bytesToBase64Url(bin: Uint8Array): string {
		const b64 = (() => {
			type BufferLike = { from(input: string | Uint8Array, enc?: string): { toString(enc: string): string } | Uint8Array };
			if (typeof btoa === 'function') {
				const binStr = Array.from(bin).map((b) => String.fromCharCode(b)).join('');
				return btoa(binStr);
			}
			const Buf = (globalThis as unknown as { Buffer?: BufferLike }).Buffer;
			if (Buf) return (Buf.from(bin) as unknown as { toString(enc: string): string }).toString('base64');
			return '';
		})();
		return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}

	private base64UrlToBytes(packed: string): Uint8Array {
		try {
			const b64 = packed.replace(/-/g, '+').replace(/_/g, '/');
			const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
			const normalized = `${b64}${pad}`;
			if (typeof atob === 'function') {
				const binStr = atob(normalized);
				return new Uint8Array(Array.from(binStr).map((ch) => ch.charCodeAt(0)));
			}
			const Buf = (globalThis as unknown as { Buffer?: { from(input: string, enc: string): Uint8Array } }).Buffer;
			if (Buf) return Buf.from(normalized, 'base64');
			return new Uint8Array();
		} catch {
			return new Uint8Array();
		}
	}

	private encodePackedBytes(bin: Uint8Array): string {
		try {
			const deflated = deflateSync(bin, { level: 9 });
			return `${this.SHARE_PACK_COMPRESSED_PREFIX}${this.bytesToBase64Url(deflated)}`;
		} catch {
			return this.bytesToBase64Url(bin);
		}
	}

	private decodePackedBytes(packed: string): Uint8Array {
		if (!packed) return new Uint8Array();
		if (packed.startsWith(this.SHARE_PACK_COMPRESSED_PREFIX)) {
			const raw = this.base64UrlToBytes(packed.slice(this.SHARE_PACK_COMPRESSED_PREFIX.length));
			if (raw.length === 0) throw new Error('Empty deflate block');
			// One byte past the cap: a full buffer means the stream met or
			// exceeded it. fflate truncates into `out` instead of allocating
			// the whole inflated size. Callers catch this and return null.
			const limit = this.MAX_PACKED_BYTES;
			const inflated = inflateSync(raw, { out: new Uint8Array(limit + 1) });
			if (inflated.length > limit) throw new Error('Inflated share payload too large');
			return inflated;
		}
		const raw = this.base64UrlToBytes(packed);
		if (raw.length > this.MAX_PACKED_BYTES) throw new Error('Share payload too large');
		return raw;
	}
}

export const urlService = new UrlService();
