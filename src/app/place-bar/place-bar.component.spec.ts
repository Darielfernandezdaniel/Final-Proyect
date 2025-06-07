import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceBarComponent } from './place-bar.component';

describe('PlaceBarComponent', () => {
  let component: PlaceBarComponent;
  let fixture: ComponentFixture<PlaceBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaceBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
