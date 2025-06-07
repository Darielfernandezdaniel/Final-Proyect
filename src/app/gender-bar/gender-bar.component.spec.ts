import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenderBarComponent } from './gender-bar.component';

describe('GenderBarComponent', () => {
  let component: GenderBarComponent;
  let fixture: ComponentFixture<GenderBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenderBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenderBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
