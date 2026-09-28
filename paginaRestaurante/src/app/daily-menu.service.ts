import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface DailyMenu {
  date: string;
  starters: string[];
  mains: string[];
  dessert: string;
  readonly price: '13,50€';
}

const STORAGE_KEY = 'jofemar-daily-menu';

@Injectable({ providedIn: 'root' })
export class DailyMenuService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://elperuanojofemar.onrender.com/api';
  get(): DailyMenu {
    if (typeof localStorage === 'undefined') return this.empty();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...this.empty(), ...saved, starters: saved.starters ?? [saved.starter ?? '', '', ''], mains: saved.mains ?? [saved.main ?? '', '', ''], price: '13,50€' };
    } catch { return this.empty(); }
  }

  save(menu: DailyMenu): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(menu)); }
  loadRemote(): Observable<DailyMenu> { return this.http.get<DailyMenu>(`${this.apiUrl}/daily-menu`).pipe(tap(menu => this.save({ ...menu, price: '13,50€' }))); }
  saveRemote(menu: DailyMenu): Observable<DailyMenu> {
    const token = localStorage.getItem('admin_token');
    return this.http.put<DailyMenu>(`${this.apiUrl}/admin/daily-menu`, { ...menu, price: '13,50€' }, { headers: new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {}) }).pipe(tap(saved => this.save({ ...saved, price: '13,50€' })));
  }

  private empty(): DailyMenu {
    return {
      date: new Date().toISOString().slice(0, 10),
      starters: ['Causa rellena', '', ''],
      mains: ['Seco de pollo', '', ''],
      dessert: 'Arroz con leche',
      price: '13,50€'
    };
  }
}
