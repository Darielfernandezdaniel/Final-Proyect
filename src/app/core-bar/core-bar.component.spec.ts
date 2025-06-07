import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreBarComponent } from './core-bar.component';

describe('CoreBarComponent', () => {
  let component: CoreBarComponent;
  let fixture: ComponentFixture<CoreBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoreBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoreBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
