import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AdminLiveService } from './admin-live.service';
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
  private url = 'https://axwxlsai9xocqzi5jvnbebks.2.31.73.77.sslip.io/api/admin/table-orders';
  private options() { return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.token() ?? ''}` }) }; }
  list(status: 'open' | 'closed') { return this.http.get<TableOrder[]>(`${this.url}?status=${status}`, this.options()); }
  private live = inject(AdminLiveService);
  changes() { return this.live.changes(this.url); }
  save(draft: TableOrderDraft, order?: TableOrder) {
    const body = { ...draft, lines: draft.lines.map(({ productId, quantity, notes }) => ({ productId, quantity, notes })) };
    return order ? this.http.put<TableOrder>(`${this.url}/${order._id}`, { ...body, revision: order.revision }, this.options())
      : this.http.post<TableOrder>(this.url, body, this.options());
  }
  close(order: TableOrder, payment?: {method:'cash'|'card'|'mixed';tendered:number;cash:number}) { return this.http.post<TableOrder>(`${this.url}/${order._id}/checkout`, { revision: order.revision, payment }, this.options()); }
}
