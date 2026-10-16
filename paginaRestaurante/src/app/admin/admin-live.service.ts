import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable({ providedIn: 'root' })
export class AdminLiveService {
  private auth = inject(AuthService);
  changes(url: string) {
    return new Observable<'changed' | 'offline'>(subscriber => {
      let stopped = false;
      let controller: AbortController | undefined;
      let retry: ReturnType<typeof setTimeout> | undefined;
      let watchdog: ReturnType<typeof setTimeout> | undefined;
      let delay = 1000;
      const connect = async () => {
        if (stopped) return;
        retry = undefined;
        controller = new AbortController();
        const watch = () => {
          clearTimeout(watchdog);
          watchdog = setTimeout(() => controller?.abort(), 45000);
        };
        watch();
        try {
          const response = await fetch(`${url}/events`, {
            cache: 'no-store', headers: { Authorization: `Bearer ${this.auth.token() ?? ''}` }, signal: controller.signal
          });
          if (!response.ok || !response.body) {
            // A normal API call handles expired/revoked sessions through the interceptor.
            if (response.status === 401) subscriber.next('changed');
            throw new Error('Stream unavailable');
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!stopped) {
            const { value, done } = await reader.read();
            if (done) break;
            watch(); delay = 1000;
            buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');
            let boundary: number;
            while ((boundary = buffer.indexOf('\n\n')) >= 0) {
              const event = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
              if (event.startsWith('event: tables\n')) subscriber.next('changed');
            }
          }
        } catch { /* Reconnect after outages without clearing the session. */ }
        finally {
          clearTimeout(watchdog);
          controller.abort();
          if (!stopped) {
            subscriber.next('offline');
            retry = setTimeout(connect, delay);
            delay = Math.min(delay * 2, 30000);
          }
        }
      };
      const resume = () => {
        if (document.visibilityState === 'hidden' || stopped) return;
        // Mobile browsers may silently suspend a stream in the background.
        subscriber.next('changed');
        if (retry) { clearTimeout(retry); retry = undefined; void connect(); }
        else controller?.abort();
      };
      window.addEventListener('online', resume);
      document.addEventListener('visibilitychange', resume);
      void connect();
      return () => {
        stopped = true; clearTimeout(retry); clearTimeout(watchdog); controller?.abort();
        window.removeEventListener('online', resume);
        document.removeEventListener('visibilitychange', resume);
      };
    });
  }
}
