import { Injectable, signal } from '@angular/core';

export const CONSENT_KEY = 'jofemar-consent-v1';
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
const MEASUREMENT_ID = 'G-XE4YF2K141';
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

@Injectable({ providedIn: 'root' })
export class ConsentService {
  readonly preferencesOpen = signal(false);
  readonly choice = signal<boolean | null>(this.read());
  private loaded = false;
  private sessionChoice = false;
  private path = '';
  private lastPage = '';

  constructor() {
    // A second tab may withdraw consent while this tab is measuring.
    window.addEventListener('storage', event => {
      if (event.key === CONSENT_KEY || event.key === null) {
        this.choice.set(this.read());
        if (this.loaded) this.stop();
      }
    });
  }

  private read(): boolean | null {
    try {
      const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
      const age = Date.now() - value?.savedAt;
      return typeof value?.analytics === 'boolean' && age >= 0 && age < MAX_AGE ? value.analytics : null;
    } catch { return null; }
  }

  save(analytics: boolean): void {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics, savedAt: Date.now() })); this.sessionChoice = false; } catch { this.sessionChoice = true; }
    this.choice.set(analytics);
    if (!analytics) {
      this.clearCookies();
      if (this.loaded) this.stop();
    } else this.page(this.path);
  }

  page(path: string): void {
    this.path = path.split(/[?#]/)[0];
    // Only these two public screens are measured. Never load tags in administration.
    if (!['/', '/resenas'].includes(this.path)) {
      if (this.loaded) this.stop();
      return;
    }
    if (this.choice() !== true) return;
    // Consent expires during long visits too.
    if (!this.sessionChoice && this.read() === null) {
      this.choice.set(null);
      if (this.loaded) this.stop();
      return;
    }
    const win = window as AnalyticsWindow;
    if (!this.loaded) {
      this.loaded = true;
      win.dataLayer = win.dataLayer || [];
      win.gtag = function () { win.dataLayer!.push(arguments); };
      win.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      win.gtag('consent', 'update', { analytics_storage: 'granted' });
      win.gtag('js', new Date());
      win.gtag('config', MEASUREMENT_ID, {
        send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_expires: 60 * 60 * 24 * 180, cookie_update: false,
        page_location: `https://elperuanojofemar.com${this.path}`, page_referrer: '',
      });
      const script = document.createElement('script');
      script.id = 'jofemar-analytics';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }
    if (this.lastPage === this.path) return;
    this.lastPage = this.path;
    win.gtag?.('event', 'page_view', {
      page_location: `https://elperuanojofemar.com${this.path}`,
      page_title: this.path === '/' ? 'El Peruano Jofemar' : 'Opiniones | El Peruano Jofemar',
      page_referrer: '',
    });
  }

  private stop(): void {
    // Unload Google's runtime as well as its script element; no cookieless pings after withdrawal.
    (window as unknown as Record<string, unknown>)[`ga-disable-${MEASUREMENT_ID}`] = true;
    document.getElementById('jofemar-analytics')?.remove();
    window.location.reload();
  }

  private clearCookies(): void {
    const host = window.location.hostname.split('.');
    const domains = ['', ...host.map((_, index) => host.slice(index).join('.'))];
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (name !== '_ga' && !name.startsWith('_ga_')) continue;
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ''} SameSite=Lax`;
      }
    }
  }
}
