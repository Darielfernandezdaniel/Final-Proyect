import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { passwordValidatorAsync } from '../Validators/validators/custom-validators';
import { AuthService } from '../Services/auth.service';
import { UserCreationService } from '../Services/user-creation.service';
import { browserLocalPersistence, browserSessionPersistence, getAuth, setPersistence } from 'firebase/auth';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SpinnerComponent } from "../spinner-loader/spinner-loader.component";
import { Subject, takeUntil, take } from 'rxjs';
import { Database } from '@angular/fire/database';
import { ref, get} from 'firebase/database';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    SpinnerComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  FormTitle: string = '';
  FormQuestion: string = '';
  dinamicValue: string = '';
  inverseParamValue: string = '';

  firstPartOfForm: string = '';
  paramValue: string = '';
  joinForm!: FormGroup;
  joinForm2!: FormGroup;
  loginForm!: FormGroup;
  maxDate!: Date;
  registrationError: string | null = null;
  loginComplet: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authServicie: AuthService,
    private user: UserCreationService,
    private ngZone: NgZone,
    private router: Router,
    private db: Database
  ) { }

  ngOnInit() {
    this.handleRouteParams();
    this.initializeMaxDate();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleParamValue() {
    if (this.paramValue === 'join') {
      this.paramValue = 'login';
      this.setupLoginForm();
    } else if (this.paramValue === 'login') {
      this.paramValue = 'join';
      this.setupJoinForm();
    }
  }

  handleRouteParams(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((paramValue) => {
        this.paramValue = paramValue.get('param') ?? '';
        this.firstPartOfForm = 'FirstPart';
        if (this.paramValue === 'join') {
          this.setupJoinForm();
        } else {
          this.setupLoginForm();
        }
      });
  }

  initializeMaxDate(): void {
    const currentYear = new Date().getFullYear();
    this.maxDate = new Date(currentYear - 1, 11, 31);
  }

  setupJoinForm(): void {
    this.FormTitle = 'Welcome to ArtWorld';
    this.FormQuestion = 'Already a member?';
    this.firstPartOfForm = 'FirstPart';

    this.joinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)], [passwordValidatorAsync()]],
    });

    this.joinForm2 = this.fb.group({
      nickName: ['', [Validators.required]],
      date: ['', [Validators.required]]
    });
  }

  setupLoginForm() {
    this.FormTitle = 'Login';
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      keepMeChecked: [false]
    });
  }

  async withEmailAndPassword() {
    this.registrationError = null;
    if (this.joinForm.get('email')?.valid && this.joinForm.get('password')?.valid) {
      const email = this.joinForm.get('email')?.value;
      const password = this.joinForm.get('password')?.value;
      try {
        await this.authServicie.registerUser(email, password);
        this.firstPartOfForm = "secondPart";
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          this.joinForm.get('email')?.setErrors({ emailInUse: true });
          this.joinForm.get('email')?.markAsTouched();
        } else {
          this.registrationError = error.message;
        }
      }
    }
  }

  sendHalfForm() {
    if (this.firstPartOfForm === "secondPart") {
      const user = this.joinForm2.get('nickName')?.value;
      const date = this.joinForm2.get('date')?.value;
      const dates = new Date(date).getTime();
      this.loginComplet = true;
      this.creatingUser(user, dates);
    }
  }

  creatingUser(user: string, dates: number) {
    this.ngZone.runOutsideAngular(() => {
      this.user.createUser(user, dates)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Usuario creado en la base de datos:', response, dates);
            this.ngZone.run(() => {
              this.router.navigate(['/UserPage']);
              this.loginComplet = false;
            });
          },
          error: (err) => {
            console.error('Error al enviar a la base de datos:', err);
            if (err.message === 'El nickname ya está registrado') {
              this.loginComplet = false;
              this.joinForm2.get('nickName')?.setErrors({ nicknameInUse: true });
            }
          }
        });
    });
  }

  InitSesion() {
  if (this.loginForm.valid) {
    this.loginComplet = true;
    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;
    const keepMeLoggedIn = this.loginForm.get('keepMeChecked')?.value;
    const persistence = keepMeLoggedIn
      ? browserLocalPersistence
      : browserSessionPersistence;
    const auth = getAuth();
    setPersistence(auth, persistence)
      .then(() => {
        return this.authServicie.loginUser(email, password);
      })
      .then(({ token, uid }) => {
        console.log('Login exitoso:', { token, uid });
        
        // Verificar si el UID existe en la ruta users
        return this.checkUserExists(uid).then(userExists => {
        if (!userExists) {
        // Cambiar manualmente todo el estado sin navegar
        this.paramValue = 'join';
        this.setupJoinForm();
        this.firstPartOfForm = 'secondPart';
        this.loginComplet = false;
        
        // Opcional: actualizar la URL sin recargar la página
        window.history.replaceState(null, '', '/register/join');
  
  return;
}
          
          // Si el usuario existe, navegar normalmente
          this.router.navigate(['/UserPage']);
          this.loginComplet = false;
        });
      })
      .catch((error) => {
        console.error("Error al iniciar sesión:", error);
        // Limpiar errores previos
        this.loginForm.setErrors(null);
        if (error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential') {
          this.loginForm.setErrors({ invalidCredentials: true });
        } else if (error.code === 'auth/invalid-email') {
          this.loginForm.get('email')?.setErrors({ email: true });
        } else if (error.code === 'auth/too-many-requests') {
          this.loginForm.setErrors({ tooManyRequests: true });
        } else {
          this.loginForm.setErrors({ loginError: true });
        }
        this.loginComplet = false; // Importante para desactivar spinner si hay error
      });
  }
}

// Método auxiliar para verificar si el usuario existe


private async checkUserExists(uid: string): Promise<boolean> {
  try {
    const dbRef = ref(this.db, `users/${uid}`);
    const snapshot = await get(dbRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}
}
