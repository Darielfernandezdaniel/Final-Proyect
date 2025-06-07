import { Injectable, NgZone } from '@angular/core';
import { Database, onValue, ref } from '@angular/fire/database';
import { distinctUntilChanged, Observable, of } from 'rxjs';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { update, push, set } from '@angular/fire/database';
import { UserCreationService } from './user-creation.service';

@Injectable({
  providedIn: 'root',
})
export class ImgUploadService {
  constructor(
    private db: Database,
    private ngZone: NgZone,
    private user: UserCreationService,
  ) {}

  previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      return reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  loadUserImage(uid: string, type: 'profile' | 'cover' = 'profile'): Observable<string | null> {
    if (!uid) {
      console.log('loadUserImage: UID is null or undefined');
      return of(null);
    }

    const key = type === 'profile' ? 'URLPhoto' : 'CoverPhoto';
    console.log(`Loading ${type} image with key: ${key} for UID: ${uid}`);

    return new Observable<string | null>((observer) => {
      const userRef = ref(this.db, `users/${uid}/ProfilePhoto`);

      const unsubscribe = onValue(
        userRef,
        (snapshot) => {
          console.log('Firebase snapshot for', uid, ':', snapshot.val());
          const data = snapshot.val();
          const imageUrl = data?.[key] ?? null;
          console.log(`Found ${type} URL:`, imageUrl);
          observer.next(imageUrl);
        },
        (error) => {
          console.error('Firebase onValue error:', error);
          observer.error(error);
        },
      );

      return () => unsubscribe();
    }).pipe(distinctUntilChanged());
  }

  async uploadPhoto(file: File, userUID: string, type: 'profile' | 'cover'): Promise<string> {
    if (!userUID) throw new Error('UID del usuario no definido para foto de perfil o portada');

    console.log(`Uploading ${type} photo for UID: ${userUID}`);

    const storage = getStorage();
    const filePath = `${type === 'profile' ? 'profile' : 'cover'}/${userUID}.jpg`;
    const imageRef = storageRef(storage, filePath);

    await uploadBytesResumable(imageRef, file);
    const url = await getDownloadURL(imageRef);

    console.log(`Upload successful, URL: ${url}`);

    const userRef = ref(this.db, `users/${userUID}/ProfilePhoto`);
    const updateData = { [type === 'profile' ? 'URLPhoto' : 'CoverPhoto']: url };

    console.log('Updating database with:', updateData);
    await update(userRef, updateData);

    return url;
  }

  updateImageUrlInStorage(url: string, type: 'profile' | 'cover'): void {
    this.ngZone.runOutsideAngular(() => {
      const storageKey = type === 'profile' ? 'profileImageUrl' : 'coverImgUrl';
      localStorage.setItem(storageKey, url);
    });
  }

  async uploadAlbumPhoto(file: File, nickname: string, albumTitle: string): Promise<string> {
    if (!albumTitle) throw new Error('UID del álbum no definido');

    const storage = getStorage();
    const filePath = `Albums/${nickname}${albumTitle}/images/${Date.now()}.jpg`;
    const imageRef = storageRef(storage, filePath);

    await uploadBytesResumable(imageRef, file);
    const url = await getDownloadURL(imageRef);

    // GENERAR UN SOLO ID ÚNICO
    const albumImagesRef = ref(this.db, `Albums/${nickname}/${albumTitle}/images`);
    const newImageRef = push(albumImagesRef);
    const uniqueImageId = newImageRef.key;

    // USAR EL MISMO ID EN AMBOS NODOS
    await set(newImageRef, url);
    await this.createImageReverseNode(url, albumTitle, uniqueImageId!, nickname);

    return url;
  }

  async createImageReverseNode(imageUrl: string, albumTitle: string, imageId: string, nickname: string): Promise<void> {
    try {
      const imagenesRef = ref(this.db, `Imagenes/${imageId}`);

      const imageData = {
        url: imageUrl,
        albumTitle: albumTitle,
        uploadedAt: Date.now(),
        nickname: nickname,
      };

      await set(imagenesRef, imageData);

      console.log('Nodo inverso de imagen creado con el mismo ID:', imageId);
    } catch (error) {
      console.error('Error al crear nodo inverso de imagen:', error);
    }
  }
}
