import { Injectable, inject } from '@angular/core';
import { map, Observable, switchMap, catchError, throwError, from, filter } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Database, ref, get, DataSnapshot, update } from '@angular/fire/database';
import { AuthService } from './auth.service';
import { Auth } from '@angular/fire/auth';
import { UserData } from '../Interfaces/Interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserCreationService {
  private auth: Auth = inject(Auth);

  constructor(
    private http: HttpClient,
    private db: Database,
    private authServicie: AuthService,
  ) {}

  createUser(user: string, date: number): Observable<UserData> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const uid = currentUser.uid;
    // Referencia directa al username
    const usernameRef = ref(this.db, `username/${user}`);

    return from(get(usernameRef)).pipe(
      map((snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          throw new Error('El nickname ya está registrado');
        }
        const userData: UserData = { user, date, uid };
        return userData;
      }),
      switchMap((userData: UserData) => {
        // Guardar en ambas ubicaciones
        const userRef = ref(this.db, `users/${uid}`);
        const usernameRef = ref(this.db, `username/${user}`);

        // Usar batch update para atomicidad
        const updates: { [key: string]: any } = {};
        updates[`users/${uid}`] = userData;
        updates[`username/${user}`] = { uid };

        return from(update(ref(this.db), updates)).pipe(map(() => userData));
      }),
    );
  }

  getUserData(): Observable<UserData> {
    return this.authServicie.getCurrentUser().pipe(
      filter((user) => user !== null), // Filtrar valores null
      switchMap((user) => {
        const uid = user!.uid;
        const userRef = ref(this.db, `users/${uid}`);
        return from(get(userRef)).pipe(
          map((snapshot: DataSnapshot) => {
            if (snapshot.exists()) {
              return snapshot.val() as UserData;
            } else {
              throw new Error('Usuario no encontrado');
            }
          }),
        );
      }),
      catchError((error) => throwError(() => error)),
    );
  }
}
