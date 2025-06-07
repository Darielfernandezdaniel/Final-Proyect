import { Component, ElementRef, ViewChild } from '@angular/core';
import { NAvBarComponent } from "../nav-bar/nav-bar.component";
import { UserCreationService } from '../Services/user-creation.service';
import { Database, DataSnapshot, equalTo, get, orderByChild, push, query, ref, remove, set } from '@angular/fire/database';
import { ImgUploadService } from '../Services/img-upload.service';
import { AuthService } from '../Services/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AlbumEraseService } from '../Services/album-erase.service';
import { SpinnerService } from '../Services/spinner.service';
import { SpinnerComponent } from "../spinner-loader/spinner-loader.component";
import { LeftNavBarComponent } from "../left-nav-bar/left-nav-bar.component";
import { Album } from '../Interfaces/Interfaces';

@Component({
  selector: 'app-user-page',
  imports: [NAvBarComponent, CommonModule, FormsModule, RouterModule, SpinnerComponent, LeftNavBarComponent ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.css',
  providers: [UserCreationService, ImgUploadService, AuthService],
})
  
export class UserPageComponent {

  @ViewChild('coverFileInput') coverFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('profileFileInput') profileFileInput!: ElementRef<HTMLInputElement>;
  
  spinnerStatus: boolean = false;

  nickname: string = '';
  uid: string = '';
  previewUrl: string | null = null;
  previewUrlCover: string | null = null;
  
 
  hasProfileImage: boolean = false;
  hasCoverImage: boolean = false;
  
  isLoggedIn: boolean = false;
  defaultProfileImage: string = 'assets/pequeños_iconos/perfil-del-usuario.png'; 
  defaultCoverImage: string = 'assets/Imagenes/fondo_negro.webp';

  isModalOpen: boolean = false;
  typeModal: string | undefined = '';
  modalImg: boolean = false;

  albumTitle: string = '';
  userUID: string = '';
  albums: Album[] = [];
  selectedAlbumId: string = '';

  isDragging = false;
  selectedFile: File | null = null;
  private userSubscription: Subscription = new Subscription();
  selectedAlbumTitle: string ="";
  modalObjective: string = "";
  titleExistsError: boolean = false;
  titleExistsMessage: string = "";

  constructor(
    private userService: UserCreationService,
    private db: Database,
    private upload: ImgUploadService,
    private albumEraseService: AlbumEraseService,
    private spinner: SpinnerService,
    private router: Router
  ) { }

  
  ngOnInit(){
    this.userSubscription = this.userService.getUserData().subscribe((userData: any) => {
      this.userUID = userData.uid;
      this.loadUserData()
    })
  }
  loadUserData(): void {
    this.userService.getUserData().subscribe({
      next: (userData) => {
        console.log('UserData received:', userData);
        this.nickname = userData.user;
        this.uid = userData.uid;
        

        if (this.uid) {
          this.loadImage('profile');
          this.loadImage('cover');
          this.loadAlbums();
        } else {
          console.error('UID is null or undefined');
        }
      },
      error: (error) => {
        console.error('Error al obtener el nickname:', error);
      }
    });
  }

  loadImage(type: 'profile' | 'cover'): void {
    console.log(`Loading ${type} image for UID: ${this.uid}`);
    
    const cacheKey = type === 'profile' ? 'profileImageUrl' : 'coverImgUrl';
    const cachedUrl = localStorage.getItem(cacheKey);

    // Primero verificar cache
    if (cachedUrl && cachedUrl !== 'null' && cachedUrl !== '') {
      console.log(`Found cached ${type} URL:`, cachedUrl);
      this.setImageUrl(cachedUrl, type);
      return;
    }

    // Si no hay cache, intentar cargar desde Firebase
    if (this.uid) {
      this.upload.loadUserImage(this.uid, type).subscribe({
        next: (url: string | null) => {
          console.log(`Firebase returned ${type} URL:`, url);
          if (url && url !== 'null' && url !== '') {
            this.setImageUrl(url, type);
            // Cachear la imagen
            localStorage.setItem(cacheKey, url);
          } else {
            // No hay imagen en Firebase, usar por defecto
            this.setDefaultImage(type);
          }
        },
        error: (err: any) => {
          console.error(`Error cargando imagen de ${type}:`, err);
          this.setDefaultImage(type);
        }
      });
    } else {
      this.setDefaultImage(type);
    }
  }

  private setImageUrl(url: string, type: 'profile' | 'cover'): void {
    if (type === 'profile') {
      this.previewUrl = url;
      this.hasProfileImage = true;
    } else {
      this.previewUrlCover = url;
      this.hasCoverImage = true;
    }
  }

  private setDefaultImage(type: 'profile' | 'cover'): void {
    if (type === 'profile') {
      this.previewUrl = null;
      this.hasProfileImage = false;
    } else {
      this.previewUrlCover = null;
      this.hasCoverImage = false;
    }
  }

  // Manejo de errores de carga de imagen
  onImageError(type: 'profile' | 'cover'): void {
    console.log(`Error loading ${type} image, falling back to default`);
    this.setDefaultImage(type);
    
    // Limpiar cache corrupto
    const cacheKey = type === 'profile' ? 'profileImageUrl' : 'coverImgUrl';
    localStorage.removeItem(cacheKey);
  }
    
   triggerFileInput(type: 'profile' | 'cover'): void {
    if (type === 'cover') {
      this.coverFileInput.nativeElement.click();
      console.log('Cover file input triggered');
    } else if (type === 'profile') {
      this.profileFileInput.nativeElement.click();
      console.log('Profile file input triggered');
    }
  }

  handleFileChange(event: Event, type: 'profile' | 'cover') {
    console.log('handleFileChange called with type:', type);
    const input = event.target as HTMLInputElement;
    
    if (!input.files?.length) {
        console.log('No files selected');
        return;
    }
    
    const file = input.files[0];
    console.log('File selected:', {
      name: file.name, 
      type: file.type, 
      size: file.size,
      uid: this.uid
    });
    
    if (!this.uid) {
      console.error('Cannot upload: UID is not available');
      return;
    }
    
    this.previewImageTemporarily(file, type);
  }

  private previewImageTemporarily(file: File, type: 'profile' | 'cover'): void {
    console.log('previewImageTemporarily called with type:', type);
    const reader = new FileReader();
    
    reader.onload = () => {
        console.log('FileReader loaded successfully');
        const result = reader.result as string;
        
        this.setImageUrl(result, type);
        
        // Subir imagen
        this.uploadImageAndUpdateUrl(file, type);
    };
    
    reader.onerror = (error) => {
        console.error('FileReader error:', error);
    };
    
    reader.readAsDataURL(file);
  }

  private uploadImageAndUpdateUrl(file: File, type: 'profile' | 'cover'): void {
    this.upload.uploadPhoto(file, this.uid, type)
      .then(url => {
        console.log(`Upload successful for ${type}:`, url);
        // Actualizar con URL final y cachear
        this.setImageUrl(url, type);
        this.upload.updateImageUrlInStorage(url, type);
      })
      .catch(err => {
        console.error(`Error subiendo ${type}:`, err);
        // En caso de error, volver a cargar la imagen original
        this.loadImage(type);
      });
  }


 loadAlbums() {
  const AlbumsRef = ref(this.db, `Albums/${this.nickname}`);
  get(AlbumsRef).then((snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      this.albums = Object.entries(snapshot.val()).map(([key, album]) => ({
        ...(album as Album), 
        id: key,  // Esta es la clave de Firebase
        title: (album as Album).title  // Asegurar que el título esté disponible
      }));
    } else {
      this.albums = []; // Limpiar el array si no hay álbumes
    }
  }).catch((error) => {
    console.error('Error cargando álbumes:', error);
    this.albums = [];
  });
}

  openModal(typeModal: string, albumId?: string, albumTitle?: string) {
  console.log('openModal llamado con:', { typeModal, albumId, albumTitle });
  
  if (typeModal === 'createAlbum') {
    this.isModalOpen = true;
    this.typeModal = 'createAlbum';
    this.modalObjective = "Create"; 
    
  } else if (typeModal === 'modalImg') {
    this.modalImg = true;
    this.selectedAlbumId = albumId ?? '';
    this.selectedAlbumTitle = albumTitle ?? '';
    
  } else if (typeModal === 'DeleteAlbum') {
    this.isModalOpen = true;
    this.typeModal = 'DeleteAlbum'; 
    this.modalObjective = "Delete";
    
    // CORRECCIÓN CRÍTICA: albumId es la clave de Firebase (el título)
    // En tu estructura, la clave ES el título del álbum
    this.selectedAlbumId = albumId ?? '';
    this.selectedAlbumTitle = albumId ?? ''; // Usar albumId como título también
    
    console.log('Variables establecidas para eliminación:', {
      selectedAlbumId: this.selectedAlbumId,
      selectedAlbumTitle: this.selectedAlbumTitle
    });
  }
}

 closeModal(typeModal: string) {
  if(typeModal === 'closeAlbum'){
    this.isModalOpen = false;
    this.albumTitle = '';
    this.modalObjective = "";
  } else {
    this.modalImg = false;
    this.selectedAlbumId = '';
    this.selectedAlbumTitle = '';
    this.previewUrlAlbum = null; 
    this.selectedFile = null;    
  }
}

// Método saveAlbum() corregido - solo la parte de eliminación
async saveAlbum() {
  if (!this.userUID) return;

  if (this.typeModal === 'createAlbum') {
    if (!this.albumTitle.trim()) {
      return;
    }

    const titleExists = await this.checkTitleExists(this.albumTitle.trim());
    
    if (titleExists) {
      this.titleExistsError = true;
      this.titleExistsMessage = `Ya existe un álbum con el título "${this.albumTitle.trim()}"`;
      this.albumTitle = '';
      return;
    }

    const albumRef = ref(this.db, `Albums/${this.nickname}/${this.albumTitle}`);
    const id = albumRef.key ?? this.albumTitle;

    const newAlbum = {
      title: this.albumTitle,
      images: [],
      id: this.albumTitle // Usar el título como ID también
    };

    set(albumRef, {
      title: this.albumTitle,
      images: [],
    }).then(() => {
      console.log('Álbum creado con éxito');
      this.albums.push(newAlbum);
      this.closeModal('closeAlbum');
    }).catch((error: string) => {
      console.error('Error al crear el álbum: ', error);
    });
      
  } else if (this.typeModal === 'DeleteAlbum' && this.selectedAlbumId) {
    console.log('Iniciando eliminación del álbum:', this.selectedAlbumId);
    
    // CORRECCIÓN: Usar selectedAlbumId que contiene la clave de Firebase
    const albumRef = ref(this.db, `Albums/${this.nickname}/${this.selectedAlbumId}`);
    
    console.log('Referencia de Firebase:', `Albums/${this.nickname}/${this.selectedAlbumId}`);
    
    remove(albumRef).then(() => {
      console.log('Álbum eliminado de Firebase exitosamente');
      
      // Limpiar imágenes huérfanas
      this.albumEraseService.cleanupOrphanedImages(this.selectedAlbumId)
        .then(() => {
          console.log('Limpieza de imágenes completada');
        })
        .catch((error) => {
          console.warn('Error en limpieza de imágenes:', error);
        });
      
      // Eliminar del array local usando el ID correcto
      const albumIndex = this.albums.findIndex(album => album.id === this.selectedAlbumId);
      
      if (albumIndex !== -1) {
        this.albums.splice(albumIndex, 1);
        console.log(`Álbum eliminado del array local en posición ${albumIndex}`);
      } else {
        console.warn('No se encontró el álbum en el array local');
        console.log('Albums actuales:', this.albums.map(a => ({ id: a.id, title: a.title })));
      }
      
      // Limpiar variables
      this.selectedAlbumId = '';
      this.selectedAlbumTitle = '';
      this.albumTitle = '';
      this.modalObjective = '';
      
      this.closeModal('closeAlbum');
      
    }).catch((error: string) => {
      console.error('Error al eliminar el álbum de Firebase:', error);
    });
    
  } else {
    console.log('No se puede procesar la operación:', {
      typeModal: this.typeModal,
      userUID: this.userUID,
      selectedAlbumId: this.selectedAlbumId
    });
  }
}

async checkTitleExists(title: string): Promise<boolean> {
  const userAlbumsRef = ref(this.db, `Albums/${this.nickname}`);
  const q = query(
    userAlbumsRef,
    orderByChild('title'),
    equalTo(title)
  );
  const snapshot = await get(q);
  return snapshot.exists();
}

onDragEnter() {
  this.isDragging = true;
}

  onDragLeave() {
    this.isDragging = false;
  }

 onDrop(event: DragEvent) {
  event.preventDefault();
  this.isDragging = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    this.selectedFile = files[0];
    console.log('Archivo arrastrado:', this.selectedFile);
    
    // Agregar previsualización también para drag & drop
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrlAlbum = e.target?.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }
}

  previewUrlAlbum: string | null = null;

  onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.selectedFile = input.files[0];
    
    // Crear la previsualización manualmente
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrlAlbum = e.target?.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }
}

  uploadImage() {
    if (this.selectedFile && this.selectedAlbumTitle) {
      console.log('Título del álbum:', this.selectedAlbumTitle);
      this.previewUrlAlbum = "";
      this.spinnerStatus = true;
      
      this.upload.uploadAlbumPhoto(this.selectedFile, this.nickname, this.selectedAlbumTitle);
      const esperarTresSegundos = () => {
              setTimeout(() => {
                this.spinnerStatus = false ;
                
              }, 3000); 
            }
             esperarTresSegundos()
      this.selectedFile = null;
      
    } else {
      console.log('Falta archivo o albumId:', {
        selectedFile: !!this.selectedFile,
        albumTitle: this.selectedAlbumTitle
      });
    }
  }

  getFirstImage(album: Album): string | null {
    return album.images ? Object.values(album.images)[0] || null : null;
  }

  navigateToAlbum(title: string) {
    console.log('Navegando a:', title);
    this.router.navigate(['/albumView', title, this.nickname]);

  }
}