import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  created_at: Date;
}

export async function uploadImage(base64Image: string, folder: string = 'courses'): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(
      base64Image,
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' }
        ]
      }
    );
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: 'image',
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: new Date(result.created_at)
    };
  } catch (error) {
    console.error("Cloudinary image upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

export async function uploadVideo(base64Video: string, folder: string = 'courses/videos'): Promise<CloudinaryUploadResult> {
  try {
    // For larger videos, use an unsigned upload with chunking
    // Instead of sending the whole base64 string directly
    
    // First, set a reasonable chunk size and quality to avoid buffer issues
    const uploadOptions = {
      folder: folder,
      resource_type: 'video',
      chunk_size: 6000000, // 6 MB chunks
      eager: [
        { format: 'mp4', quality: 'auto:low' } // Lower initial quality to avoid buffer issues
      ],
      eager_async: true,
      timeout: 120000, // Increase timeout to 2 minutes for larger files
    };
    
    // Upload with chunking enabled
    const result = await cloudinary.uploader.upload(
      base64Video,
      uploadOptions
    );
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: 'video',
      format: result.format,
      duration: result.duration,
      bytes: result.bytes,
      created_at: new Date(result.created_at)
    };
  } catch (error) {
    console.error("Cloudinary video upload error:", error);
    throw new Error("Failed to upload video to Cloudinary");
  }
}

export async function deleteAsset(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: resourceType
      }
    );
    
    return result.result === 'ok';
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete asset from Cloudinary");
  }
}

export default cloudinary;