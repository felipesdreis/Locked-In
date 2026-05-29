import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BadgeCelebrationModalComponent } from './badge-celebration-modal.component';

describe('BadgeCelebrationModalComponent', () => {
  function createComponent(milestone: 7 | 30 | 100) {
    TestBed.configureTestingModule({
      imports: [BadgeCelebrationModalComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    const fixture = TestBed.createComponent(BadgeCelebrationModalComponent);
    fixture.componentInstance.milestone = milestone;
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('renders 7-day badge config', () => {
    const c = createComponent(7);
    expect(c.config.emoji).toBe('🌟');
    expect(c.config.title).toContain('7');
  });

  it('renders 30-day badge config', () => {
    const c = createComponent(30);
    expect(c.config.emoji).toBe('🏆');
    expect(c.config.title).toContain('Mês');
  });

  it('renders 100-day badge config', () => {
    const c = createComponent(100);
    expect(c.config.emoji).toBe('💎');
    expect(c.config.title).toContain('Século');
  });

  it('emits closed when close() is called', () => {
    const c = createComponent(7);
    const spy = jasmine.createSpy('closed');
    c.closed.subscribe(spy);
    c.close();
    expect(spy).toHaveBeenCalled();
  });

  it('auto-closes after 3 seconds', fakeAsync(() => {
    const c = createComponent(7);
    const spy = jasmine.createSpy('closed');
    c.closed.subscribe(spy);
    tick(3000);
    expect(spy).toHaveBeenCalled();
  }));
});
