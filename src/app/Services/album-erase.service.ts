import { Injectable } from '@angular/core';
import { Database, ref, remove, get, query, orderByChild, equalTo } from '@angular/fire/database';

@Injectable({
  providedIn: 'root',
})
export class AlbumEraseService {
  constructor(private db: Database) {}

  async cleanupOrphanedImages(albumUid: string): Promise<void> {
    try {
      console.log(`🗑️ Iniciando limpieza de imágenes para el álbum: ${albumUid}`);

      const imagesRef = ref(this.db, 'Imagenes');
      const imageQuery = query(imagesRef, orderByChild('albumUid'), equalTo(albumUid));
      const snapshot = await get(imageQuery);

      if (snapshot.exists()) {
        const images = snapshot.val();
        const imagesToDelete: string[] = Object.keys(images);

        console.log(`📸 Encontradas ${imagesToDelete.length} imágenes para eliminar del álbum ${albumUid}`);

        // Eliminar imágenes en lotes para mejor rendimiento
        const deletePromises = imagesToDelete.map(async (imageUid) => {
          const imageRef = ref(this.db, `Imagenes/${imageUid}`);
          try {
            await remove(imageRef);
            console.log(`✅ Imagen eliminada: ${imageUid}`);
          } catch (error) {
            console.error(`❌ Error eliminando imagen ${imageUid}:`, error);
            throw error; // Re-lanzar para que Promise.all lo capture
          }
        });

        // Ejecutar todas las eliminaciones en paralelo
        await Promise.all(deletePromises);
        console.log(`🎉 Eliminación completa: ${imagesToDelete.length} imágenes del álbum ${albumUid}`);
      } else {
        console.log(`ℹ️ No se encontraron imágenes para el álbum: ${albumUid}`);
      }
    } catch (error) {
      console.error('💥 Error en la limpieza de imágenes:', error);
    }
  }

  async cleanupOrphanedImagesBatch(albumUid: string, batchSize: number = 10): Promise<void> {
    try {
      console.log(`🗑️ Iniciando limpieza por lotes de imágenes para el álbum: ${albumUid}`);

      const imagesRef = ref(this.db, 'Imagenes');
      const imageQuery = query(imagesRef, orderByChild('albumUid'), equalTo(albumUid));
      const snapshot = await get(imageQuery);

      if (snapshot.exists()) {
        const images = snapshot.val();
        const imagesToDelete: string[] = Object.keys(images);

        console.log(`📸 Encontradas ${imagesToDelete.length} imágenes para eliminar en lotes de ${batchSize}`);

        // Procesar en lotes
        for (let i = 0; i < imagesToDelete.length; i += batchSize) {
          const batch = imagesToDelete.slice(i, i + batchSize);

          const batchPromises = batch.map((imageUid) => {
            const imageRef = ref(this.db, `Imagenes/${imageUid}`);
            return remove(imageRef);
          });

          await Promise.all(batchPromises);
          console.log(`✅ Lote procesado: ${Math.min(i + batchSize, imagesToDelete.length)}/${imagesToDelete.length} imágenes`);

          // Pequeña pausa entre lotes para no sobrecargar Firebase
          if (i + batchSize < imagesToDelete.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        console.log(`🎉 Eliminación por lotes completa: ${imagesToDelete.length} imágenes del álbum ${albumUid}`);
      } else {
        console.log(`ℹ️ No se encontraron imágenes para el álbum: ${albumUid}`);
      }
    } catch (error) {
      console.error('💥 Error en la limpieza por lotes de imágenes:', error);
    }
  }

  async getImageCountForAlbum(albumUid: string): Promise<number> {
    try {
      const imagesRef = ref(this.db, 'Imagenes');
      const imageQuery = query(imagesRef, orderByChild('albumUid'), equalTo(albumUid));
      const snapshot = await get(imageQuery);

      if (snapshot.exists()) {
        const images = snapshot.val();
        return Object.keys(images).length;
      }

      return 0;
    } catch (error) {
      console.error('Error contando imágenes:', error);
      return 0;
    }
  }
}
