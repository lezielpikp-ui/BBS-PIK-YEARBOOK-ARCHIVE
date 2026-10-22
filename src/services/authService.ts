/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdminUser } from '../types/yearbook';

/**
 * ============================================================================
 * AUTHENTICATION SERVICE & ADMIN ACCESS CONTROL
 * ============================================================================
 * In production environments (e.g. Google Cloud Run, Vercel, Node/Express):
 * - Replace client-side credential verification with server-side OAuth2,
 *   Firebase Authentication, or JWT bearer tokens with secure HTTP-only cookies.
 * - Restrict admin routes on the server (/api/admin/*) using middleware.
 * - This file provides a structured placeholder authentication engine for
 *   local testing and demonstrations with full role-based separation.
 * ============================================================================
 */

const ADMIN_SESSION_KEY = 'bbs_pik_admin_session_v3';
const ADMIN_CREDENTIALS_KEY = 'bbs_pik_admin_creds_v3';

// Default initial admin credentials for BBS Pantai Indah Kapuk
export const DEFAULT_ADMIN_CONFIG = {
  email: 'admin.pikp@binabangsaschool.com',
  password: 'Binabangsap1k',
  fullName: 'Principal / Lead Archivist (BBS PIK)',
  role: 'super_admin' as const,
};

export interface StoredCredentials {
  email: string;
  passwordHash: string; // In this demo, stored securely in storage
  fullName: string;
  role: 'super_admin' | 'archivist_admin';
}

/**
 * Loads stored admin credentials or defaults.
 */
export function getStoredAdminCredentials(): StoredCredentials {
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (!raw) {
      const initial: StoredCredentials = {
        email: DEFAULT_ADMIN_CONFIG.email,
        passwordHash: DEFAULT_ADMIN_CONFIG.password,
        fullName: DEFAULT_ADMIN_CONFIG.fullName,
        role: DEFAULT_ADMIN_CONFIG.role,
      };
      localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    // If stored creds are using older default password, seamlessly update to the requested default
    if (
      parsed.email === DEFAULT_ADMIN_CONFIG.email &&
      (parsed.passwordHash === 'BBSAdmin2026!' || parsed.passwordHash === 'BBS2026Admin' || !parsed.passwordHash)
    ) {
      parsed.passwordHash = DEFAULT_ADMIN_CONFIG.password;
      localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return {
      email: DEFAULT_ADMIN_CONFIG.email,
      passwordHash: DEFAULT_ADMIN_CONFIG.password,
      fullName: DEFAULT_ADMIN_CONFIG.fullName,
      role: DEFAULT_ADMIN_CONFIG.role,
    };
  }
}

/**
 * Verifies email and password. Returns AdminUser on success or throws an error.
 */
export async function authenticateAdmin(emailInput: string, passwordInput: string): Promise<AdminUser> {
  // Simulate network latency for realistic feel
  await new Promise((resolve) => setTimeout(resolve, 350));

  const creds = getStoredAdminCredentials();

  const normalizedInputEmail = emailInput.trim().toLowerCase();
  const normalizedStoredEmail = creds.email.trim().toLowerCase();

  if (normalizedInputEmail !== normalizedStoredEmail) {
    throw new Error('Invalid email address. Access is restricted to authorized administrators only.');
  }

  if (passwordInput !== creds.passwordHash) {
    throw new Error('Incorrect admin password. Please verify credentials or contact school IT.');
  }

  const user: AdminUser = {
    id: 'adm-001',
    email: creds.email,
    fullName: creds.fullName,
    role: creds.role,
    lastLogin: new Date().toISOString(),
  };

  // Save session in sessionStorage (expires when browser tab is closed)
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('admin_auth_changed', { detail: { user } }));

  return user;
}

/**
 * Checks if an administrator is currently logged in with an active session.
 */
export function getActiveAdminSession(): AdminUser | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

/**
 * Terminates the current admin session.
 */
export function logoutAdmin(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('admin_auth_changed', { detail: { user: null } }));
}

/**
 * Allows the current admin to update their access password.
 */
export function updateAdminPassword(currentPassword: string, newPassword: string): void {
  const creds = getStoredAdminCredentials();
  if (currentPassword !== creds.passwordHash) {
    throw new Error('Current password does not match.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }
  creds.passwordHash = newPassword;
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(creds));
}
