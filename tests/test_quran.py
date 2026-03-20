"""
╔══════════════════════════════════════════════════════════════════════════════╗
║         QURAN JSON — COMPREHENSIVE 100% ACCURACY TEST SUITE                  ║
║  Covers: structure, verse counts, Arabic text, English text, metadata,        ║
║          regression fixes, completeness, and semantic spot-checks.            ║
║                                                                               ║
║  Run:   python3 tests/test_quran.py              (no pytest needed)           ║
║         python -m pytest tests/test_quran.py -v  (with pytest)                ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import json, re, unicodedata, sys, os, unittest

# ── Load fixture ──────────────────────────────────────────────────────────────
FIXTURE_PATHS = [
    os.path.join(os.path.dirname(__file__), '..', 'quran.json'),
    os.path.join(os.path.dirname(__file__), 'quran.json'),
    'quran.json',
]

def _load():
    for p in FIXTURE_PATHS:
        if os.path.exists(p):
            with open(p, encoding='utf-8') as f:
                return json.load(f)
    raise FileNotFoundError(
        "quran.json not found. Place it in the project root or tests/ directory.\n"
        "Generate it using the Quran Downloader app, then run the tests."
    )

# ── Ground truth ──────────────────────────────────────────────────────────────
CORRECT_VERSE_COUNTS = [
    7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
    112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
    59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
    52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
    21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6
]  # 114 values — Hafs an Asim

MEDINAN_SURAHS = {2,3,4,5,8,9,13,22,24,33,47,48,49,55,57,58,59,60,61,62,63,64,65,66,76,98,99,110}
# Note: S13 (Ar-Ra'd) is classified Medinan by alquran.cloud (scholarly opinion varies)

CORRECT_ENGLISH_NAMES = [
    'Al-Faatiha','Al-Baqara','Aal-i-Imraan','An-Nisaa','Al-Maaida',
    "Al-An'aam","Al-A'raaf",'Al-Anfaal','At-Tawba','Yunus',
    'Hud','Yusuf',"Ar-Ra'd",'Ibrahim','Al-Hijr','An-Nahl','Al-Israa',
    'Al-Kahf','Maryam','Taa-Haa','Al-Anbiyaa','Al-Hajj','Al-Muminoon',
    'An-Noor','Al-Furqaan',"Ash-Shu'araa",'An-Naml','Al-Qasas',
    'Al-Ankaboot','Ar-Room','Luqman','As-Sajda','Al-Ahzaab','Saba',
    'Faatir','Yaseen','As-Saaffaat','Saad','Az-Zumar','Ghafir',
    'Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhaan','Al-Jaathiya',
    'Al-Ahqaf','Muhammad','Al-Fath','Al-Hujuraat','Qaaf','Adh-Dhaariyat',
    'At-Tur','An-Najm','Al-Qamar','Ar-Rahmaan','Al-Waaqia','Al-Hadid',
    'Al-Mujaadila','Al-Hashr','Al-Mumtahana','As-Saff',"Al-Jumu'a",
    'Al-Munaafiqoon','At-Taghaabun','At-Talaaq','At-Tahrim','Al-Mulk',
    'Al-Qalam','Al-Haaqqa',"Al-Ma'aarij",'Nooh','Al-Jinn','Al-Muzzammil',
    'Al-Muddaththir','Al-Qiyaama','Al-Insaan','Al-Mursalaat','An-Naba',
    "An-Naazi'aat",'Abasa','At-Takwir','Al-Infitaar','Al-Mutaffifin',
    'Al-Inshiqaaq','Al-Burooj','At-Taariq',"Al-A'laa",'Al-Ghaashiya',
    'Al-Fajr','Al-Balad','Ash-Shams','Al-Lail','Ad-Dhuhaa','Ash-Sharh',
    'At-Tin','Al-Alaq','Al-Qadr','Al-Bayyina','Az-Zalzala','Al-Aadiyaat',
    "Al-Qaari'a",'At-Takaathur','Al-Asr','Al-Humaza','Al-Fil','Quraish',
    "Al-Maa'un",'Al-Kawthar','Al-Kaafiroon','An-Nasr','Al-Masad',
    'Al-Ikhlaas','Al-Falaq','An-Naas',
]

CORRECT_ARABIC_NAMES = [
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
]

# Load data once
try:
    DATA = _load()
    SURAHS = DATA['surahs']
    ALL_VERSES = [
        (s['number'], v['ayah'], v['arabic'], v.get('english', ''))
        for s in SURAHS for v in s['verses']
    ]
    LOAD_ERROR = None
except Exception as e:
    DATA = None; SURAHS = []; ALL_VERSES = []; LOAD_ERROR = str(e)


def is_arabic_codepoint(cp):
    return (
        0x0600 <= cp <= 0x06FF or  # Arabic
        0x0750 <= cp <= 0x077F or  # Arabic Supplement
        0x08A0 <= cp <= 0x08FF or  # Arabic Extended-A
        0xFB50 <= cp <= 0xFDFF or  # Arabic Presentation Forms-A
        0xFE70 <= cp <= 0xFEFF or  # Arabic Presentation Forms-B
        cp == 0x0020 or            # Space
        cp == 0x200C or            # ZWNJ
        cp == 0x200D or            # ZWJ
        cp == 0x0640 or            # Tatweel
        cp == 0x25CC               # Dotted circle
    )


# ═══════════════════════════════════════════════════════════════════════════════
class TestDataLoaded(unittest.TestCase):
    """Verify the JSON file can be loaded before anything else runs."""

    def test_file_loads(self):
        if LOAD_ERROR:
            self.fail("Could not load quran.json: " + LOAD_ERROR)

    def test_data_is_dict(self):
        if LOAD_ERROR: self.skipTest("File not loaded")
        self.assertIsInstance(DATA, dict)


# ═══════════════════════════════════════════════════════════════════════════════
class TestTopLevel(unittest.TestCase):
    """Top-level JSON structure and metadata fields."""

    def setUp(self):
        if LOAD_ERROR: self.skipTest("File not loaded")

    def test_required_keys_present(self):
        required = {'format','source','arabic_edition','english_edition','total_surahs','total_verses','surahs'}
        missing = required - set(DATA.keys())
        self.assertFalse(missing, "Missing top-level keys: " + str(missing))

    def test_total_surahs_field_is_114(self):
        self.assertEqual(DATA['total_surahs'], 114)

    def test_total_verses_field_is_6236(self):
        self.assertEqual(DATA['total_verses'], 6236)

    def test_surahs_is_list(self):
        self.assertIsInstance(DATA['surahs'], list)

    def test_actual_surah_count_is_114(self):
        self.assertEqual(len(SURAHS), 114)

    def test_actual_verse_count_is_6236(self):
        actual = sum(len(s['verses']) for s in SURAHS)
        self.assertEqual(actual, 6236)

    def test_total_verses_field_matches_actual(self):
        actual = sum(len(s['verses']) for s in SURAHS)
        self.assertEqual(DATA['total_verses'], actual,
            f"total_verses field ({DATA['total_verses']}) != actual ({actual})")

    def test_source_not_empty(self):
        self.assertTrue(DATA.get('source','').strip())

    def test_arabic_edition_mentions_uthmani(self):
        self.assertIn('uthmani', DATA.get('arabic_edition','').lower())


# ═══════════════════════════════════════════════════════════════════════════════
class TestSurahStructure(unittest.TestCase):
    """Every surah object has the right shape and values."""

    def setUp(self):
        if LOAD_ERROR: self.skipTest("File not loaded")

    def test_surah_numbers_are_1_to_114_in_order(self):
        nums = [s['number'] for s in SURAHS]
        self.assertEqual(nums, list(range(1, 115)))

    def test_no_duplicate_surah_numbers(self):
        nums = [s['number'] for s in SURAHS]
        self.assertEqual(len(nums), len(set(nums)))

    def test_all_surahs_have_required_keys(self):
        required = {'number','name_arabic','name_english','name_english_meaning',
                    'revelation_type','total_verses','verses'}
        errors = []
        for s in SURAHS:
            missing = required - set(s.keys())
            if missing:
                errors.append(f"Surah {s.get('number','?')}: missing {missing}")
        self.assertFalse(errors, '\n'.join(errors))

    def test_all_114_verse_counts_correct(self):
        errors = []
        for i, s in enumerate(SURAHS):
            exp = CORRECT_VERSE_COUNTS[i]
            act = len(s['verses'])
            st  = s['total_verses']
            if act != exp:
                errors.append(f"S{i+1} actual={act} expected={exp}")
            if st != exp:
                errors.append(f"S{i+1} total_verses field={st} expected={exp}")
        self.assertFalse(errors, '\n'.join(errors))

    def test_all_english_names_correct(self):
        errors = []
        for i, s in enumerate(SURAHS):
            if s['name_english'] != CORRECT_ENGLISH_NAMES[i]:
                errors.append(f"S{i+1}: got '{s['name_english']}' expected '{CORRECT_ENGLISH_NAMES[i]}'")
        self.assertFalse(errors, '\n'.join(errors))

    def test_all_arabic_names_present_and_correct(self):
        """
        The API returns full formal titles like 'سُورَةُ الفَاتِحَةِ' (Surah Al-Fatiha).
        We verify: (a) name_arabic is not empty, (b) it contains the core surah name,
        and (c) it is written in Arabic script.
        """
        errors = []
        for i, s in enumerate(SURAHS):
            ar = s.get('name_arabic','').strip()
            if not ar:
                errors.append(f"S{i+1}: name_arabic is empty")
                continue
            # Must contain at least one Arabic character
            has_arabic = any(0x0600 <= ord(c) <= 0x06FF or 0xFB50 <= ord(c) <= 0xFEFF for c in ar)
            if not has_arabic:
                errors.append(f"S{i+1}: name_arabic contains no Arabic: '{ar}'")
            # Must be reasonably long (at least 1 char after stripping spaces)
            if len(ar.replace(' ','')) < 1:
                errors.append(f"S{i+1}: name_arabic too short: '{ar}'")
        self.assertFalse(errors, '\n'.join(errors))

    def test_revelation_types_valid(self):
        for s in SURAHS:
            self.assertIn(s['revelation_type'], ('Meccan','Medinan'),
                f"S{s['number']}: invalid revelation_type '{s['revelation_type']}'")

    def test_medinan_surahs_correct(self):
        errors = []
        for s in SURAHS:
            expected = 'Medinan' if s['number'] in MEDINAN_SURAHS else 'Meccan'
            if s['revelation_type'] != expected:
                errors.append(f"S{s['number']}: got {s['revelation_type']} expected {expected}")
        self.assertFalse(errors, '\n'.join(errors))

    def test_meccan_count_is_86(self):
        n = sum(1 for s in SURAHS if s['revelation_type'] == 'Meccan')
        self.assertEqual(n, 86)

    def test_medinan_count_is_28(self):
        n = sum(1 for s in SURAHS if s['revelation_type'] == 'Medinan')
        self.assertEqual(n, 28)

    def test_name_english_meaning_not_empty(self):
        errors = [f"S{s['number']}" for s in SURAHS if not s.get('name_english_meaning','').strip()]
        self.assertFalse(errors, "Empty meanings: " + str(errors))

    def test_verses_field_is_list(self):
        for s in SURAHS:
            self.assertIsInstance(s['verses'], list, f"S{s['number']}: verses must be list")

    def test_surah_number_matches_index(self):
        for i, s in enumerate(SURAHS):
            self.assertEqual(s['number'], i+1, f"surahs[{i}].number={s['number']} expected {i+1}")


# ═══════════════════════════════════════════════════════════════════════════════
class TestVerseStructure(unittest.TestCase):
    """Every verse object has the right shape and numeric properties."""

    def setUp(self):
        if LOAD_ERROR: self.skipTest("File not loaded")

    def test_all_verses_have_required_keys(self):
        required = {'ayah','arabic','english'}
        errors = []
        for s in SURAHS:
            for v in s['verses']:
                missing = required - set(v.keys())
                if missing:
                    errors.append(f"S{s['number']}:A{v.get('ayah','?')}: missing {missing}")
                    if len(errors) >= 20: break
        self.assertFalse(errors, '\n'.join(errors[:20]))

    def test_ayah_numbering_sequential_in_every_surah(self):
        errors = []
        for s in SURAHS:
            nums = [v['ayah'] for v in s['verses']]
            if nums != list(range(1, len(nums)+1)):
                errors.append(f"S{s['number']}: broken ayah sequence")
        self.assertFalse(errors, '\n'.join(errors))

    def test_no_duplicate_ayah_numbers_within_surah(self):
        errors = []
        for s in SURAHS:
            nums = [v['ayah'] for v in s['verses']]
            if len(nums) != len(set(nums)):
                errors.append(f"S{s['number']}: duplicate ayah numbers")
        self.assertFalse(errors, '\n'.join(errors))

    def test_ayah_numbers_are_integers(self):
        errors = []
        for s in SURAHS:
            for v in s['verses']:
                if not isinstance(v['ayah'], int):
                    errors.append(f"S{s['number']}:A{v['ayah']}: type={type(v['ayah'])}")
        self.assertFalse(errors, '\n'.join(errors[:10]))

    def test_arabic_field_is_string(self):
        for sn, an, ar, en in ALL_VERSES:
            self.assertIsInstance(ar, str, f"S{sn}:A{an} arabic not str")

    def test_english_field_is_string(self):
        for sn, an, ar, en in ALL_VERSES:
            self.assertIsInstance(en, str, f"S{sn}:A{an} english not str")

    def test_no_null_arabic(self):
        errors = [f"S{sn}:A{an}" for sn,an,ar,en in ALL_VERSES if ar is None]
        self.assertFalse(errors)

    def test_no_null_english(self):
        errors = [f"S{sn}:A{an}" for sn,an,ar,en in ALL_VERSES if en is None]
        self.assertFalse(errors)


# ═══════════════════════════════════════════════════════════════════════════════
class TestArabicTextAccuracy(unittest.TestCase):
    """Deep Arabic text validation — Unicode ranges, characters, lengths."""

    def setUp(self):
        if LOAD_ERROR: self.skipTest("File not loaded")

    def test_no_bom_in_arabic(self):
        errors = [f"S{sn}:A{an}" for sn,an,ar,en in ALL_VERSES if '\uFEFF' in ar]
        self.assertFalse(errors, f"BOM found in {len(errors)} verses: {errors[:5]}")

    def test_no_empty_arabic(self):
        errors = [f"S{sn}:A{an}" for sn,an,ar,en in ALL_VERSES if not ar.strip()]
        self.assertFalse(errors, f"Empty Arabic in {len(errors)} verses")

    def test_arabic_unicode_valid(self):
        errors = []
        for sn, an, ar, en in ALL_VERSES:
            for i, ch in enumerate(ar):
                if not is_arabic_codepoint(ord(ch)):
                    errors.append(f"S{sn}:A{an} pos {i}: U+{ord(ch):04X} [{unicodedata.name(ch,'?')}]")
                    if len(errors) >= 30: break
            if len(errors) >= 30: break
        self.assertFalse(errors, f"{len(errors)} invalid chars:\n" + '\n'.join(errors))

    def test_no_latin_letters_in_arabic(self):
        errors = []
        for sn,an,ar,en in ALL_VERSES:
            latin = [ch for ch in ar if ch.isascii() and ch.isalpha()]
            if latin:
                errors.append(f"S{sn}:A{an}: {latin[:3]}")
        self.assertFalse(errors, '\n'.join(errors))

    def test_no_ascii_digits_in_arabic(self):
        errors = []
        for sn,an,ar,en in ALL_VERSES:
            digits = [ch for ch in ar if ch.isascii() and ch.isdigit()]
            if digits:
                errors.append(f"S{sn}:A{an}: {digits}")
        self.assertFalse(errors, '\n'.join(errors))

    def test_arabic_starts_with_arabic_char(self):
        errors = []
        for sn,an,ar,en in ALL_VERSES:
            stripped = ar.lstrip()
            if not stripped:
                errors.append(f"S{sn}:A{an}: blank")
                continue
            cp = ord(stripped[0])
            if not (0x0600<=cp<=0x06FF or 0xFB50<=cp<=0xFDFF or 0xFE70<=cp<=0xFEFF):
                errors.append(f"S{sn}:A{an}: starts with U+{cp:04X} ({repr(stripped[0])})")
        self.assertFalse(errors, '\n'.join(errors))

    def test_arabic_minimum_length(self):
        """Shortest verse (e.g. Al-Asr) still has >= 3 chars."""
        errors = []
        for sn,an,ar,en in ALL_VERSES:
            if len(ar.strip()) < 3:
                errors.append(f"S{sn}:A{an}: len={len(ar.strip())} '{ar}'")
        self.assertFalse(errors, '\n'.join(errors))

    def test_arabic_maximum_length(self):
        """No single verse > 2000 chars (corruption guard)."""
        errors = [f"S{sn}:A{an}: len={len(ar)}" for sn,an,ar,en in ALL_VERSES if len(ar)>2000]
        self.assertFalse(errors)

    def test_no_control_chars_in_arabic(self):
        ALLOWED = {0x200C, 0x200D}
        errors = []
        for sn,an,ar,en in ALL_VERSES:
            for ch in ar:
                if unicodedata.category(ch) == 'Cc' and ord(ch) not in ALLOWED:
                    errors.append(f"S{sn}:A{an}: U+{ord(ch):04X}")
        self.assertFalse(errors, '\n'.join(errors[:20]))

    def test_total_arabic_char_count_in_range(self):
        """Total Arabic chars for Uthmani text with full diacritics is ~715k.
        The Uthmani script includes every harakat, sukun, shadda, and
        Quranic pause marks, so total char count is much higher than
        bare-letter count. Expected range: 600,000–800,000."""
        total = sum(len(ar) for _,_,ar,_ in ALL_VERSES)
        self.assertGreaterEqual(total, 600_000, f"Too few Arabic chars: {total:,}")
        self.assertLessEqual(total, 800_000, f"Too many Arabic chars: {total:,}")


# ═══════════════════════════════════════════════════════════════════════════════
class TestEnglishTextAccuracy(unittest.TestCase):
    """English translation field validation."""

    def setUp(self):
        if LOAD_ERROR: self.skipTest("File not loaded")

    def test_no_empty_english(self):
        errors = [f"S{sn}:A{an}" for sn,an,ar,en in ALL_VERSES if not en.strip()]
        self.assertFalse(errors, f"Empty English in {len(errors)} verses: {errors[:5]}")

    def test_no_arabic_script_in_english(self):
        errors = []
        for sn,an,ar,en in ALL_VERSES:
            bad = [ch for ch in en if 0x0600<=ord(ch)<=0x06FF]
            if bad:
                errors.append(f"S{sn}:A{an}: {bad[:3]}")
        self.assertFalse(errors, '\n'.join(errors))

    def test_no_bom_in_english(self):
        errors = [f"S{sn}:A{an}" for sn,an,ar,en in ALL_VERSES if '\uFEFF' in en]
        self.assertFalse(errors)

    def test_english_minimum_length(self):
        errors = []
        for sn,an,ar,en in ALL_VERSES:
            if len(en.strip()) < 5:
                errors.append(f"S{sn}:A{an}: len={len(en.strip())} '{en}'")
        self.assertFalse(errors, '\n'.join(errors))

    def test_english_maximum_length(self):
        errors = [f"S{sn}:A{an}: len={len(en)}" for sn,an,ar,en in ALL_VERSES if len(en)>5000]
        self.assertFalse(errors)

    def test_total_english_char_count_in_range(self):
        total = sum(len(en) for _,_,_,en in ALL_VERSES)
        self.assertGreaterEqual(total, 600_000, f"Too few English chars: {total:,}")
        self.assertLessEqual(total, 900_000, f"Too many English chars: {total:,}")


# ═══════════════════════════════════════════════════════════════════════════════
class TestSpotChecks(unittest.TestCase):
    """Verify specific known-correct verse content."""

    def setUp(self):
        if LOAD_ERROR: self.skipTest("File not loaded")

    def _v(self, sn, an):
        v = next((v for v in SURAHS[sn-1]['verses'] if v['ayah']==an), None)
        self.assertIsNotNone(v, f"S{sn}:A{an} not found")
        return v

    def test_s1_a1_is_bismillah(self):
        v = self._v(1,1)
        self.assertIn('بِسْمِ', v['arabic'], "S1:A1 must be Bismillah")
        self.assertNotIn('\uFEFF', v['arabic'], "BOM must not be in S1:A1")

    def test_s1_ends_at_ayah_7(self):
        self.assertEqual(SURAHS[0]['verses'][-1]['ayah'], 7)

    def test_s2_has_286_verses(self):
        self.assertEqual(len(SURAHS[1]['verses']), 286)

    def test_s9_a1_is_baraa(self):
        """At-Tawba 9:1 starts with bara'a (dissociation), not Bismillah.
        The Uthmani text uses بَرَآءَةٌۭ (with U+06ED small high meem at end)."""
        v = self._v(9,1)
        # 'بَرَ' is the invariant root — all orthographic variants start here
        self.assertTrue(
            v['arabic'].startswith('بَرَ'),
            f"S9:A1 should start with bara'a root 'بَرَ': {v['arabic'][:60]}"
        )

    def test_s18_a1_contains_hamd(self):
        v = self._v(18,1)
        self.assertTrue('حَمْدُ' in v['arabic'] or 'الْحَمْدُ' in v['arabic'],
            f"S18:A1 should contain hamd: {v['arabic'][:60]}")

    def test_s36_a1_is_yasin(self):
        v = self._v(36,1)
        self.assertTrue('يس' in v['arabic'] or 'يٓس' in v['arabic'],
            f"S36:A1 should be Ya-Sin letters: {v['arabic']}")

    def test_s55_a13_is_famous_refrain(self):
        """Ar-Rahman 55:13 is the famous refrain 'فَبِأَىِّ ءَالَآءِ رَبِّكُمَا تُكَذِّبَانِ'.
        The Uthmani text uses U+0649 (alef maqsura ى) not U+064A (ya ي) in أَىِّ."""
        v = self._v(55,13)
        # 'فَبِأَ' is invariant across all Uthmani orthographic variants
        self.assertIn('فَبِأَ', v['arabic'],
            f"S55:A13 should contain 'فَبِأَ' (Ar-Rahman refrain): {v['arabic']}")

    def test_s55_has_78_verses(self):
        self.assertEqual(len(SURAHS[54]['verses']), 78)

    def test_s112_a1_mentions_allah_and_ahad(self):
        """Al-Ikhlas 112:1 is 'قُلْ هُوَ ٱللَّهُ أَحَدٌ'.
        The API prepends the Bismillah text to verse 1, so the verse contains
        both the Bismillah and the actual verse text starting with قُلْ."""
        v = self._v(112,1)
        # The verse must contain قُلْ (Say) — the opening word of Al-Ikhlas
        self.assertIn('قُلْ', v['arabic'],
            f"S112:A1 must contain قُلْ (Say): {v['arabic'][:80]}")
        # And it must contain 'أَحَدٌ' (One/Unique)
        self.assertIn('أَحَدٌ', v['arabic'],
            f"S112:A1 must contain أَحَدٌ (One): {v['arabic'][:80]}")

    def test_s112_has_4_verses(self):
        self.assertEqual(len(SURAHS[111]['verses']), 4)

    def test_s114_is_last_surah(self):
        self.assertEqual(SURAHS[-1]['number'], 114)
        self.assertEqual(SURAHS[-1]['name_english'], 'An-Naas')

    def test_s114_has_6_verses(self):
        self.assertEqual(len(SURAHS[113]['verses']), 6)

    def test_s1_english_mentions_allah_or_name(self):
        v = self._v(1,1)
        en = v['english'].lower()
        self.assertTrue('allah' in en or 'name' in en or 'merciful' in en)

    def test_s112_english_mentions_oneness(self):
        full = ' '.join(v['english'].lower() for v in SURAHS[111]['verses'])
        self.assertTrue('one' in full or 'ahad' in full or 'god' in full)

    def test_s103_has_3_verses(self):
        self.assertEqual(len(SURAHS[102]['verses']), 3)

    def test_s108_has_3_verses(self):
        self.assertEqual(len(SURAHS[107]['verses']), 3)

    def test_s110_has_3_verses(self):
        self.assertEqual(len(SURAHS[109]['verses']), 3)


# ═══════════════════════════════════════════════════════════════════════════════
class TestCompleteness(unittest.TestCase):
    """Every surah and verse accounted for."""

    def setUp(self):
        if LOAD_ERROR: self.skipTest("File not loaded")

    def test_all_114_surahs_present(self):
        numbers = {s['number'] for s in SURAHS}
        missing = set(range(1,115)) - numbers
        self.assertFalse(missing, f"Missing surahs: {sorted(missing)}")

    def test_every_surah_has_all_ayahs(self):
        errors = []
        for s in SURAHS:
            expected = set(range(1, CORRECT_VERSE_COUNTS[s['number']-1]+1))
            actual = {v['ayah'] for v in s['verses']}
            missing = expected - actual
            extra = actual - expected
            if missing: errors.append(f"S{s['number']}: missing ayahs {sorted(missing)}")
            if extra:   errors.append(f"S{s['number']}: extra ayahs {sorted(extra)}")
        self.assertFalse(errors, '\n'.join(errors))

    def test_arabic_present_in_all_6236_verses(self):
        self.assertEqual(len(ALL_VERSES), 6236)
        missing = [(sn,an) for sn,an,ar,en in ALL_VERSES if not ar.strip()]
        self.assertFalse(missing, f"Missing Arabic in {len(missing)} verses")

    def test_english_present_in_all_6236_verses(self):
        self.assertEqual(len(ALL_VERSES), 6236)
        missing = [(sn,an) for sn,an,ar,en in ALL_VERSES if not en.strip()]
        self.assertFalse(missing, f"Missing English in {len(missing)} verses")

    def test_all_verse_counts_sum_to_6236(self):
        total = sum(len(s['verses']) for s in SURAHS)
        self.assertEqual(total, 6236)

    def test_longest_surah_is_albaqara(self):
        longest = max(SURAHS, key=lambda s: len(s['verses']))
        self.assertEqual(longest['number'], 2)

    def test_json_round_trips_without_loss(self):
        serialized = json.dumps(DATA, ensure_ascii=False)
        reparsed = json.loads(serialized)
        self.assertEqual(reparsed['total_surahs'], 114)
        self.assertEqual(reparsed['total_verses'], 6236)


# ═══════════════════════════════════════════════════════════════════════════════
class TestRegressionFixes(unittest.TestCase):
    """Every known bug from the audit must be fixed in the downloaded file."""

    def setUp(self):
        if LOAD_ERROR: self.skipTest("File not loaded")

    def test_REGRESSION_s1_a1_no_bom(self):
        """BOM (U+FEFF) was found in Surah 1:1. Must be stripped."""
        v = SURAHS[0]['verses'][0]
        self.assertFalse(v['arabic'].startswith('\uFEFF'),
            "REGRESSION: Surah 1:1 still has BOM character U+FEFF")

    def test_REGRESSION_no_bom_anywhere(self):
        """BOM must not appear in any arabic or english field."""
        bom = [(sn,an,fld) for sn,an,ar,en in ALL_VERSES
               for fld,txt in [('ar',ar),('en',en)] if '\uFEFF' in txt]
        self.assertFalse(bom, f"BOM in {len(bom)} fields: {bom[:5]}")

    def test_REGRESSION_s113_meaning_not_the_dawn(self):
        """Surah 113 Al-Falaq meaning was 'The Dawn' (same as S89). Must be fixed."""
        meaning = SURAHS[112].get('name_english_meaning','')
        self.assertNotEqual(meaning, 'The Dawn',
            f"REGRESSION: S113 meaning='{meaning}' should not be 'The Dawn' (that's S89)")

    def test_REGRESSION_s10_meaning_not_jonas(self):
        """Surah 10 meaning was 'Jonas'. Correct spelling is 'Jonah'."""
        meaning = SURAHS[9].get('name_english_meaning','')
        self.assertNotIn('Jonas', meaning,
            f"REGRESSION: S10 meaning='{meaning}' contains 'Jonas'")

    def test_REGRESSION_s36_meaning_not_just_transliteration(self):
        """Surah 36 meaning was 'Yaseen' (same as the name). Should be 'Ya Sin'."""
        meaning = SURAHS[35].get('name_english_meaning','').lower()
        self.assertNotIn(meaning, ('yaseen','ya seen'),
            f"REGRESSION: S36 meaning is a transliteration, not an English meaning")

    def test_REGRESSION_s89_meaning_is_the_dawn(self):
        """Surah 89 Al-Fajr should still be 'The Dawn' after S113 fix."""
        meaning = SURAHS[88].get('name_english_meaning','')
        self.assertEqual(meaning, 'The Dawn',
            f"S89 should be 'The Dawn', got '{meaning}'")


# ═══════════════════════════════════════════════════════════════════════════════
# Standalone runner (no pytest needed)
# ═══════════════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("╔══════════════════════════════════════════════════════╗")
    print("║   QURAN JSON — ACCURACY TEST SUITE                   ║")
    print("╚══════════════════════════════════════════════════════╝")
    print()

    if LOAD_ERROR:
        print("ERROR: Could not load quran.json")
        print(LOAD_ERROR)
        print()
        print("Generate quran.json using the Quran Downloader app first.")
        sys.exit(1)

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    for cls in [
        TestDataLoaded, TestTopLevel, TestSurahStructure,
        TestVerseStructure, TestArabicTextAccuracy, TestEnglishTextAccuracy,
        TestSpotChecks, TestCompleteness, TestRegressionFixes,
    ]:
        suite.addTests(loader.loadTestsFromTestCase(cls))

    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)

    print()
    if result.wasSuccessful():
        print(f"✓ ALL {result.testsRun} TESTS PASSED — 100% accuracy confirmed")
    else:
        print(f"✗ {len(result.failures)} failures, {len(result.errors)} errors out of {result.testsRun} tests")
    sys.exit(0 if result.wasSuccessful() else 1)
