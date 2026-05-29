import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { OnboardingTutorialComponent, ONBOARDING_DONE_KEY } from './onboarding-tutorial.component';

describe('OnboardingTutorialComponent', () => {
  let component: OnboardingTutorialComponent;

  beforeEach(() => {
    localStorage.removeItem(ONBOARDING_DONE_KEY);

    TestBed.configureTestingModule({
      imports: [OnboardingTutorialComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    const fixture = TestBed.createComponent(OnboardingTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('starts on slide 0', () => {
    expect(component.currentIndex()).toBe(0);
  });

  it('has 3 slides', () => {
    expect(component.slides.length).toBe(3);
  });

  it('isFirstSlide is true on slide 0', () => {
    expect(component.isFirstSlide).toBeTrue();
  });

  it('isLastSlide is false on slide 0', () => {
    expect(component.isLastSlide).toBeFalse();
  });

  it('next() advances to slide 1', () => {
    component.next();
    expect(component.currentIndex()).toBe(1);
  });

  it('prev() does nothing on first slide', () => {
    component.prev();
    expect(component.currentIndex()).toBe(0);
  });

  it('next() from slide 2 stays on slide 2 (last slide guard)', () => {
    component.next();
    component.next();
    component.next(); // should not go past 2
    expect(component.currentIndex()).toBe(2);
  });

  it('isLastSlide is true on slide 2', () => {
    component.next();
    component.next();
    expect(component.isLastSlide).toBeTrue();
  });

  it('prev() from slide 1 goes back to slide 0', () => {
    component.next();
    component.prev();
    expect(component.currentIndex()).toBe(0);
  });

  it('complete() emits dismissed and sets localStorage flag', () => {
    const emitted = jasmine.createSpy('dismissed');
    component.dismissed.subscribe(emitted);
    component.complete();
    expect(emitted).toHaveBeenCalled();
    expect(localStorage.getItem(ONBOARDING_DONE_KEY)).toBe('true');
  });

  it('skip() emits dismissed and sets localStorage flag', () => {
    const emitted = jasmine.createSpy('dismissed');
    component.dismissed.subscribe(emitted);
    component.skip();
    expect(emitted).toHaveBeenCalled();
    expect(localStorage.getItem(ONBOARDING_DONE_KEY)).toBe('true');
  });

  it('isCompleted() returns false when flag not set', () => {
    expect(OnboardingTutorialComponent.isCompleted()).toBeFalse();
  });

  it('isCompleted() returns true after complete() is called', () => {
    component.complete();
    expect(OnboardingTutorialComponent.isCompleted()).toBeTrue();
  });

  it('currentSlide returns slide at currentIndex', () => {
    expect(component.currentSlide).toBe(component.slides[0]);
    component.next();
    expect(component.currentSlide).toBe(component.slides[1]);
  });
});
