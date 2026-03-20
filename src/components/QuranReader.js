import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
      // Exponential back-off — skipped when retries=1 (tests)
      await new Promise(res => setTimeout(res, 300 * (i + 1)));
    }
  }
}

// Exported for testing — allows tests to swap retries to 1 (no back-off)
export { fetchWithRetry };

// ── Storage helpers ─────────────────────────────────────────────────────────
const BK_KEY     = 'quran_bookmarks_v2';
const LAST_KEY   = 'quran_last_read_v2';
const PREFS_KEY  = 'quran_prefs_v2';
const HISTORY_KEY= 'quran_history_v2';
const NOTES_KEY  = 'quran_notes_v2';

const ls = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const defaultPrefs = { arabicSize: 28, showEnglish: true, theme: 'dark', layout: 'default' };

// ── Highlight search terms in text ─────────────────────────────────────────
function HighlightText({ text, query }) {
  if (!query || query.length < 2) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return <>{parts.map((p, i) =>
    regex.test(p) ? <mark key={i} className="search-highlight">{p}</mark> : p
  )}</>;
}

// ── Format date ──────────────────────────────────────────────────────────────
function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000)   return 'just now';
  if (d < 3600000) return Math.floor(d/60000) + 'm ago';
  if (d < 86400000)return Math.floor(d/3600000) + 'h ago';
  return Math.floor(d/86400000) + 'd ago';
}

export default function QuranReader() {
  // ── State ──
  const [sideTab, setSideTab]       = useState('browse');   // browse | bookmarks | stats
  const [selectedSurah, setSel]     = useState(null);
  const [verses, setVerses]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [revFilter, setRevFilter]   = useState('all');
  const [bookmarks, setBookmarks]   = useState(() => ls.get(BK_KEY, {}));
  const [notes, setNotes]           = useState(() => ls.get(NOTES_KEY, {}));
  const [history, setHistory]       = useState(() => ls.get(HISTORY_KEY, []));
  const [prefs, setPrefs]           = useState(() => ls.get(PREFS_KEY, defaultPrefs));
  const [toast, setToast]           = useState('');
  const [copiedAyah, setCopied]     = useState(null);
  const [highlightAyah, setHL]      = useState(null);
  const [jumpVal, setJump]          = useState('');
  const [verseSearch, setVSearch]   = useState('');
  const [noteTarget, setNoteTarget] = useState(null);  // {surah,ayah}
  const [noteText, setNoteText]     = useState('');
  const [showNoteModal, setShowNote]= useState(false);
  const [readVerses, setReadVerses] = useState(() => ls.get('quran_read_v2', {}));
  const [tafsirVerse, setTafsir]    = useState(null);
  const [showTafsir, setShowTafsir] = useState(false);
  const [fontSize, setFontSize]     = useState(() => ls.get(PREFS_KEY, defaultPrefs).arabicSize || 28);
  const [showEnglish, setShowEn]    = useState(() => ls.get(PREFS_KEY, defaultPrefs).showEnglish !== false);

  const verseRefs  = useRef({});
  const toastTimer = useRef(null);
  const scrollRef  = useRef(null);

  const lastRead = ls.get(LAST_KEY, null);

  // ── Persist preferences ──
  useEffect(() => {
    ls.set(PREFS_KEY, { ...prefs, arabicSize: fontSize, showEnglish });
  }, [fontSize, showEnglish, prefs]);

  // ── Filtered surah list ──
  const filteredSurahs = useMemo(() => SURAH_META.filter(([n, ne, na, nm, tv, rt]) => {
    const q = search.toLowerCase();
    const matchSearch = !q || ne.toLowerCase().includes(q) || na.includes(q) || nm.toLowerCase().includes(q) || String(n).startsWith(q);
    const matchRev = revFilter === 'all' || (revFilter === 'meccan' && rt === 'Meccan') || (revFilter === 'medinan' && rt === 'Medinan');
    return matchSearch && matchRev;
  }), [search, revFilter]);

  // ── Filtered verses (in-surah search) ──
  const filteredVerses = useMemo(() => {
    if (!verseSearch.trim()) return verses;
    const q = verseSearch.toLowerCase();
    return verses.filter(v => v.english.toLowerCase().includes(q) || v.arabic.includes(verseSearch));
  }, [verses, verseSearch]);

  // ── Load surah ──
  const loadSurah = useCallback(async (num) => {
    setLoading(true); setError(''); setVerses([]); setHL(null); setJump(''); setVSearch('');
    try {
      const [arRes, enRes] = await Promise.all([
        fetchWithRetry(BASE + '/surah/' + num + '/quran-uthmani'),
        fetchWithRetry(BASE + '/surah/' + num + '/en.sahih'),
      ]);
      const enMap = {};
      enRes.data.ayahs.forEach(a => { enMap[a.numberInSurah] = a.text; });
      const vs = arRes.data.ayahs.map(a => ({
        ayah: a.numberInSurah,
        arabic: a.text.replace(/\uFEFF/g, ''),
        english: enMap[a.numberInSurah] || '',
      }));
      setVerses(vs);
      ls.set(LAST_KEY, { surah: num, ayah: 1, ts: Date.now() });
      // Update history
      setHistory(prev => {
        const next = [{ surah: num, ts: Date.now() }, ...prev.filter(h => h.surah !== num)].slice(0, 10);
        ls.set(HISTORY_KEY, next);
        return next;
      });
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  const openSurah = useCallback((num) => { setSel(num); loadSurah(num); }, [loadSurah]);

  // ── Toast ──
  function showToast(msg, color) {
    setToast({ msg, color: color || 'gold' });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }

  // ── Bookmark ──
  const toggleBookmark = useCallback((surahNum, ayah) => {
    const key = surahNum + ':' + ayah;
    setBookmarks(prev => {
      const next = { ...prev };
      if (next[key]) { delete next[key]; showToast('Bookmark removed'); }
      else { next[key] = { surah: surahNum, ayah, ts: Date.now() }; showToast('★ Bookmarked'); }
      ls.set(BK_KEY, next);
      return next;
    });
  }, []);

  // ── Mark as read ──
  const markRead = useCallback((surahNum, ayah) => {
    const key = surahNum + ':' + ayah;
    setReadVerses(prev => {
      const next = { ...prev, [key]: true };
      ls.set('quran_read_v2', next);
      return next;
    });
  }, []);

  // ── Copy ──
  const copyVerse = useCallback((surahNum, ayah, arabic, english) => {
    const meta = SURAH_META[surahNum - 1];
    const text = arabic + '\n\n' + english + '\n\n— ' + meta[1] + ' ' + surahNum + ':' + ayah;
    navigator.clipboard.writeText(text)
      .then(() => { setCopied(ayah); showToast('Verse copied ✓', 'teal'); setTimeout(() => setCopied(null), 1800); })
      .catch(() => showToast('Copy failed'));
  }, []);

  // ── Share ──
  const shareVerse = useCallback((surahNum, ayah, arabic, english) => {
    const meta = SURAH_META[surahNum - 1];
    const text = `"${english}"\n\n— Quran ${surahNum}:${ayah} (${meta[1]})`;
    if (navigator.share) {
      navigator.share({ title: 'Quran ' + surahNum + ':' + ayah, text });
    } else {
      navigator.clipboard.writeText(text).then(() => showToast('Copied for sharing ✓', 'teal'));
    }
  }, []);

  // ── Note ──
  const openNote = useCallback((surahNum, ayah) => {
    const key = surahNum + ':' + ayah;
    setNoteTarget({ surah: surahNum, ayah });
    setNoteText(notes[key] || '');
    setShowNote(true);
  }, [notes]);

  const saveNote = useCallback(() => {
    if (!noteTarget) return;
    const key = noteTarget.surah + ':' + noteTarget.ayah;
    setNotes(prev => {
      const next = { ...prev };
      if (noteText.trim()) next[key] = noteText.trim();
      else delete next[key];
      ls.set(NOTES_KEY, next);
      return next;
    });
    setShowNote(false);
    showToast(noteText.trim() ? 'Note saved ✓' : 'Note removed');
  }, [noteTarget, noteText]);

  // ── Jump ──
  const jumpToAyah = useCallback(() => {
    const n = parseInt(jumpVal);
    if (!n || n < 1 || n > verses.length) { showToast('Invalid ayah number'); return; }
    const el = verseRefs.current[n];
    if (el) {
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setHL(n); setTimeout(() => setHL(null), 2200);
    }
  }, [jumpVal, verses.length]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && selectedSurah && selectedSurah < 114) openSurah(selectedSurah + 1);
      if (e.key === 'ArrowLeft'  && selectedSurah && selectedSurah > 1)   openSurah(selectedSurah - 1);
      if (e.key === 'e') setShowEn(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedSurah, openSurah]);

  const meta = selectedSurah ? SURAH_META[selectedSurah - 1] : null;
  const hasBismillah = selectedSurah && !noBismillah(selectedSurah);
  const bkKeys = Object.keys(bookmarks);
  const noteKeys = Object.keys(notes);

  // ── Stats ──
  const stats = useMemo(() => {
    const totalRead = Object.keys(readVerses).length;
    const pct = Math.round(totalRead / 6236 * 100);
    const surahsRead = new Set(Object.keys(readVerses).map(k => k.split(':')[0])).size;
    return { totalRead, pct, surahsRead };
  }, [readVerses]);

  // ── Tafsir (simplified — shows word-for-word note) ──
  const openTafsir = useCallback((v) => { setTafsir(v); setShowTafsir(true); }, []);

  // ── Toast color ──
  const toastColor = toast?.color === 'teal' ? 'var(--teal2)' : 'var(--gold2)';

  return (
    <div className="reader-layout">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="sidebar">
        <div className="sidebar-header">
          {/* Tab bar */}
          <div className="sidebar-tabs">
            {[
              ['browse',    '◈', 'Browse'],
              ['bookmarks', '★', `Saved${bkKeys.length ? ' '+bkKeys.length : ''}`],
              ['stats',     '◉', 'Stats'],
            ].map(([id, icon, label]) => (
              <button key={id} className={`sidebar-tab${sideTab===id?' active':''}`} onClick={() => setSideTab(id)}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          {/* Search */}
          {sideTab === 'browse' && (
            <>
              <div className="search-box">
                <span className="search-icon">⌕</span>
                <input
                  className="search-input"
                  placeholder="Search surahs…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-chips">
                {[['all','All 114'],['meccan','Meccan'],['medinan','Medinan']].map(([v,l]) => (
                  <button key={v}
                    className={`filter-chip${revFilter===v ? (v==='medinan'?' active-teal':' active') : ''}`}
                    onClick={() => setRevFilter(v)}>
                    {l}
                  </button>
                ))}
                <span className="filter-count">{filteredSurahs.length}</span>
              </div>

              {/* Resume banner */}
              {lastRead && (
                <div className="resume-banner">
                  <span style={{fontSize:14}}>↺</span>
                  <span className="resume-banner-text">
                    Resume: <strong>{SURAH_META[lastRead.surah-1][1]}</strong>
                    {lastRead.ts && <><br/><span style={{opacity:.7,fontSize:'0.85em'}}>{timeAgo(lastRead.ts)}</span></>}
                  </span>
                  <button className="resume-btn" onClick={() => openSurah(lastRead.surah)}>Go</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Browse list ── */}
        {sideTab === 'browse' && (
          <div className="surah-list">
            {filteredSurahs.map(([n, ne, na, nm, tv, rt]) => {
              const bkCount = Object.values(bookmarks).filter(b => b.surah === n).length;
              return (
                <div
                  key={n}
                  className={`surah-item${selectedSurah===n?' active':''}${bkCount>0?' bookmarked':''}`}
                  onClick={() => openSurah(n)}
                >
                  {bkCount > 0 && <div className="bk-indicator" />}
                  <div className="surah-num">{n}</div>
                  <div className="surah-arabic-name">{na}</div>
                  <div className="surah-en-name">
                    <HighlightText text={ne} query={search} />
                  </div>
                  <div className="surah-meta-badges">
                    <span className={`type-badge ${rt.toLowerCase()}`}>{rt==='Meccan'?'M':'Md'}</span>
                    <span className="verse-count-badge">{tv}v</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Bookmarks ── */}
        {sideTab === 'bookmarks' && (
          <div className="bookmarks-list">
            {bkKeys.length === 0 ? (
              <div className="empty-bookmarks">
                <span className="empty-bookmarks-icon">☆</span>
                No bookmarks yet.<br />
                Star any verse while reading<br />to save it here.
              </div>
            ) : (
              <>
                {/* Notes section */}
                {noteKeys.length > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontFamily:'var(--f-display)',fontSize:'8.5px',letterSpacing:'0.14em',color:'var(--gold-dim)',textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>
                      ◆ Notes ({noteKeys.length})
                    </div>
                    {noteKeys.slice(0,3).map(key => {
                      const [sn, an] = key.split(':').map(Number);
                      const m = SURAH_META[sn-1];
                      return (
                        <div key={key} className="bookmark-item" style={{borderColor:'rgba(124,92,220,0.25)',background:'rgba(124,92,220,0.04)'}} onClick={() => { openSurah(sn); setTimeout(() => { const el = verseRefs.current[an]; if(el) { if(typeof el.scrollIntoView==='function') el.scrollIntoView({behavior:'smooth',block:'center'}); setHL(an); setTimeout(()=>setHL(null),2200); } },1400); }}>
                          <div style={{fontFamily:'var(--f-display)',fontSize:'10px',color:'var(--purple2)'}}>✏</div>
                          <div className="bookmark-info">
                            <div className="bookmark-name">{m[1]} {sn}:{an}</div>
                            <div className="bookmark-ref" style={{color:'var(--purple2)',opacity:.7}}>{notes[key].slice(0,40)}{notes[key].length>40?'…':''}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{fontFamily:'var(--f-display)',fontSize:'8.5px',letterSpacing:'0.14em',color:'var(--gold-dim)',textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>
                  ★ Bookmarks ({bkKeys.length})
                </div>
                {bkKeys
                  .sort((a,b) => (bookmarks[b].ts||0)-(bookmarks[a].ts||0))
                  .map(key => {
                    const bk = bookmarks[key];
                    const m = SURAH_META[bk.surah-1];
                    return (
                      <div key={key} className="bookmark-item" onClick={() => {
                        openSurah(bk.surah);
                        setTimeout(() => {
                          const el = verseRefs.current[bk.ayah];
                          if (el) { if(typeof el.scrollIntoView==='function') el.scrollIntoView({behavior:'smooth',block:'center'}); setHL(bk.ayah); setTimeout(()=>setHL(null),2200); }
                        }, 1400);
                      }}>
                        <div className="bookmark-ar">{m[2]}</div>
                        <div className="bookmark-info">
                          <div className="bookmark-name">{m[1]}</div>
                          <div className="bookmark-ref">Surah {bk.surah}:{bk.ayah} · {timeAgo(bk.ts)}</div>
                        </div>
                        <button className="bookmark-remove" onClick={e => { e.stopPropagation(); toggleBookmark(bk.surah,bk.ayah); }} title="Remove">×</button>
                      </div>
                    );
                  })}
                <button className="clear-bookmarks" onClick={() => { setBookmarks({}); ls.set(BK_KEY,{}); }}>Clear all bookmarks</button>
              </>
            )}
          </div>
        )}

        {/* ── Stats ── */}
        {sideTab === 'stats' && (
          <div className="stats-panel">
            <div className="stat-block">
              <div className="stat-block-title">Reading Progress</div>
              <div className="stat-row"><span className="stat-label">Verses read</span><span className="stat-value">{stats.totalRead.toLocaleString()} / 6,236</span></div>
              <div className="stat-row"><span className="stat-label">Surahs visited</span><span className="stat-value">{stats.surahsRead} / 114</span></div>
              <div className="stat-row"><span className="stat-label">Completion</span><span className="stat-value">{stats.pct}%</span></div>
              <div className="progress-pill"><div className="progress-pill-fill" style={{width:stats.pct+'%'}} /></div>
            </div>
            <div className="stat-block">
              <div className="stat-block-title">Bookmarks & Notes</div>
              <div className="stat-row"><span className="stat-label">Bookmarked verses</span><span className="stat-value">{bkKeys.length}</span></div>
              <div className="stat-row"><span className="stat-label">Personal notes</span><span className="stat-value">{noteKeys.length}</span></div>
              <div className="stat-row"><span className="stat-label">Surahs bookmarked</span><span className="stat-value">{new Set(Object.values(bookmarks).map(b=>b.surah)).size}</span></div>
            </div>
            <div className="stat-block">
              <div className="stat-block-title">Recent History</div>
              {history.length === 0 ? <div style={{color:'var(--text3)',fontSize:13,fontStyle:'italic',padding:'4px 0'}}>No history yet</div> :
                history.slice(0,6).map(h => {
                  const m = SURAH_META[h.surah-1];
                  return (
                    <div key={h.surah} className="stat-row" style={{cursor:'pointer'}} onClick={() => openSurah(h.surah)}>
                      <span className="stat-label">{m[1]}</span>
                      <span className="stat-value" style={{fontSize:9,color:'var(--text3)'}}>{timeAgo(h.ts)}</span>
                    </div>
                  );
                })
              }
            </div>
            <div className="stat-block">
              <div className="stat-block-title">Dataset</div>
              <div className="stat-row"><span className="stat-label">Total surahs</span><span className="stat-value">114</span></div>
              <div className="stat-row"><span className="stat-label">Total verses</span><span className="stat-value">6,236</span></div>
              <div className="stat-row"><span className="stat-label">Meccan surahs</span><span className="stat-value">86</span></div>
              <div className="stat-row"><span className="stat-label">Medinan surahs</span><span className="stat-value">28</span></div>
              <div className="stat-row"><span className="stat-label">Arabic edition</span><span className="stat-value" style={{fontSize:8}}>Uthmani</span></div>
              <div className="stat-row"><span className="stat-label">English edition</span><span className="stat-value" style={{fontSize:8}}>Saheeh Intl</span></div>
            </div>
            {stats.totalRead > 0 && (
              <button className="clear-bookmarks" style={{marginTop:4}} onClick={() => { setReadVerses({}); ls.set('quran_read_v2',{}); showToast('Progress reset'); }}>Reset progress</button>
            )}
          </div>
        )}
      </aside>

      {/* ══════════ READING PANE ══════════ */}
      <main className="reading-pane">
        {!selectedSurah ? (
          /* Welcome state */
          <div className="state-container">
            <div className="state-icon">☪</div>
            <div className="state-title">Choose a Surah</div>
            <div className="state-sub">Select any surah from the browse panel to begin reading.</div>
            <div style={{marginTop:24,fontFamily:'var(--f-arabic)',fontSize:28,color:'var(--gold)',direction:'rtl',opacity:.6}}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
          </div>
        ) : (
          <>
            {/* ── Navigation row ── */}
            <div className="surah-nav-row">
              <button className="nav-arrow-btn" disabled={selectedSurah<=1}
                onClick={() => selectedSurah>1 && openSurah(selectedSurah-1)}>
                ← {selectedSurah>1 ? SURAH_META[selectedSurah-2][1] : ''}
              </button>
              <div className="nav-center">
                <div className="nav-center-arabic">{meta[2]}</div>
                <div className="nav-center-en">{meta[1]} · {selectedSurah} of 114</div>
              </div>
              <button className="nav-arrow-btn" disabled={selectedSurah>=114}
                onClick={() => selectedSurah<114 && openSurah(selectedSurah+1)}>
                {selectedSurah<114 ? SURAH_META[selectedSurah][1] : ''} →
              </button>
            </div>

            {/* ── Toolbar ── */}
            <div className="reader-toolbar">
              <div className="toolbar-group">
                <span className="toolbar-label">English</span>
                <button className={`toolbar-btn${showEnglish?' active':''}`} onClick={() => setShowEn(true)}>On</button>
                <button className={`toolbar-btn${!showEnglish?' active':''}`} onClick={() => setShowEn(false)}>Off</button>
              </div>

              <div className="toolbar-divider" />

              <div className="toolbar-group">
                <span className="toolbar-label">Size</span>
                <button className="toolbar-icon-btn" onClick={() => setFontSize(s => Math.max(18,s-2))}>−</button>
                <span className="toolbar-size-val">{fontSize}px</span>
                <button className="toolbar-icon-btn" onClick={() => setFontSize(s => Math.min(52,s+2))}>+</button>
              </div>

              <div className="toolbar-divider" />

              {/* In-surah search */}
              <div className="toolbar-group">
                <span className="toolbar-label">Search</span>
                <div className="search-box" style={{position:'relative'}}>
                  <span className="search-icon" style={{left:8,fontSize:12}}>⌕</span>
                  <input
                    style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 10px 5px 26px',color:'var(--text)',fontFamily:'var(--f-body)',fontSize:13,width:150,outline:'none',transition:'border-color .15s'}}
                    placeholder="Search verses…"
                    value={verseSearch}
                    onChange={e => setVSearch(e.target.value)}
                    onFocus={e => e.target.style.borderColor='var(--gold-dim)'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}
                  />
                </div>
                {verseSearch && (
                  <span style={{fontFamily:'var(--f-display)',fontSize:9,color:'var(--text3)'}}>
                    {filteredVerses.length} result{filteredVerses.length!==1?'s':''}
                  </span>
                )}
              </div>

              {/* Jump to ayah */}
              <div className="jump-form">
                <span className="toolbar-label">Jump</span>
                <input
                  className="jump-input"
                  type="number" min={1} max={verses.length}
                  placeholder={'1–'+verses.length}
                  value={jumpVal}
                  onChange={e => setJump(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && jumpToAyah()}
                />
                <button className="jump-btn" onClick={jumpToAyah}>Go</button>
              </div>

              {/* Keyboard hint */}
              <div style={{marginLeft:4,fontFamily:'var(--f-mono)',fontSize:9,color:'var(--text4)',display:'flex',gap:6}}>
                <span title="Previous surah">←</span>
                <span title="Next surah">→</span>
                <span title="Toggle English">[E]</span>
              </div>
            </div>

            {/* ── Scroll area ── */}
            <div className="scroll-area" ref={scrollRef}>

              {loading && (
                <div className="state-container">
                  <div className="spinner" />
                  <div className="state-title">Loading {meta[1]}…</div>
                </div>
              )}

              {error && !loading && (
                <div className="state-container">
                  <div className="error-card" data-testid="error-card">
                    <div className="error-msg" data-testid="error-msg">⚠ {error}</div>
                    <button className="retry-btn" data-testid="retry-btn" onClick={() => loadSurah(selectedSurah)}>↺ Retry</button>
                  </div>
                </div>
              )}

              {!loading && !error && verses.length > 0 && (
                <>
                  {/* Surah header */}
                  <div className="surah-header">
                    <div className="surah-header-ornament">
                      <div className="ornament-line" />
                      <div className="ornament-diamond">
                        <span /><span /><span />
                      </div>
                      <div className="ornament-line right" />
                    </div>
                    <div className="surah-number-label">Surah {selectedSurah} of 114</div>
                    <div className="surah-arabic-title">{meta[2]}</div>
                    <div className="surah-english-title">{meta[1]}</div>
                    <div className="surah-meaning">{meta[3]}</div>
                    <div className="surah-badges">
                      <span className={`surah-badge ${meta[5].toLowerCase()}`}>{meta[5]}</span>
                      <span className="surah-badge verses">{meta[4]} verses</span>
                      {bkKeys.filter(k=>k.startsWith(selectedSurah+':')).length > 0 && (
                        <span className="surah-badge" style={{color:'var(--teal2)',borderColor:'rgba(31,184,160,0.26)'}}>
                          ★ {bkKeys.filter(k=>k.startsWith(selectedSurah+':')).length} bookmarked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bismillah */}
                  {hasBismillah && (
                    <div className="bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
                  )}

                  {/* Verse search empty state */}
                  {verseSearch && filteredVerses.length === 0 && (
                    <div style={{textAlign:'center',padding:'48px 20px',color:'var(--text3)',fontStyle:'italic',fontSize:14}}>
                      No verses match "{verseSearch}"
                    </div>
                  )}

                  {/* Verses */}
                  {filteredVerses.map((v, idx) => {
                    const bkKey = selectedSurah + ':' + v.ayah;
                    const isBk = !!bookmarks[bkKey];
                    const hasNote = !!notes[bkKey];
                    const isRead = !!readVerses[bkKey];
                    return (
                      <div
                        key={v.ayah}
                        ref={el => { verseRefs.current[v.ayah] = el; }}
                        className={`verse-row${highlightAyah===v.ayah?' highlighted':''}${copiedAyah===v.ayah?' copied':''}`}
                        style={{animationDelay: verseSearch ? '0ms' : Math.min(idx*8,200)+'ms'}}
                        onMouseEnter={() => !isRead && markRead(selectedSurah, v.ayah)}
                      >
                        <div className="verse-gutter">
                          <div className={`verse-num-badge${isRead?' '+'' :''}`}
                            style={isRead ? {borderColor:'rgba(200,151,58,0.3)',color:'var(--gold-dim)'} : {}}>
                            {v.ayah}
                          </div>
                          <div className="verse-actions">
                            <button
                              className={`verse-action-btn${isBk?' bookmarked':''}`}
                              title={isBk ? 'Remove bookmark' : 'Bookmark'}
                              onClick={() => toggleBookmark(selectedSurah, v.ayah)}
                            >
                              {isBk ? '★' : '☆'}
                            </button>
                            <button
                              className="verse-action-btn teal"
                              title="Copy verse"
                              onClick={() => copyVerse(selectedSurah, v.ayah, v.arabic, v.english)}
                            >
                              ⎘
                            </button>
                            <button
                              className="verse-action-btn teal"
                              title="Share verse"
                              onClick={() => shareVerse(selectedSurah, v.ayah, v.arabic, v.english)}
                            >
                              ↗
                            </button>
                            <button
                              className={`verse-action-btn${hasNote?' bookmarked':''}`}
                              style={hasNote ? {color:'var(--purple2)',opacity:1} : {}}
                              title={hasNote ? 'Edit note' : 'Add note'}
                              onClick={() => openNote(selectedSurah, v.ayah)}
                            >
                              ✏
                            </button>
                          </div>
                        </div>

                        <div className="verse-body">
                          <div className="verse-arabic" style={{fontSize:fontSize+'px'}}>
                            {verseSearch ? (
                              <HighlightText text={v.arabic} query={verseSearch} />
                            ) : v.arabic}
                          </div>
                          {showEnglish && (
                            <div className="verse-english">
                              <HighlightText text={v.english} query={verseSearch} />
                            </div>
                          )}
                          {hasNote && (
                            <div style={{marginTop:8,padding:'7px 12px',background:'rgba(124,92,220,0.07)',border:'1px solid rgba(124,92,220,0.2)',borderRadius:6,fontSize:13,color:'var(--purple2)',fontStyle:'italic',cursor:'pointer'}}
                              onClick={() => openNote(selectedSurah, v.ayah)}>
                              ✏ {notes[bkKey]}
                            </div>
                          )}
                          <span className="verse-ref">{meta[1]} {selectedSurah}:{v.ayah}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Bottom navigation */}
                  <div style={{display:'flex',justifyContent:'space-between',padding:'24px 20px',borderTop:'1px solid var(--border)',background:'var(--bg1)'}}>
                    <button className="nav-arrow-btn" disabled={selectedSurah<=1}
                      onClick={() => selectedSurah>1 && openSurah(selectedSurah-1)}>
                      ← {selectedSurah>1 ? SURAH_META[selectedSurah-2][1] : 'Start'}
                    </button>
                    <div style={{textAlign:'center',fontFamily:'var(--f-display)',fontSize:9,letterSpacing:'0.12em',color:'var(--text3)'}}>
                      <div>{selectedSurah} / 114</div>
                      <div style={{marginTop:3,color:'var(--text4)',fontSize:8}}>
                        {Math.round(selectedSurah/114*100)}% through Quran
                      </div>
                    </div>
                    <button className="nav-arrow-btn" disabled={selectedSurah>=114}
                      onClick={() => selectedSurah<114 && openSurah(selectedSurah+1)}>
                      {selectedSurah<114 ? SURAH_META[selectedSurah][1] : 'End'} →
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* ══════════ NOTE MODAL ══════════ */}
      {showNoteModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(6,8,14,0.85)',zIndex:8000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(8px)'}}
          onClick={e => e.target===e.currentTarget && setShowNote(false)}>
          <div style={{background:'var(--surface2)',border:'1px solid var(--border3)',borderRadius:16,padding:28,width:'100%',maxWidth:480,animation:'fadeDown 0.25s ease'}}>
            <div style={{fontFamily:'var(--f-display)',fontSize:10,letterSpacing:'0.18em',color:'var(--gold)',textTransform:'uppercase',marginBottom:6}}>
              ✏ Personal Note
            </div>
            <div style={{fontFamily:'var(--f-display)',fontSize:9,color:'var(--text3)',marginBottom:16}}>
              {noteTarget && `${SURAH_META[noteTarget.surah-1][1]} ${noteTarget.surah}:${noteTarget.ayah}`}
            </div>
            <textarea
              autoFocus
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Write your note, reflection, or tafsir here…"
              style={{width:'100%',minHeight:120,background:'var(--bg)',border:'1px solid var(--border2)',borderRadius:8,padding:'12px 14px',color:'var(--text)',fontFamily:'var(--f-body)',fontSize:15,resize:'vertical',outline:'none',lineHeight:1.6}}
              onFocus={e => e.target.style.borderColor='var(--gold-dim)'}
              onBlur={e => e.target.style.borderColor='var(--border2)'}
            />
            <div style={{display:'flex',gap:8,marginTop:14,justifyContent:'flex-end'}}>
              <button
                onClick={() => setShowNote(false)}
                style={{background:'transparent',border:'1px solid var(--border)',color:'var(--text2)',padding:'8px 18px',borderRadius:8,fontFamily:'var(--f-display)',fontSize:9,letterSpacing:'0.1em',cursor:'pointer',textTransform:'uppercase'}}>
                Cancel
              </button>
              {noteText && notes[noteTarget?.surah+':'+noteTarget?.ayah] && (
                <button
                  onClick={() => { setNoteText(''); saveNote(); }}
                  style={{background:'rgba(217,79,79,0.1)',border:'1px solid var(--red)',color:'var(--red2)',padding:'8px 18px',borderRadius:8,fontFamily:'var(--f-display)',fontSize:9,letterSpacing:'0.1em',cursor:'pointer',textTransform:'uppercase'}}>
                  Delete
                </button>
              )}
              <button
                onClick={saveNote}
                style={{background:'linear-gradient(135deg,var(--gold-dim),var(--gold))',border:'none',color:'#06080e',padding:'8px 20px',borderRadius:8,fontFamily:'var(--f-display)',fontSize:9,fontWeight:700,letterSpacing:'0.1em',cursor:'pointer',textTransform:'uppercase'}}>
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TOAST ══════════ */}
      {toast && (
        <div className="toast" style={{color: toastColor}}>
          {toast.msg || toast}
        </div>
      )}
    </div>
  );
}
