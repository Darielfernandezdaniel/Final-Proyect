import { AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { delay, Observable, of } from 'rxjs';

export function passwordValidatorAsync(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        const value = control.value;
        const errors: ValidationErrors = {};
    
        if (!/[A-Z]/.test(value)) {
          errors['passwordUppercase'] = true; // Error si no tiene mayúscula
        }
    
        if (!/\d/.test(value)) {
          errors['passwordNumber'] = true; // Error si no tiene número
        }
    
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          errors['passwordSpecial'] = true; // Error si no tiene carácter especial
        }
    
        return of(Object.keys(errors).length ? errors : null).pipe(delay(0)); // Devuelve los errores si existen
      };
  }
