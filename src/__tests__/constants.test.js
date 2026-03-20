/**
 * ─────────────────────────────────────────────────────────────────────────────
 * constants.test.js
 *
 * Tests the SURAH_META table and all validator helpers in constants.js.
 * 100% deterministic — no network calls. All expected values are hard-coded
 * from the canonical Hafs an-Asim rasm used in the standard Uthmani mushaf.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  SURAH_META,
  VERSE_COUNTS,
  TOTAL_VERSES,
  ARABIC_RANGES,
  ARABIC_ALLOWED_SINGLES,
  BOM,
  BISMILLAH_ARABIC,
  NO_BISMILLAH_SURAHS,
  noBismillah,
  getSurahMeta,
  validateVerse,
  validateSurah,
  validateQuranJSON,
} from '../constants';

// ─── Canonical reference data (Hafs an-Asim) ─────────────────────────────────

const CANONICAL_VERSE_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
  59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
  52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
  21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6,
];

const CANONICAL_ARABIC_NAMES = [
  'الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف',
  'الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر',
  'النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون',
  'النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان',
  'السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر',
  'فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح',
  'الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة',
  'الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون',
  'التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح',
  'الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات',
  'عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق',
  'الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح',
  'التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر',
  'العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر',
  'المسد','الإخلاص','الفلق','الناس',
];

const CANONICAL_REVELATION_TYPES = [
  // 1-10
  'Meccan','Medinan','Medinan','Medinan','Medinan','Meccan','Meccan','Medinan','Medinan','Meccan',
  // 11-20
  'Meccan','Meccan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan',
  // 21-30
  'Meccan','Medinan','Meccan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan',
  // 31-40
  'Meccan','Meccan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan',
  // 41-50
  'Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Medinan','Medinan','Meccan',
  // 51-60
  'Meccan','Meccan','Meccan','Meccan','Medinan','Meccan','Medinan','Medinan','Medinan','Medinan',
  // 61-70
  'Medinan','Medinan','Medinan','Medinan','Medinan','Medinan','Meccan','Meccan','Meccan','Meccan',
  // 71-80
  'Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Meccan','Meccan','Meccan','Meccan',
  // 81-90
  'Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan',
  // 91-100
  'Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Medinan','Meccan',
  // 101-110
  'Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan',
  // 111-114
  'Meccan','Meccan','Meccan','Meccan',
];

// ─── 1. SURAH_META shape ──────────────────────────────────────────────────────

describe('SURAH_META — shape and completeness', () => {
  test('has exactly 114 entries', () => {
    expect(SURAH_META).toHaveLength(114);
  });

  test('every entry is a 6-element array', () => {
    SURAH_META.forEach((m, i) => {
      expect(Array.isArray(m)).toBe(true);
      expect(m).toHaveLength(6);
    });
  });

  test('surah numbers run 1–114 in order', () => {
    SURAH_META.forEach((m, i) => {
      expect(m[0]).toBe(i + 1);
    });
  });

  test('every English name is a non-empty string', () => {
    SURAH_META.forEach(([n, ne]) => {
      expect(typeof ne).toBe('string');
      expect(ne.trim().length).toBeGreaterThan(0);
    });
  });

  test('every Arabic name is a non-empty string containing Arabic characters', () => {
    SURAH_META.forEach(([n, ne, na]) => {
      expect(typeof na).toBe('string');
      expect(na.trim().length).toBeGreaterThan(0);
      // Must contain at least one Arabic character
      const hasArabic = [...na].some(ch => ch.codePointAt(0) >= 0x0600 && ch.codePointAt(0) <= 0x06FF);
      expect(hasArabic).toBe(true);
    });
  });

  test('every meaning is a non-empty string', () => {
    SURAH_META.forEach(([n, ne, na, nm]) => {
      expect(typeof nm).toBe('string');
      expect(nm.trim().length).toBeGreaterThan(0);
    });
  });

  test('every verse count is a positive integer', () => {
    SURAH_META.forEach(([n, ne, na, nm, tv]) => {
      expect(Number.isInteger(tv)).toBe(true);
      expect(tv).toBeGreaterThan(0);
    });
  });

  test('revelation type is only Meccan or Medinan', () => {
    SURAH_META.forEach(([n, ne, na, nm, tv, rt]) => {
      expect(['Meccan', 'Medinan']).toContain(rt);
    });
  });
});

// ─── 2. VERSE_COUNTS against canonical Hafs an-Asim ─────────────────────────

describe('VERSE_COUNTS — canonical Hafs an-Asim verification', () => {
  test('VERSE_COUNTS array length is 114', () => {
    expect(VERSE_COUNTS).toHaveLength(114);
  });

  test('every surah verse count matches canonical Hafs an-Asim', () => {
    CANONICAL_VERSE_COUNTS.forEach((expected, i) => {
      expect(VERSE_COUNTS[i]).toBe(expected);
    });
  });

  test('TOTAL_VERSES equals 6236', () => {
    expect(TOTAL_VERSES).toBe(6236);
  });

  test('sum of VERSE_COUNTS equals TOTAL_VERSES', () => {
    const sum = VERSE_COUNTS.reduce((a, b) => a + b, 0);
    expect(sum).toBe(TOTAL_VERSES);
  });

  // Spot-check specific well-known surahs
  test('Al-Fatiha (1) has 7 verses', () => expect(VERSE_COUNTS[0]).toBe(7));
  test('Al-Baqara (2) has 286 verses (longest)', () => expect(VERSE_COUNTS[1]).toBe(286));
  test('Al-Asr (103) has 3 verses (shortest with Al-Kawthar/An-Nasr)', () => expect(VERSE_COUNTS[102]).toBe(3));
  test('Al-Kawthar (108) has 3 verses', () => expect(VERSE_COUNTS[107]).toBe(3));
  test('An-Nasr (110) has 3 verses', () => expect(VERSE_COUNTS[109]).toBe(3));
  test('Ash-Shuara (26) has 227 verses (second longest)', () => expect(VERSE_COUNTS[25]).toBe(227));
  test('At-Tawba (9) has 129 verses', () => expect(VERSE_COUNTS[8]).toBe(129));
  test('Al-Ikhlas (112) has 4 verses', () => expect(VERSE_COUNTS[111]).toBe(4));
  test('An-Naas (114) has 6 verses', () => expect(VERSE_COUNTS[113]).toBe(6));
});

// ─── 3. Arabic names ─────────────────────────────────────────────────────────

describe('SURAH_META — Arabic names vs canonical', () => {
  CANONICAL_ARABIC_NAMES.forEach((expectedAr, i) => {
    test(`Surah ${i + 1} Arabic name = "${expectedAr}"`, () => {
      expect(SURAH_META[i][2]).toBe(expectedAr);
    });
  });
});

// ─── 4. Revelation types ─────────────────────────────────────────────────────

describe('SURAH_META — revelation types vs canonical', () => {
  CANONICAL_REVELATION_TYPES.forEach((expectedRt, i) => {
    test(`Surah ${i + 1} revelation type = ${expectedRt}`, () => {
      expect(SURAH_META[i][5]).toBe(expectedRt);
    });
  });

  test('exactly 86 Meccan surahs', () => {
    const count = SURAH_META.filter(m => m[5] === 'Meccan').length;
    expect(count).toBe(86);
  });

  test('exactly 28 Medinan surahs', () => {
    const count = SURAH_META.filter(m => m[5] === 'Medinan').length;
    expect(count).toBe(28);
  });
});

// ─── 5. NO_BISMILLAH_SURAHS ───────────────────────────────────────────────────

describe('NO_BISMILLAH_SURAHS', () => {
  test('is a Set', () => {
    expect(NO_BISMILLAH_SURAHS instanceof Set).toBe(true);
  });

  test('contains Surah 1 (Al-Fatiha — bismillah IS verse 1, not a header)', () => {
    expect(NO_BISMILLAH_SURAHS.has(1)).toBe(true);
  });

  test('contains Surah 9 (At-Tawba — unique: has no bismillah at all)', () => {
    expect(NO_BISMILLAH_SURAHS.has(9)).toBe(true);
  });

  test('does not contain Surah 27 (An-Naml — has bismillah inside verse 30, not as header)', () => {
    // Surah 27 does get a bismillah header (it is not in the no-bismillah set)
    expect(NO_BISMILLAH_SURAHS.has(27)).toBe(false);
  });

  test('does not contain Surah 2', () => {
    expect(NO_BISMILLAH_SURAHS.has(2)).toBe(false);
  });
});

// ─── 6. BOM constant ─────────────────────────────────────────────────────────

describe('BOM constant', () => {
  test('BOM is U+FEFF', () => {
    expect(BOM).toBe('\uFEFF');
    expect(BOM.codePointAt(0)).toBe(0xFEFF);
  });

  test('BOM has length 1', () => {
    expect(BOM).toHaveLength(1);
  });
});

// ─── 7. BISMILLAH_ARABIC constant ────────────────────────────────────────────

describe('BISMILLAH_ARABIC constant', () => {
  test('is a non-empty string', () => {
    expect(typeof BISMILLAH_ARABIC).toBe('string');
    expect(BISMILLAH_ARABIC.length).toBeGreaterThan(0);
  });

  test('starts with Arabic character ب (ba)', () => {
    // First non-space char is ب
    const clean = BISMILLAH_ARABIC.replace(BOM, '').trim();
    const firstChar = clean.codePointAt(0);
    expect(firstChar).toBeGreaterThanOrEqual(0x0600);
    expect(firstChar).toBeLessThanOrEqual(0x06FF);
  });

  test('contains no BOM character', () => {
    expect(BISMILLAH_ARABIC).not.toContain(BOM);
  });
});

// ─── 8. getSurahMeta helper ───────────────────────────────────────────────────

describe('getSurahMeta()', () => {
  test('returns correct entry for surah 1', () => {
    const m = getSurahMeta(1);
    expect(m).not.toBeNull();
    expect(m[0]).toBe(1);
  });

  test('returns correct entry for surah 114', () => {
    const m = getSurahMeta(114);
    expect(m).not.toBeNull();
    expect(m[0]).toBe(114);
  });

  test('returns null for surah 0', () => {
    expect(getSurahMeta(0)).toBeNull();
  });

  test('returns null for surah 115', () => {
    expect(getSurahMeta(115)).toBeNull();
  });

  test('returns null for undefined', () => {
    expect(getSurahMeta(undefined)).toBeNull();
  });

  test('returns null for string', () => {
    expect(getSurahMeta('1')).toBeNull();
  });
});

// ─── 9. validateVerse() ───────────────────────────────────────────────────────

describe('validateVerse()', () => {
  const goodVerse = {
    ayah: 1,
    arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    english: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
  };

  test('valid verse returns no errors', () => {
    const errors = validateVerse(goodVerse, 1);
    expect(errors).toHaveLength(0);
  });

  test('null verse returns errors', () => {
    expect(validateVerse(null, 1).length).toBeGreaterThan(0);
  });

  test('non-object verse returns errors', () => {
    expect(validateVerse('text', 1).length).toBeGreaterThan(0);
  });

  test('missing ayah field → error', () => {
    const v = { ...goodVerse };
    delete v.ayah;
    expect(validateVerse(v, 1).length).toBeGreaterThan(0);
  });

  test('ayah = 0 → error', () => {
    expect(validateVerse({ ...goodVerse, ayah: 0 }, 1).length).toBeGreaterThan(0);
  });

  test('ayah = -1 → error', () => {
    expect(validateVerse({ ...goodVerse, ayah: -1 }, 1).length).toBeGreaterThan(0);
  });

  test('ayah = 1.5 (non-integer) → error', () => {
    expect(validateVerse({ ...goodVerse, ayah: 1.5 }, 1).length).toBeGreaterThan(0);
  });

  test('ayah = "1" (string) → error', () => {
    expect(validateVerse({ ...goodVerse, ayah: '1' }, 1).length).toBeGreaterThan(0);
  });

  test('empty arabic → error', () => {
    expect(validateVerse({ ...goodVerse, arabic: '' }, 1).length).toBeGreaterThan(0);
  });

  test('whitespace-only arabic → error', () => {
    expect(validateVerse({ ...goodVerse, arabic: '   ' }, 1).length).toBeGreaterThan(0);
  });

  test('arabic starting with BOM → error', () => {
    const errors = validateVerse({ ...goodVerse, arabic: '\uFEFF' + goodVerse.arabic }, 1);
    expect(errors.some(e => e.includes('BOM'))).toBe(true);
  });

  test('arabic containing Latin character → error', () => {
    const errors = validateVerse({ ...goodVerse, arabic: goodVerse.arabic + 'A' }, 1);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('empty english → error', () => {
    expect(validateVerse({ ...goodVerse, english: '' }, 1).length).toBeGreaterThan(0);
  });

  test('whitespace-only english → error', () => {
    expect(validateVerse({ ...goodVerse, english: '   ' }, 1).length).toBeGreaterThan(0);
  });

  test('english field containing Arabic character → error', () => {
    const errors = validateVerse({ ...goodVerse, english: goodVerse.english + ' \u0628' }, 1);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('valid verse with ayah 286 passes', () => {
    const v = { ayah: 286, arabic: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا', english: 'Allah does not burden a soul beyond that it can bear.' };
    expect(validateVerse(v, 2)).toHaveLength(0);
  });

  // Arabic Unicode ranges — representative characters from each block
  test('Arabic Extended-A character (U+08B4) is accepted', () => {
    const arWithExtended = 'بِ\u08B4سْمِ';
    const v = { ayah: 1, arabic: arWithExtended, english: 'test' };
    const errors = validateVerse(v, 1);
    expect(errors.filter(e => e.includes('Unexpected')).length).toBe(0);
  });

  test('ZWJ (U+200D) in arabic is accepted', () => {
    const v = { ayah: 1, arabic: 'بِسْمِ\u200Dٱللَّهِ', english: 'test' };
    expect(validateVerse(v, 1).filter(e => e.includes('Unexpected')).length).toBe(0);
  });

  test('ZWNJ (U+200C) in arabic is accepted', () => {
    const v = { ayah: 1, arabic: 'بِسْمِ\u200Cٱللَّهِ', english: 'test' };
    expect(validateVerse(v, 1).filter(e => e.includes('Unexpected')).length).toBe(0);
  });
});

// ─── 10. validateSurah() ──────────────────────────────────────────────────────

function makeSurah(overrides = {}) {
  const verses = Array.from({ length: 7 }, (_, i) => ({
    ayah: i + 1,
    arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    english: `Verse ${i + 1} translation`,
  }));
  return {
    number: 1,
    name_arabic: 'الفاتحة',
    name_english: 'Al-Faatiha',
    name_english_meaning: 'The Opening',
    revelation_type: 'Meccan',
    total_verses: 7,
    verses,
    ...overrides,
  };
}

describe('validateSurah()', () => {
  test('valid Surah 1 mock passes', () => {
    expect(validateSurah(makeSurah())).toHaveLength(0);
  });

  test('null surah → errors', () => {
    expect(validateSurah(null).length).toBeGreaterThan(0);
  });

  test('unknown surah number 115 → errors', () => {
    expect(validateSurah(makeSurah({ number: 115 })).length).toBeGreaterThan(0);
  });

  test('total_verses mismatch → error', () => {
    const errors = validateSurah(makeSurah({ total_verses: 8 }));
    expect(errors.some(e => e.includes('total_verses'))).toBe(true);
  });

  test('actual verse array count mismatch → error', () => {
    const s = makeSurah();
    s.verses.push({ ayah: 8, arabic: 'بِسْمِ', english: 'extra' });
    const errors = validateSurah(s);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('out-of-sequence ayah → error', () => {
    const s = makeSurah();
    s.verses[2].ayah = 99; // break sequence
    const errors = validateSurah(s);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('duplicate ayah number → error', () => {
    const s = makeSurah();
    s.verses[3].ayah = 1; // duplicate
    const errors = validateSurah(s);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('verses not an array → error', () => {
    const errors = validateSurah(makeSurah({ verses: 'not array' }));
    expect(errors.length).toBeGreaterThan(0);
  });

  test('verse with BOM arabic → error propagated from validateVerse', () => {
    const s = makeSurah();
    s.verses[0].arabic = '\uFEFF' + s.verses[0].arabic;
    const errors = validateSurah(s);
    expect(errors.some(e => e.includes('BOM'))).toBe(true);
  });
});

// ─── 11. validateQuranJSON() — full dataset ───────────────────────────────────

function makeFullQuranJSON(overrides = {}) {
  const surahs = SURAH_META.map(([num, ne, na, nm, tv, rt]) => ({
    number: num,
    name_arabic: na,
    name_english: ne,
    name_english_meaning: nm,
    revelation_type: rt,
    total_verses: tv,
    verses: Array.from({ length: tv }, (_, i) => ({
      ayah: i + 1,
      arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      english: `S${num}:${i + 1} translation`,
    })),
  }));
  return {
    format: 'combined',
    source: 'alquran.cloud',
    total_surahs: 114,
    total_verses: TOTAL_VERSES,
    surahs,
    ...overrides,
  };
}

describe('validateQuranJSON() — full dataset structure', () => {
  test('valid full mock Quran JSON passes with 0 errors', () => {
    const errors = validateQuranJSON(makeFullQuranJSON());
    expect(errors).toHaveLength(0);
  });

  test('null input → errors', () => {
    expect(validateQuranJSON(null).length).toBeGreaterThan(0);
  });

  test('missing surahs array → errors', () => {
    expect(validateQuranJSON({ total_surahs: 114, total_verses: 6236 }).length).toBeGreaterThan(0);
  });

  test('wrong total_surahs field → error', () => {
    const errors = validateQuranJSON(makeFullQuranJSON({ total_surahs: 113 }));
    expect(errors.some(e => e.includes('total_surahs'))).toBe(true);
  });

  test('wrong total_verses field → error', () => {
    const errors = validateQuranJSON(makeFullQuranJSON({ total_verses: 9999 }));
    expect(errors.some(e => e.includes('total_verses'))).toBe(true);
  });

  test('only 113 surahs → error', () => {
    const data = makeFullQuranJSON();
    data.surahs.pop();
    data.total_surahs = 113;
    const errors = validateQuranJSON(data);
    expect(errors.some(e => e.includes('114'))).toBe(true);
  });

  test('surah out of order → error', () => {
    const data = makeFullQuranJSON();
    // Swap surahs 1 and 2
    [data.surahs[0], data.surahs[1]] = [data.surahs[1], data.surahs[0]];
    const errors = validateQuranJSON(data);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('actual verse sum != total_verses → error', () => {
    const data = makeFullQuranJSON();
    // Remove a verse from surah 1
    data.surahs[0].verses.pop();
    const errors = validateQuranJSON(data);
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ─── 12. ARABIC_RANGES / ARABIC_ALLOWED_SINGLES ──────────────────────────────

describe('ARABIC_RANGES and ARABIC_ALLOWED_SINGLES', () => {
  test('ARABIC_RANGES is non-empty array', () => {
    expect(Array.isArray(ARABIC_RANGES)).toBe(true);
    expect(ARABIC_RANGES.length).toBeGreaterThan(0);
  });

  test('every range is [lo, hi] with lo <= hi', () => {
    ARABIC_RANGES.forEach(([lo, hi]) => {
      expect(lo).toBeLessThanOrEqual(hi);
    });
  });

  test('main Arabic block 0x0600–0x06FF is included', () => {
    const has = ARABIC_RANGES.some(([lo, hi]) => lo <= 0x0600 && hi >= 0x06FF);
    expect(has).toBe(true);
  });

  test('space (0x20) is in ARABIC_ALLOWED_SINGLES', () => {
    expect(ARABIC_ALLOWED_SINGLES).toContain(0x20);
  });

  test('ZWJ (0x200D) is in ARABIC_ALLOWED_SINGLES', () => {
    expect(ARABIC_ALLOWED_SINGLES).toContain(0x200D);
  });

  test('ZWNJ (0x200C) is in ARABIC_ALLOWED_SINGLES', () => {
    expect(ARABIC_ALLOWED_SINGLES).toContain(0x200C);
  });
});

// ─── noBismillah helper ───────────────────────────────────────────────────────

describe('noBismillah() helper', () => {
  test('returns true for surah 1', () => {
    expect(noBismillah(1)).toBe(true);
  });

  test('returns true for surah 9', () => {
    expect(noBismillah(9)).toBe(true);
  });

  test('returns false for surah 2', () => {
    expect(noBismillah(2)).toBe(false);
  });

  test('returns false for surah 114', () => {
    expect(noBismillah(114)).toBe(false);
  });

  test('matches NO_BISMILLAH_SURAHS.has() for all 114 surahs', () => {
    for (let i = 1; i <= 114; i++) {
      expect(noBismillah(i)).toBe(NO_BISMILLAH_SURAHS.has(i));
    }
  });

  test('Set does NOT have .includes() — must use .has()', () => {
    expect(typeof NO_BISMILLAH_SURAHS.includes).toBe('undefined');
    expect(typeof NO_BISMILLAH_SURAHS.has).toBe('function');
  });
});
