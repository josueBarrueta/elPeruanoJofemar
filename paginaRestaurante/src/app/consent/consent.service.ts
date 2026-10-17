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
  private readonly referrer = this.safeReferrer();

  constructor() {
    // A second tab may withdraw consent while this tab is measuring.
    window.addEventListener('storage', event => {
      if (event.key === CONSENT_KEY || event.key === null) {
        this.choice.set(this.read());
        if (this.loaded) this.stop();
      }
    });
  }

  private safeReferrer(): string {
    try {
      const url = new URL(document.referrer);
      return ['http:', 'https:'].includes(url.protocol) && url.hostname !== window.location.hostname ? url.origin + '/' : '';
    } catch { return ''; }
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
    this.path = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    // Development previews must not contaminate the restaurant's production reports.
    if (!['elperuanojofemar.com', 'www.elperuanojofemar.com'].includes(window.location.hostname)) return;
    // Only the public homepage is measured. Never load tags in administration.
    if (this.path !== '/') {
      if (this.loaded) this.stop();
      return;
    }
    if (this.choice() !== true) return;
    // Consent expires during long visits too.
    if (!this.sessionChoice && this.read() !== true) {
      this.choice.set(this.read());
      this.clearCookies();
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
        page_location: `https://elperuanojofemar.com${this.path}`, page_referrer: this.referrer,
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
      page_title: 'El Peruano Jofemar',
      page_referrer: this.referrer,
    });
  }

  trackContact(method: 'whatsapp' | 'phone'): void {
    if (!this.loaded || this.choice() !== true || this.path !== '/') return;
    if (!this.sessionChoice && this.read() !== true) {
      this.choice.set(this.read());
      this.clearCookies();
      this.stop();
      return;
    }
    // Send only the contact method and a clean public URL, never phone numbers or message text.
    (window as AnalyticsWindow).gtag?.('event', method === 'whatsapp' ? 'click_whatsapp' : 'click_phone', {
      contact_method: method,
      page_location: `https://elperuanojofemar.com${this.path}`,
      page_referrer: this.referrer,
      transport_type: 'beacon',
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
