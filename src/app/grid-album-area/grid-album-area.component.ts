import { Component } from '@angular/core';
import { UserCreationService } from '../Services/user-creation.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Database, get, limitToFirst, orderByKey, query, ref, startAfter } from '@angular/fire/database';
import { CommonModule } from '@angular/common';
import { ImageData } from '../Interfaces/Interfaces';

@Component({
  selector: 'app-grid-album-area',
  imports: [CommonModule, RouterModule],
  templateUrl: './grid-album-area.component.html',
  styleUrl: './grid-album-area.component.css'
})

export class GridAlbumAreaComponent {

  userData: any = null;
  titleAlbum: string | null = null;
  nickname: string | null = null;
  
  images: ImageData[] = []; 
  imageKeys: string[] = []; 
  
  pageSize: number = 12; 
  currentPage: number = 0;
  lastKey: string | null = null; 
  hasMorePages: boolean = true;
  isLoading: boolean = false;
  totalImages: number = 0;

  constructor(private user: UserCreationService, private route: ActivatedRoute, private db: Database) {}

  ngOnInit(){
    this.loadFirstPage()
  }

  async loadFirstPage() {
    this.currentPage = 0;
    this.lastKey = null;
    this.images = [];
    this.imageKeys = [];
    this.hasMorePages = true;
    await this.loadImagesPage();
  }

  async loadImagesPage() {
    if (this.isLoading || !this.hasMorePages) return;
    
    this.isLoading = true;
    const albumRef = ref(this.db, `Imagenes`);
    
    try {
      console.log('Intentando cargar desde:', `Imagenes`);
      
      let imageQuery;
      
      if (this.lastKey) {
        // Cargar página siguiente
        imageQuery = query(
          albumRef,
          orderByKey(),
          startAfter(this.lastKey),
          limitToFirst(this.pageSize)
        );
      } else {
        // Cargar primera página
        imageQuery = query(
          albumRef,
          orderByKey(),
          limitToFirst(this.pageSize)
        );
      }

      const snapshot = await get(imageQuery);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const pushIds = Object.keys(data); // Los identificadores push
        
        // Procesar cada imagen con su identificador push
        const newImages: ImageData[] = [];
        
        pushIds.forEach(pushId => {
          const imageInfo = data[pushId];
          
          // Crear objeto con toda la información de la imagen
          const imageData: ImageData = {
            pushId: pushId,
            albumTitle: imageInfo.albumTitle || '',
            uploadedAt: imageInfo.uploadedAt || 0,
            url: imageInfo.url || '',
            nickname: imageInfo.nickname
          };
          console.log("asdakslfjafhs", imageData)
          newImages.push(imageData);
          console.log("asdakslfjafhs", newImages)
        });
        
        // Ordenar por fecha de subida (más recientes primero)
        newImages.sort((a, b) => b.uploadedAt - a.uploadedAt);
        
        if (this.currentPage === 0) {
          this.images = newImages;
          this.imageKeys = pushIds;
        } else {
          this.images = [...this.images, ...newImages];
          this.imageKeys = [...this.imageKeys, ...pushIds];
        }
        
        // Actualizar estado de paginación
        this.lastKey = pushIds[pushIds.length - 1];
        this.hasMorePages = newImages.length === this.pageSize;
        this.currentPage++;
        
        console.log(`Página ${this.currentPage} cargada:`, newImages.length, 'imágenes');
        console.log('Datos de imágenes:', newImages);
        
      } else {
        this.hasMorePages = false;
        if (this.currentPage === 0) {
          this.images = [];
          this.imageKeys = [];
        }
      }
    } catch (error) {
      console.error('Error al obtener imágenes:', error);
      this.hasMorePages = false;
    } finally {
      this.isLoading = false;
    }
  }

  // Método para cargar más imágenes (scroll infinito o botón)
  async loadMoreImages() {
    if (this.hasMorePages && !this.isLoading) {
      await this.loadImagesPage();
    }
  }

  // Método para obtener el total de imágenes
  async getTotalImagesCount() {
    const albumRef = ref(this.db, `Imagenes`);
    try {
      const snapshot = await get(albumRef);
      if (snapshot.exists()) {
        this.totalImages = Object.keys(snapshot.val()).length;
        return this.totalImages;
      }
      return 0;
    } catch (error) {
      console.error('Error al contar imágenes:', error);
      return 0;
    }
  }

  // Método para obtener información específica de una imagen por pushId
  getImageByPushId(pushId: string): ImageData | undefined {
    return this.images.find(img => img.pushId === pushId);
  }

  // Método para obtener todas las URLs de imágenes
  getImageUrls(): string[] {
    return this.images.map(img => img.url);
  }

  // Método para obtener imagen por índice
  getImageByIndex(index: number): ImageData | undefined {
    return this.images[index];
  }

  // Método para formatear fecha de subida
  formatUploadDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  // Método para manejar click en imagen (ejemplo de uso como enlace)
  onImageClick(imageData: ImageData) {
    console.log('Imagen clickeada:', imageData);
    // Aquí puedes implementar la lógica de navegación o modal
    // Por ejemplo: this.router.navigate(['/image-detail', imageData.pushId]);
  }

  async refreshAlbum() {
    await this.loadFirstPage();
  }

  onImageError(event: any) {
    console.log('Error cargando imagen:', event.target.src);
    event.target.src = 'assets/placeholder-image.png';
  }

  onScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      this.loadMoreImages();
    }
  }
}