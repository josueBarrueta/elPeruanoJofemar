import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
export interface TableOrderLine { productId: string; name: string; unitPriceCents: number; quantity: number; notes: string; taxRate?: number | null; }
export interface TableOrder {
  _id: string; tableName: string; guests: number; notes: string; lines: TableOrderLine[];
  payment?: {method:'cash'|'card'|'mixed';cashCents:number;cardCents:number;tenderedCents:number;changeCents:number;paidAt:string};
  totalCents: number; status: 'open' | 'closed'; revision: number; createdAt: string; closedAt?: string;
}
export interface TableOrderDraft { tableName: string; guests: number; notes: string; lines: TableOrderLine[]; }
@Injectable({ providedIn: 'root' })
export class TableOrdersService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private url = 'https://elperuanojofemar.onrender.com/api/admin/table-orders';
  private options() { return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.token() ?? ''}` }) }; }
  list(status: 'open' | 'closed') { return this.http.get<TableOrder[]>(`${this.url}?status=${status}`, this.options()); }
  changes() {
    return new Observable<'changed' | 'offline'>(subscriber => {
      let stopped = false;
      let controller: AbortController | undefined;
      let retry: ReturnType<typeof setTimeout> | undefined;
      let watchdog: ReturnType<typeof setTimeout> | undefined;
      let delay = 1000;
      const connect = async () => {
        controller = new AbortController();
        const watch = () => {
          clearTimeout(watchdog);
          watchdog = setTimeout(() => controller?.abort(), 45000);
        };
        watch();
        try {
          const response = await fetch(`${this.url}/events`, {
            headers: { Authorization: `Bearer ${this.auth.token() ?? ''}` }, signal: controller.signal
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
            buffer += decoder.decode(value, { stream: true });
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
      void connect();
      return () => { stopped = true; clearTimeout(retry); clearTimeout(watchdog); controller?.abort(); };
    });
  }
  save(draft: TableOrderDraft, order?: TableOrder) {
    const body = { ...draft, lines: draft.lines.map(({ productId, quantity, notes }) => ({ productId, quantity, notes })) };
    return order ? this.http.put<TableOrder>(`${this.url}/${order._id}`, { ...body, revision: order.revision }, this.options())
      : this.http.post<TableOrder>(this.url, body, this.options());
  }
  close(order: TableOrder, payment?: {method:'cash'|'card'|'mixed';tendered:number;cash:number}) { return this.http.post<TableOrder>(`${this.url}/${order._id}/checkout`, { revision: order.revision, payment }, this.options()); }
}
