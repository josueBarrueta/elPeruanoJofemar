import { AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { ConsentService } from './consent.service';

@Component({
  selector: 'app-consent',
  standalone: true,
  templateUrl: './consent.component.html',
  styleUrl: './consent.component.scss',
})
export class ConsentComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('consentDialog') private dialog?: ElementRef<HTMLDialogElement>;

  ngAfterViewChecked(): void {
    const dialog = this.dialog?.nativeElement;
    if (dialog && !dialog.open) dialog.showModal();
  }

  readonly consent = inject(ConsentService);
  get editing(): boolean { return this.consent.preferencesOpen(); }
  set editing(value: boolean) { this.consent.preferencesOpen.set(value); }
  ngOnDestroy(): void { this.editing = false; }
  details = false;
  save(analytics: boolean): void {
    this.editing = false;
    this.details = false;
    this.consent.save(analytics);
  }
}
