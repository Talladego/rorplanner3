import { Career } from '../types';

const BASE = 'https://killboard.returnofreckoning.com/images/icons';

export const CAREER_ICON_URL: Record<Career, string> = {
  [Career.BRIGHT_WIZARD]: `${BASE}/bright-wizard.png`,
  [Career.ENGINEER]: `${BASE}/engineer.png`,
  [Career.SHADOW_WARRIOR]: `${BASE}/shadow-warrior.png`,
  [Career.WHITE_LION]: `${BASE}/white-lion.png`,
  [Career.SWORD_MASTER]: `${BASE}/sword-master.png`,
  [Career.IRON_BREAKER]: `${BASE}/ironbreaker.png`,
  [Career.KNIGHT_OF_THE_BLAZING_SUN]: `${BASE}/knight-of-the-blazing-sun.png`,
  [Career.WARRIOR_PRIEST]: `${BASE}/warrior-priest.png`,
  [Career.RUNE_PRIEST]: `${BASE}/rune-priest.png`,
  [Career.WITCH_HUNTER]: `${BASE}/witch-hunter.png`,
  [Career.ARCHMAGE]: `${BASE}/archmage.png`,
  [Career.SLAYER]: `${BASE}/slayer.png`,

  [Career.SORCERER]: `${BASE}/sorcerer.png`,
  [Career.MAGUS]: `${BASE}/magus.png`,
  [Career.SQUIG_HERDER]: `${BASE}/squig-herder.png`,
  [Career.MARAUDER]: `${BASE}/marauder.png`,
  [Career.CHOPPA]: `${BASE}/choppa.png`,
  [Career.WITCH_ELF]: `${BASE}/witch-elf.png`,
  [Career.BLACK_ORC]: `${BASE}/black-orc.png`,
  [Career.CHOSEN]: `${BASE}/chosen.png`,
  [Career.DISCIPLE_OF_KHAINE]: `${BASE}/disciple-of-khaine.png`,
  [Career.ZEALOT]: `${BASE}/zealot.png`,
  [Career.SHAMAN]: `${BASE}/shaman.png`,
  [Career.BLACK_GUARD]: `${BASE}/black-guard.png`,
};

export function getCareerIconUrl(career: Career): string {
  return CAREER_ICON_URL[career];
}

// Preload all career icons to reduce first-open latency in CareerSelect.
// Creates Image objects and sets src to warm the HTTP cache and connection.
let careerIconsPreloaded = false;
export function preloadCareerIcons(): void {
  if (careerIconsPreloaded) return;
  careerIconsPreloaded = true;
  try {
    const urls = Object.values(CAREER_ICON_URL);
    urls.forEach((url) => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
    });
  } catch {
    // no-op: best-effort warmup
  }
}
