import { Subscription } from 'rxjs';
import { AdminLiveService } from './admin-live.service';
import { Component, ChangeDetectorRef, ElementRef, ViewChild, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';

type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';
interface Reservation { _id: string; name: string; guests: number; date: string; time: string; status?: ReservationStatus; revision?: number; }
@Component({
  selector: 'app-reservations', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './reservations.component.html', styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private changes = inject(ChangeDetectorRef);
  private url = 'https://axwxlsai9xocqzi5jvnbebks.2.31.73.77.sslip.io/api/admin/reservations';
  @ViewChild('reservationDialog') dialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('addButton') addButton?: ElementRef<HTMLButtonElement>;
  reservations: Reservation[] = [];
  loading = false;
  saving = false;
  error = '';
  formError = '';
  actionError = '';
  message = '';
  day = '';
  selected?: Reservation;
  statusLabel(status?: ReservationStatus) { return status === 'confirmed' ? 'Confirmada' : status === 'cancelled' ? 'Cancelada' : 'Pendiente'; }
  draft = { status: 'pending' as ReservationStatus, name: '', guests: 2, date: this.localDate(), time: '' };
  liveOffline = false;
  private refreshRequest?: Subscription;
  private pendingRefresh = false;
  constructor() {
    this.load();
    const live = inject(AdminLiveService).changes(this.url).subscribe(event => {
      this.liveOffline = event === 'offline';
      if (event === 'changed') {
        if (this.saving || (this.refreshRequest && !this.refreshRequest.closed)) this.pendingRefresh = true;
        else this.load(true);
      }
      this.changes.markForCheck();
    });
    const refresh = () => { if (document.visibilityState === 'visible' && !this.saving) this.load(true); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    inject(DestroyRef).onDestroy(() => {
      live.unsubscribe(); this.refreshRequest?.unsubscribe();
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    });
  }
  private localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  private options() { return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.token() ?? ''}` }) }; }
  get visible() { return this.reservations.filter(r => !this.day || r.date === this.day); }
  get guests() { return this.visible.filter(r => r.status !== 'cancelled').reduce((total, r) => total + r.guests, 0); }
  load(background = false) {
    this.refreshRequest?.unsubscribe(); this.pendingRefresh = false;
    if (!background) this.loading = true;
    this.error = '';
    this.refreshRequest = this.http.get<Reservation[]>(this.url, this.options()).subscribe({
      next: rows => { this.reservations = rows; this.loading = false; this.error = ''; this.changes.markForCheck();
        if (this.pendingRefresh) queueMicrotask(() => this.load(true)); },
      error: () => { this.error = 'No se pudieron cargar las reservas. Vuelve a intentarlo.'; this.loading = false; this.changes.markForCheck(); }
    });
  }
  open(reservation?: Reservation) {
    this.selected = reservation;
    this.draft = reservation
      ? { name: reservation.name, guests: reservation.guests, date: reservation.date, time: reservation.time, status: reservation.status || 'pending' }
      : { name: '', guests: 2, date: this.day || this.localDate(), time: '', status: 'pending' };
    this.formError = ''; this.message = ''; this.dialog?.nativeElement.showModal();
  }
  setStatus(reservation: Reservation, status: ReservationStatus) {
    if (this.saving || (status === 'cancelled' && !window.confirm(`¿Cancelar la reserva de ${reservation.name}? Se conservará en la agenda como cancelada.`))) return;
    this.actionError = '';
    this.saving = true; this.refreshRequest?.unsubscribe(); this.loading = false;
    this.http.put<Reservation>(`${this.url}/${reservation._id}`, { ...reservation, status, revision: reservation.revision ?? 0 }, this.options()).subscribe({
      next: () => { this.saving = false; this.message = status === 'confirmed' ? 'Reserva confirmada.' : 'Reserva cancelada.'; this.load(true); },
      error: response => { this.saving = false; this.load(true); this.actionError = response.error?.message || 'No se pudo cambiar el estado de la reserva.'; this.changes.markForCheck(); }
    });
  }
  close() { if (!this.saving) this.dialog?.nativeElement.close(); }
  cancel(event: Event) { if (this.saving) event.preventDefault(); }
  restoreFocus() { this.addButton?.nativeElement.focus(); }
  save() {
    if (this.saving) return;
    this.refreshRequest?.unsubscribe();
    this.loading = false; this.saving = true; this.formError = '';
    const body = { ...this.draft, name: this.draft.name.trim(), revision: this.selected?.revision ?? 0 };
    const request = this.selected
      ? this.http.put<Reservation>(`${this.url}/${this.selected._id}`, body, this.options())
      : this.http.post<Reservation>(this.url, body, this.options());
    request.subscribe({
      next: reservation => {
        this.reservations = [...this.reservations.filter(row => row._id !== reservation._id), reservation].sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
        this.day = reservation.date; this.saving = false; this.message = 'Reserva guardada correctamente.';
        this.dialog?.nativeElement.close(); this.load(true); this.changes.markForCheck();
      },
      error: response => { this.saving = false; if (this.pendingRefresh) this.load(true); this.formError = response.error?.message || 'No se pudo guardar la reserva. Tus datos siguen en el formulario.'; this.changes.markForCheck(); }
    });
  }
}
