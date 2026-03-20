// ─────────────────────────────────────────────────────────────────────────────
// constants.js  —  Single source of truth for Surah metadata
// Used by: App.js, QuranReader.js, and all test files
// ─────────────────────────────────────────────────────────────────────────────

// Format: [number, nameEnglish, nameArabic, nameMeaning, totalVerses, revelationType]
export const SURAH_META = [
  [1,  'Al-Faatiha',     'الفاتحة',    'The Opening',             7,   'Meccan'],
  [2,  'Al-Baqara',      'البقرة',     'The Cow',                 286, 'Medinan'],
  [3,  'Aal-i-Imraan',   'آل عمران',   'Family of Imran',         200, 'Medinan'],
  [4,  'An-Nisaa',       'النساء',     'The Women',               176, 'Medinan'],
  [5,  'Al-Maaida',      'المائدة',    'The Table',               120, 'Medinan'],
  [6,  "Al-An'aam",      'الأنعام',    'The Cattle',              165, 'Meccan'],
  [7,  "Al-A'raaf",      'الأعراف',    'The Heights',             206, 'Meccan'],
  [8,  'Al-Anfaal',      'الأنفال',    'The Spoils of War',       75,  'Medinan'],
  [9,  'At-Tawba',       'التوبة',     'The Repentance',          129, 'Medinan'],
  [10, 'Yunus',          'يونس',      'Jonah',                   109, 'Meccan'],
  [11, 'Hud',            'هود',       'Hud',                     123, 'Meccan'],
  [12, 'Yusuf',          'يوسف',      'Joseph',                  111, 'Meccan'],
  [13, "Ar-Ra'd",        'الرعد',     'The Thunder',             43,  'Medinan'],
  [14, 'Ibrahim',        'إبراهيم',   'Abraham',                 52,  'Meccan'],
  [15, 'Al-Hijr',        'الحجر',     'The Rock',                99,  'Meccan'],
  [16, 'An-Nahl',        'النحل',     'The Bee',                 128, 'Meccan'],
  [17, 'Al-Israa',       'الإسراء',   'The Night Journey',       111, 'Meccan'],
  [18, 'Al-Kahf',        'الكهف',     'The Cave',                110, 'Meccan'],
  [19, 'Maryam',         'مريم',      'Mary',                    98,  'Meccan'],
  [20, 'Taa-Haa',        'طه',        'Ta-Ha',                   135, 'Meccan'],
  [21, 'Al-Anbiyaa',     'الأنبياء',  'The Prophets',            112, 'Meccan'],
  [22, 'Al-Hajj',        'الحج',      'The Pilgrimage',          78,  'Medinan'],
  [23, 'Al-Muminoon',    'المؤمنون',  'The Believers',           118, 'Meccan'],
  [24, 'An-Noor',        'النور',     'The Light',               64,  'Medinan'],
  [25, 'Al-Furqaan',     'الفرقان',   'The Criterion',           77,  'Meccan'],
  [26, "Ash-Shu'araa",   'الشعراء',   'The Poets',               227, 'Meccan'],
  [27, 'An-Naml',        'النمل',     'The Ant',                 93,  'Meccan'],
  [28, 'Al-Qasas',       'القصص',     'The Stories',             88,  'Meccan'],
  [29, 'Al-Ankaboot',    'العنكبوت',  'The Spider',              69,  'Meccan'],
  [30, 'Ar-Room',        'الروم',     'The Romans',              60,  'Meccan'],
  [31, 'Luqman',         'لقمان',     'Luqman',                  34,  'Meccan'],
  [32, 'As-Sajda',       'السجدة',    'The Prostration',         30,  'Meccan'],
  [33, 'Al-Ahzaab',      'الأحزاب',   'The Clans',               73,  'Medinan'],
  [34, 'Saba',           'سبأ',       'Sheba',                   54,  'Meccan'],
  [35, 'Faatir',         'فاطر',      'The Originator',          45,  'Meccan'],
  [36, 'Yaseen',         'يس',        'Ya Sin',                  83,  'Meccan'],
  [37, 'As-Saaffaat',    'الصافات',   'Those in Ranks',          182, 'Meccan'],
  [38, 'Saad',           'ص',         'The Letter Sad',          88,  'Meccan'],
  [39, 'Az-Zumar',       'الزمر',     'The Groups',              75,  'Meccan'],
  [40, 'Ghafir',         'غافر',      'The Forgiver',            85,  'Meccan'],
  [41, 'Fussilat',       'فصلت',      'Explained in Detail',     54,  'Meccan'],
  [42, 'Ash-Shura',      'الشورى',    'Consultation',            53,  'Meccan'],
  [43, 'Az-Zukhruf',     'الزخرف',    'Ornaments of Gold',       89,  'Meccan'],
  [44, 'Ad-Dukhaan',     'الدخان',    'The Smoke',               59,  'Meccan'],
  [45, 'Al-Jaathiya',    'الجاثية',   'Crouching',               37,  'Meccan'],
  [46, 'Al-Ahqaf',       'الأحقاف',   'The Dunes',               35,  'Meccan'],
  [47, 'Muhammad',       'محمد',      'Muhammad',                38,  'Medinan'],
  [48, 'Al-Fath',        'الفتح',     'The Victory',             29,  'Medinan'],
  [49, 'Al-Hujuraat',    'الحجرات',   'The Inner Apartments',    18,  'Medinan'],
  [50, 'Qaaf',           'ق',         'The Letter Qaf',          45,  'Meccan'],
  [51, 'Adh-Dhaariyat',  'الذاريات',  'The Winnowing Winds',     60,  'Meccan'],
  [52, 'At-Tur',         'الطور',     'The Mount',               49,  'Meccan'],
  [53, 'An-Najm',        'النجم',     'The Star',                62,  'Meccan'],
  [54, 'Al-Qamar',       'القمر',     'The Moon',                55,  'Meccan'],
  [55, 'Ar-Rahmaan',     'الرحمن',    'The Beneficent',          78,  'Medinan'],
  [56, 'Al-Waaqia',      'الواقعة',   'The Inevitable',          96,  'Meccan'],
  [57, 'Al-Hadid',       'الحديد',    'The Iron',                29,  'Medinan'],
  [58, 'Al-Mujaadila',   'المجادلة',  'The Pleading Woman',      22,  'Medinan'],
  [59, 'Al-Hashr',       'الحشر',     'The Exile',               24,  'Medinan'],
  [60, 'Al-Mumtahana',   'الممتحنة',  'She That is Examined',    13,  'Medinan'],
  [61, 'As-Saff',        'الصف',      'The Ranks',               14,  'Medinan'],
  [62, "Al-Jumu'a",      'الجمعة',    'Friday',                  11,  'Medinan'],
  [63, 'Al-Munaafiqoon', 'المنافقون', 'The Hypocrites',          11,  'Medinan'],
  [64, 'At-Taghaabun',   'التغابن',   'Mutual Disillusion',      18,  'Medinan'],
  [65, 'At-Talaaq',      'الطلاق',    'Divorce',                 12,  'Medinan'],
  [66, 'At-Tahrim',      'التحريم',   'The Prohibition',         12,  'Medinan'],
  [67, 'Al-Mulk',        'الملك',     'The Sovereignty',         30,  'Meccan'],
  [68, 'Al-Qalam',       'القلم',     'The Pen',                 52,  'Meccan'],
  [69, 'Al-Haaqqa',      'الحاقة',    'The Reality',             52,  'Meccan'],
  [70, "Al-Ma'aarij",    'المعارج',   'The Ascending Stairways', 44,  'Meccan'],
  [71, 'Nooh',           'نوح',       'Noah',                    28,  'Meccan'],
  [72, 'Al-Jinn',        'الجن',      'The Jinn',                28,  'Meccan'],
  [73, 'Al-Muzzammil',   'المزمل',    'The Enshrouded One',      20,  'Meccan'],
  [74, 'Al-Muddaththir', 'المدثر',    'The Cloaked One',         56,  'Meccan'],
  [75, 'Al-Qiyaama',     'القيامة',   'The Resurrection',        40,  'Meccan'],
  [76, 'Al-Insaan',      'الإنسان',   'Man',                     31,  'Medinan'],
  [77, 'Al-Mursalaat',   'المرسلات',  'The Emissaries',          50,  'Meccan'],
  [78, 'An-Naba',        'النبأ',     'The Announcement',        40,  'Meccan'],
  [79, "An-Naazi'aat",   'النازعات',  'Those Who Drag Forth',    46,  'Meccan'],
  [80, 'Abasa',          'عبس',       'He Frowned',              42,  'Meccan'],
  [81, 'At-Takwir',      'التكوير',   'The Overthrowing',        29,  'Meccan'],
  [82, 'Al-Infitaar',    'الانفطار',  'The Cleaving',            19,  'Meccan'],
  [83, 'Al-Mutaffifin',  'المطففين',  'Defrauding',              36,  'Meccan'],
  [84, 'Al-Inshiqaaq',   'الانشقاق',  'The Splitting Open',      25,  'Meccan'],
  [85, 'Al-Burooj',      'البروج',    'The Constellations',      22,  'Meccan'],
  [86, 'At-Taariq',      'الطارق',    'The Morning Star',        17,  'Meccan'],
  [87, "Al-A'laa",       'الأعلى',    'The Most High',           19,  'Meccan'],
  [88, 'Al-Ghaashiya',   'الغاشية',   'The Overwhelming',        26,  'Meccan'],
  [89, 'Al-Fajr',        'الفجر',     'The Dawn',                30,  'Meccan'],
  [90, 'Al-Balad',       'البلد',     'The City',                20,  'Meccan'],
  [91, 'Ash-Shams',      'الشمس',     'The Sun',                 15,  'Meccan'],
  [92, 'Al-Lail',        'الليل',     'The Night',               21,  'Meccan'],
  [93, 'Ad-Dhuhaa',      'الضحى',     'The Morning Hours',       11,  'Meccan'],
  [94, 'Ash-Sharh',      'الشرح',     'The Consolation',         8,   'Meccan'],
  [95, 'At-Tin',         'التين',     'The Fig',                 8,   'Meccan'],
  [96, 'Al-Alaq',        'العلق',     'The Clot',                19,  'Meccan'],
  [97, 'Al-Qadr',        'القدر',     'The Power',               5,   'Meccan'],
  [98, 'Al-Bayyina',     'البينة',    'The Evidence',            8,   'Medinan'],
  [99, 'Az-Zalzala',     'الزلزلة',   'The Earthquake',          8,   'Medinan'],
  [100,"Al-Aadiyaat",    'العاديات',  'The Chargers',            11,  'Meccan'],
  [101,"Al-Qaari'a",     'القارعة',   'The Calamity',            11,  'Meccan'],
  [102,'At-Takaathur',   'التكاثر',   'Competition',             8,   'Meccan'],
  [103,'Al-Asr',         'العصر',     'The Declining Day',       3,   'Meccan'],
  [104,'Al-Humaza',      'الهمزة',    'The Traducer',            9,   'Meccan'],
  [105,'Al-Fil',         'الفيل',     'The Elephant',            5,   'Meccan'],
  [106,'Quraish',        'قريش',      'Quraysh',                 4,   'Meccan'],
  [107,"Al-Maa'un",      'الماعون',   'Almsgiving',              7,   'Meccan'],
  [108,'Al-Kawthar',     'الكوثر',    'Abundance',               3,   'Meccan'],
  [109,'Al-Kaafiroon',   'الكافرون',  'The Disbelievers',        6,   'Meccan'],
  [110,'An-Nasr',        'النصر',     'Divine Support',          3,   'Medinan'],
  [111,'Al-Masad',       'المسد',     'The Palm Fibre',          5,   'Meccan'],
  [112,'Al-Ikhlaas',     'الإخلاص',   'Sincerity',               4,   'Meccan'],
  [113,'Al-Falaq',       'الفلق',     'The Daybreak',            5,   'Meccan'],
  [114,'An-Naas',        'الناس',     'Mankind',                 6,   'Meccan'],
];

// Verse counts per surah (Hafs an Asim — standard)
export const VERSE_COUNTS = SURAH_META.map(m => m[4]);

// Total verses in the Quran
export const TOTAL_VERSES = VERSE_COUNTS.reduce((a, b) => a + b, 0); // 6236

// Valid Arabic Unicode ranges for Quran text
export const ARABIC_RANGES = [
  [0x0600, 0x06FF], // Arabic block
  [0x0750, 0x077F], // Arabic Supplement
  [0x08A0, 0x08FF], // Arabic Extended-A
  [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
  [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
];
// Also allowed in Arabic text: space (0x20), ZWNJ (0x200C), ZWJ (0x200D)
export const ARABIC_ALLOWED_SINGLES = [0x0020, 0x200C, 0x200D];

export const BOM = '\uFEFF';
export const BISMILLAH_ARABIC = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

// Surahs that do NOT get a Bismillah header (1 already has it as verse 1; 9 has none)
// Use .has(n) — it's a Set, NOT an array (.includes is not a function on Set)
export const NO_BISMILLAH_SURAHS = new Set([1, 9]);
// Safe helper usable anywhere without worrying about Set vs Array
export function noBismillah(surahNum) { return surahNum === 1 || surahNum === 9; }

// Helper: get surah meta by number (1-indexed)
export function getSurahMeta(num) {
  return SURAH_META[num - 1] || null;
}

// Helper: validate a single verse object
export function validateVerse(verse, surahNum) {
  const errors = [];
  if (!verse || typeof verse !== 'object') {
    errors.push('Verse is not an object');
    return errors;
  }
  if (typeof verse.ayah !== 'number' || !Number.isInteger(verse.ayah) || verse.ayah < 1) {
    errors.push(`ayah must be a positive integer, got: ${JSON.stringify(verse.ayah)}`);
  }
  if (typeof verse.arabic !== 'string' || verse.arabic.trim() === '') {
    errors.push(`arabic field is empty or missing`);
  } else {
    // BOM check
    if (verse.arabic.startsWith(BOM)) {
      errors.push(`arabic text starts with BOM character (U+FEFF) at Surah ${surahNum} Ayah ${verse.ayah}`);
    }
    // Unicode range check
    const clean = verse.arabic.replace(BOM, '');
    for (const ch of clean) {
      const cp = ch.codePointAt(0);
      const isAllowed =
        ARABIC_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi) ||
        ARABIC_ALLOWED_SINGLES.includes(cp);
      if (!isAllowed) {
        errors.push(`Unexpected character U+${cp.toString(16).toUpperCase().padStart(4,'0')} (${ch}) in arabic at Surah ${surahNum} Ayah ${verse.ayah}`);
        break; // report first offender only
      }
    }
  }
  if (typeof verse.english !== 'string' || verse.english.trim() === '') {
    errors.push(`english field is empty or missing at Surah ${surahNum} Ayah ${verse.ayah}`);
  } else {
    // English must not contain Arabic-block characters
    for (const ch of verse.english) {
      const cp = ch.codePointAt(0);
      if (cp >= 0x0600 && cp <= 0x06FF) {
        errors.push(`Arabic character found in english field at Surah ${surahNum} Ayah ${verse.ayah}`);
        break;
      }
    }
  }
  return errors;
}

// Helper: validate a full surah object from the combined JSON
export function validateSurah(surah) {
  const errors = [];
  if (!surah || typeof surah !== 'object') { errors.push('Surah is not an object'); return errors; }

  const meta = getSurahMeta(surah.number);
  if (!meta) { errors.push(`Unknown surah number: ${surah.number}`); return errors; }

  const [num, nameEn, nameAr, nameMeaning, expectedCount, revType] = meta;

  if (surah.number !== num) errors.push(`number mismatch: ${surah.number} vs ${num}`);
  if (surah.total_verses !== expectedCount)
    errors.push(`total_verses says ${surah.total_verses} but expected ${expectedCount} for ${nameEn}`);
  if (!Array.isArray(surah.verses))
    errors.push(`verses is not an array`);
  else {
    if (surah.verses.length !== expectedCount)
      errors.push(`actual verse count ${surah.verses.length} != expected ${expectedCount} for ${nameEn}`);

    // Check sequential ayah numbers
    surah.verses.forEach((v, i) => {
      if (v.ayah !== i + 1)
        errors.push(`Surah ${num} verse index ${i}: expected ayah ${i+1}, got ${v.ayah}`);
      validateVerse(v, num).forEach(e => errors.push(e));
    });

    // Check no duplicate ayah numbers
    const seen = new Set();
    for (const v of surah.verses) {
      if (seen.has(v.ayah)) errors.push(`Duplicate ayah number ${v.ayah} in Surah ${num}`);
      seen.add(v.ayah);
    }
  }
  return errors;
}

// Helper: validate the full combined-format JSON
export function validateQuranJSON(data) {
  const errors = [];
  if (!data || typeof data !== 'object') { errors.push('Root is not an object'); return errors; }
  if (!Array.isArray(data.surahs)) { errors.push('data.surahs is not an array'); return errors; }
  if (data.surahs.length !== 114) errors.push(`Expected 114 surahs, got ${data.surahs.length}`);

  // Check total_surahs and total_verses metadata fields
  if (data.total_surahs !== 114) errors.push(`total_surahs field = ${data.total_surahs}, expected 114`);
  if (data.total_verses !== TOTAL_VERSES)
    errors.push(`total_verses field = ${data.total_verses}, expected ${TOTAL_VERSES}`);

  // Surah numbers must be 1..114 in order
  data.surahs.forEach((s, i) => {
    if (s.number !== i + 1)
      errors.push(`Surah at index ${i} has number ${s.number}, expected ${i+1}`);
    validateSurah(s).forEach(e => errors.push(e));
  });

  // Cross-check actual verse count sum
  const actualTotal = data.surahs.reduce((t, s) => t + (s.verses?.length || 0), 0);
  if (actualTotal !== TOTAL_VERSES)
    errors.push(`Sum of all verse arrays = ${actualTotal}, expected ${TOTAL_VERSES}`);

  return errors;
}
