/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Yearbook } from '../types/yearbook';
import { generateCoverSvgDataUrl } from '../utils/coverGenerator';
import { deletePdfFile } from './pdfStore';
import { broadcastSync } from './syncService';

const STORAGE_KEY = 'bbs_pik_yearbook_gallery_records_v4';

/**
 * Pre-populated realistic initial yearbook collection for
 * Bina Bangsa School-Pantai Indah Kapuk (BBS PIK).
 */
export const INITIAL_YEARBOOKS: Yearbook[] = [
  {
    id: 'yb-bbs-pik-2024-2025',
    year: '2024–2025',
    startYear: 2024,
    endYear: 2025,
    title: 'To Build The Nation',
    description: 'Celebrating academic excellence in Cambridge A-Levels, national badminton championships, cultural festivals, and the graduating seniors of BBS Pantai Indah Kapuk.',
    theme: 'Gloria Dei Vivens Homo & Global Leadership',
    coverImageUrl: generateCoverSvgDataUrl('2024–2025', 'To Build The Nation', 'darkBlue'),
    fileUrl: '', // Uses dynamic generator or uploaded file
    fileName: 'BBS_PIK_Yearbook_2024-2025_ToBuildTheNation.pdf',
    fileSize: '48.5 MB',
    fileSizeBytes: 50855936,
    pageCount: 224,
    dateUploaded: '2025-06-20T10:30:00Z',
    featured: true,
    tags: ['Cambridge A-Levels', 'Valedictorian', 'Faith & Chapel', 'Graduation'],
    samplePages: [
      {
        pageNumber: 1,
        section: 'Prologue & Cover',
        title: 'Bina Bangsa School - Pantai Indah Kapuk 2024–2025',
        content: 'Volume XXIV — "To Build The Nation". Dedicated to our graduating cohorts stepping out to glorify God, lead with integrity, and shape the future of our nation and global community.',
      },
      {
        pageNumber: 4,
        section: 'Principal & Pastoral Address',
        title: 'Walking in Wisdom and Grace',
        content: '"At Bina Bangsa School Pantai Indah Kapuk, our motto \'Gloria Dei Vivens Homo\' reminds us that when young people discover their God-given gifts in scholarship, music, arts, and service, they illuminate the world around them."',
      },
      {
        pageNumber: 32,
        section: 'Senior Class Directory',
        title: 'Graduating Cohort of 2025: Eagles in Flight',
        content: 'Featuring 138 graduates, Cambridge Top in the Country awardees, and matriculations to top universities across Singapore, Australia, the UK, the US, and Asia.',
      },
      {
        pageNumber: 88,
        section: 'Athletics & Competitions',
        title: 'Inter-School Champions: Basketball & Badminton',
        content: 'BBS PIK Varsity teams swept regional gold medals in the Jakarta Inter-School Sports League, demonstrating outstanding teamwork and sportsmanship.',
      },
      {
        pageNumber: 144,
        section: 'Arts, Choir & Chapel Ministry',
        title: 'BBS PIK Orchestra & Annual Musical Gala',
        content: 'A breathtaking performance by our 80-piece student orchestra and combined choir in the PIK Campus Grand Auditorium.',
      },
      {
        pageNumber: 216,
        section: 'Senior Traditions & Candids',
        title: 'Ring Ceremony & Graduation Walk',
        content: 'Cherished memories, teacher tributes, cap-toss celebrations, and lifelong bonds forged at Pantai Indah Kapuk.',
      },
    ],
  },
  {
    id: 'yb-bbs-pik-2023-2024',
    year: '2023–2024',
    startYear: 2023,
    endYear: 2024,
    title: 'Wings of Excellence',
    description: 'Documenting our bilingual Cambridge curriculum milestones, FIRST Robotics triumphs, Model UN delegations, and community outreach by the student council.',
    theme: 'Character, Faith & Scholastic Triumph',
    coverImageUrl: generateCoverSvgDataUrl('2023–2024', 'Wings of Excellence', 'turquoise'),
    fileUrl: '',
    fileName: 'BBS_PIK_Yearbook_2023-2024_WingsOfExcellence.pdf',
    fileSize: '43.2 MB',
    fileSizeBytes: 45298483,
    pageCount: 208,
    dateUploaded: '2024-06-18T14:15:00Z',
    featured: true,
    tags: ['Robotics', 'Cambridge IGCSE', 'Chinese Cultural Show', 'Prefects'],
    samplePages: [
      {
        pageNumber: 1,
        section: 'Opening Dedication',
        title: 'Wings of Excellence: Volume XXIII',
        content: 'Bina Bangsa School Pantai Indah Kapuk honors a year of relentless pursuit of knowledge, Christian fellowship, and creative exploration.',
      },
      {
        pageNumber: 22,
        section: 'Bilingual & Cultural Showcase',
        title: 'Spring Festival & Chinese Speech Competition',
        content: 'Celebrating heritage, bilingual fluency in English and Mandarin, and national storytelling accolades.',
      },
      {
        pageNumber: 68,
        section: 'Senior Profiles',
        title: 'Class of 2024 Senior Memories',
        content: 'Senior superlatives, kindergarten-to-high-school lifers, university acceptance letters, and personal testaments.',
      },
      {
        pageNumber: 130,
        section: 'Campus Life & Houses',
        title: 'House Matches & Spirit Carnival',
        content: 'House battles, spirit chants, cheerleading, and friendship across the primary and secondary campuses.',
      },
    ],
  },
  {
    id: 'yb-bbs-pik-2022-2023',
    year: '2022–2023',
    startYear: 2022,
    endYear: 2023,
    title: 'Echoes of Light',
    description: 'A vibrant retrospective of chapel praise, science fairs, math Olympiads, swimming galas, and friendships at BBS PIK.',
    theme: 'Shining Bright in Truth & Love',
    coverImageUrl: generateCoverSvgDataUrl('2022–2023', 'Echoes of Light', 'navyYellow'),
    fileUrl: '',
    fileName: 'BBS_PIK_Yearbook_2022-2023_EchoesOfLight.pdf',
    fileSize: '40.6 MB',
    fileSizeBytes: 42572185,
    pageCount: 192,
    dateUploaded: '2023-06-16T09:00:00Z',
    featured: false,
    tags: ['Math Olympiad', 'Choir', 'Graduates', 'Community Service'],
    samplePages: [
      {
        pageNumber: 1,
        section: 'Welcome',
        title: 'Echoes of Light — BBS PIK 2023',
        content: 'Every classroom lesson, musical note, and service project reflected the glorious potential of our students.',
      },
      {
        pageNumber: 50,
        section: 'STEM & Math Olympiads',
        title: 'Southeast Asian Mathematical Olympiad (SEAMO)',
        content: '14 Gold medals won by BBS PIK scholars in regional math competitions.',
      },
    ],
  },
  {
    id: 'yb-bbs-pik-2021-2022',
    year: '2021–2022',
    startYear: 2021,
    endYear: 2022,
    title: 'Resilience & Renewal',
    description: 'Our triumphant return to full face-to-face learning on the Pantai Indah Kapuk campus, unmasked smiles, rekindled traditions, and community triumph.',
    theme: 'Steadfast Faith & Reconnection',
    coverImageUrl: generateCoverSvgDataUrl('2021–2022', 'Resilience & Renewal', 'midnight'),
    fileUrl: '',
    fileName: 'BBS_PIK_Yearbook_2021-2022_Resilience.pdf',
    fileSize: '37.8 MB',
    fileSizeBytes: 39636172,
    pageCount: 184,
    dateUploaded: '2022-06-15T11:45:00Z',
    featured: false,
    tags: ['Campus Return', 'Solidarity', 'Sports', 'Faculty Tributes'],
    samplePages: [
      {
        pageNumber: 1,
        section: 'Opening Reflection',
        title: 'Back Home at Pantai Indah Kapuk',
        content: 'Reunited under one roof, our students celebrated the joy of shared learning, playground laughter, and chapel worship.',
      },
    ],
  },
  {
    id: 'yb-bbs-pik-2020-2021',
    year: '2020–2021',
    startYear: 2020,
    endYear: 2021,
    title: 'United in Purpose',
    description: 'A historic commemorative edition chronicling virtual chapel gatherings, remote Cambridge exam milestones, and resilient community spirit.',
    theme: 'Hope, Courage and Unity',
    coverImageUrl: generateCoverSvgDataUrl('2020–2021', 'United in Purpose', 'darkBlue'),
    fileUrl: '',
    fileName: 'BBS_PIK_Yearbook_2020-2021_UnitedInPurpose.pdf',
    fileSize: '35.0 MB',
    fileSizeBytes: 36700160,
    pageCount: 168,
    dateUploaded: '2021-06-12T16:20:00Z',
    featured: false,
    tags: ['Historic Hybrid', 'Resilience', 'Class of 2021'],
  },
  {
    id: 'yb-bbs-pik-2019-2020',
    year: '2019–2020',
    startYear: 2019,
    endYear: 2020,
    title: 'Crossing Horizons',
    description: 'Celebrating two decades of excellence, the opening of our expanded sports complex, and senior commencement memories.',
    theme: 'Legacy & Next Generation',
    coverImageUrl: generateCoverSvgDataUrl('2019–2020', 'Crossing Horizons', 'whiteGold'),
    fileUrl: '',
    fileName: 'BBS_PIK_Yearbook_2019-2020_CrossingHorizons.pdf',
    fileSize: '38.4 MB',
    fileSizeBytes: 40265318,
    pageCount: 188,
    dateUploaded: '2020-06-25T13:00:00Z',
    featured: false,
    tags: ['20th Anniversary', 'Alumni', 'Traditions'],
  },
  {
    id: 'yb-bbs-pik-2018-2019',
    year: '2018–2019',
    startYear: 2018,
    endYear: 2019,
    title: 'Champions of Tomorrow',
    description: 'International exchange programs, drama productions, science fairs, and senior sports championships at Pantai Indah Kapuk.',
    theme: 'Leadership and Discovery',
    coverImageUrl: generateCoverSvgDataUrl('2018–2019', 'Champions of Tomorrow', 'royal'),
    fileUrl: '',
    fileName: 'BBS_PIK_Yearbook_2018-2019_ChampionsOfTomorrow.pdf',
    fileSize: '36.1 MB',
    fileSizeBytes: 37853593,
    pageCount: 176,
    dateUploaded: '2019-06-14T08:30:00Z',
    featured: false,
    tags: ['Drama Gala', 'Science Fair', 'Graduation'],
  },
  {
    id: 'yb-bbs-pik-2015-2016',
    year: '2015–2016',
    startYear: 2015,
    endYear: 2016,
    title: 'Foundations of Faith',
    description: 'Archival volume commemorating 15 years of Bina Bangsa School Pantai Indah Kapuk and our pioneer batches.',
    theme: 'Roots and Vision',
    coverImageUrl: generateCoverSvgDataUrl('2015–2016', 'Foundations of Faith', 'turquoise'),
    fileUrl: '',
    fileName: 'BBS_PIK_Yearbook_2015-2016_FoundationsOfFaith.pdf',
    fileSize: '33.8 MB',
    fileSizeBytes: 35441868,
    pageCount: 160,
    dateUploaded: '2016-06-18T12:00:00Z',
    featured: false,
    tags: ['Milestone', 'Heritage', 'Classics'],
  },
];

/**
 * Parses academic year string (e.g. "2024–2025", "2024-2025", or "2025")
 * to extract start and optional end year numbers for accurate sorting.
 */
export function parseYearRange(yearInput: string): { startYear: number; endYear?: number } {
  const matches = yearInput.match(/(\d{4})/g);
  if (!matches || matches.length === 0) {
    const currentYear = new Date().getFullYear();
    return { startYear: currentYear };
  }
  const first = parseInt(matches[0], 10);
  if (matches.length > 1) {
    const second = parseInt(matches[1], 10);
    return { startYear: Math.min(first, second), endYear: Math.max(first, second) };
  }
  return { startYear: first };
}

/**
 * Retrieves all stored yearbooks from LocalStorage or seeds with defaults.
 */
export function getAllYearbooks(): Yearbook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_YEARBOOKS));
      return INITIAL_YEARBOOKS;
    }
    const parsed = JSON.parse(raw) as Yearbook[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_YEARBOOKS));
      return INITIAL_YEARBOOKS;
    }

    // Auto-heal: Fix any deprecated 'utf8,' or blank covers for mobile and tablet browsers
    let hasHealed = false;
    const healed = parsed.map((item) => {
      if (
        !item.coverImageUrl ||
        item.coverImageUrl.includes('data:image/svg+xml;utf8,') ||
        item.coverImageUrl.trim() === ''
      ) {
        hasHealed = true;
        return {
          ...item,
          coverImageUrl: generateCoverSvgDataUrl(item.year, item.title, 'darkBlue'),
        };
      }
      return item;
    });

    if (hasHealed) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(healed));
      } catch {
        // Storage quota full or unavailable
      }
    }

    return healed;
  } catch (err) {
    console.error('Failed to read yearbooks from storage:', err);
    return INITIAL_YEARBOOKS;
  }
}

/**
 * Exports all yearbook archives as an encrypted/portable sync bundle
 * so users can seamlessly transfer uploaded files to mobile or tablet.
 */
export function exportSyncBundle(): string {
  const yearbooks = getAllYearbooks();
  const bundle = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    source: 'BBS PIK Digital Yearbook Archive',
    count: yearbooks.length,
    yearbooks,
  };
  return JSON.stringify(bundle, null, 2);
}

/**
 * Imports a sync bundle to instantly update mobile and tablet views
 * with all uploaded files, updates, and certified pages.
 */
export function importSyncBundle(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    const list = Array.isArray(data) ? data : data.yearbooks;
    if (!Array.isArray(list) || list.length === 0) {
      return { success: false, count: 0, error: 'Invalid sync file: no yearbook records found.' };
    }

    const validated: Yearbook[] = list.map((item: any) => ({
      ...item,
      coverImageUrl: (!item.coverImageUrl || item.coverImageUrl.includes('utf8,'))
        ? generateCoverSvgDataUrl(item.year || '2024–2025', item.title || 'Yearbook', 'darkBlue')
        : item.coverImageUrl,
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    window.dispatchEvent(new CustomEvent('yearbooks_updated'));
    broadcastSync('YEARBOOKS_UPDATED');
    return { success: true, count: validated.length };
  } catch (err) {
    return { success: false, count: 0, error: (err as Error).message };
  }
}

/**
 * Saves a new or updated yearbook entry.
 */
export function saveYearbook(yearbook: Yearbook): Yearbook[] {
  const all = getAllYearbooks();
  const existingIndex = all.findIndex((item) => item.id === yearbook.id);

  let updatedList: Yearbook[];
  if (existingIndex >= 0) {
    updatedList = [...all];
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      ...yearbook,
    };
  } else {
    updatedList = [yearbook, ...all];
  }

  try {
    // Sanitize to prevent LocalStorage quota overflow (PDF binaries are saved in IndexedDB)
    const sanitizedList = updatedList.map((item) => {
      if (item.fileUrl && item.fileUrl.startsWith('data:application/pdf') && item.fileUrl.length > 50000) {
        return { ...item, fileUrl: '' };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedList));
    window.dispatchEvent(new CustomEvent('yearbooks_updated'));
    broadcastSync('YEARBOOKS_UPDATED');
  } catch (err) {
    console.error('Storage write error, attempting stripped fallback:', err);
    try {
      const strippedList = updatedList.map((item) => ({ ...item, fileUrl: '' }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(strippedList));
      window.dispatchEvent(new CustomEvent('yearbooks_updated'));
      broadcastSync('YEARBOOKS_UPDATED');
    } catch {
      throw new Error('Storage write failed. Please ensure browser storage quota is available.');
    }
  }

  return updatedList;
}

/**
 * Deletes a yearbook entry by ID.
 */
export function deleteYearbook(id: string): Yearbook[] {
  const all = getAllYearbooks();
  const filtered = all.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  deletePdfFile(id).catch(() => {});
  window.dispatchEvent(new CustomEvent('yearbooks_updated'));
  broadcastSync('YEARBOOKS_UPDATED');
  return filtered;
}

/**
 * Resets storage back to initial sample collection.
 */
export function resetYearbooks(): Yearbook[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_YEARBOOKS));
  window.dispatchEvent(new CustomEvent('yearbooks_updated'));
  broadcastSync('YEARBOOKS_UPDATED');
  return INITIAL_YEARBOOKS;
}
