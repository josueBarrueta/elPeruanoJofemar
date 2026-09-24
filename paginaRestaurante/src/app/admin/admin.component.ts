import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiMenuItem, MenuApiService } from '../menu-api.service';

type EditableItem = Omit<ApiMenuItem, '_id'> & { _id?: string };

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent {
  private readonly api = inject(MenuApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  items: ApiMenuItem[] = [];
  selected: EditableItem = this.emptyItem();
  isEditing = false;
  status = 'Cargando carta…';
  orderingMode = false;
  orderDirty = false;
  showOrderExitModal = false;
  draggedItem?: ApiMenuItem;
  dropTarget?: ApiMenuItem;
  openCategories = new Set<string>();
  itemToDelete?: ApiMenuItem;

  get categoryOptions(): string[] {
    return [...new Set(this.items.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  toggleCategory(category: string): void {
    if (this.openCategories.has(category)) this.openCategories.delete(category);
    else this.openCategories.add(category);
    this.changeDetector.markForCheck();
  }

  toggleOrderingMode(): void {
    if (!this.orderingMode) {
      this.orderingMode = true;
      return;
    }
    this.cancelOrdering();
  }

  cancelOrdering(): void {
    this.showOrderExitModal = false;
    this.draggedItem = undefined;
    this.dropTarget = undefined;
    this.orderingMode = false;
    if (this.orderDirty) {
      this.orderDirty = false;
      this.status = 'Cambios de orden cancelados';
      this.loadItems();
    }
  }

  discardOrderChanges(): void {
    this.showOrderExitModal = false;
    this.orderingMode = false;
    this.orderDirty = false;
    this.loadItems();
  }

  continueOrdering(): void { this.showOrderExitModal = false; }

  get subcategoryOptions(): string[] {
    const values = this.items
      .filter((item) => !this.selected.category || item.category === this.selected.category)
      .map((item) => item.subcategory)
      .filter((subcategory): subcategory is string => Boolean(subcategory));
    if (this.selected.subcategory && !values.includes(this.selected.subcategory)) values.push(this.selected.subcategory);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }

  get allergenOptions(): string[] {
    const pageAllergens = ['Pescado', 'Apio', 'Huevos', 'FrutosSecos', 'Lacteos', 'Cacahuetes', 'Soja', 'Crustaceos', 'Moluscos', 'Gluten', 'Mostaza', 'Sulfitos', 'Sésamo', 'Altramuces'];
    return [...new Set([...pageAllergens, ...this.items.flatMap((item) => item.allergens || [])])].sort((a, b) => a.localeCompare(b));
  }

  toggleAllergen(allergen: string, checked: boolean): void {
    const current = new Set(this.selected.allergens);
    if (checked) current.add(allergen);
    else current.delete(allergen);
    this.selected.allergens = [...current];
  }

  get groupedItems(): { category: string; subcategories: { name: string; items: ApiMenuItem[] }[] }[] {
    const categories = new Map<string, Map<string, ApiMenuItem[]>>();
    for (const item of this.items) {
      if (!categories.has(item.category)) categories.set(item.category, new Map());
      const subcategories = categories.get(item.category)!;
      const subcategory = item.subcategory || 'General';
      if (!subcategories.has(subcategory)) subcategories.set(subcategory, []);
      subcategories.get(subcategory)!.push(item);
    }
    return [...categories.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([category, subcategories]) => ({
      category,
      subcategories: [...subcategories.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => ({ name, items }))
    }));
  }

  constructor() {
    this.loadItems();
  }

  loadItems(): void {
    this.api.getAdminMenu().subscribe({
      next: (items) => { this.items = items; this.status = `${items.length} productos cargados desde MongoDB`; this.changeDetector.markForCheck(); },
      error: () => { this.status = 'No se pudo cargar la carta'; this.changeDetector.markForCheck(); }
    });
  }

  newItem(): void { this.selected = { ...this.emptyItem(), order: this.items.length ? Math.max(...this.items.map((item) => item.order)) + 1 : 0 }; this.isEditing = false; }

  edit(item: ApiMenuItem): void {
    this.selected = { ...item, allergens: [...item.allergens] };
    this.isEditing = true;
  }

  save(): void {
    const request = this.isEditing && this.selected._id
      ? this.api.updateItem(this.selected._id, this.selected)
      : this.api.createItem(this.selected);
    request.subscribe({
      next: () => { this.status = 'Guardado correctamente en MongoDB'; this.loadItems(); this.newItem(); },
      error: () => { this.status = 'No se pudo guardar el producto'; }
    });
  }


  toggleActive(item: ApiMenuItem): void {
    if (!item._id) return;
    const active = item.active === false;
    this.api.updateItem(item._id, { active }).subscribe({
      next: () => { this.status = `${item.name} ${active ? 'activado' : 'desactivado'}`; this.loadItems(); },
      error: () => { this.status = 'No se pudo cambiar la visibilidad del producto'; }
    });
  }

  askDelete(item: ApiMenuItem): void { this.itemToDelete = item; }

  cancelDelete(): void { this.itemToDelete = undefined; }

  confirmDelete(): void {
    const item = this.itemToDelete;
    if (!item?._id) return;
    this.api.deleteItem(item._id).subscribe({
      next: () => { this.itemToDelete = undefined; this.status = `${item.name} eliminado`; if (this.selected._id === item._id) this.newItem(); this.loadItems(); },
      error: () => { this.itemToDelete = undefined; this.status = 'No se pudo borrar el producto'; }
    });
  }

  setAllergens(value: string): void {
    this.selected.allergens = value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  deactivate(item: ApiMenuItem): void {
    if (!item._id) return;
    this.api.updateItem(item._id, { active: false }).subscribe({
      next: () => { this.status = `${item.name} desactivado`; this.loadItems(); },
      error: () => { this.status = 'No se pudo desactivar el producto'; }
    });
  }

  startDragging(item: ApiMenuItem, event?: PointerEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.draggedItem = item;
    this.dropTarget = undefined;
    this.changeDetector.markForCheck();
  }

  handlePointerMove(event: PointerEvent, item: ApiMenuItem): void {
    if (!this.draggedItem) return;
    event.preventDefault();
    event.stopPropagation();
    this.setDropTarget(item);
  }

  handlePointerUp(event: PointerEvent, item: ApiMenuItem): void {
    event.preventDefault();
    event.stopPropagation();
    this.dropItem(item);
  }

  setDropTarget(item: ApiMenuItem): void {
    if (this.draggedItem && this.draggedItem !== item && this.draggedItem.category === item.category && this.draggedItem.subcategory === item.subcategory) {
      this.dropTarget = item;
      this.changeDetector.markForCheck();
    }
  }


  dropItem(target: ApiMenuItem): void {
    if (!this.draggedItem) return;
    if (this.draggedItem === target || this.draggedItem.category !== target.category || this.draggedItem.subcategory !== target.subcategory) {
      this.draggedItem = undefined;
      this.dropTarget = undefined;
      this.changeDetector.markForCheck();
      return;
    }
    const sourceIndex = this.items.indexOf(this.draggedItem);
    const targetIndex = this.items.indexOf(target);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const reordered = [...this.items];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(sourceIndex < targetIndex ? targetIndex : targetIndex, 0, moved);
    this.items = reordered;
    this.draggedItem = undefined;
    this.dropTarget = undefined;
    this.status = 'Orden cambiado en pantalla. Pulsa «Guardar orden» para conservarlo';
    this.orderDirty = true;
    this.changeDetector.markForCheck();
  }

  moveItem(item: ApiMenuItem, direction: -1 | 1): void {
    const sameGroup = this.items.filter((entry) => entry.category === item.category && entry.subcategory === item.subcategory);
    const currentIndex = sameGroup.indexOf(item);
    const target = sameGroup[currentIndex + direction];
    if (target) {
      this.draggedItem = item;
      this.dropItem(target);
    }
  }

  saveOrder(): void {
    const requests = this.items.filter((item) => item._id).map((item, index) => this.api.updateItem(item._id!, { order: index }));
    forkJoin(requests).subscribe({
      next: () => { this.orderingMode = false; this.orderDirty = false; this.showOrderExitModal = false; this.status = 'Orden guardado correctamente en MongoDB'; this.loadItems(); },
      error: () => { this.status = 'No se pudo guardar el orden'; }
    });
  }

  private emptyItem(): EditableItem {
    return { name: '', category: 'Primer plato o Entradas', subcategory: '', price: 0, allergens: [], image: '', description: '', order: 0, active: true };
  }
}
