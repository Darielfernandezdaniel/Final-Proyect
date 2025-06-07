import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, ref, get } from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';
import { UserPermissions } from '../Interfaces/Interfaces';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private permissionsSubject = new BehaviorSubject<UserPermissions>({
    canEdit: false,
    canDelete: false,
    canView: true,
    isOwner: false,
  });
  permissions$ = this.permissionsSubject.asObservable();

  constructor(
    private auth: Auth,
    private db: Database,
  ) {}

  async checkAlbumPermissions(albumOwner: string, albumTitle: string): Promise<UserPermissions> {
    const currentUser = this.auth.currentUser;
    
    console.log(albumOwner, "este no es el dueño")
    if (!currentUser) {
      const albumRef = ref(this.db, `Albums/${albumOwner}/${albumTitle}/settings`);
      const snapshot = await get(albumRef);
      const isPublic = snapshot.exists() ? snapshot.val().isPublic : true; // Por defecto público
      
      return this.setPermissions({
        canEdit: false,
        canDelete: false,
        canView: isPublic,
        isOwner: false,
      });
    }

    // 🔧 FIX: Obtener el userData real desde Firebase
    const userRef = ref(this.db, `users/${currentUser.uid}`);
    const userSnapshot = await get(userRef);
    const currentUserNickname = userSnapshot.exists() ? userSnapshot.val().user : currentUser.email?.split('@')[0];

    const isOwner = currentUserNickname === albumOwner;

    // Verificar configuración del álbum
    const albumRef = ref(this.db, `Albums/${albumOwner}/${albumTitle}/settings`);
    const snapshot = await get(albumRef);
    const albumSettings = snapshot.exists() ? snapshot.val() : {};
    
    // Por defecto, los álbumes son públicos (visibles)
    const isPublic = albumSettings.isPublic !== undefined ? albumSettings.isPublic : true;
    
    // Verificar si el usuario tiene permisos específicos
    const hasSpecificPermissions = albumSettings.permissions && albumSettings.permissions[currentUserNickname];
    const specificPermissions = hasSpecificPermissions ? albumSettings.permissions[currentUserNickname] : {};

  

    // Determinar permisos finales
    let canView = isOwner || isPublic;
    let canEdit = isOwner;
    let canDelete = isOwner;

    // Si hay permisos específicos para este usuario, aplicarlos
    if (hasSpecificPermissions) {
      canView = canView || specificPermissions.canView;
      canEdit = canEdit || specificPermissions.canEdit;
      canDelete = canDelete || specificPermissions.canDelete;
    }

    const permissions: UserPermissions = {
      isOwner,
      canView,
      canEdit,
      canDelete,
    };

    console.log('🎯 Permisos finales:', permissions);

    return this.setPermissions(permissions);
  }

  private setPermissions(permissions: UserPermissions): UserPermissions {
    this.permissionsSubject.next(permissions);
    return permissions;
  }

  // Métodos de conveniencia
  canDelete(): boolean {
    return this.permissionsSubject.value.canDelete;
  }

  canEdit(): boolean {
    return this.permissionsSubject.value.canEdit;
  }

  canView(): boolean {
    return this.permissionsSubject.value.canView;
  }

  isOwner(): boolean {
    return this.permissionsSubject.value.isOwner;
  }
}