import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocumentPreviewService } from './document-preview.service';
@Component({
  selector: 'app-document-preview', standalone: true,
  template: `<dialog #dialog (cancel)="close()" aria-labelledby="document-title"><header><h2 id="document-title">{{ title }}</h2><div><button type="button" [disabled]="!loaded" (click)="print()">Imprimir / Guardar PDF</button><button type="button" (click)="close()">Cerrar</button></div></header><p>Recibo: papel de 80 mm. Factura e informe: A4. Al imprimir, usa escala 100 % y desactiva los encabezados del navegador.</p><iframe #frame [srcdoc]="html" sandbox="allow-same-origin allow-modals" [title]="title" (load)="loaded = true"></iframe></dialog>`,
  styles: [`dialog{width:min(1150px,calc(100vw - 1rem));height:95dvh;max-height:95dvh;border:1px solid #ddd;border-radius:16px;padding:1rem;color:#302b28}dialog::backdrop{background:#0008}header{display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap}h2{font-size:1.1rem;margin:0;overflow-wrap:anywhere}header div{display:flex;gap:.5rem}button{min-height:48px;border:0;border-radius:8px;padding:.7rem 1rem;font:inherit;cursor:pointer}button:first-child{background:#b1283f;color:white}button:disabled{opacity:.5}p{font:12px/1.5 Arial;color:#756d67}iframe{width:100%;height:calc(100% - 125px);border:1px solid #ddd;background:#eee}@media(max-width:600px){iframe{height:calc(100% - 180px)}}`]
})
export class DocumentPreviewComponent {
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('frame') frame?: ElementRef<HTMLIFrameElement>;
  private api = inject(DocumentPreviewService);
  private sanitizer = inject(DomSanitizer);
  html: SafeHtml = ''; title = ''; loaded = false;
  constructor() { effect(() => {
    const doc = this.api.preview();
    if (!doc) { this.dialog?.nativeElement.close(); return; }
    this.title = doc.title; this.loaded = false;
    // Se confía únicamente en HTML generado aquí con todos los datos escapados.
    this.html = this.sanitizer.bypassSecurityTrustHtml(doc.html);
    queueMicrotask(() => { const dialog = this.dialog?.nativeElement; if (this.api.preview() === doc && dialog?.isConnected && !dialog.open) dialog.showModal(); });
  }); }
  close() { this.api.preview.set(null); }
  async print() {
    const win = this.frame?.nativeElement.contentWindow;
    if (!win) return;
    const images = [...(win.document.images ?? [])];
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    win.focus(); win.print();
  }
}
