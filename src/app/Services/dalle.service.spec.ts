import { TestBed } from '@angular/core/testing';

import { DALLEService } from './dalle.service';

describe('DALLEService', () => {
  let service: DALLEService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DALLEService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
