import { Component, OnDestroy } from '@angular/core';
import { OnClickChangeService } from '../Services/on-click-change.service';
import { Router, RouterModule } from '@angular/router';
import { UserCreationService } from '../Services/user-creation.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../Services/auth.service';
import { Database, ref, get } from '@angular/fire/database';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterModule, CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css',
})
export class NAvBarComponent implements OnDestroy {

  isLoggedIn: boolean = false;
  profilePhoto: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private onClick: OnClickChangeService,
    private user: UserCreationService,
    private auth: AuthService,
    private db: Database,
    private router: Router
  ) {}

  ngOnInit() {
    this.user.getUserData()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.isLoggedIn = true;
          this.profileImage(user.uid);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClickChange() {
    this.onClick.onClickChange();
  }

  async logOut() {
    try {
      await this.auth.logoutUser();
      this.isLoggedIn = false;
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al hacer logout:', error);
    }
  }

  profileImage(uid: string) {
    const cacheKey = 'profileImageUrl';
    const cachedUrl = localStorage.getItem(cacheKey);

    if (cachedUrl && cachedUrl !== 'null' && cachedUrl !== '') {
      this.profilePhoto = cachedUrl;
      console.log('URL de perfil desde cache:', cachedUrl);
      return;
    }

    const userRef = ref(this.db, `users/${uid}/ProfilePhoto/`);

    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.URLPhoto) {
          this.profilePhoto = data.URLPhoto;
          console.log('URL de perfil encontrada:', this.profilePhoto);
        } else {
          this.profilePhoto = null;
          console.log('URLPhoto no existe');
        }
      } else {
        this.profilePhoto = null;
        console.log('Nodo ProfilePhoto no existe');
      }
    }).catch((error) => {
      console.error('Error al obtener imagen de perfil:', error);
      this.profilePhoto = null;
    });
  }
}
