import React, { useState, useRef, useCallback } from 'react';
import { SURAH_META, noBismillah } from '../constants';

const BASE = 'https://api.alquran.cloud/v1';

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, 800 * (i + 1)));
    }
  }
}

const BK_KEY = 'quran_bookmarks_v1';
const LAST_KEY = 'quran_last_read_v1';
function loadBookmarks() { try { return JSON.parse(localStorage.getItem(BK_KEY) || '{}'); } catch { return {}; } }
function saveBookmarks(bk) { try { localStorage.setItem(BK_KEY, JSON.stringify(bk)); } catch {} }
function loadLast() { try { return JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); } catch { return null; } }
function saveLast(pos) { try { localStorage.setItem(LAST_KEY, JSON.stringify(pos)); } catch {} }

export default function QuranReader() {
  const [tab, setTab] = useState('browse');
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEnglish, setShowEnglish] = useState(true);
  const [arabicSize, setArabicSize] = useState(26);
  const [search, setSearch] = useState('');
  const [revFilter, setRevFilter] = useState('all');
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [toast, setToast] = useState('');
  const [copiedAyah, setCopiedAyah] = useState(null);
  const [jumpVal, setJumpVal] = useState('');
  const [highlightAyah, setHighlightAyah] = useState(null);
  const verseRefs = useRef({});
  const toastTimer = useRef(null);

  const lastRead = loadLast();

  const filteredSurahs = SURAH_META.filter(([n, ne, na, nm, tv, rt]) => {
    const q = search.toLowerCase();
    const matchSearch = !q || ne.toLowerCase().includes(q) || na.includes(q) || nm.toLowerCase().includes(q) || String(n).startsWith(q);
    const matchRev = revFilter === 'all' || (revFilter === 'meccan' && rt === 'Meccan') || (revFilter === 'medinan' && rt === 'Medinan');
    return matchSearch && matchRev;
  });

  const loadSurah = useCallback(async (num) => {
    setLoading(true); setError(''); setVerses([]); setHighlightAyah(null); setJumpVal('');
    try {
      const [arRes, enRes] = await Promise.all([
        fetchWithRetry(BASE + '/surah/' + num + '/quran-uthmani'),
        fetchWithRetry(BASE + '/surah/' + num + '/en.sahih'),
      ]);
      const enMap = {};
      enRes.data.ayahs.forEach(a => { enMap[a.numberInSurah] = a.text; });
      const vs = arRes.data.ayahs.map(a => ({ ayah: a.numberInSurah, arabic: a.text.replace(/\uFEFF/g, ''), english: enMap[a.numberInSurah] || '' }));
      setVerses(vs); setTab('reader'); saveLast({ surah: num, ayah: 1 });
    } catch (e) { setError(e.message); setTab('reader'); }
    setLoading(false);
  }, []);

  const openSurah = useCallback((num) => { setSelectedSurah(num); loadSurah(num); }, [loadSurah]);

  function showToast(msg) { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2200); }

  const toggleBookmark = useCallback((surahNum, ayah) => {
    const key = surahNum + ':' + ayah;
    setBookmarks(prev => {
      const next = { ...prev };
      if (next[key]) { delete next[key]; showToast('Bookmark removed'); }
      else { next[key] = { surah: surahNum, ayah, ts: Date.now() }; showToast('Bookmarked ✓'); }
      saveBookmarks(next); return next;
    });
  }, []);

  const copyVerse = useCallback((surahNum, ayah, arabic, english) => {
    const meta = SURAH_META[surahNum - 1];
    const text = arabic + '\n\n' + english + '\n\n— ' + meta[1] + ' ' + surahNum + ':' + ayah;
    navigator.clipboard.writeText(text).then(() => { setCopiedAyah(ayah); showToast('Verse copied ✓'); setTimeout(() => setCopiedAyah(null), 1500); }).catch(() => showToast('Copy failed'));
  }, []);

  const jumpToAyah = () => {
    const n = parseInt(jumpVal);
    if (!n || n < 1 || n > verses.length) { showToast('Invalid ayah'); return; }
    const el = verseRefs.current[n];
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHighlightAyah(n); setTimeout(() => setHighlightAyah(null), 2000); }
  };

  const meta = selectedSurah ? SURAH_META[selectedSurah - 1] : null;
  const hasBismillah = selectedSurah && !noBismillah(selectedSurah);
  const bkKeys = Object.keys(bookmarks);

  // Styles (inline for portability)
  const s = {
    root: { fontFamily: "'Crimson Pro',Georgia,serif", color: 'var(--text)' },
    tabBar: { display: 'flex', gap: 3, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, marginBottom: 20 },
    tab: (a) => ({ flex: 1, padding: '9px 16px', borderRadius: 7, border: 'none', background: a ? 'linear-gradient(135deg,rgba(200,151,58,0.15),rgba(200,151,58,0.05))' : 'transparent', color: a ? 'var(--gold2)' : 'var(--text3)', fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }),
    panel: { background: 'linear-gradient(180deg,var(--surface) 0%,var(--bg2) 100%)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' },
    panelTitle: { fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
    dot: { width: 7, height: 7, background: 'var(--gold)', borderRadius: '50%', boxShadow: '0 0 6px var(--gold)', flexShrink: 0 },
    input: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontFamily: "'Crimson Pro',Georgia,serif", fontSize: 15, marginBottom: 12, outline: 'none', transition: 'border-color 0.2s' },
    filterRow: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' },
    fBtn: (a) => ({ background: a ? 'rgba(200,151,58,0.12)' : 'var(--bg)', border: '1px solid ' + (a ? 'var(--gold)' : 'var(--border)'), color: a ? 'var(--gold2)' : 'var(--text3)', padding: '5px 14px', borderRadius: 20, fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s' }),
    surahGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 7, maxHeight: 420, overflowY: 'auto', padding: '2px 4px 2px 0' },
    surahCard: (sel, bk) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, border: '1px solid ' + (sel ? 'var(--gold)' : bk ? 'rgba(45,212,191,0.4)' : 'var(--border)'), background: sel ? 'linear-gradient(135deg,rgba(200,151,58,0.1),rgba(200,151,58,0.03))' : bk ? 'rgba(45,212,191,0.04)' : 'var(--bg)', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }),
    bkDot: { position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 4px var(--teal)' },
    resumeBanner: { background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '0.08em', color: 'var(--teal)' },
    resumeBtn: { marginLeft: 'auto', background: 'var(--teal)', border: 'none', color: '#07090f', padding: '5px 12px', borderRadius: 5, fontFamily: "'Cinzel',serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' },
    navRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
    navBtn: (d) => ({ background: d ? 'var(--bg)' : 'var(--surface2)', border: '1px solid ' + (d ? 'var(--border)' : 'var(--border2)'), color: d ? 'var(--text3)' : 'var(--text)', padding: '7px 14px', borderRadius: 7, fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '0.08em', cursor: d ? 'not-allowed' : 'pointer', opacity: d ? 0.4 : 1, transition: 'all 0.15s' }),
    ctrlBar: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 14, flexWrap: 'wrap' },
    ctrlLabel: { fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: '0.12em', color: 'var(--text3)', textTransform: 'uppercase' },
    ctrlGrp: { display: 'flex', gap: 4 },
    ctrlBtn: (a) => ({ background: a ? 'rgba(200,151,58,0.12)' : 'transparent', border: '1px solid ' + (a ? 'var(--gold)' : 'var(--border)'), color: a ? 'var(--gold2)' : 'var(--text3)', padding: '4px 10px', borderRadius: 5, fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.15s' }),
    sizeRow: { display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' },
    sizeBtn: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text2)', width: 26, height: 26, borderRadius: 5, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', padding: 0, fontFamily: 'monospace' },
    jumpRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' },
    jumpInput: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 12px', color: 'var(--text)', fontFamily: "'Cinzel',serif", fontSize: 11, width: 90, outline: 'none', transition: 'border-color 0.2s' },
    jumpBtn: { background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '7px 14px', borderRadius: 7, fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.15s' },
    surahHdr: { textAlign: 'center', padding: '28px 20px 20px', background: 'linear-gradient(180deg,rgba(200,151,58,0.06) 0%,transparent 100%)', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none' },
    shNum: { fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '0.2em', color: 'var(--text3)', marginBottom: 6 },
    shAr: { fontFamily: "'Amiri',serif", fontSize: 40, color: 'var(--gold2)', direction: 'rtl', lineHeight: 1.1, marginBottom: 4, textShadow: '0 0 30px rgba(200,151,58,0.2)' },
    shEn: { fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '0.06em', marginBottom: 2 },
    shMeaning: { fontSize: 13, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 8 },
    shMeta: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
    shBadge: (type) => ({ fontSize: 10, fontFamily: "'Cinzel',serif", letterSpacing: '0.1em', color: type === 'Meccan' ? 'var(--gold)' : type === 'Medinan' ? 'var(--teal)' : 'var(--text3)', border: '1px solid ' + (type === 'Meccan' ? 'rgba(200,151,58,0.3)' : type === 'Medinan' ? 'rgba(45,212,191,0.3)' : 'var(--border)'), padding: '2px 10px', borderRadius: 20 }),
    bismillah: { textAlign: 'center', fontFamily: "'Amiri',serif", fontSize: 26, color: 'var(--gold)', direction: 'rtl', padding: '20px 20px 12px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', opacity: 0.85 },
    versesWrap: { border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' },
    verse: (hl, cp) => ({ display: 'grid', gridTemplateColumns: '40px 1fr', borderBottom: '1px solid var(--border)', background: hl ? 'rgba(200,151,58,0.07)' : cp ? 'rgba(45,212,191,0.05)' : 'transparent', transition: 'background 0.3s' }),
    verseNumCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0 18px 10px', gap: 8 },
    verseNum: { fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--gold)', opacity: 0.8, lineHeight: 1 },
    verseActions: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 },
    actionBtn: (a) => ({ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 14, opacity: a ? 1 : 0.35, transition: 'opacity 0.15s', lineHeight: 1, color: 'inherit' }),
    verseContent: { padding: '18px 20px 18px 8px' },
    verseAr: (sz) => ({ fontFamily: "'Amiri',serif", fontSize: sz, lineHeight: 2.1, direction: 'rtl', textAlign: 'right', color: '#f0e8d5', marginBottom: 10 }),
    verseEn: { fontSize: 14, lineHeight: 1.75, color: 'var(--text2)', fontStyle: 'italic', fontWeight: 300 },
    verseRef: { display: 'inline-block', fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: '0.1em', color: 'var(--text3)', marginTop: 4, opacity: 0.7 },
    loadingWrap: { textAlign: 'center', padding: '60px 24px', color: 'var(--text3)', fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: '0.12em' },
    spinner: { display: 'inline-block', width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 14 },
    errBox: { background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.25)', borderRadius: 10, padding: '20px', textAlign: 'center', color: 'var(--red)', fontStyle: 'italic' },
    retryBtn: { background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', padding: '7px 18px', borderRadius: 7, fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer', marginTop: 12 },
    bkItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg)', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' },
    bkItemAr: { fontFamily: "'Amiri',serif", fontSize: 18, color: 'var(--gold)', direction: 'rtl' },
    bkItemInfo: { flex: 1 },
    bkItemName: { fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--text)', letterSpacing: '0.05em' },
    bkItemRef: { fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' },
    bkRmBtn: { background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '4px', lineHeight: 1 },
    emptyBk: { textAlign: 'center', color: 'var(--text3)', padding: '40px', fontStyle: 'italic', fontSize: 14 },
    clearBtn: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', padding: '7px 18px', borderRadius: 7, fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer', marginTop: 8 },
    toast: { position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--gold)', borderRadius: 8, padding: '9px 20px', fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '0.1em', zIndex: 9000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease', pointerEvents: 'none' },
    divider: { width: 1, height: 20, background: 'var(--border)', margin: '0 4px' },
  };

  return (
    <div style={s.root}>
      {/* Tab bar */}
      <div style={s.tabBar}>
        {[
          ['browse', '◈ Browse'],
          ['reader', selectedSurah ? ('◉ ' + meta[1]) : '◉ Reader'],
          ['bookmarks', '◆ Bookmarks' + (bkKeys.length ? ' (' + bkKeys.length + ')' : '')],
        ].map(([id, label]) => (
          <button key={id} style={s.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── BROWSE ── */}
      {tab === 'browse' && (
        <div style={s.panel}>
          <div style={s.panelTitle}><div style={s.dot} />Select a Surah</div>

          {lastRead && (
            <div style={s.resumeBanner}>
              <span>↺</span>
              <span>Last read: <strong>{SURAH_META[lastRead.surah - 1][1]}</strong></span>
              <button style={s.resumeBtn} onClick={() => openSurah(lastRead.surah)}>Resume</button>
            </div>
          )}

          <input
            style={s.input}
            placeholder="Search by name, number, or meaning…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--gold)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
          />

          <div style={s.filterRow}>
            {[['all', 'All 114'], ['meccan', 'Meccan (86)'], ['medinan', 'Medinan (28)']].map(([v, l]) => (
              <button key={v} style={s.fBtn(revFilter === v)} onClick={() => setRevFilter(v)}>{l}</button>
            ))}
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: '0.1em', color: 'var(--text3)', marginLeft: 'auto' }}>
              {filteredSurahs.length} surahs
            </span>
          </div>

          <div style={s.surahGrid}>
            {filteredSurahs.map(([n, ne, na, nm, tv, rt]) => {
              const bkCount = Object.values(bookmarks).filter(b => b.surah === n).length;
              return (
                <div key={n} style={s.surahCard(selectedSurah === n, bkCount > 0)} onClick={() => openSurah(n)}>
                  {bkCount > 0 && <div style={s.bkDot} />}
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: 'var(--text3)', minWidth: 24, textAlign: 'right', flexShrink: 0 }}>{n}</div>
                  <div style={{ fontFamily: "'Amiri',serif", fontSize: 17, color: 'var(--gold)', direction: 'rtl', flexShrink: 0 }}>{na}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ne}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontStyle: 'italic' }}>{nm}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 8, fontFamily: "'Cinzel',serif", letterSpacing: '0.08em', color: rt === 'Meccan' ? 'var(--gold)' : 'var(--teal)', opacity: 0.8 }}>{rt === 'Meccan' ? 'M' : 'Md'}</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{tv}v</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── READER ── */}
      {tab === 'reader' && (
        <div style={{ animation: 'fadeIn 0.35s ease' }}>
          {!selectedSurah ? (
            <div style={s.panel}>
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontStyle: 'italic' }}>
                Select a surah from the Browse tab to start reading.
              </div>
            </div>
          ) : (
            <>
              {/* Surah navigation */}
              <div style={s.navRow}>
                <button style={s.navBtn(selectedSurah <= 1)} onClick={() => { if (selectedSurah > 1) openSurah(selectedSurah - 1); }} disabled={selectedSurah <= 1}>← Prev</button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '0.06em' }}>{meta[1]}</div>
                  <div style={{ fontFamily: "'Amiri',serif", fontSize: 20, color: 'var(--gold)', direction: 'rtl', lineHeight: 1.1 }}>{meta[2]}</div>
                </div>
                <button style={s.navBtn(selectedSurah >= 114)} onClick={() => { if (selectedSurah < 114) openSurah(selectedSurah + 1); }} disabled={selectedSurah >= 114}>Next →</button>
              </div>

              {/* Controls */}
              <div style={s.ctrlBar}>
                <span style={s.ctrlLabel}>English</span>
                <div style={s.ctrlGrp}>
                  <button style={s.ctrlBtn(showEnglish)} onClick={() => setShowEnglish(true)}>On</button>
                  <button style={s.ctrlBtn(!showEnglish)} onClick={() => setShowEnglish(false)}>Off</button>
                </div>
                <div style={s.divider} />
                <span style={s.ctrlLabel}>Arabic Size</span>
                <div style={s.sizeRow}>
                  <button style={s.sizeBtn} onClick={() => setArabicSize(sz => Math.max(18, sz - 2))}>−</button>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', minWidth: 30, textAlign: 'center' }}>{arabicSize}px</span>
                  <button style={s.sizeBtn} onClick={() => setArabicSize(sz => Math.min(52, sz + 2))}>+</button>
                </div>
                <div style={s.divider} />
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, color: 'var(--text3)', letterSpacing: '0.08em' }}>
                  {selectedSurah}:{meta[4]} · {meta[5]}
                </span>
              </div>

              {/* Jump to ayah */}
              {!loading && verses.length > 0 && (
                <div style={s.jumpRow}>
                  <span style={s.ctrlLabel}>Jump to ayah</span>
                  <input
                    style={s.jumpInput} type="number" min={1} max={verses.length}
                    placeholder={'1–' + verses.length} value={jumpVal}
                    onChange={e => setJumpVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && jumpToAyah()}
                    onFocus={e => { e.target.style.borderColor = 'var(--gold)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                  <button style={s.jumpBtn} onClick={jumpToAyah}>Go</button>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={s.loadingWrap}>
                  <div style={s.spinner} />
                  <div>{'Loading ' + meta[1] + '…'}</div>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div style={s.errBox}>
                  <div>{'⚠ ' + error}</div>
                  <button style={s.retryBtn} onClick={() => loadSurah(selectedSurah)}>Retry</button>
                </div>
              )}

              {/* Verses */}
              {!loading && !error && verses.length > 0 && (
                <div>
                  {/* Header */}
                  <div style={s.surahHdr}>
                    <div style={s.shNum}>SURAH {selectedSurah} OF 114</div>
                    <div style={s.shAr}>{meta[2]}</div>
                    <div style={s.shEn}>{meta[1]}</div>
                    <div style={s.shMeaning}>{meta[3]}</div>
                    <div style={s.shMeta}>
                      <span style={s.shBadge(meta[5])}>{meta[5]}</span>
                      <span style={s.shBadge('verse')}>{meta[4]} verses</span>
                    </div>
                  </div>

                  {/* Bismillah */}
                  {hasBismillah && (
                    <div style={s.bismillah}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
                  )}

                  {/* Verse list */}
                  <div style={s.versesWrap}>
                    {verses.map(v => {
                      const bkKey = selectedSurah + ':' + v.ayah;
                      const isBk = !!bookmarks[bkKey];
                      return (
                        <div key={v.ayah} ref={el => { verseRefs.current[v.ayah] = el; }} style={s.verse(highlightAyah === v.ayah, copiedAyah === v.ayah)}>
                          <div style={s.verseNumCol}>
                            <div style={s.verseNum}>{v.ayah}</div>
                            <div style={s.verseActions}>
                              <button title={isBk ? 'Remove bookmark' : 'Bookmark'} style={s.actionBtn(isBk)} onClick={() => toggleBookmark(selectedSurah, v.ayah)}>{isBk ? '★' : '☆'}</button>
                              <button title="Copy verse" style={s.actionBtn(false)} onClick={() => copyVerse(selectedSurah, v.ayah, v.arabic, v.english)}>⎘</button>
                            </div>
                          </div>
                          <div style={s.verseContent}>
                            <div style={s.verseAr(arabicSize)}>{v.arabic}</div>
                            {showEnglish && <div style={s.verseEn}>{v.english}</div>}
                            <div style={s.verseRef}>{meta[1]} {selectedSurah}:{v.ayah}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom nav */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                    <button style={s.navBtn(selectedSurah <= 1)} onClick={() => { if (selectedSurah > 1) openSurah(selectedSurah - 1); }} disabled={selectedSurah <= 1}>
                      {'← ' + (selectedSurah > 1 ? SURAH_META[selectedSurah - 2][1] : 'Start')}
                    </button>
                    <button style={s.navBtn(selectedSurah >= 114)} onClick={() => { if (selectedSurah < 114) openSurah(selectedSurah + 1); }} disabled={selectedSurah >= 114}>
                      {(selectedSurah < 114 ? SURAH_META[selectedSurah][1] : 'End') + ' →'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── BOOKMARKS ── */}
      {tab === 'bookmarks' && (
        <div style={s.panel}>
          <div style={s.panelTitle}><div style={s.dot} />Bookmarked Verses</div>
          {bkKeys.length === 0 ? (
            <div style={s.emptyBk}>No bookmarks yet.<br />Star any verse while reading to save it here.</div>
          ) : (
            <>
              <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>{bkKeys.length} bookmark{bkKeys.length !== 1 ? 's' : ''} saved</div>
              {bkKeys
                .sort((a, b) => (bookmarks[b].ts || 0) - (bookmarks[a].ts || 0))
                .map(key => {
                  const bk = bookmarks[key];
                  const m = SURAH_META[bk.surah - 1];
                  return (
                    <div key={key} style={s.bkItem} onClick={() => {
                      openSurah(bk.surah);
                      setTimeout(() => {
                        const el = verseRefs.current[bk.ayah];
                        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHighlightAyah(bk.ayah); setTimeout(() => setHighlightAyah(null), 2000); }
                      }, 1400);
                    }}>
                      <div style={s.bkItemAr}>{m[2]}</div>
                      <div style={s.bkItemInfo}>
                        <div style={s.bkItemName}>{m[1]}</div>
                        <div style={s.bkItemRef}>Surah {bk.surah}, Ayah {bk.ayah} · {m[5]}</div>
                      </div>
                      <button style={s.bkRmBtn} onClick={e => { e.stopPropagation(); toggleBookmark(bk.surah, bk.ayah); }} title="Remove">×</button>
                    </div>
                  );
                })}
              <button style={s.clearBtn} onClick={() => { setBookmarks({}); saveBookmarks({}); }}>Clear all bookmarks</button>
            </>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}
