// Universal polyfills for PDF.js 6+ compatibility across Vercel & modern browsers
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: (...args: unknown[]) => unknown, ...args: unknown[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (!(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
  };
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
