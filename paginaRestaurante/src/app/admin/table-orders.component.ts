import { Component, Input, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiMenuItem } from '../menu-api.service';
import { FinanceService } from './finance.service';
import { DocumentPreviewService } from './document-preview.service';
import { TableOrder, TableOrderDraft, TableOrderLine, TableOrdersService } from './table-orders.service';
@Component({
  selector: 'app-table-orders', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './table-orders.component.html', styleUrls: ['./table-orders.component.scss']
})
export class TableOrdersComponent {
  @Input() menu: ApiMenuItem[] = [];
  @ViewChild('editor') editor?: ElementRef<HTMLDialogElement>;
  @ViewChild('closeDialog') closeDialog?: ElementRef<HTMLDialogElement>;
  private api = inject(TableOrdersService);
  private finance = inject(FinanceService);
  private documents = inject(DocumentPreviewService);
  private changes = inject(ChangeDetectorRef);
  readonly tableNames = ['Entrada', 'Banderas', 'Tumi', 'Cuadros', 'Loro', 'Araña', 'Espejo', 'Machupichu', 'Enchufe', 'Medio dentro', 'Aire', 'Pasillo 1', 'Pasillo 2', 'Terraza 1', 'Terraza 2', 'Terraza 3', 'Terraza 4'];
  editorTab: 'products' | 'order' = 'products';
  addedMessage = '';
  pickingTable = false;
  orders: TableOrder[] = [];
  view: 'open' | 'closed' = 'open';
  loading = false;
  saving = false;
  error = '';
  formError = '';
  closeError = '';
  message = '';
  productPage = 0;
  query = '';
  category = '';
  selected?: TableOrder;
  closing?: TableOrder;
  private original = '';
  private returnFocus?: HTMLElement;
  draft: TableOrderDraft = this.empty();
  constructor() { this.load(); }
  private empty(): TableOrderDraft { return { tableName: '', guests: 2, notes: '', lines: [] }; }
  get readonly() { return this.selected?.status === 'closed'; }
  get categories() { return [...new Set(this.menu.filter(item => item.active !== false).map(item => item.category))]; }
  get products() {
    const search = this.query.trim().toLocaleLowerCase('es');
    return this.menu.filter(item => item._id && item.active !== false && (!this.category || item.category === this.category) && (!search || item.name.toLocaleLowerCase('es').includes(search)));
  }
  get pageSize() {
    if (window.innerWidth < 900) return window.innerHeight < 800 ? 2 : 4;
    return window.innerHeight < 850 ? 4 : 8;
  }
  get productPages() { return Math.max(1, Math.ceil(this.products.length / this.pageSize)); }
  get visibleProducts() {
    const page = Math.min(this.productPage, this.productPages - 1);
    return this.products.slice(page * this.pageSize, (page + 1) * this.pageSize);
  }
  get currentProductPage() { return Math.min(this.productPage, this.productPages - 1); }
  get totalCents() { return this.draft.lines.reduce((total, line) => total + line.unitPriceCents * (Number(line.quantity) || 0), 0); }
  get guests() { return this.orders.reduce((total, order) => total + order.guests, 0); }
  changeView(view: 'open' | 'closed') { if (this.loading || this.saving) return; this.view = view; this.load(); }
  load() {
    this.loading = true; this.error = '';
    this.api.list(this.view).subscribe({
      next: orders => { this.orders = orders; this.loading = false; this.changes.markForCheck(); },
      error: () => { this.error = 'No se pudieron cargar las mesas. Comprueba la conexión y vuelve a intentarlo.'; this.loading = false; this.changes.markForCheck(); }
    });
  }
  orderFor(name: string) { return this.orders.find(order => order.tableName === name && order.status === 'open'); }
  get legacyOrders() { return this.orders.filter(order => !this.tableNames.includes(order.tableName)); }
  chooseTable(name: string) { this.open(this.orderFor(name), name); }
  tableOccupied(name: string) { return this.orders.some(order => order.status === 'open' && order.tableName === name && order._id !== this.selected?._id); }
  quantityFor(id?: string) { return this.draft.lines.find(line => line.productId === id)?.quantity || 0; }
  adjustGuests(delta: number) { this.draft.guests = Math.min(1000, Math.max(1, (Number(this.draft.guests) || 1) + delta)); }
  open(order?: TableOrder, tableName = '') {
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.selected = order;
    this.draft = order ? { tableName: order.tableName, guests: order.guests, notes: order.notes, lines: order.lines.map(line => ({ ...line })) } : { ...this.empty(), tableName };
    this.pickingTable = !order && !tableName;
    this.editorTab = order?.lines.length ? 'order' : 'products'; this.addedMessage = '';
    this.productPage = 0;
    this.original = JSON.stringify(this.draft); this.query = ''; this.category = ''; this.formError = ''; this.message = '';
    this.editor?.nativeElement.showModal();
  }
  dismiss(event?: Event) {
    event?.preventDefault();
    if (this.saving) return;
    if (!this.readonly && this.original !== JSON.stringify(this.draft) && !window.confirm('¿Descartar los cambios sin guardar de esta comanda?')) return;
    this.editor?.nativeElement.close();
  }
  restoreFocus() { this.returnFocus?.focus(); }
  add(item: ApiMenuItem) {
    if (!item._id) return;
    this.addedMessage = item.name + ' añadido a la comanda.';
    const line = this.draft.lines.find(line => line.productId === item._id);
    if (line) { if (line.quantity < 1000) line.quantity++; }
    else if (this.draft.lines.length < 100) this.draft.lines.push({ productId: item._id, name: item.name, unitPriceCents: Math.round(item.price * 100), quantity: 1, notes: '' });
  }
  subtract(item: ApiMenuItem) {
    const index = this.draft.lines.findIndex(line => line.productId === item._id);
    if (index < 0) return;
    if (this.draft.lines[index].quantity > 1) this.draft.lines[index].quantity--;
    else this.draft.lines.splice(index, 1);
    this.addedMessage = item.name + ': ' + this.quantityFor(item._id) + ' unidades en la comanda.';
  }
  adjust(line: TableOrderLine, delta: number) { line.quantity = Math.min(1000, Math.max(1, (Number(line.quantity) || 1) + delta)); }
  remove(index: number) { this.draft.lines.splice(index, 1); }
  save() {
    if (this.saving || this.readonly) return;
    this.saving = true; this.formError = '';
    this.api.save(this.draft, this.selected).subscribe({
      next: () => { this.saving = false; this.editor?.nativeElement.close(); this.view = 'open'; this.message = 'Comanda guardada correctamente.'; this.load(); },
      error: response => { this.saving = false; this.formError = response.error?.message || 'No se pudo guardar. Tus cambios siguen en el formulario.'; this.changes.markForCheck(); }
    });
  }
  showReceipt(order: TableOrder) {
    this.finance.settings().subscribe({
      next: settings => { this.documents.receipt(order, settings); this.changes.markForCheck(); },
      error: () => { this.error = 'No se pudieron cargar los datos del restaurante para el recibo.'; this.changes.markForCheck(); }
    });
  }
  askClose(order: TableOrder) {
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.closing = order; this.closeError = ''; this.closeDialog?.nativeElement.showModal();
  }
  cancelClose(event?: Event) { event?.preventDefault(); if (!this.saving) this.closeDialog?.nativeElement.close(); }
  confirmClose() {
    if (this.saving || !this.closing) return;
    this.saving = true; this.closeError = '';
    this.api.close(this.closing).subscribe({
      next: () => { this.saving = false; this.closeDialog?.nativeElement.close(); this.message = 'Mesa cerrada. La comanda está en el historial.'; this.load(); },
      error: response => { this.saving = false; this.closeError = response.error?.message || 'No se pudo cerrar la mesa. Vuelve a intentarlo.'; this.changes.markForCheck(); }
    });
  }
}
