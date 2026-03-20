/**
 * ─────────────────────────────────────────────────────────────────────────────
 * QuranReader.test.js  —  Component tests (React Testing Library + Jest)
 *
 * Key facts about the current component UI:
 *
 *  SIDEBAR TABS : "Browse" | "Saved [N]" | "Stats"   (no tab called "Bookmarks" or "Reader")
 *  SURAH ITEMS  : each has class .surah-en-name  — "Al-Faatiha" also appears in the
 *                 resume banner so we never use getByText('Al-Faatiha') directly
 *  ERROR PATH   : fetchWithRetry retries up to 3 times with back-off; tests must
 *                 use { timeout: 5000 } on waitFor and mock all calls to reject
 *  STATS 6,236  : appears in TWO separate <span> nodes so getByText(/6,236/) throws
 *                 "multiple elements" — use getAllByText or target .stat-value
 *  ERROR CARD   : has data-testid="error-card" and data-testid="retry-btn"
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {
  render, screen, fireEvent, waitFor, within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import QuranReader from '../components/QuranReader';
import { SURAH_META, TOTAL_VERSES, VERSE_COUNTS } from '../constants';

// ─── Mock data factories ──────────────────────────────────────────────────────

function makeArabicResponse(surahNum) {
  const count = VERSE_COUNTS[surahNum - 1];
  return {
    data: {
      ayahs: Array.from({ length: count }, (_, i) => ({
        numberInSurah: i + 1,
        text: `عَرَبِيٌّ آيَةٌ ${i + 1}`,
      })),
    },
  };
}

function makeEnglishResponse(surahNum) {
  const count = VERSE_COUNTS[surahNum - 1];
  return {
    data: {
      ayahs: Array.from({ length: count }, (_, i) => ({
        numberInSurah: i + 1,
        text: `English translation verse ${i + 1}`,
      })),
    },
  };
}

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
  // Default: resolve correctly for any surah
  mockFetch.mockImplementation((url) => {
    const match = url.match(/\/surah\/(\d+)\//);
    const num   = match ? parseInt(match[1]) : 1;
    const isEn  = url.includes('en.sahih');
    const body  = isEn ? makeEnglishResponse(num) : makeArabicResponse(num);
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── DOM helpers ──────────────────────────────────────────────────────────────

/**
 * Click a surah by its English name via the .surah-en-name divs.
 * Avoids "multiple elements" caused by the resume banner also showing the name.
 */
function clickSurahByName(container, name) {
  const els = Array.from(container.querySelectorAll('.surah-en-name'));
  const match = els.find(el => el.textContent.trim() === name);
  if (!match) throw new Error(`No .surah-en-name with text "${name}"`);
  fireEvent.click(match.closest('.surah-item'));
}

/** Click the Saved (bookmarks) sidebar tab regardless of its exact label. */
function openSavedTab(container) {
  const tab = Array.from(container.querySelectorAll('.sidebar-tab'))
    .find(t => t.textContent.includes('Saved') || t.textContent.includes('Bookmark'));
  if (!tab) throw new Error('Saved/Bookmark tab not found');
  fireEvent.click(tab);
}

/** Click the Stats sidebar tab. */
function openStatsTab(container) {
  const tab = Array.from(container.querySelectorAll('.sidebar-tab'))
    .find(t => t.textContent.includes('Stats'));
  if (!tab) throw new Error('Stats tab not found');
  fireEvent.click(tab);
}

/** Load Al-Fatiha and wait for verse 1 to appear. */
async function loadFatiha() {
  const utils = render(<QuranReader />);
  clickSurahByName(utils.container, 'Al-Faatiha');
  await waitFor(() => {
    expect(screen.getByText('عَرَبِيٌّ آيَةٌ 1')).toBeInTheDocument();
  });
  return utils;
}

// ─── 1. Initial render ────────────────────────────────────────────────────────

describe('QuranReader — initial render', () => {
  test('renders without crashing', () => {
    render(<QuranReader />);
  });

  test('sidebar search input is present', () => {
    render(<QuranReader />);
    expect(screen.getByPlaceholderText(/search surahs/i)).toBeInTheDocument();
  });

  test('three sidebar tabs exist: Browse, Saved, Stats', () => {
    const { container } = render(<QuranReader />);
    const tabs = Array.from(container.querySelectorAll('.sidebar-tab'));
    const labels = tabs.map(t => t.textContent.trim().replace(/[◈★◉]/g, '').trim());
    expect(labels.some(l => l.includes('Browse'))).toBe(true);
    expect(labels.some(l => l.includes('Saved') || l.includes('Bookmark'))).toBe(true);
    expect(labels.some(l => l.includes('Stats'))).toBe(true);
  });

  test('Browse tab is active by default', () => {
    const { container } = render(<QuranReader />);
    const active = container.querySelector('.sidebar-tab.active');
    expect(active).toBeTruthy();
    expect(active.textContent).toMatch(/Browse/i);
  });

  test('all 114 surah items rendered in list', () => {
    const { container } = render(<QuranReader />);
    expect(container.querySelectorAll('.surah-item')).toHaveLength(114);
  });

  test('surah number 1 and 114 visible in list', () => {
    const { container } = render(<QuranReader />);
    const nums = Array.from(container.querySelectorAll('.surah-num')).map(el => el.textContent.trim());
    expect(nums).toContain('1');
    expect(nums).toContain('114');
  });

  test('Arabic names rendered: الفاتحة and الناس', () => {
    render(<QuranReader />);
    expect(screen.getByText('الفاتحة')).toBeInTheDocument();
    expect(screen.getByText('الناس')).toBeInTheDocument();
  });

  test('reading pane shows welcome state initially', () => {
    render(<QuranReader />);
    expect(screen.getByText(/choose a surah/i)).toBeInTheDocument();
  });

  test('filter chips: All 114, Meccan, Medinan present', () => {
    const { container } = render(<QuranReader />);
    const chips = Array.from(container.querySelectorAll('.filter-chip'));
    const labels = chips.map(c => c.textContent.trim());
    expect(labels.some(l => l.includes('All'))).toBe(true);
    expect(labels.some(l => l === 'Meccan')).toBe(true);
    expect(labels.some(l => l === 'Medinan')).toBe(true);
  });

  test('filter count starts at 114', () => {
    const { container } = render(<QuranReader />);
    expect(container.querySelector('.filter-count').textContent.trim()).toBe('114');
  });
});

// ─── 2. Browse / Search / Filter ─────────────────────────────────────────────

describe('QuranReader — browse, search, filter', () => {
  test('search by English name filters list', () => {
    const { container } = render(<QuranReader />);
    fireEvent.change(screen.getByPlaceholderText(/search surahs/i), { target: { value: 'Kahf' } });
    const names = Array.from(container.querySelectorAll('.surah-en-name')).map(e => e.textContent.trim());
    expect(names).toContain('Al-Kahf');
    expect(names).not.toContain('Al-Baqara');
  });

  test('search by Arabic name filters list', () => {
    const { container } = render(<QuranReader />);
    fireEvent.change(screen.getByPlaceholderText(/search surahs/i), { target: { value: 'الكهف' } });
    const names = Array.from(container.querySelectorAll('.surah-en-name')).map(e => e.textContent.trim());
    expect(names).toContain('Al-Kahf');
  });

  test('search by surah number filters list', () => {
    const { container } = render(<QuranReader />);
    fireEvent.change(screen.getByPlaceholderText(/search surahs/i), { target: { value: '18' } });
    const names = Array.from(container.querySelectorAll('.surah-en-name')).map(e => e.textContent.trim());
    expect(names).not.toContain('An-Naas');
  });

  test('search clearing restores all 114', () => {
    const { container } = render(<QuranReader />);
    const input = screen.getByPlaceholderText(/search surahs/i);
    fireEvent.change(input, { target: { value: 'Kahf' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(container.querySelectorAll('.surah-item')).toHaveLength(114);
  });

  test('Meccan filter — Al-Faatiha shown, Al-Baqara hidden', () => {
    const { container } = render(<QuranReader />);
    const chip = Array.from(container.querySelectorAll('.filter-chip')).find(c => c.textContent === 'Meccan');
    fireEvent.click(chip);
    const names = Array.from(container.querySelectorAll('.surah-en-name')).map(e => e.textContent.trim());
    expect(names).toContain('Al-Faatiha');
    expect(names).not.toContain('Al-Baqara');
  });

  test('Meccan filter count = 86', () => {
    const { container } = render(<QuranReader />);
    const chip = Array.from(container.querySelectorAll('.filter-chip')).find(c => c.textContent === 'Meccan');
    fireEvent.click(chip);
    expect(container.querySelector('.filter-count').textContent.trim()).toBe('86');
  });

  test('Medinan filter — Al-Baqara shown, Al-Faatiha hidden', () => {
    const { container } = render(<QuranReader />);
    const chip = Array.from(container.querySelectorAll('.filter-chip')).find(c => c.textContent === 'Medinan');
    fireEvent.click(chip);
    const names = Array.from(container.querySelectorAll('.surah-en-name')).map(e => e.textContent.trim());
    expect(names).toContain('Al-Baqara');
    expect(names).not.toContain('Al-Faatiha');
  });

  test('Medinan filter count = 28', () => {
    const { container } = render(<QuranReader />);
    const chip = Array.from(container.querySelectorAll('.filter-chip')).find(c => c.textContent === 'Medinan');
    fireEvent.click(chip);
    expect(container.querySelector('.filter-count').textContent.trim()).toBe('28');
  });

  test('All filter restores 114 after Medinan filter', () => {
    const { container } = render(<QuranReader />);
    const medChip = Array.from(container.querySelectorAll('.filter-chip')).find(c => c.textContent === 'Medinan');
    const allChip = Array.from(container.querySelectorAll('.filter-chip')).find(c => c.textContent.includes('All'));
    fireEvent.click(medChip);
    fireEvent.click(allChip);
    expect(container.querySelectorAll('.surah-item')).toHaveLength(114);
  });

  test('active filter chip gets .active class', () => {
    const { container } = render(<QuranReader />);
    const chip = Array.from(container.querySelectorAll('.filter-chip')).find(c => c.textContent === 'Meccan');
    fireEvent.click(chip);
    expect(chip.classList.contains('active')).toBe(true);
  });

  test('search + filter combined works', () => {
    const { container } = render(<QuranReader />);
    const chip = Array.from(container.querySelectorAll('.filter-chip')).find(c => c.textContent === 'Meccan');
    fireEvent.click(chip);
    fireEvent.change(screen.getByPlaceholderText(/search surahs/i), { target: { value: 'Kahf' } });
    const names = Array.from(container.querySelectorAll('.surah-en-name')).map(e => e.textContent.trim());
    expect(names).toContain('Al-Kahf');
    expect(names).not.toContain('Al-Baqara');
  });
});

// ─── 3. Loading a surah ───────────────────────────────────────────────────────

describe('QuranReader — loading a surah', () => {
  test('clicking surah shows header with "Surah 1 of 114"', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => {
      expect(screen.getByText(/surah 1 of 114/i)).toBeInTheDocument();
    });
  });

  test('clicked surah item gets .active class', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => {
      const active = container.querySelector('.surah-item.active');
      expect(active).toBeTruthy();
      expect(active.querySelector('.surah-en-name').textContent.trim()).toBe('Al-Faatiha');
    });
  });

  test('Arabic verse text appears after load', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => expect(screen.getByText('عَرَبِيٌّ آيَةٌ 1')).toBeInTheDocument());
  });

  test('English translation appears after load', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => expect(screen.getByText('English translation verse 1')).toBeInTheDocument());
  });

  test('exactly 7 verse rows for Al-Fatiha', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => expect(screen.getByText('عَرَبِيٌّ آيَةٌ 7')).toBeInTheDocument());
    expect(container.querySelectorAll('.verse-row')).toHaveLength(7);
    expect(screen.queryByText('عَرَبِيٌّ آيَةٌ 8')).not.toBeInTheDocument();
  });

  test('surah header .surah-arabic-title contains الفاتحة', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => {
      expect(container.querySelector('.surah-arabic-title').textContent).toContain('الفاتحة');
    });
  });

  test('.surah-badge.meccan rendered for Al-Fatiha', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => {
      expect(container.querySelector('.surah-badge.meccan')).toBeTruthy();
    });
  });

  test('.surah-badge.verses shows verse count', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => {
      expect(container.querySelector('.surah-badge.verses').textContent).toMatch(/7/);
    });
  });

  test('Bismillah header shown for surah 2 (Al-Baqara)', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Baqara');
    await waitFor(() => expect(container.querySelector('.bismillah')).toBeTruthy());
  });

  test('each verse has 4 action buttons', async () => {
    const { container } = await loadFatiha();
    // 4 buttons per verse (bookmark, copy, share, note) × 7 verses = 28
    expect(container.querySelectorAll('.verse-action-btn')).toHaveLength(28);
  });

  test('verse reference label shows surah:ayah', async () => {
    await loadFatiha();
    expect(screen.getByText('Al-Faatiha 1:1')).toBeInTheDocument();
  });

  test('loading surah 2 shows Surah 2 of 114', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Baqara');
    await waitFor(() => expect(screen.getByText(/surah 2 of 114/i)).toBeInTheDocument());
  });
});

// ─── 4. Reader controls ───────────────────────────────────────────────────────

describe('QuranReader — reader controls', () => {
  test('English Off hides translation', async () => {
    await loadFatiha();
    const off = Array.from(screen.getAllByRole('button')).find(b => b.textContent.trim() === 'Off');
    fireEvent.click(off);
    expect(screen.queryByText('English translation verse 1')).not.toBeInTheDocument();
  });

  test('English On restores translation', async () => {
    await loadFatiha();
    const off = Array.from(screen.getAllByRole('button')).find(b => b.textContent.trim() === 'Off');
    const on  = Array.from(screen.getAllByRole('button')).find(b => b.textContent.trim() === 'On');
    fireEvent.click(off);
    fireEvent.click(on);
    expect(screen.getByText('English translation verse 1')).toBeInTheDocument();
  });

  test('Off button gets .active class when English disabled', async () => {
    await loadFatiha();
    const off = Array.from(screen.getAllByRole('button')).find(b => b.textContent.trim() === 'Off');
    fireEvent.click(off);
    expect(off.classList.contains('active')).toBe(true);
  });

  test('+ button increases font size', async () => {
    const { container } = await loadFatiha();
    const sizeEl = container.querySelector('.toolbar-size-val');
    const before = sizeEl.textContent.trim();
    const plus = Array.from(screen.getAllByRole('button')).find(b => b.textContent.trim() === '+');
    fireEvent.click(plus);
    expect(sizeEl.textContent.trim()).not.toBe(before);
  });

  test('− button decreases font size', async () => {
    const { container } = await loadFatiha();
    const sizeEl = container.querySelector('.toolbar-size-val');
    const before = sizeEl.textContent.trim();
    const minus = Array.from(screen.getAllByRole('button')).find(b => b.textContent.trim() === '−');
    fireEvent.click(minus);
    expect(sizeEl.textContent.trim()).not.toBe(before);
  });

  test('next surah button navigates to surah 2', async () => {
    const { container } = await loadFatiha();
    const navBtns = container.querySelectorAll('.nav-arrow-btn');
    fireEvent.click(navBtns[navBtns.length - 1]); // rightmost = next
    await waitFor(() => expect(screen.getByText(/surah 2 of 114/i)).toBeInTheDocument());
  });

  test('prev surah button is disabled on surah 1', async () => {
    const { container } = await loadFatiha();
    const navBtns = container.querySelectorAll('.nav-arrow-btn');
    expect(navBtns[0]).toBeDisabled(); // leftmost = prev
  });

  test('jump input accepts a value', async () => {
    const { container } = await loadFatiha();
    const jumpInput = container.querySelector('.jump-input');
    fireEvent.change(jumpInput, { target: { value: '5' } });
    expect(jumpInput.value).toBe('5');
  });

  test('jump to valid ayah does not crash', async () => {
    const { container } = await loadFatiha();
    const jumpInput = container.querySelector('.jump-input');
    const jumpBtn   = container.querySelector('.jump-btn');
    fireEvent.change(jumpInput, { target: { value: '3' } });
    fireEvent.click(jumpBtn);
    // verse 3 still in DOM
    expect(screen.getByText('عَرَبِيٌّ آيَةٌ 3')).toBeInTheDocument();
  });

  test('in-surah verse search filters visible rows', async () => {
    const { container } = await loadFatiha();
    fireEvent.change(screen.getByPlaceholderText(/search verses/i), { target: { value: 'verse 3' } });
    expect(container.querySelectorAll('.verse-row')).toHaveLength(1);
  });

  test('clearing verse search restores all rows', async () => {
    const { container } = await loadFatiha();
    const input = screen.getByPlaceholderText(/search verses/i);
    fireEvent.change(input, { target: { value: 'verse 3' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(container.querySelectorAll('.verse-row')).toHaveLength(7);
  });

  test('verse search result count label appears', async () => {
    const { container } = await loadFatiha();
    fireEvent.change(screen.getByPlaceholderText(/search verses/i), { target: { value: 'verse 3' } });
    expect(screen.getByText(/1 result/i)).toBeInTheDocument();
  });
});

// ─── 5. Bookmarks ─────────────────────────────────────────────────────────────

describe('QuranReader — bookmarks', () => {
  test('Saved tab shows empty state when no bookmarks', () => {
    const { container } = render(<QuranReader />);
    openSavedTab(container);
    expect(screen.getByText(/No bookmarks/i)).toBeInTheDocument();
  });

  test('bookmarking a verse adds surah to Saved panel', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => screen.getByText('عَرَبِيٌّ آيَةٌ 1'));

    const bkBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('bookmark'));
    fireEvent.click(bkBtn);

    openSavedTab(container);
    const list = container.querySelector('.bookmarks-list');
    expect(within(list).getByText('Al-Faatiha')).toBeInTheDocument();
  });

  test('bookmark button gets .bookmarked class', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => screen.getByText('عَرَبِيٌّ آيَةٌ 1'));

    const bkBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('bookmark'));
    fireEvent.click(bkBtn);

    // Wait for React re-render to apply the class
    await waitFor(() => {
      expect(bkBtn.classList.contains('bookmarked')).toBe(true);
    });
  });

  test('unbookmarking removes .bookmarked class', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => screen.getByText('عَرَبِيٌّ آيَةٌ 1'));

    const bkBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('bookmark'));
    fireEvent.click(bkBtn); // add
    fireEvent.click(bkBtn); // remove
    expect(bkBtn.classList.contains('bookmarked')).toBe(false);
  });

  test('unbookmarking restores empty state in Saved tab', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => screen.getByText('عَرَبِيٌّ آيَةٌ 1'));

    const bkBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('bookmark'));
    fireEvent.click(bkBtn); // add
    fireEvent.click(bkBtn); // remove

    openSavedTab(container);
    expect(screen.getByText(/No bookmarks/i)).toBeInTheDocument();
  });

  test('bookmarked surah item gets .bookmarked class', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => screen.getByText('عَرَبِيٌّ آيَةٌ 1'));

    const bkBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('bookmark'));
    fireEvent.click(bkBtn);

    const item = container.querySelector('.surah-item.active');
    expect(item.classList.contains('bookmarked')).toBe(true);
  });
});

// ─── 6. Stats tab ─────────────────────────────────────────────────────────────

describe('QuranReader — stats tab', () => {
  test('stats panel renders', () => {
    const { container } = render(<QuranReader />);
    openStatsTab(container);
    expect(container.querySelector('.stats-panel')).toBeTruthy();
  });

  test('Reading Progress section present', () => {
    const { container } = render(<QuranReader />);
    openStatsTab(container);
    expect(screen.getByText('Reading Progress')).toBeInTheDocument();
  });

  test('Dataset section shows 114 surahs', () => {
    const { container } = render(<QuranReader />);
    openStatsTab(container);
    // Look inside .stats-panel to avoid ambiguity with filter-count
    const panel = container.querySelector('.stats-panel');
    expect(within(panel).getAllByText('114').length).toBeGreaterThan(0);
  });

  test('Dataset section shows 6,236 verses', () => {
    const { container } = render(<QuranReader />);
    openStatsTab(container);
    // Use getAllByText — it appears in two places (stat-value cells)
    const matches = screen.getAllByText(/6,236/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test('Dataset section shows 86 Meccan, 28 Medinan', () => {
    const { container } = render(<QuranReader />);
    openStatsTab(container);
    const panel = container.querySelector('.stats-panel');
    expect(within(panel).getByText('86')).toBeInTheDocument();
    expect(within(panel).getByText('28')).toBeInTheDocument();
  });

  test('Bookmarks & Notes section present', () => {
    const { container } = render(<QuranReader />);
    openStatsTab(container);
    expect(screen.getByText(/Bookmarks & Notes/i)).toBeInTheDocument();
  });

  test('Dataset section shows Uthmani and Saheeh Intl', () => {
    const { container } = render(<QuranReader />);
    openStatsTab(container);
    expect(screen.getByText('Uthmani')).toBeInTheDocument();
    expect(screen.getByText('Saheeh Intl')).toBeInTheDocument();
  });

  test('recent history appears after loading a surah', async () => {
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(() => screen.getByText('عَرَبِيٌّ آيَةٌ 1'));

    openStatsTab(container);
    const panel = container.querySelector('.stats-panel');
    expect(within(panel).getAllByText('Al-Faatiha').length).toBeGreaterThan(0);
  });
});

// ─── 7. Notes modal ───────────────────────────────────────────────────────────

describe('QuranReader — notes modal', () => {
  test('✏ note button present on each verse', async () => {
    const { container } = await loadFatiha();
    const noteButtons = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .filter(b => b.title.toLowerCase().includes('note'));
    expect(noteButtons).toHaveLength(7);
  });

  test('clicking note button opens modal with textarea', async () => {
    const { container } = await loadFatiha();
    const noteBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('note'));
    fireEvent.click(noteBtn);
    expect(screen.getByPlaceholderText(/write your note/i)).toBeInTheDocument();
  });

  test('modal shows surah:ayah reference', async () => {
    const { container } = await loadFatiha();
    const noteBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('note'));
    fireEvent.click(noteBtn);
    // The reference appears in both the modal div and the verse-ref span
    const matches = screen.getAllByText(/Al-Faatiha 1:1/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test('Cancel button closes modal', async () => {
    const { container } = await loadFatiha();
    const noteBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('note'));
    fireEvent.click(noteBtn);

    const cancelBtn = Array.from(screen.getAllByRole('button')).find(b => b.textContent.trim() === 'Cancel');
    fireEvent.click(cancelBtn);
    expect(screen.queryByPlaceholderText(/write your note/i)).not.toBeInTheDocument();
  });

  test('Save Note button closes modal', async () => {
    const { container } = await loadFatiha();
    const noteBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('note'));
    fireEvent.click(noteBtn);

    fireEvent.change(screen.getByPlaceholderText(/write your note/i), { target: { value: 'My note' } });
    const saveBtn = Array.from(screen.getAllByRole('button')).find(b => b.textContent.includes('Save Note'));
    fireEvent.click(saveBtn);
    expect(screen.queryByPlaceholderText(/write your note/i)).not.toBeInTheDocument();
  });

  test('saved note text appears inline under verse', async () => {
    const { container } = await loadFatiha();
    const noteBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('note'));
    fireEvent.click(noteBtn);

    fireEvent.change(screen.getByPlaceholderText(/write your note/i), { target: { value: 'Bismillah note' } });
    const saveBtn = Array.from(screen.getAllByRole('button')).find(b => b.textContent.includes('Save Note'));
    fireEvent.click(saveBtn);

    // Note renders inline as "✏ Bismillah note" — use regex to match partial text
    await waitFor(() => {
      expect(screen.getByText(/Bismillah note/i)).toBeInTheDocument();
    });
  });

  test('note button gets .bookmarked style after saving', async () => {
    const { container } = await loadFatiha();
    const noteBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('note'));
    fireEvent.click(noteBtn);

    fireEvent.change(screen.getByPlaceholderText(/write your note/i), { target: { value: 'Test note' } });
    const saveBtn = Array.from(screen.getAllByRole('button')).find(b => b.textContent.includes('Save Note'));
    fireEvent.click(saveBtn);

    // Re-find button after re-render
    const updatedBtn = Array.from(container.querySelectorAll('.verse-action-btn[title]'))
      .find(b => b.title.toLowerCase().includes('note'));
    expect(updatedBtn.classList.contains('bookmarked')).toBe(true);
  });
});

// ─── 8. Error handling ────────────────────────────────────────────────────────

describe('QuranReader — error handling', () => {
  // Use longer timeout because fetchWithRetry retries 3× with back-off
  const TIMEOUT = { timeout: 8000 };

  test('error card shown when all retries fail', async () => {
    // Reject every call immediately
    mockFetch.mockRejectedValue(new Error('Network failure'));
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(
      () => expect(screen.getByTestId('error-card')).toBeInTheDocument(),
      TIMEOUT,
    );
  });

  test('error message contains the error text', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(
      () => expect(screen.getByTestId('error-msg').textContent).toMatch(/network failure/i),
      TIMEOUT,
    );
  });

  test('Retry button is rendered on error', async () => {
    mockFetch.mockRejectedValue(new Error('Timeout'));
    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');
    await waitFor(
      () => expect(screen.getByTestId('retry-btn')).toBeInTheDocument(),
      TIMEOUT,
    );
  });

  test('Retry button re-fetches and shows verses on success', async () => {
    // Phase 1: always reject so error state appears
    mockFetch.mockRejectedValue(new Error('fail'));

    const { container } = render(<QuranReader />);
    clickSurahByName(container, 'Al-Faatiha');

    await waitFor(
      () => expect(screen.getByTestId('retry-btn')).toBeInTheDocument(),
      TIMEOUT,
    );

    // Phase 2: swap mock to succeed, then click Retry
    mockFetch.mockImplementation((url) => {
      const match = url.match(/\/surah\/(\d+)\//);
      const num = match ? parseInt(match[1]) : 1;
      const isEn = url.includes('en.sahih');
      const body = isEn ? makeEnglishResponse(num) : makeArabicResponse(num);
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    });

    fireEvent.click(screen.getByTestId('retry-btn'));

    await waitFor(
      () => expect(screen.getByText('عَرَبِيٌّ آيَةٌ 1')).toBeInTheDocument(),
      TIMEOUT,
    );
  }, 20000);
});

// ─── 9. SURAH_META integrity ──────────────────────────────────────────────────

describe('SURAH_META — data integrity', () => {
  test('has 114 entries', () => expect(SURAH_META).toHaveLength(114));
  test('entry 1 is Al-Faatiha (الفاتحة)', () => {
    expect(SURAH_META[0][1]).toBe('Al-Faatiha');
    expect(SURAH_META[0][2]).toBe('الفاتحة');
  });
  test('entry 114 is An-Naas (الناس)', () => {
    expect(SURAH_META[113][1]).toBe('An-Naas');
    expect(SURAH_META[113][2]).toBe('الناس');
  });
  test('TOTAL_VERSES = 6236', () => expect(TOTAL_VERSES).toBe(6236));
  test('VERSE_COUNTS has 114 entries', () => expect(VERSE_COUNTS).toHaveLength(114));
  test('VERSE_COUNTS sum = 6236', () => {
    expect(VERSE_COUNTS.reduce((a, b) => a + b, 0)).toBe(6236);
  });
  test('all entries have valid revelation type', () => {
    SURAH_META.forEach(([,,,, , rt]) => {
      expect(['Meccan', 'Medinan']).toContain(rt);
    });
  });
});
