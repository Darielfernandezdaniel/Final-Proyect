import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OnClickChangeService {
  constructor() {}

  private clickSubject = new BehaviorSubject<boolean>(false);

  click$ = this.clickSubject.asObservable();

  onClickChange() {
    this.clickSubject.next(!this.clickSubject.value);
  }
}
