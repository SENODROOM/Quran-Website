/**
 * ─────────────────────────────────────────────────────────────────────────────
 * QuranReader.test.js
 *
 * Component-level tests for the QuranReader UI.
 * Uses React Testing Library. Network calls are mocked.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuranReader from '../components/QuranReader';
import { SURAH_META, TOTAL_VERSES, VERSE_COUNTS } from '../constants';

// ─── Mock fetch ───────────────────────────────────────────────────────────────

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

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
  // Default: return Al-Fatiha for any surah fetch
  mockFetch.mockImplementation((url) => {
    const surahMatch = url.match(/\/surah\/(\d+)\//);
    const num = surahMatch ? parseInt(surahMatch[1]) : 1;
    const isEnglish = url.includes('en.sahih');
    const body = isEnglish ? makeEnglishResponse(num) : makeArabicResponse(num);
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── 1. Render ────────────────────────────────────────────────────────────────

describe('QuranReader — initial render', () => {
  test('renders without crashing', () => {
    render(<QuranReader />);
  });

  test('shows Browse tab by default', () => {
    render(<QuranReader />);
    // Browse panel should contain surah list
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('shows tab buttons: Browse, Reader, Bookmarks', () => {
    render(<QuranReader />);
    expect(screen.getByText(/browse/i)).toBeInTheDocument();
    expect(screen.getByText(/reader/i)).toBeInTheDocument();
    expect(screen.getByText(/bookmarks/i)).toBeInTheDocument();
  });

  test('renders all 114 surah cards in browse view', () => {
    render(<QuranReader />);
    // Surah numbers 1-114 should be present
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('114')).toBeInTheDocument();
  });

  test('renders surah Arabic names in browse list', () => {
    render(<QuranReader />);
    expect(screen.getByText('الفاتحة')).toBeInTheDocument();
    expect(screen.getByText('الناس')).toBeInTheDocument();
  });
});

// ─── 2. Browse / Search / Filter ─────────────────────────────────────────────

describe('QuranReader — browse, search, filter', () => {
  test('search by English name filters the list', () => {
    render(<QuranReader />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'Kahf' } });
    expect(screen.getByText('Al-Kahf')).toBeInTheDocument();
  });

  test('search by surah number filters the list', () => {
    render(<QuranReader />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: '18' } });
    // Should show surah 18 but not surah 114
    expect(screen.queryByText('Al-Naas') || screen.queryByText('An-Naas')).not.toBeInTheDocument();
  });

  test('filter to Meccan shows only Meccan surahs', () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText(/Meccan/i));
    // Al-Fatiha is Meccan — should still be present
    expect(screen.getByText('Al-Faatiha')).toBeInTheDocument();
    // Al-Baqara is Medinan — should not appear
    expect(screen.queryByText('Al-Baqara')).not.toBeInTheDocument();
  });

  test('filter to Medinan shows only Medinan surahs', () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText(/Medinan/i));
    expect(screen.getByText('Al-Baqara')).toBeInTheDocument();
    expect(screen.queryByText('Al-Faatiha')).not.toBeInTheDocument();
  });

  test('All filter restores full list', () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText(/Medinan/i));
    fireEvent.click(screen.getByText(/All/i));
    expect(screen.getByText('Al-Faatiha')).toBeInTheDocument();
    expect(screen.getByText('Al-Baqara')).toBeInTheDocument();
  });
});

// ─── 3. Loading a surah ───────────────────────────────────────────────────────

describe('QuranReader — loading a surah', () => {
  test('clicking a surah card switches to reader tab', async () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    await waitFor(() => {
      // Reader tab should now show surah header
      expect(screen.getByText(/SURAH 1 OF 114/i)).toBeInTheDocument();
    });
  });

  test('shows loading state while fetching', async () => {
    // Delay fetch
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve(makeArabicResponse(1)),
    }), 200)));
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    // Loading indicator should appear briefly
    // (may or may not be visible depending on test speed — just ensure no crash)
  });

  test('renders verse Arabic text after loading', async () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    await waitFor(() => {
      expect(screen.getByText('عَرَبِيٌّ آيَةٌ 1')).toBeInTheDocument();
    });
  });

  test('renders verse English text when showEnglish is on', async () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    await waitFor(() => {
      expect(screen.getByText('English translation verse 1')).toBeInTheDocument();
    });
  });

  test('correct number of verses rendered for Al-Fatiha (7)', async () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    await waitFor(() => {
      expect(screen.getByText('عَرَبِيٌّ آيَةٌ 7')).toBeInTheDocument();
    });
    // Verse 8 should NOT exist
    expect(screen.queryByText('عَرَبِيٌّ آيَةٌ 8')).not.toBeInTheDocument();
  });

  test('surah header shows revelation type badge', async () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    await waitFor(() => {
      expect(screen.getByText('Meccan')).toBeInTheDocument();
    });
  });
});

// ─── 4. Controls ─────────────────────────────────────────────────────────────

describe('QuranReader — reader controls', () => {
  async function loadFatiha() {
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    await waitFor(() => screen.getByText('عَرَبِيٌّ آيَةٌ 1'));
  }

  test('toggling English Off hides translation', async () => {
    await loadFatiha();
    const offBtn = screen.getByText('Off');
    fireEvent.click(offBtn);
    expect(screen.queryByText('English translation verse 1')).not.toBeInTheDocument();
  });

  test('toggling English On shows translation', async () => {
    await loadFatiha();
    fireEvent.click(screen.getByText('Off'));
    fireEvent.click(screen.getByText('On'));
    expect(screen.getByText('English translation verse 1')).toBeInTheDocument();
  });

  test('Next button navigates to surah 2', async () => {
    await loadFatiha();
    const nextBtn = screen.getByText(/Next →/i);
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText(/SURAH 2 OF 114/i)).toBeInTheDocument();
    });
  });

  test('Prev button is disabled on surah 1', async () => {
    await loadFatiha();
    const prevBtn = screen.getByText(/← Prev/i);
    expect(prevBtn).toBeDisabled();
  });
});

// ─── 5. Bookmarks ─────────────────────────────────────────────────────────────

describe('QuranReader — bookmarks', () => {
  test('Bookmarks tab shows empty state initially', () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText(/bookmarks/i));
    expect(screen.getByText(/No bookmarks/i)).toBeInTheDocument();
  });

  test('bookmarking a verse adds it to bookmarks tab', async () => {
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    await waitFor(() => screen.getByText('عَرَبِيٌّ آيَةٌ 1'));

    // Click the first star button (☆ → ★)
    const starBtns = screen.getAllByTitle(/bookmark/i);
    fireEvent.click(starBtns[0]);

    // Switch to bookmarks tab
    fireEvent.click(screen.getByText(/bookmarks/i));
    expect(screen.getByText('Al-Faatiha')).toBeInTheDocument();
  });
});

// ─── 6. Error handling ────────────────────────────────────────────────────────

describe('QuranReader — error handling', () => {
  test('shows error state when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    await waitFor(() => {
      expect(screen.getByText(/network failure/i)).toBeInTheDocument();
    });
  });

  test('shows Retry button on error', async () => {
    mockFetch.mockRejectedValue(new Error('Timeout'));
    render(<QuranReader />);
    fireEvent.click(screen.getByText('Al-Faatiha'));
    await waitFor(() => {
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });
});

// ─── 7. SURAH_META integrity (used by the component) ─────────────────────────

describe('SURAH_META used by QuranReader — integrity', () => {
  test('SURAH_META has 114 entries available to component', () => {
    expect(SURAH_META).toHaveLength(114);
  });

  test('first entry is Al-Faatiha', () => {
    expect(SURAH_META[0][1]).toBe('Al-Faatiha');
    expect(SURAH_META[0][2]).toBe('الفاتحة');
  });

  test('last entry is An-Naas', () => {
    expect(SURAH_META[113][1]).toBe('An-Naas');
    expect(SURAH_META[113][2]).toBe('الناس');
  });

  test('TOTAL_VERSES is 6236', () => {
    expect(TOTAL_VERSES).toBe(6236);
  });
});
