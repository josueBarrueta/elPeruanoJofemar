import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyMenu, DailyMenuService } from './daily-menu.service';
import { MenuApiService } from './menu-api.service';

@Component({
  selector: 'app-daily-menu-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<main class="daily-admin"><a class="back-link" href="#/">← Volver a la web</a><section class="daily-card"><span class="eyebrow">Edición local</span><h1>Menú del día</h1><p class="intro">La fecha se actualiza automáticamente. Escribe las opciones desde el móvil y pulsa guardar.</p><form (ngSubmit)="save()"><p class="today">Fecha de hoy: <strong>{{ menu.date | date:'d MMMM y' }}</strong></p><h2>Primeros a elegir</h2><label *ngFor="let item of menu.starters; let i = index; trackBy: trackByIndex">Primero {{ i + 1 }}<input [name]="'starter' + i" [(ngModel)]="menu.starters[i]" (focus)="setSuggestionField('starter' + i)" required><div class="suggestions" *ngIf="suggestionField === 'starter' + i"><button type="button" *ngFor="let option of suggestions(menu.starters[i])" (click)="choose('starter', i, option)">{{ option }}</button></div></label><h2>Segundos a elegir</h2><label *ngFor="let item of menu.mains; let i = index; trackBy: trackByIndex">Segundo {{ i + 1 }}<input [name]="'main' + i" [(ngModel)]="menu.mains[i]" (focus)="setSuggestionField('main' + i)" required><div class="suggestions" *ngIf="suggestionField === 'main' + i"><button type="button" *ngFor="let option of suggestions(menu.mains[i])" (click)="choose('main', i, option)">{{ option }}</button></div></label><label>Postre<input name="dessert" [(ngModel)]="menu.dessert" (focus)="setSuggestionField('dessert')"><div class="suggestions" *ngIf="suggestionField === 'dessert'"><button type="button" *ngFor="let option of suggestions(menu.dessert)" (click)="choose('dessert', 0, option)">{{ option }}</button></div></label><p class="fixed-price">Precio del menú: <strong>13,50€</strong></p><button type="submit">Guardar menú</button></form><p class="saved" *ngIf="saved">Menú guardado en este dispositivo.</p></section></main>`,
  styles: [' :host{display:block;min-height:100vh;background:#c72c41;padding:1rem;box-sizing:border-box}.daily-admin{max-width:34rem;margin:0 auto;padding-top:1rem}.back-link{color:#fff;text-decoration:none;font-weight:700}.daily-card{margin-top:2rem;padding:clamp(1.25rem,5vw,2.5rem);border-radius:1.25rem;background:#fff;color:#302a27;box-shadow:0 1rem 3rem #76142844}.eyebrow{color:#b1283f;text-transform:uppercase;letter-spacing:.12em;font-size:.75rem;font-weight:800}h1{margin:.4rem 0;font:700 clamp(2rem,8vw,3rem) Georgia,serif;color:#b1283f}.intro{color:#746963;line-height:1.5}.today,.fixed-price{padding:.8rem 1rem;border-radius:.7rem;background:#fff1ec;color:#5c514a}h2{margin:1.5rem 0 .4rem;color:#b1283f;font-size:1.05rem}label{position:relative;display:grid;gap:.4rem;margin-top:1rem;color:#5c514a;font-weight:700}input{box-sizing:border-box;width:100%;padding:.8rem;border:1px solid #dfd3cc;border-radius:.7rem;font:inherit}.suggestions{display:grid;gap:.25rem}.suggestions button{width:100%;margin:0;padding:.55rem .7rem;border:1px solid #ead5d0;border-radius:.5rem;background:#fff8f5;color:#5c514a;text-align:left;font:inherit;font-size:.9rem;cursor:pointer}.suggestions button:hover{background:#f8e4df;color:#b1283f}form>button{width:100%;margin-top:1.4rem;padding:.9rem;border:0;border-radius:.7rem;background:#b1283f;color:#fff;font:inherit;font-weight:800;cursor:pointer}.saved{margin:1rem 0 0;color:#24724b;font-weight:700}']
})
export class DailyMenuAdminComponent {
  private readonly service = inject(DailyMenuService);
  private readonly menuApi = inject(MenuApiService);
  menu: DailyMenu = this.service.get();
  menuOptions: string[] = [];
  suggestionField = '';
  saved = false;
  constructor() { this.menuApi.getMenu().subscribe({ next: items => this.menuOptions = items.map(item => item.name).filter(Boolean).sort(), error: () => this.menuOptions = [] }); }
  setSuggestionField(field: string): void { this.suggestionField = field; }
  trackByIndex(index: number): number { return index; }
  suggestions(value: string): string[] { const query = value.trim().toLocaleLowerCase(); return query ? this.menuOptions.filter(option => option.toLocaleLowerCase().includes(query)).slice(0, 6) : []; }
  choose(type: 'starter' | 'main' | 'dessert', index: number, value: string): void { if (type === 'starter') this.menu.starters[index] = value; else if (type === 'main') this.menu.mains[index] = value; else this.menu.dessert = value; this.suggestionField = ''; }
  save(): void { this.service.save(this.menu); this.saved = true; }
}
