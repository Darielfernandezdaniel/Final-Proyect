import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NAvBarComponent } from './nav-bar.component';

describe('NAvBarComponent', () => {
  let component: NAvBarComponent;
  let fixture: ComponentFixture<NAvBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NAvBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NAvBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
