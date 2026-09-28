import { Injectable } from '@angular/core';

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
  get(): DailyMenu {
    if (typeof localStorage === 'undefined') return this.empty();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...this.empty(), ...saved, starters: saved.starters ?? [saved.starter ?? '', '', ''], mains: saved.mains ?? [saved.main ?? '', '', ''], price: '13,50€' };
    } catch { return this.empty(); }
  }

  save(menu: DailyMenu): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(menu)); }

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
