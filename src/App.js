import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import QuranReader from './components/QuranReader';

// ── Constants ──────────────────────────────────────────────────────────────
const BASE = 'https://api.alquran.cloud/v1';

const SURAH_META = [
  [1,'Al-Faatiha','الفاتحة','The Opening',7,'Meccan'],
  [2,'Al-Baqara','البقرة','The Cow',286,'Medinan'],
  [3,'Aal-i-Imraan','آل عمران','Family of Imran',200,'Medinan'],
  [4,'An-Nisaa','النساء','The Women',176,'Medinan'],
  [5,'Al-Maaida','المائدة','The Table',120,'Medinan'],
  [6,'Al-An\'aam','الأنعام','The Cattle',165,'Meccan'],
  [7,'Al-A\'raaf','الأعراف','The Heights',206,'Meccan'],
  [8,'Al-Anfaal','الأنفال','The Spoils of War',75,'Medinan'],
  [9,'At-Tawba','التوبة','The Repentance',129,'Medinan'],
  [10,'Yunus','يونس','Jonah',109,'Meccan'],
  [11,'Hud','هود','Hud',123,'Meccan'],
  [12,'Yusuf','يوسف','Joseph',111,'Meccan'],
  [13,'Ar-Ra\'d','الرعد','The Thunder',43,'Medinan'],
  [14,'Ibrahim','إبراهيم','Abraham',52,'Meccan'],
  [15,'Al-Hijr','الحجر','The Rock',99,'Meccan'],
  [16,'An-Nahl','النحل','The Bee',128,'Meccan'],
  [17,'Al-Israa','الإسراء','The Night Journey',111,'Meccan'],
  [18,'Al-Kahf','الكهف','The Cave',110,'Meccan'],
  [19,'Maryam','مريم','Mary',98,'Meccan'],
  [20,'Taa-Haa','طه','Ta-Ha',135,'Meccan'],
  [21,'Al-Anbiyaa','الأنبياء','The Prophets',112,'Meccan'],
  [22,'Al-Hajj','الحج','The Pilgrimage',78,'Medinan'],
  [23,'Al-Muminoon','المؤمنون','The Believers',118,'Meccan'],
  [24,'An-Noor','النور','The Light',64,'Medinan'],
  [25,'Al-Furqaan','الفرقان','The Criterion',77,'Meccan'],
  [26,'Ash-Shu\'araa','الشعراء','The Poets',227,'Meccan'],
  [27,'An-Naml','النمل','The Ant',93,'Meccan'],
  [28,'Al-Qasas','القصص','The Stories',88,'Meccan'],
  [29,'Al-Ankaboot','العنكبوت','The Spider',69,'Meccan'],
  [30,'Ar-Room','الروم','The Romans',60,'Meccan'],
  [31,'Luqman','لقمان','Luqman',34,'Meccan'],
  [32,'As-Sajda','السجدة','The Prostration',30,'Meccan'],
  [33,'Al-Ahzaab','الأحزاب','The Clans',73,'Medinan'],
  [34,'Saba','سبأ','Sheba',54,'Meccan'],
  [35,'Faatir','فاطر','The Originator',45,'Meccan'],
  [36,'Yaseen','يس','Ya Sin',83,'Meccan'],
  [37,'As-Saaffaat','الصافات','Those in Ranks',182,'Meccan'],
  [38,'Saad','ص','The Letter Sad',88,'Meccan'],
  [39,'Az-Zumar','الزمر','The Groups',75,'Meccan'],
  [40,'Ghafir','غافر','The Forgiver',85,'Meccan'],
  [41,'Fussilat','فصلت','Explained in Detail',54,'Meccan'],
  [42,'Ash-Shura','الشورى','Consultation',53,'Meccan'],
  [43,'Az-Zukhruf','الزخرف','Ornaments of Gold',89,'Meccan'],
  [44,'Ad-Dukhaan','الدخان','The Smoke',59,'Meccan'],
  [45,'Al-Jaathiya','الجاثية','Crouching',37,'Meccan'],
  [46,'Al-Ahqaf','الأحقاف','The Dunes',35,'Meccan'],
  [47,'Muhammad','محمد','Muhammad',38,'Medinan'],
  [48,'Al-Fath','الفتح','The Victory',29,'Medinan'],
  [49,'Al-Hujuraat','الحجرات','The Inner Apartments',18,'Medinan'],
  [50,'Qaaf','ق','The Letter Qaf',45,'Meccan'],
  [51,'Adh-Dhaariyat','الذاريات','The Winnowing Winds',60,'Meccan'],
  [52,'At-Tur','الطور','The Mount',49,'Meccan'],
  [53,'An-Najm','النجم','The Star',62,'Meccan'],
  [54,'Al-Qamar','القمر','The Moon',55,'Meccan'],
  [55,'Ar-Rahmaan','الرحمن','The Beneficent',78,'Medinan'],
  [56,'Al-Waaqia','الواقعة','The Inevitable',96,'Meccan'],
  [57,'Al-Hadid','الحديد','The Iron',29,'Medinan'],
  [58,'Al-Mujaadila','المجادلة','The Pleading Woman',22,'Medinan'],
  [59,'Al-Hashr','الحشر','The Exile',24,'Medinan'],
  [60,'Al-Mumtahana','الممتحنة','She That is Examined',13,'Medinan'],
  [61,'As-Saff','الصف','The Ranks',14,'Medinan'],
  [62,'Al-Jumu\'a','الجمعة','Friday',11,'Medinan'],
  [63,'Al-Munaafiqoon','المنافقون','The Hypocrites',11,'Medinan'],
  [64,'At-Taghaabun','التغابن','Mutual Disillusion',18,'Medinan'],
  [65,'At-Talaaq','الطلاق','Divorce',12,'Medinan'],
  [66,'At-Tahrim','التحريم','The Prohibition',12,'Medinan'],
  [67,'Al-Mulk','الملك','The Sovereignty',30,'Meccan'],
  [68,'Al-Qalam','القلم','The Pen',52,'Meccan'],
  [69,'Al-Haaqqa','الحاقة','The Reality',52,'Meccan'],
  [70,'Al-Ma\'aarij','المعارج','The Ascending Stairways',44,'Meccan'],
  [71,'Nooh','نوح','Noah',28,'Meccan'],
  [72,'Al-Jinn','الجن','The Jinn',28,'Meccan'],
  [73,'Al-Muzzammil','المزمل','The Enshrouded One',20,'Meccan'],
  [74,'Al-Muddaththir','المدثر','The Cloaked One',56,'Meccan'],
  [75,'Al-Qiyaama','القيامة','The Resurrection',40,'Meccan'],
  [76,'Al-Insaan','الإنسان','Man',31,'Medinan'],
  [77,'Al-Mursalaat','المرسلات','The Emissaries',50,'Meccan'],
  [78,'An-Naba','النبأ','The Announcement',40,'Meccan'],
  [79,'An-Naazi\'aat','النازعات','Those Who Drag Forth',46,'Meccan'],
  [80,'Abasa','عبس','He Frowned',42,'Meccan'],
  [81,'At-Takwir','التكوير','The Overthrowing',29,'Meccan'],
  [82,'Al-Infitaar','الانفطار','The Cleaving',19,'Meccan'],
  [83,'Al-Mutaffifin','المطففين','Defrauding',36,'Meccan'],
  [84,'Al-Inshiqaaq','الانشقاق','The Splitting Open',25,'Meccan'],
  [85,'Al-Burooj','البروج','The Constellations',22,'Meccan'],
  [86,'At-Taariq','الطارق','The Morning Star',17,'Meccan'],
  [87,'Al-A\'laa','الأعلى','The Most High',19,'Meccan'],
  [88,'Al-Ghaashiya','الغاشية','The Overwhelming',26,'Meccan'],
  [89,'Al-Fajr','الفجر','The Dawn',30,'Meccan'],
  [90,'Al-Balad','البلد','The City',20,'Meccan'],
  [91,'Ash-Shams','الشمس','The Sun',15,'Meccan'],
  [92,'Al-Lail','الليل','The Night',21,'Meccan'],
  [93,'Ad-Dhuhaa','الضحى','The Morning Hours',11,'Meccan'],
  [94,'Ash-Sharh','الشرح','The Consolation',8,'Meccan'],
  [95,'At-Tin','التين','The Fig',8,'Meccan'],
  [96,'Al-Alaq','العلق','The Clot',19,'Meccan'],
  [97,'Al-Qadr','القدر','The Power',5,'Meccan'],
  [98,'Al-Bayyina','البينة','The Evidence',8,'Medinan'],
  [99,'Az-Zalzala','الزلزلة','The Earthquake',8,'Medinan'],
  [100,'Al-Aadiyaat','العاديات','The Chargers',11,'Meccan'],
  [101,'Al-Qaari\'a','القارعة','The Calamity',11,'Meccan'],
  [102,'At-Takaathur','التكاثر','Competition',8,'Meccan'],
  [103,'Al-Asr','العصر','The Declining Day',3,'Meccan'],
  [104,'Al-Humaza','الهمزة','The Traducer',9,'Meccan'],
  [105,'Al-Fil','الفيل','The Elephant',5,'Meccan'],
  [106,'Quraish','قريش','Quraysh',4,'Meccan'],
  [107,'Al-Maa\'un','الماعون','Almsgiving',7,'Meccan'],
  [108,'Al-Kawthar','الكوثر','Abundance',3,'Meccan'],
  [109,'Al-Kaafiroon','الكافرون','The Disbelievers',6,'Meccan'],
  [110,'An-Nasr','النصر','Divine Support',3,'Medinan'],
  [111,'Al-Masad','المسد','The Palm Fibre',5,'Meccan'],
  [112,'Al-Ikhlaas','الإخلاص','Sincerity',4,'Meccan'],
  [113,'Al-Falaq','الفلق','The Daybreak',5,'Meccan'],
  [114,'An-Naas','الناس','Mankind',6,'Meccan'],
];

// ── Utilities ──────────────────────────────────────────────────────────────
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }
}

function downloadBlob(content, filename, type = 'application/json') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function buildSQL(surahs) {
  const lines = [];
  lines.push(`-- ╔══════════════════════════════════════════════════════════════╗`);
  lines.push(`-- ║          QURAN DATABASE - SQL SCHEMA & DATA                  ║`);
  lines.push(`-- ║  Arabic (Uthmani) + English (Saheeh International)           ║`);
  lines.push(`-- ║  114 Surahs · 6,236 Verses                                   ║`);
  lines.push(`-- ║  Generated: ${new Date().toISOString().split('T')[0]}                                   ║`);
  lines.push(`-- ╚══════════════════════════════════════════════════════════════╝`);
  lines.push('');
  lines.push('-- Compatible with: MySQL, PostgreSQL, SQLite');
  lines.push('');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  lines.push('-- TABLE: surahs');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  lines.push('CREATE TABLE IF NOT EXISTS surahs (');
  lines.push('  id               INTEGER PRIMARY KEY,');
  lines.push('  number           INTEGER NOT NULL UNIQUE,');
  lines.push('  name_arabic      TEXT    NOT NULL,');
  lines.push('  name_english     TEXT    NOT NULL,');
  lines.push('  name_meaning     TEXT,');
  lines.push('  total_verses     INTEGER NOT NULL,');
  lines.push('  revelation_type  TEXT    CHECK(revelation_type IN (\'Meccan\',\'Medinan\'))');
  lines.push(');');
  lines.push('');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  lines.push('-- TABLE: verses');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  lines.push('CREATE TABLE IF NOT EXISTS verses (');
  lines.push('  id               INTEGER PRIMARY KEY AUTOINCREMENT,');
  lines.push('  surah_number     INTEGER NOT NULL REFERENCES surahs(number),');
  lines.push('  ayah_number      INTEGER NOT NULL,');
  lines.push('  arabic           TEXT    NOT NULL,');
  lines.push('  english          TEXT,');
  lines.push('  UNIQUE(surah_number, ayah_number)');
  lines.push(');');
  lines.push('');
  lines.push('CREATE INDEX IF NOT EXISTS idx_verses_surah ON verses(surah_number);');
  lines.push('');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  lines.push('-- DATA: surahs');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  for (const s of surahs) {
    const esc = t => t.replace(/'/g, "''");
    lines.push(`INSERT INTO surahs VALUES (${s.number},${s.number},'${esc(s.name_arabic)}','${esc(s.name_english)}','${esc(s.name_english_meaning)}',${s.total_verses},'${s.revelation_type}');`);
  }
  lines.push('');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  lines.push('-- DATA: verses');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  for (const s of surahs) {
    lines.push(`-- Surah ${s.number}: ${s.name_english}`);
    for (const v of s.verses) {
      const ar = v.arabic.replace(/'/g, "''").replace(/\uFEFF/g, '');
      const en = (v.english || '').replace(/'/g, "''");
      lines.push(`INSERT INTO verses(surah_number,ayah_number,arabic,english) VALUES (${s.number},${v.ayah},'${ar}','${en}');`);
    }
  }
  lines.push('');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  lines.push('-- SAMPLE QUERIES');
  lines.push('-- ─────────────────────────────────────────────────────────────');
  lines.push('-- Get all verses of Al-Fatiha:');
  lines.push('-- SELECT * FROM verses WHERE surah_number = 1;');
  lines.push('');
  lines.push('-- Search English translation:');
  lines.push('-- SELECT s.name_english, v.ayah_number, v.arabic, v.english');
  lines.push('-- FROM verses v JOIN surahs s ON v.surah_number = s.number');
  lines.push('-- WHERE v.english LIKE \'%mercy%\';');
  lines.push('');
  lines.push('-- Count Meccan vs Medinan:');
  lines.push('-- SELECT revelation_type, COUNT(*) FROM surahs GROUP BY revelation_type;');
  return lines.join('\n');
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse 120% 80% at 50% -10%, #1a1200 0%, #080a0f 55%)',
    position: 'relative',
    overflow: 'hidden',
  },
  // Decorative star field
  starField: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    background: `
      radial-gradient(1px 1px at 10% 15%, rgba(200,151,58,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 25% 40%, rgba(200,151,58,0.2) 0%, transparent 100%),
      radial-gradient(1px 1px at 40% 8%, rgba(255,255,255,0.15) 0%, transparent 100%),
      radial-gradient(1px 1px at 60% 22%, rgba(255,255,255,0.1) 0%, transparent 100%),
      radial-gradient(1px 1px at 75% 5%, rgba(200,151,58,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 85% 35%, rgba(255,255,255,0.12) 0%, transparent 100%),
      radial-gradient(1px 1px at 95% 18%, rgba(200,151,58,0.25) 0%, transparent 100%),
      radial-gradient(2px 2px at 50% 3%, rgba(200,151,58,0.5) 0%, transparent 100%)
    `,
  },
  container: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '0 24px 80px',
    position: 'relative',
    zIndex: 1,
  },
  // ── Hero ──
  hero: {
    textAlign: 'center',
    padding: '64px 0 48px',
    animation: 'fadeUp 0.8s ease both',
  },
  heroArabic: {
    fontFamily: "'Amiri', serif",
    fontSize: 64,
    color: 'var(--gold2)',
    direction: 'rtl',
    lineHeight: 1.1,
    textShadow: '0 0 60px rgba(200,151,58,0.4), 0 0 120px rgba(200,151,58,0.15)',
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    letterSpacing: '0.35em',
    color: 'var(--text3)',
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  heroDivider: {
    display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', marginBottom: 20,
  },
  heroDividerLine: {
    width: 80, height: 1,
    background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
  },
  heroDiamonds: {
    display: 'flex', gap: 6, alignItems: 'center',
  },
  heroDiamond: {
    width: 5, height: 5,
    background: 'var(--gold)',
    transform: 'rotate(45deg)',
  },
  heroTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: 28,
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: '0.05em',
    marginBottom: 10,
  },
  heroDesc: {
    fontSize: 17,
    color: 'var(--text2)',
    fontStyle: 'italic',
    fontWeight: 300,
  },
  // ── Stats bar ──
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 28,
    animation: 'fadeUp 0.8s 0.1s ease both',
  },
  statCard: {
    background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '16px 12px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  statVal: {
    fontFamily: "'Cinzel', serif",
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--gold2)',
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "'Cinzel', serif",
    fontSize: 9,
    letterSpacing: '0.15em',
    color: 'var(--text3)',
    textTransform: 'uppercase',
  },
  // ── Panel ──
  panel: {
    background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg2) 100%)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '28px 32px',
    marginBottom: 20,
    animation: 'fadeUp 0.8s 0.15s ease both',
  },
  panelHeader: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
  },
  panelDot: {
    width: 8, height: 8,
    background: 'var(--gold)',
    borderRadius: '50%',
    boxShadow: '0 0 8px var(--gold)',
    flexShrink: 0,
  },
  panelTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    letterSpacing: '0.22em',
    color: 'var(--gold)',
    textTransform: 'uppercase',
  },
  panelLine: {
    flex: 1, height: 1,
    background: 'linear-gradient(90deg, var(--border2), transparent)',
  },
  // ── Format grid ──
  formatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 24,
  },
  fmtCard: (active) => ({
    background: active
      ? 'linear-gradient(135deg, rgba(200,151,58,0.12) 0%, rgba(200,151,58,0.04) 100%)'
      : 'var(--bg)',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    borderRadius: 10,
    padding: '16px 14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  }),
  fmtIcon: { fontSize: 22, marginBottom: 6 },
  fmtName: (active) => ({
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: active ? 'var(--gold2)' : 'var(--text2)',
    marginBottom: 4,
  }),
  fmtDesc: {
    fontSize: 12,
    color: 'var(--text3)',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  // ── Fetch button ──
  fetchBtn: (loading) => ({
    width: '100%',
    background: loading
      ? 'var(--surface2)'
      : 'linear-gradient(135deg, #9a6f20 0%, #c8973a 50%, #9a6f20 100%)',
    backgroundSize: '200% auto',
    border: `1px solid ${loading ? 'var(--border2)' : 'var(--gold)'}`,
    color: loading ? 'var(--text3)' : '#0a0600',
    padding: '15px 28px',
    borderRadius: 10,
    fontFamily: "'Cinzel', serif",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.12em',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s',
    textTransform: 'uppercase',
    animation: loading ? 'none' : 'shimmer 3s linear infinite',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  }),
  // ── Progress ──
  progressWrap: {
    marginTop: 20,
  },
  progressTrack: {
    height: 4,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  progressFill: (pct, color = 'var(--gold)') => ({
    height: '100%',
    width: `${pct}%`,
    background: `linear-gradient(90deg, ${color}, var(--gold3))`,
    borderRadius: 2,
    transition: 'width 0.4s ease',
    boxShadow: `0 0 8px ${color}`,
  }),
  progressRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  progressLabel: {
    fontFamily: "'Cinzel', serif",
    fontSize: 10,
    letterSpacing: '0.1em',
    color: 'var(--text3)',
  },
  progressPct: {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    color: 'var(--gold)',
  },
  // ── Log ──
  log: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '14px 16px',
    height: 150,
    overflowY: 'auto',
    fontFamily: 'var(--mono)',
    fontSize: 11.5,
    lineHeight: 1.8,
    marginTop: 14,
  },
  logLine: (type) => ({
    color: type === 'ok' ? 'var(--green)'
         : type === 'warn' ? 'var(--gold)'
         : type === 'err' ? 'var(--red)'
         : 'var(--text3)',
  }),
  // ── Download panel ──
  dlPanel: {
    background: 'linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(52,211,153,0.04) 100%)',
    border: '1px solid rgba(45,212,191,0.2)',
    borderRadius: 14,
    padding: '32px',
    marginBottom: 20,
    animation: 'fadeUp 0.5s ease both',
    textAlign: 'center',
  },
  dlIcon: { fontSize: 48, marginBottom: 10, animation: 'float 3s ease-in-out infinite' },
  dlTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--teal2)',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  dlMeta: {
    fontSize: 15,
    color: 'var(--text2)',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  dlBtns: {
    display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
  },
  dlBtn: (variant) => ({
    background: variant === 'primary'
      ? 'linear-gradient(135deg, var(--teal), var(--teal2))'
      : variant === 'pdf'
      ? 'linear-gradient(135deg, #e05555, #c03030)'
      : variant === 'sql'
      ? 'linear-gradient(135deg, #7c3aed, #9f67fa)'
      : 'transparent',
    border: variant === 'outline' ? '1px solid var(--teal)' : 'none',
    color: variant === 'outline' ? 'var(--teal)' : '#fff',
    padding: '11px 22px',
    borderRadius: 8,
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'transform 0.15s, box-shadow 0.15s',
  }),
  // ── Preview ──
  previewBox: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '14px 16px',
    fontFamily: 'var(--mono)',
    fontSize: 11,
    lineHeight: 1.8,
    textAlign: 'left',
    marginTop: 16,
    maxHeight: 180,
    overflow: 'hidden',
    position: 'relative',
    color: 'var(--text3)',
  },
  // ── Surah list ──
  surahListWrap: {
    animation: 'fadeUp 0.8s 0.2s ease both',
  },
  surahGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 8,
    maxHeight: 320,
    overflowY: 'auto',
    padding: '4px 2px',
  },
  surahItem: (selected) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
    background: selected ? 'rgba(200,151,58,0.08)' : 'var(--bg)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  surahNum: {
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    color: 'var(--text3)',
    minWidth: 26,
    textAlign: 'right',
  },
  surahArabic: {
    fontFamily: "'Amiri', serif",
    fontSize: 17,
    color: 'var(--gold)',
    direction: 'rtl',
  },
  surahEnglish: {
    fontSize: 13,
    color: 'var(--text2)',
    flex: 1,
  },
  surahBadge: (type) => ({
    fontSize: 9,
    fontFamily: "'Cinzel', serif",
    letterSpacing: '0.08em',
    color: type === 'Meccan' ? 'var(--gold)' : 'var(--teal)',
    opacity: 0.7,
  }),
  // ── Single surah dl ──
  singleDlRow: {
    display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap',
  },
  // ── Error ──
  errBox: {
    background: 'rgba(224,85,85,0.08)',
    border: '1px solid rgba(224,85,85,0.25)',
    borderRadius: 8,
    padding: '14px 16px',
    marginTop: 14,
    fontSize: 14,
    color: 'var(--red)',
    fontStyle: 'italic',
  },
};

// ── PDF template generator (HTML-based, opens in new tab) ──────────────────
function generatePDFTemplate(surahs) {
  const surahRows = surahs.map(s =>
    `<tr><td>${s.number}</td><td dir="rtl" style="font-family:'Amiri',serif;font-size:15px">${s.name_arabic}</td><td>${s.name_english}</td><td>${s.name_english_meaning}</td><td>${s.total_verses}</td><td>${s.revelation_type}</td></tr>`
  ).join('');

  const sample = surahs[0].verses.slice(0, 3).map(v =>
    `<tr><td>1</td><td>${v.ayah}</td><td dir="rtl" style="font-family:'Amiri',serif;font-size:15px">${v.arabic.replace(/\uFEFF/g,'')}</td><td style="font-style:italic">${v.english}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Quran Database — Reference Sheet</title>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4; margin: 20mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Crimson Pro', Georgia, serif; color: #1a1008; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }
  /* Header */
  .header { text-align: center; border-bottom: 2px solid #c8973a; padding-bottom: 24px; margin-bottom: 32px; }
  .arabic-title { font-family: 'Amiri', serif; font-size: 52px; color: #9a6f20; direction: rtl; line-height: 1.1; margin-bottom: 8px; }
  .eng-title { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; letter-spacing: 0.08em; color: #1a1008; margin-bottom: 6px; }
  .subtitle { font-size: 14px; color: #7a6040; font-style: italic; }
  .ornament { color: #c8973a; font-size: 20px; margin: 8px 0; }
  /* Sections */
  .section { margin-bottom: 32px; }
  .section-title { font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; color: #9a6f20; text-transform: uppercase; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e8d5aa; display: flex; align-items: center; gap: 10px; }
  .section-title::before { content: '◆'; font-size: 8px; }
  /* Stats */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
  .stat-box { background: linear-gradient(135deg, #fdf8f0, #f5edd8); border: 1px solid #e8d5aa; border-radius: 8px; padding: 14px; text-align: center; }
  .stat-val { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: #9a6f20; }
  .stat-label { font-size: 10px; font-family: 'Cinzel', serif; letter-spacing: 0.1em; color: #7a6040; text-transform: uppercase; margin-top: 2px; }
  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { background: linear-gradient(135deg, #2a1f08, #3d2e0f); color: #e8c97a; font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 9px 10px; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #f0e8d5; vertical-align: middle; }
  tr:nth-child(even) td { background: #fdfaf5; }
  tr:hover td { background: #fef9ee; }
  /* JSON preview */
  .code-box { background: #f5f0e8; border: 1px solid #e8d5aa; border-radius: 6px; padding: 14px; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.7; color: #2a1f08; white-space: pre; overflow: hidden; }
  .k { color: #7c3aed; } .s { color: #065f46; } .n { color: #9a6f20; }
  /* SQL preview */
  .sql-box { background: #0d0820; border: 1px solid #2a1a5e; border-radius: 6px; padding: 14px; font-family: 'Courier New', monospace; font-size: 10.5px; line-height: 1.7; color: #c4b5fd; white-space: pre; overflow: hidden; }
  .sql-kw { color: #7c3aed; font-weight: bold; } .sql-str { color: #34d399; } .sql-cm { color: #4a5578; }
  /* Footer */
  .footer { text-align: center; border-top: 1px solid #e8d5aa; padding-top: 16px; margin-top: 32px; font-size: 11px; color: #7a6040; }
  @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="arabic-title">القرآن الكريم</div>
    <div class="ornament">◆ ◈ ◆</div>
    <div class="eng-title">The Holy Quran — Database Reference</div>
    <div class="subtitle">Arabic (Uthmani Script) · English (Saheeh International) · ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
  </div>

  <div class="section">
    <div class="section-title">Dataset Statistics</div>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-val">114</div><div class="stat-label">Surahs</div></div>
      <div class="stat-box"><div class="stat-val">6,236</div><div class="stat-label">Verses</div></div>
      <div class="stat-box"><div class="stat-val">86</div><div class="stat-label">Meccan</div></div>
      <div class="stat-box"><div class="stat-val">28</div><div class="stat-label">Medinan</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">All 114 Surahs</div>
    <table>
      <thead><tr><th>#</th><th>Arabic Name</th><th>English Name</th><th>Meaning</th><th>Verses</th><th>Type</th></tr></thead>
      <tbody>${surahRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">JSON Structure — Sample (Al-Fatiha, verses 1–3)</div>
    <div class="code-box"><span class="k">"surahs"</span>: [
  {
    <span class="k">"number"</span>: <span class="n">1</span>,
    <span class="k">"name_arabic"</span>: <span class="s">"الفاتحة"</span>,
    <span class="k">"name_english"</span>: <span class="s">"Al-Faatiha"</span>,
    <span class="k">"name_english_meaning"</span>: <span class="s">"The Opening"</span>,
    <span class="k">"revelation_type"</span>: <span class="s">"Meccan"</span>,
    <span class="k">"total_verses"</span>: <span class="n">7</span>,
    <span class="k">"verses"</span>: [
      { <span class="k">"ayah"</span>: <span class="n">1</span>, <span class="k">"arabic"</span>: <span class="s">"بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"</span>, <span class="k">"english"</span>: <span class="s">"In the name of Allah..."</span> },
      { <span class="k">"ayah"</span>: <span class="n">2</span>, <span class="k">"arabic"</span>: <span class="s">"ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ"</span>, <span class="k">"english"</span>: <span class="s">"[All] praise is [due] to Allah..."</span> },
      ...
    ]
  }, ...
]</div>
  </div>

  <div class="section">
    <div class="section-title">SQL Schema Template</div>
    <div class="sql-box"><span class="sql-kw">CREATE TABLE</span> surahs (
  id               <span class="sql-kw">INTEGER PRIMARY KEY</span>,
  number           <span class="sql-kw">INTEGER NOT NULL UNIQUE</span>,
  name_arabic      <span class="sql-kw">TEXT    NOT NULL</span>,
  name_english     <span class="sql-kw">TEXT    NOT NULL</span>,
  name_meaning     <span class="sql-kw">TEXT</span>,
  total_verses     <span class="sql-kw">INTEGER NOT NULL</span>,
  revelation_type  <span class="sql-kw">TEXT</span>
);

<span class="sql-kw">CREATE TABLE</span> verses (
  id               <span class="sql-kw">INTEGER PRIMARY KEY AUTOINCREMENT</span>,
  surah_number     <span class="sql-kw">INTEGER NOT NULL REFERENCES</span> surahs(number),
  ayah_number      <span class="sql-kw">INTEGER NOT NULL</span>,
  arabic           <span class="sql-kw">TEXT    NOT NULL</span>,
  english          <span class="sql-kw">TEXT</span>
);
<span class="sql-cm">-- See quran.sql for full data (6,236 INSERT statements)</span></div>
  </div>

  <div class="section">
    <div class="section-title">Sample Verses — Al-Fatiha</div>
    <table>
      <thead><tr><th>Surah</th><th>Ayah</th><th>Arabic</th><th>English</th></tr></thead>
      <tbody>${sample}</tbody>
    </table>
  </div>

  <div class="footer">
    Al-Quran Database Reference · Arabic: Uthmani Edition · English: Saheeh International
    · Source: alquran.cloud
  </div>
</div>
<script>window.onload=()=>window.print();</script>
</body>
</html>`;
}

// ── Root wrapper with tab navigation ──────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = React.useState('reader');
  const [menuOpen, setMenuOpen]   = React.useState(false);

  const navigate = (tab) => { setActiveTab(tab); setMenuOpen(false); };

  return (
    <div>
      <nav className="app-nav">
        {/* Brand */}
        <div className="nav-brand">
          <span className="nav-brand-arabic">القرآن</span>
          <span className="nav-brand-en">The Holy Quran</span>
        </div>

        {/* Desktop tabs */}
        <div className="nav-tabs nav-tabs-desktop">
          <button className={`nav-tab${activeTab==='reader'?' active':''}`} onClick={() => navigate('reader')}>
            <span className="nav-tab-icon">📖</span>Reader
          </button>
          <button className={`nav-tab${activeTab==='downloader'?' active':''}`} onClick={() => navigate('downloader')}>
            <span className="nav-tab-icon">⬇</span>Downloader
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-drawer" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="mobile-drawer-arabic">القرآن الكريم</span>
              <button className="mobile-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <div className="mobile-drawer-links">
              <button
                className={`mobile-drawer-link${activeTab==='reader'?' active':''}`}
                onClick={() => navigate('reader')}
              >
                <span className="mobile-drawer-link-icon">📖</span>
                <span>
                  <span className="mobile-drawer-link-title">Reader</span>
                  <span className="mobile-drawer-link-sub">Read all 114 surahs</span>
                </span>
              </button>
              <button
                className={`mobile-drawer-link${activeTab==='downloader'?' active':''}`}
                onClick={() => navigate('downloader')}
              >
                <span className="mobile-drawer-link-icon">⬇</span>
                <span>
                  <span className="mobile-drawer-link-title">Downloader</span>
                  <span className="mobile-drawer-link-sub">Export JSON · SQL · PDF</span>
                </span>
              </button>
            </div>
            <div className="mobile-drawer-footer">
              <span>114 Surahs · 6,236 Verses</span>
              <span>Arabic + English</span>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        {activeTab === 'reader' && <QuranReader />}
        {activeTab === 'downloader' && <div className="downloader-page"><Downloader /></div>}
      </div>
    </div>
  );
}

// ── Downloader ─────────────────────────────────────────────────────────────
function Downloader() {
  const [fmt, setFmt] = useState('combined');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [logs, setLogs] = useState([]);
  const [quranData, setQuranData] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const logRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en', { hour12: false });
    setLogs(prev => [...prev, { msg, type, time }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const FORMATS = [
    { id: 'combined', icon: '📖', name: 'Combined', desc: 'Arabic + English per verse in one structure' },
    { id: 'flat', icon: '📋', name: 'Flat Array', desc: 'Single array of all 6,236 verses' },
    { id: 'split', icon: '🔀', name: 'Split', desc: 'Separate arabic[] and english[] arrays' },
  ];

  async function startFetch() {
    setStatus('loading');
    setProgress(0);
    setLogs([]);
    setErrMsg('');
    setQuranData(null);

    try {
      addLog('Connecting to alquran.cloud API…', 'info');
      setProgress(5); setProgressLabel('Connecting…');

      addLog('Fetching Arabic text — Uthmani edition…', 'info');
      setProgress(15); setProgressLabel('Fetching Arabic (Uthmani)…');
      const arRes = await fetchWithRetry(`${BASE}/quran/quran-uthmani`);
      addLog(`✓ Arabic received — ${arRes.data.surahs.length} surahs`, 'ok');

      setProgress(50); setProgressLabel('Fetching English translation…');
      addLog('Fetching English — Saheeh International…', 'info');
      const enRes = await fetchWithRetry(`${BASE}/quran/en.sahih`);
      addLog(`✓ English received — ${enRes.data.surahs.length} surahs`, 'ok');

      setProgress(80); setProgressLabel('Merging & building dataset…');
      addLog('Merging datasets…', 'info');

      const arSurahs = arRes.data.surahs;
      const enSurahs = enRes.data.surahs;

      // Build English lookup
      const enLookup = {};
      enSurahs.forEach(s => {
        enLookup[s.number] = {};
        s.ayahs.forEach(a => { enLookup[s.number][a.numberInSurah] = a.text; });
      });

      // Build per-surah metadata from SURAH_META
      const metaMap = {};
      SURAH_META.forEach(([n, ne, na, nm, tv, rt]) => {
        metaMap[n] = { name_english: ne, name_arabic: na, name_english_meaning: nm, revelation_type: rt };
      });

      const combined = arSurahs.map(s => ({
        number: s.number,
        name_arabic: metaMap[s.number].name_arabic,
        name_english: metaMap[s.number].name_english,
        name_english_meaning: metaMap[s.number].name_english_meaning,
        revelation_type: metaMap[s.number].revelation_type,
        total_verses: s.ayahs.length,
        verses: s.ayahs.map(a => ({
          ayah: a.numberInSurah,
          arabic: a.text.replace(/\uFEFF/g, ''),
          english: enLookup[s.number]?.[a.numberInSurah] || '',
        }))
      }));

      const totalVerses = combined.reduce((t, s) => t + s.verses.length, 0);
      addLog(`✓ Merged — ${combined.length} surahs, ${totalVerses} verses`, 'ok');

      let output;
      if (fmt === 'flat') {
        const verses = [];
        combined.forEach(s => s.verses.forEach(v => verses.push({
          surah: s.number, surah_name: s.name_english, surah_name_arabic: s.name_arabic,
          ayah: v.ayah, arabic: v.arabic, english: v.english
        })));
        output = { format: 'flat', source: 'alquran.cloud', total_verses: verses.length, verses };
      } else if (fmt === 'split') {
        output = {
          format: 'split', source: 'alquran.cloud',
          arabic: combined.map(s => ({ number: s.number, name: s.name_arabic, verses: s.verses.map(v => ({ ayah: v.ayah, text: v.arabic })) })),
          english: combined.map(s => ({ number: s.number, name: s.name_english, verses: s.verses.map(v => ({ ayah: v.ayah, text: v.english })) })),
        };
      } else {
        output = {
          format: 'combined', source: 'alquran.cloud',
          arabic_edition: 'quran-uthmani',
          english_edition: 'en.sahih (Saheeh International)',
          total_surahs: combined.length,
          total_verses: totalVerses,
          surahs: combined,
        };
      }

      setProgress(100); setProgressLabel('Done!');
      addLog('✓ Full Quran ready for download!', 'ok');
      setQuranData({ output, combined });
      setStatus('done');
    } catch (e) {
      addLog(`✗ Error: ${e.message}`, 'err');
      setErrMsg(e.message);
      setStatus('error');
    }
  }

  function dlJSON() {
    if (!quranData) return;
    const fname = fmt === 'flat' ? 'quran-flat.json' : fmt === 'split' ? 'quran-split.json' : 'quran.json';
    downloadBlob(JSON.stringify(quranData.output, null, 2), fname);
  }

  function dlSQL() {
    if (!quranData) return;
    downloadBlob(buildSQL(quranData.combined), 'quran.sql', 'text/plain');
  }

  function dlPDF() {
    if (!quranData) return;
    const html = generatePDFTemplate(quranData.combined);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  }

  async function dlSingleSurah(surahNum) {
    setSingleLoading(true);
    try {
      const [arRes, enRes] = await Promise.all([
        fetchWithRetry(`${BASE}/surah/${surahNum}/quran-uthmani`),
        fetchWithRetry(`${BASE}/surah/${surahNum}/en.sahih`),
      ]);
      const meta = SURAH_META[surahNum - 1];
      const enMap = {};
      enRes.data.ayahs.forEach(a => { enMap[a.numberInSurah] = a.text; });
      const out = {
        number: surahNum,
        name_arabic: meta[2],
        name_english: meta[1],
        name_english_meaning: meta[3],
        revelation_type: meta[5],
        total_verses: arRes.data.ayahs.length,
        verses: arRes.data.ayahs.map(a => ({
          ayah: a.numberInSurah,
          arabic: a.text.replace(/\uFEFF/g, ''),
          english: enMap[a.numberInSurah] || ''
        }))
      };
      downloadBlob(JSON.stringify(out, null, 2), `quran-surah-${surahNum}-${meta[1].replace(/[^a-z0-9]/gi,'-')}.json`);
    } catch (e) { alert('Failed: ' + e.message); }
    setSingleLoading(false);
  }

  const fileSize = quranData
    ? (new Blob([JSON.stringify(quranData.output)]).size / 1024 / 1024).toFixed(2) + ' MB'
    : '';

  const totalVerses = quranData?.combined.reduce((t, s) => t + s.verses.length, 0) || 0;

  return (
    <div>
      <div style={S.starField} />

      <div style={S.container}>
        {/* ── Hero ── */}
        <div style={S.hero}>
          <div style={S.heroArabic}>القرآن الكريم</div>
          <div style={S.heroSub}>The Noble Quran</div>
          <div style={S.heroDivider}>
            <div style={S.heroDividerLine} />
            <div style={S.heroDiamonds}>
              <div style={S.heroDiamond} />
              <div style={{ ...S.heroDiamond, width: 7, height: 7, background: 'var(--gold2)' }} />
              <div style={S.heroDiamond} />
            </div>
            <div style={{ ...S.heroDividerLine, transform: 'scaleX(-1)' }} />
          </div>
          <div style={S.heroTitle}>Database Downloader</div>
          <div style={S.heroDesc}>114 Surahs · 6,236 Verses · Arabic & English · JSON · SQL · PDF</div>
        </div>

        {/* ── Stats ── */}
        <div style={S.statsBar}>
          {[['114','Surahs'],['6,236','Verses'],['86 / 28','Meccan / Medinan'],['2','Languages']].map(([v,l]) => (
            <div key={l} style={S.statCard}>
              <div style={S.statVal}>{v}</div>
              <div style={S.statLabel}>{l}</div>
            </div>
          ))}
        </div>

        {/* ── Fetch panel ── */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <div style={S.panelDot} />
            <div style={S.panelTitle}>Download Full Quran</div>
            <div style={S.panelLine} />
          </div>

          {/* Format selector */}
          <div style={S.formatGrid}>
            {FORMATS.map(f => (
              <div key={f.id} style={S.fmtCard(fmt === f.id)} onClick={() => setFmt(f.id)}>
                <div style={S.fmtIcon}>{f.icon}</div>
                <div style={S.fmtName(fmt === f.id)}>{f.name}</div>
                <div style={S.fmtDesc}>{f.desc}</div>
              </div>
            ))}
          </div>

          <button
            style={S.fetchBtn(status === 'loading')}
            onClick={startFetch}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <span style={{ display:'inline-block', width:14, height:14, border:'2px solid var(--border2)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                Fetching from API…
              </>
            ) : status === 'done' ? '↺ Re-fetch Quran' : '⬇ Fetch Full Quran'}
          </button>

          {/* Progress */}
          {status === 'loading' && (
            <div style={S.progressWrap}>
              <div style={S.progressTrack}>
                <div style={S.progressFill(progress)} />
              </div>
              <div style={S.progressRow}>
                <span style={S.progressLabel}>{progressLabel}</span>
                <span style={S.progressPct}>{progress}%</span>
              </div>
            </div>
          )}

          {/* Log */}
          {logs.length > 0 && (
            <div style={S.log} ref={logRef}>
              {logs.map((l, i) => (
                <div key={i} style={S.logLine(l.type)}>
                  [{l.time}] {l.msg}
                </div>
              ))}
            </div>
          )}

          {errMsg && <div style={S.errBox}>⚠ {errMsg} — Check your connection and try again.</div>}
        </div>

        {/* ── Download panel ── */}
        {status === 'done' && quranData && (
          <div style={S.dlPanel}>
            <div style={S.dlIcon}>✨</div>
            <div style={S.dlTitle}>Full Quran Ready</div>
            <div style={S.dlMeta}>
              {totalVerses.toLocaleString()} verses · Arabic + English · {fileSize}
            </div>
            <div style={S.dlBtns}>
              <button style={S.dlBtn('primary')} onClick={dlJSON}>
                📄 Download JSON
              </button>
              <button style={S.dlBtn('sql')} onClick={dlSQL}>
                🗄 Download SQL
              </button>
              <button style={S.dlBtn('pdf')} onClick={dlPDF}>
                📑 Open PDF
              </button>
              <button style={{ ...S.dlBtn('outline'), borderColor:'var(--border2)', color:'var(--text2)' }} onClick={() => setShowPreview(v => !v)}>
                {'{}'} {showPreview ? 'Hide' : 'Preview'}
              </button>
            </div>

            {showPreview && (
              <div style={S.previewBox}>
                <span style={{ color: '#7c3aed' }}>"surahs"</span>: [{'{'}<br />
                &nbsp;&nbsp;<span style={{ color: '#7c3aed' }}>"number"</span>: <span style={{ color: 'var(--gold)' }}>1</span>,<br />
                &nbsp;&nbsp;<span style={{ color: '#7c3aed' }}>"name_arabic"</span>: <span style={{ color: 'var(--green)' }}>"الفاتحة"</span>,<br />
                &nbsp;&nbsp;<span style={{ color: '#7c3aed' }}>"name_english"</span>: <span style={{ color: 'var(--green)' }}>"Al-Faatiha"</span>,<br />
                &nbsp;&nbsp;<span style={{ color: '#7c3aed' }}>"revelation_type"</span>: <span style={{ color: 'var(--green)' }}>"Meccan"</span>,<br />
                &nbsp;&nbsp;<span style={{ color: '#7c3aed' }}>"verses"</span>: [<br />
                &nbsp;&nbsp;&nbsp;&nbsp;{'{'} <span style={{ color: '#7c3aed' }}>"ayah"</span>: <span style={{ color: 'var(--gold)' }}>1</span>, <span style={{ color: '#7c3aed' }}>"arabic"</span>: <span style={{ color: 'var(--green)' }}>"بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"</span>, ... {'}'},<br />
                &nbsp;&nbsp;&nbsp;&nbsp;...<br />
                &nbsp;&nbsp;]<br />
                {'}'}, ...]
              </div>
            )}
          </div>
        )}

        {/* ── Per-Surah downloader ── */}
        <div style={S.surahListWrap}>
          <div style={S.panel}>
            <div style={S.panelHeader}>
              <div style={S.panelDot} />
              <div style={S.panelTitle}>Download Individual Surah</div>
              <div style={S.panelLine} />
            </div>
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>
              Click any surah to download its JSON directly (no need to fetch the full Quran first).
            </div>
            <div style={S.surahGrid}>
              {SURAH_META.map(([n, ne, na, nm, tv, rt]) => (
                <div
                  key={n}
                  style={S.surahItem(selectedSurah === n)}
                  onClick={() => { setSelectedSurah(n); dlSingleSurah(n); }}
                >
                  <div style={S.surahNum}>{n}</div>
                  <div style={S.surahArabic}>{na}</div>
                  <div style={S.surahEnglish}>{ne}</div>
                  <div style={S.surahBadge(rt)}>{rt === 'Meccan' ? 'M' : 'Md'}</div>
                </div>
              ))}
            </div>
            {singleLoading && (
              <div style={{ textAlign: 'center', marginTop: 12, color: 'var(--gold)', fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.1em' }}>
                Fetching surah…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
