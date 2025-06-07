import { TestBed } from '@angular/core/testing';

import { OnClickChangeService } from '../Services/on-click-change.service';

describe('OnClickChangeService', () => {
  let service: OnClickChangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnClickChangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
