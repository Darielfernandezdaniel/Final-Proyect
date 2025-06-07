import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-gender-bar',
  imports: [],
  templateUrl: './gender-bar.component.html',
  styleUrl: './gender-bar.component.css'
})
export class GenderBarComponent {
   @ViewChild('genderContainer') genderContainer!: ElementRef<HTMLDivElement>;
  
  // Propiedades para controlar la visibilidad
  showLeftButton = false;
  showRightButton = true;
  
  constructor() {}
  
  ngAfterViewInit() {
    // Verificar inicialmente si se necesitan mostrar los botones
    setTimeout(() => {
      this.scrollObserver();
    });
  }
  
  /**
   * Maneja el evento de scroll y controla la visibilidad de los botones
   */
  scrollObserver() {
    const element = this.genderContainer.nativeElement;
    
    // Comprobar si se puede hacer scroll hacia la izquierda
    this.showLeftButton = element.scrollLeft > 0;
    
    // Comprobar si se puede hacer scroll hacia la derecha
    this.showRightButton = 
      element.scrollLeft < 
      element.scrollWidth - element.clientWidth - 1; // -1 para errores de redondeo
  }
  
  /**
   * Scroll hacia la izquierda al hacer clic en el botón correspondiente
   */
  scrollLeft() {
    this.genderContainer.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
  }
  
  /**
   * Scroll hacia la derecha al hacer clic en el botón correspondiente
   */
  scrollRight() {
    this.genderContainer.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
  }
}
