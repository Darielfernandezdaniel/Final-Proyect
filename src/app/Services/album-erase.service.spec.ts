import { TestBed } from '@angular/core/testing';

import { AlbumEraseService } from './album-erase.service';

describe('AlbumEraseService', () => {
  let service: AlbumEraseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlbumEraseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
