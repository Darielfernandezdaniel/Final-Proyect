import { Component, Input } from '@angular/core';
import { OnClickChangeService } from '../Services/on-click-change.service';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-left-nav-bar',
  imports: [CommonModule, RouterModule],
  templateUrl: './left-nav-bar.component.html',
  styleUrl: './left-nav-bar.component.css'
})
export class LeftNavBarComponent {
  toggleValue:boolean = false;
  private destroy$ = new Subject<void>();
  @Input() contex: boolean = false;
  
  constructor(private onClick: OnClickChangeService){

  }

  ngOnInit() {
  this.onClick.click$
    .pipe(takeUntil(this.destroy$))
    .subscribe((value) => {
      this.toggleValue = value;
    });
}

  onClickChange(){
    this.onClick.onClickChange()
  }

  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete();
  }
}
