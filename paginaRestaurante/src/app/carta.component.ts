import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ConsentService } from './consent/consent.service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenuApiService, ApiMenuItem } from './menu-api.service';
import { publicMenuRequest } from './public-menu-request';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-carta',
  template: `
    <header><a href="/">← El Peruano Jofemar</a><a href="tel:+34606790925">606 790 925</a></header>
    <main>
      <p class="kicker">COCINA PERUANA EN VALENCIA</p>
      <h1>La carta de Jofemar</h1>
      <p>Cocina de nuestra tierra en Calle Marqués de Zenete, 17, bajo izquierda, Valencia.</p>
      <p>Consulta los platos, sus precios y alérgenos. Para reservar, <a href="/#contactanos">contacta con nosotros</a>.</p>
      <p *ngIf="loading()" role="status">Estamos preparando nuestra carta…</p>
      <p *ngIf="error()" role="status">No hemos podido cargar la carta. <button (click)="load()">Volver a intentar</button> o llámanos al 606 790 925.</p>
      <p *ngIf="!loading() && !error() && !groups().length">Consulta por teléfono los platos disponibles.</p>
      <nav aria-label="Categorías de la carta"><a *ngFor="let group of groups(); let i=index" [href]="'#categoria-' + i">{{group.name}}</a></nav>
      <section *ngFor="let group of groups(); let i=index" [id]="'categoria-' + i">
        <h2>{{group.name}}</h2>
        <div class="grid"><article *ngFor="let item of group.items">
          <button *ngIf="item.image" class="photo" (click)="selected.set(item); photoDialog.showModal()" [attr.aria-label]="'Ampliar foto de ' + item.name"><img [src]="image(item.image)" [alt]="item.name" loading="lazy" decoding="async" [style.object-position]="item.imagePosition || '50% 50%'" [style.transform]="'scale(' + (item.imageZoom || 1) + ')'"></button>
          <div class="heading"><h3>{{item.name}}</h3><strong>{{item.price | currency:'EUR':'symbol':'1.2-2'}}</strong></div>
          <p *ngIf="item.subcategory" class="muted">{{item.subcategory}}</p>
          <p *ngIf="item.description">{{item.description}}</p>
          <p *ngIf="item.active === false" class="unavailable">No disponible</p>
          <p class="muted">{{item.allergens.length ? 'Alérgenos: ' + item.allergens.join(', ') : 'No contiene alérgenos conocidos'}}</p>
        </article></div>
      </section>
      <a href="/">Volver a la web del restaurante</a> · <button (click)="consent.preferencesOpen.set(true)">Configurar cookies</button>
    </main>
    <dialog #photoDialog (close)="selected.set(null)">
      <article *ngIf="selected() as item" class="modal">
        <button autofocus (click)="photoDialog.close()" aria-label="Cerrar foto">Cerrar ×</button>
        <img [src]="originalImage(item.image)" [alt]="item.name"><h2>{{item.name}}</h2>
      </article>
    </dialog>`,
  styles: [`
    :host{display:block;background:#fbf7f1;color:#302821;font-family:Inter,sans-serif;min-height:100vh}*{box-sizing:border-box}header{background:#c72c41;color:white;padding:25px max(24px,calc((100% - 1168px)/2));display:flex;justify-content:space-between;gap:20px}a{color:inherit}main{max-width:1200px;margin:auto;padding:64px 24px}h1,h2,h3{font-family:Georgia,serif;font-weight:400}h1{font-size:clamp(38px,6vw,64px);margin:15px 0 25px}h2{font-size:32px}h3{font-size:22px;margin:0}.kicker,.unavailable{color:#b22339}.kicker{font-size:11px;letter-spacing:.15em}p{line-height:1.7}nav{display:flex;gap:18px;flex-wrap:wrap;margin:35px 0}section{scroll-margin-top:20px;margin-bottom:55px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}article{background:#fffaf5;padding:18px;border:1px solid #e5d9cc;border-radius:5px}.heading{display:flex;gap:16px;justify-content:space-between;align-items:baseline;margin-top:18px}strong{white-space:nowrap;font-size:14px}.muted{font-size:12px;color:#75665b}.photo{overflow:hidden;display:block;width:100%;padding:0;border:0;background:transparent;cursor:pointer}.photo img{width:100%;height:230px;object-fit:cover;border-radius:3px}button{font:inherit;cursor:pointer}:where(a,button):focus-visible{outline:3px solid #c59a65;outline-offset:4px}dialog{padding:0;border:0;background:transparent;max-width:95vw}dialog::backdrop{background:#000b}.modal{max-width:700px;max-height:90vh;overflow:auto}.modal img{display:block;max-width:100%;max-height:65vh;object-fit:contain;margin-top:12px}@media(max-width:800px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.grid{grid-template-columns:1fr}header{font-size:13px}main{padding-top:35px}}
  `]
})
export class CartaComponent {
  readonly consent = inject(ConsentService);
  private readonly api = inject(MenuApiService);
  private readonly destroy = inject(DestroyRef);
  private request?: {unsubscribe():void};
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly groups = signal<Array<{name:string;items:ApiMenuItem[]}>>([]);
  readonly selected = signal<ApiMenuItem|null>(null);
  constructor(){ this.load(); }
  load(){
    this.request?.unsubscribe(); this.loading.set(true); this.error.set(false);
    this.request=publicMenuRequest(this.api.getMenu(),()=>{this.error.set(true);this.loading.set(false);}).pipe(takeUntilDestroyed(this.destroy)).subscribe({next:items=>{
      const groups=new Map<string,ApiMenuItem[]>();
      for(const item of items){const list=groups.get(item.category)||[];list.push(item);groups.set(item.category,list);}
      const order=['Primer plato o Entradas','Pescado y Mariscos','Carnes y Pollo','Platos Combinados','Bebidas','Postres'];
      this.groups.set(Array.from(groups,([name,items])=>({name,items})).sort((a,b)=>(order.includes(a.name)?order.indexOf(a.name):99)-(order.includes(b.name)?order.indexOf(b.name):99)));this.loading.set(false);this.error.set(false);
    },error:()=>{this.loading.set(false);this.error.set(true);}});
  }
  originalImage(value?:string){return !value?'':/^(https?:|data:|assets\/)/.test(value)?value:'assets/images/'+value;}
  image(value?:string){const path=this.originalImage(value);const names=['lomo_saltado','ceviche_de_pescado','arroz_con_mariscos','trio_ceviche_huancaina_arroz_pollo','aji_de_gallina','tarta_chocolate'];return names.some(name=>path===`assets/images/${name}.png`)?path.replace('.png','-card.webp'):path;}
}
