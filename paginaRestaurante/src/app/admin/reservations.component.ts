import { Component, ChangeDetectorRef, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';

interface Reservation { _id: string; name: string; guests: number; date: string; time: string; }
@Component({
  selector: 'app-reservations', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './reservations.component.html', styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private changes = inject(ChangeDetectorRef);
  private url = 'https://elperuanojofemar.onrender.com/api/admin/reservations';
  @ViewChild('reservationDialog') dialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('addButton') addButton?: ElementRef<HTMLButtonElement>;
  reservations: Reservation[] = [];
  loading = false;
  saving = false;
  error = '';
  formError = '';
  message = '';
  day = '';
  draft = { name: '', guests: 2, date: this.localDate(), time: '' };
  constructor() { this.load(); }
  private localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  private options() { return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.token() ?? ''}` }) }; }
  get visible() { return this.reservations.filter(r => !this.day || r.date === this.day); }
  get guests() { return this.visible.reduce((total, r) => total + r.guests, 0); }
  load() {
    this.loading = true; this.error = '';
    this.http.get<Reservation[]>(this.url, this.options()).subscribe({
      next: rows => { this.reservations = rows; this.loading = false; this.changes.markForCheck(); },
      error: () => { this.error = 'No se pudieron cargar las reservas. Vuelve a intentarlo.'; this.loading = false; this.changes.markForCheck(); }
    });
  }
  open() { this.draft = { name: '', guests: 2, date: this.day || this.localDate(), time: '' }; this.formError = ''; this.message = ''; this.dialog?.nativeElement.showModal(); }
  close() { if (!this.saving) this.dialog?.nativeElement.close(); }
  cancel(event: Event) { if (this.saving) event.preventDefault(); }
  restoreFocus() { this.addButton?.nativeElement.focus(); }
  save() {
    if (this.saving) return;
    this.saving = true; this.formError = '';
    this.http.post<Reservation>(this.url, { ...this.draft, name: this.draft.name.trim() }, this.options()).subscribe({
      next: reservation => {
        this.reservations = [...this.reservations, reservation].sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
        this.day = reservation.date; this.saving = false; this.message = 'Reserva guardada correctamente.';
        this.dialog?.nativeElement.close(); this.changes.markForCheck();
      },
      error: response => { this.saving = false; this.formError = response.error?.message || 'No se pudo guardar la reserva. Tus datos siguen en el formulario.'; this.changes.markForCheck(); }
    });
  }
}
