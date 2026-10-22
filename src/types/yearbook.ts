/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface YearbookSamplePage {
  pageNumber: number;
  section: string;
  title: string;
  content: string;
  photoUrl?: string;
}

export interface Yearbook {
  id: string;
  year: string;            // e.g., "2024–2025" or "2025"
  startYear: number;       // For numeric sorting (e.g. 2024)
  endYear?: number;        // e.g. 2025
  title: string;           // e.g., "Golden Horizons"
  description: string;     // e.g., "Celebrating 50 years of excellence..."
  theme?: string;          // e.g., "Jubilee & Legacy"
  coverImageUrl: string;   // Image URL or Data URL
  fileUrl: string;         // PDF URL or Data URL
  fileName: string;        // e.g., "Oakridge_Academy_2024-2025.pdf"
  fileSize: string;        // e.g., "38.4 MB"
  fileSizeBytes?: number;  // Numeric bytes
  pageCount: number;       // e.g., 184
  dateUploaded: string;    // ISO timestamp
  tags: string[];          // e.g. ["Seniors", "Athletics", "Arts"]
  featured?: boolean;
  samplePages?: YearbookSamplePage[];
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'archivist_admin';
  lastLogin: string;
}

export type SortOption = 'year-desc' | 'year-asc' | 'title-asc' | 'pages-desc';
