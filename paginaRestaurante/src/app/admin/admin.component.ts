import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiMenuItem, MenuApiService } from '../menu-api.service';
import { DailyMenu, DailyMenuService } from '../daily-menu.service';

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
  private readonly categoryOrder = [
    'Primer plato o Entradas',
    'Pescado y Mariscos',
    'Carnes y Pollo',
    'Platos Combinados',
    'Bebidas',
    'Postres'
  ];
  private readonly api = inject(MenuApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly dailyMenuService = inject(DailyMenuService);
  items: ApiMenuItem[] = [];
  dailyMenu: DailyMenu = this.dailyMenuService.get();
  dailyMenuStatus = '';
  itemStatus = '';
  suggestionField = '';

  get menuOptions(): string[] { return [...new Set(this.items.map(item => item.name).filter(Boolean))].sort((a, b) => a.localeCompare(b)); }
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
    return [...new Set(this.items.map((item) => item.category).filter(Boolean))].sort((a, b) => this.compareCategories(a, b));
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

  selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.itemStatus = 'Selecciona un archivo de imagen válido.';
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { this.selected.image = String(reader.result); this.itemStatus = ''; this.changeDetector.markForCheck(); };
    reader.readAsDataURL(file);
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
    return [...categories.entries()].sort(([a], [b]) => this.compareCategories(a, b)).map(([category, subcategories]) => ({
      category,
      subcategories: [...subcategories.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => ({ name, items }))
    }));
  }

  private compareCategories(a: string, b: string): number {
    const aIndex = this.categoryOrder.indexOf(a);
    const bIndex = this.categoryOrder.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? this.categoryOrder.length : aIndex) - (bIndex === -1 ? this.categoryOrder.length : bIndex);
    return a.localeCompare(b);
  }

  constructor() {
    this.loadItems();
  }

  saveDailyMenu(): void {
    this.dailyMenuService.saveRemote({ ...this.dailyMenu, dessert: '' }).subscribe({
      next: menu => { this.dailyMenu = menu; this.dailyMenuStatus = 'Publicado en la base de datos de MongoDB y actualizado en la página.'; this.changeDetector.markForCheck(); },
      error: () => { this.dailyMenuStatus = 'No se pudo guardar el menú del día'; this.changeDetector.markForCheck(); }
    });
  }

  trackByIndex(index: number): number { return index; }
  setSuggestionField(field: string): void { this.suggestionField = field; }
  suggestions(value: string): string[] { const query = value.trim().toLocaleLowerCase(); return query ? this.menuOptions.filter(option => option.toLocaleLowerCase().includes(query)).slice(0, 6) : []; }
  chooseDaily(type: 'starter' | 'main', index: number, value: string): void { if (type === 'starter') this.dailyMenu.starters[index] = value; else this.dailyMenu.mains[index] = value; this.suggestionField = ''; }

  loadItems(): void {
    this.api.getAdminMenu().subscribe({
      next: (items) => { this.items = items; this.status = `${items.length} productos cargados desde MongoDB`; this.changeDetector.markForCheck(); },
      error: () => { this.status = 'No se pudo cargar la carta'; this.changeDetector.markForCheck(); }
    });
  }

  newItem(): void { this.selected = { ...this.emptyItem(), order: this.items.length ? Math.max(...this.items.map((item) => item.order)) + 1 : 0 }; this.isEditing = false; this.itemStatus = ''; }

  edit(item: ApiMenuItem): void {
    this.selected = { ...item, allergens: [...item.allergens] };
    this.isEditing = true;
    this.itemStatus = '';
  }

  save(): void {
    const item = {
      ...this.selected,
      name: this.selected.name.trim(),
      category: this.selected.category.trim(),
      subcategory: this.selected.subcategory?.trim() || '',
      price: Number(this.selected.price),
      allergens: [...(this.selected.allergens || [])],
      image: this.selected.image?.trim() || '',
      description: this.selected.description?.trim() || '',
      active: this.isEditing ? this.selected.active !== false : true
    };
    if (!item.name || !item.category || !Number.isFinite(item.price) || item.price < 0) {
      this.itemStatus = 'Completa el nombre, la categoría y un precio válido.';
      return;
    }
    const request = this.isEditing && this.selected._id
      ? this.api.updateItem(this.selected._id, item)
      : this.api.createItem(item);
    request.subscribe({
      next: () => { this.status = 'Carta actualizada correctamente'; this.loadItems(); this.newItem(); this.itemStatus = 'Plato publicado en MongoDB y disponible en la carta pública.'; this.changeDetector.markForCheck(); },
      error: () => { this.itemStatus = 'No se pudo publicar el plato en MongoDB.'; this.changeDetector.markForCheck(); }
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
