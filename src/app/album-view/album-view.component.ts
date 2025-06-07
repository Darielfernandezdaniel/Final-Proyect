// album-view.component.ts
import { Component, OnDestroy } from '@angular/core';
import { UserCreationService } from '../Services/user-creation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Database, get, ref, query, orderByKey, limitToFirst, startAfter, remove } from '@angular/fire/database';
import { CommonModule } from '@angular/common';
import { NAvBarComponent } from '../nav-bar/nav-bar.component';
import { LeftNavBarComponent } from '../left-nav-bar/left-nav-bar.component';
import { UserData } from '../Interfaces/Interfaces';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-album-view',
  standalone: true,
  imports: [CommonModule, NAvBarComponent, LeftNavBarComponent],
  templateUrl: './album-view.component.html',
  styleUrl: './album-view.component.css'
})
export class AlbumViewComponent implements OnDestroy {
  loggedNick:string =""; 
  titleAlbum: string | null = null;
  nickname: string | null = null;
  images: string[] = []; 
  imageKeys: string[] = [];

  pageSize: number = 12;
  currentPage: number = 0;
  lastKey: string | null = null;
  hasMorePages: boolean = true;
  isLoading: boolean = false;

  private destroy$ = new Subject<void>();
  userSubscription: any;
  showButtonDelete: boolean | undefined

  constructor(
    private user: UserCreationService, 
    private route: ActivatedRoute, 
    private router: Router,
    private db: Database
  ) {}

  async ngOnInit() {
    this.route.params.subscribe(params => {
    this.titleAlbum = params['id'];
    this.nickname = params['secondParam']; 
});

    this.userSubscription = this.user.getUserData().subscribe({
      next: (user: UserData) => {
        this.loggedNick = user.user;
      if(this.loggedNick == this.nickname){
        this.showButtonDelete = true
      }else{
        this.showButtonDelete = false
      }
    }
  });
    await this.loadFirstPage();
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
    const albumRef = ref(this.db, `Albums/${this.nickname}/${this.titleAlbum}/images`);

    try {
      let imageQuery;

      if (this.lastKey) {
        imageQuery = query(
          albumRef,
          orderByKey(),
          startAfter(this.lastKey),
          limitToFirst(this.pageSize)
        );
      } else {
        imageQuery = query(
          albumRef,
          orderByKey(),
          limitToFirst(this.pageSize)
        );
      }

      const snapshot = await get(imageQuery);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const newImages = Object.values(data) as string[];
        const keys = Object.keys(data);

        if (this.currentPage === 0) {
          this.images = newImages;
          this.imageKeys = keys;
        } else {
          this.images = [...this.images, ...newImages];
          this.imageKeys = [...this.imageKeys, ...keys];
        }

        this.lastKey = keys[keys.length - 1];
        this.hasMorePages = newImages.length === this.pageSize;
        this.currentPage++;
      } else {
        this.hasMorePages = false;
        if (this.currentPage === 0) {
          this.images = [];
          this.imageKeys = [];
        }
      }
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      this.hasMorePages = false;
    } finally {
      this.isLoading = false;
    }
  }

  async loadMoreImages() {
    if (this.hasMorePages && !this.isLoading) {
      await this.loadImagesPage();
    }
  }

  async deleteImage(imageIndex: number) {
    try {
      const imageUrl = this.images[imageIndex];
      const imageKey = this.imageKeys[imageIndex];

      if (!this.nickname || !this.titleAlbum || !imageUrl || !imageKey) {
        console.error('Faltan datos para eliminar la imagen');
        return;
      }

      const albumImageRef = ref(this.db, `Albums/${this.nickname}/${this.titleAlbum}/images/${imageKey}`);
      const imageNodeRef = ref(this.db, `Imagenes/${imageKey}`);

      await remove(albumImageRef);
      await remove(imageNodeRef);

      this.images.splice(imageIndex, 1);
      this.imageKeys.splice(imageIndex, 1);
      
      console.log('Imagen eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      alert('Error al eliminar la imagen');
    }
  }

  onImageError(event: any) {
    console.log('Error al cargar imagen, usando placeholder');
    event.target.src = 'assets/placeholder-image.png';
  }

  onScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      this.loadMoreImages();
    }
  }

  ngOnDestroy() {
     if (this.userSubscription) {
    this.userSubscription.unsubscribe();
  }
  }
}