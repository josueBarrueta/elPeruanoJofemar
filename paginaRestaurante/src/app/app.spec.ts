import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AppComponent } from './app';
import { SeoService } from './seo.service';
import { ConsentService } from './consent/consent.service';

describe('Public route privacy', () => {
  let events: Subject<NavigationEnd>;
  let seo: jasmine.SpyObj<SeoService>;
  let consent: jasmine.SpyObj<ConsentService>;
  beforeEach(() => {
    events = new Subject();
    seo = jasmine.createSpyObj('SeoService', ['update']);
    consent = jasmine.createSpyObj('ConsentService', ['page']);
    TestBed.configureTestingModule({providers: [
      {provide: Router, useValue: {events}},
      {provide: SeoService, useValue: seo},
      {provide: ConsentService, useValue: consent},
    ]});
  });
  it('hides consent on private routes and does not repeat page processing for hash changes', () => {
    const app = TestBed.runInInjectionContext(() => new AppComponent(TestBed.inject(Router), seo, consent));
    events.next(new NavigationEnd(1, '/', '/'));
    expect(app.showPublicConsent).toBeTrue();
    events.next(new NavigationEnd(2, '/#carta', '/#carta'));
    expect(consent.page).toHaveBeenCalledTimes(1);
    events.next(new NavigationEnd(3, '/login/', '/login/'));
    expect(app.showPublicConsent).toBeFalse();
    events.next(new NavigationEnd(4, '/admin', '/admin'));
    expect(app.showPublicConsent).toBeFalse();
    events.complete();
  });
});
