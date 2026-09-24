import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ApiMenuItem {
  _id?: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  allergens: string[];
  image?: string;
  description?: string;
  order: number;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuApiService {
  private readonly apiUrl = 'https://elperuanojofemar.onrender.com/api';
  private readonly http = inject(HttpClient);
  private adminOptions() { const token = localStorage.getItem('admin_token'); return { headers: new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {}) }; }

  getMenu(): Observable<ApiMenuItem[]> {
    return this.http.get<ApiMenuItem[]>(`${this.apiUrl}/menu`);
  }

  getAdminMenu(): Observable<ApiMenuItem[]> {
    return this.http.get<ApiMenuItem[]>(`${this.apiUrl}/admin/menu`, this.adminOptions());
  }

  createItem(item: Omit<ApiMenuItem, '_id'>): Observable<ApiMenuItem> {
    return this.http.post<ApiMenuItem>(`${this.apiUrl}/admin/menu`, item, this.adminOptions());
  }

  updateItem(id: string, item: Partial<ApiMenuItem>): Observable<ApiMenuItem> {
    return this.http.patch<ApiMenuItem>(`${this.apiUrl}/admin/menu/${id}`, item, this.adminOptions());
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/menu/${id}`, this.adminOptions());
  }
}
