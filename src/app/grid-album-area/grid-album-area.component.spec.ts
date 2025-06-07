import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridAlbumAreaComponent } from './grid-album-area.component';

describe('GridAlbumAreaComponent', () => {
  let component: GridAlbumAreaComponent;
  let fixture: ComponentFixture<GridAlbumAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridAlbumAreaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridAlbumAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
