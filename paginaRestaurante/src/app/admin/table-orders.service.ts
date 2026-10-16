import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';
export interface TableOrderLine { productId: string; name: string; unitPriceCents: number; quantity: number; notes: string; }
export interface TableOrder {
  _id: string; tableName: string; guests: number; notes: string; lines: TableOrderLine[];
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
  save(draft: TableOrderDraft, order?: TableOrder) {
    const body = { ...draft, lines: draft.lines.map(({ productId, quantity, notes }) => ({ productId, quantity, notes })) };
    return order ? this.http.put<TableOrder>(`${this.url}/${order._id}`, { ...body, revision: order.revision }, this.options())
      : this.http.post<TableOrder>(this.url, body, this.options());
  }
  close(order: TableOrder) { return this.http.post<TableOrder>(`${this.url}/${order._id}/close`, { revision: order.revision }, this.options()); }
}
