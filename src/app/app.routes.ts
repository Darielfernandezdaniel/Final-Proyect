import { Routes } from '@angular/router';
import { HomeComponentComponent } from './home-component/home-component.component';
import { AuthGuard } from './Guards/auth.guard';

export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: HomeComponentComponent},
  {path: 'register/:param',loadComponent: () =>import('./register/register.component').then(m => m.RegisterComponent)},
  {path: 'UserPage', loadComponent: () => import('./user-page/user-page.component').then(m => m.UserPageComponent),  canActivate: [AuthGuard]},
  {path: 'albumView/:id', loadComponent: () => import('./album-view/album-view.component').then(m => m.AlbumViewComponent),  canActivate: [AuthGuard]},
  {path: 'albumView/:id/:secondParam', loadComponent: () => import('./album-view/album-view.component').then(m => m.AlbumViewComponent),  canActivate: [AuthGuard]},
]
