import { supabase } from '../lib/supabase';

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
  cacheControl?: string;
}

export interface PhotoMetadata {
  id?: string;
  project_id: string;
  piece_mark_id?: string;
  work_order_id?: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  uploaded_by: string;
  taken_at?: string;
}

class StorageService {
  private readonly PHOTO_BUCKET = 'piece-photos';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Upload a single file to Supabase storage
   */
  async uploadFile(options: UploadOptions): Promise<string> {
    const { bucket, path, file, upsert = false, cacheControl = '3600' } = options;

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate file type for photos
    if (bucket === this.PHOTO_BUCKET && !this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl,
          upsert,
        });

      if (error) throw error;

      return this.getPublicUrl(bucket, path);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    bucket: string,
    pathPrefix: string
  ): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `${pathPrefix}/${timestamp}-${index}-${file.name}`;
      return this.uploadFile({
        bucket,
        path: fileName,
        file,
      });
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Upload a photo for a piece mark
   */
  async uploadPieceMarkPhoto(
    file: File,
    projectId: string,
    pieceMarkId: string,
    userId: string,
    caption?: string
  ): Promise<PhotoMetadata> {
    const timestamp = Date.now();
    const fileName = `${projectId}/${pieceMarkId}/${timestamp}-${file.name}`;
    
    // Upload the photo
    const photoUrl = await this.uploadFile({
      bucket: this.PHOTO_BUCKET,
      path: fileName,
      file,
    });

    // Create thumbnail (in a real app, this would be done server-side)
    const thumbnailUrl = photoUrl; // For now, using same URL

    // Save metadata to database
    const metadata: PhotoMetadata = {
      project_id: projectId,
      piece_mark_id: pieceMarkId,
      photo_url: photoUrl,
      thumbnail_url: thumbnailUrl,
      caption: caption || `Photo uploaded on ${new Date().toLocaleDateString()}`,
      uploaded_by: userId,
      taken_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('progress_photos')
      .insert(metadata)
      .select()
      .single();

    if (error) throw error;

    return { ...metadata, id: data.id };
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(bucket: string, paths: string[]): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) throw error;
  }

  /**
   * List files in a directory
   */
  async listFiles(bucket: string, path: string, limit = 100, offset = 0) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit,
        offset,
      });

    if (error) throw error;
    return data;
  }

  /**
   * Get all photos for a piece mark
   */
  async getPieceMarkPhotos(pieceMarkId: string): Promise<PhotoMetadata[]> {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('piece_mark_id', pieceMarkId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all photos for a project
   */
  async getProjectPhotos(projectId: string, limit = 50): Promise<PhotoMetadata[]> {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete a photo and its metadata
   */
  async deletePhoto(photoId: string, photoUrl: string): Promise<void> {
    // Extract path from URL
    const url = new URL(photoUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    
    if (!pathMatch) {
      throw new Error('Invalid photo URL');
    }

    const path = pathMatch[1];

    // Delete from storage
    await this.deleteFile(this.PHOTO_BUCKET, path);

    // Delete metadata from database
    const { error } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
  }

  /**
   * Compress image before upload (client-side compression)
   */
  async compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create a download link for a file
   */
  async createDownloadLink(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }
}

export const storageService = new StorageService();