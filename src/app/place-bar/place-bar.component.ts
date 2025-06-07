import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-place-bar',
  imports: [],
  templateUrl: './place-bar.component.html',
  styleUrl: './place-bar.component.css'
})
export class PlaceBarComponent {
 @Input() contexto: string = '';
}
