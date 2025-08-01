'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Image, Video } from 'lucide-react';
import { toast } from 'sonner';

interface UploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  duration?: number;
  bytes: number;
  width?: number;
  height?: number;
}

interface DirectUploaderProps {
  onUploadSuccess: (result: UploadResult) => void;
  resourceType: 'image' | 'video';
  maxFileSize?: number; // in MB
  buttonText?: string;
  folder?: string; // Custom folder path
}

export default function DirectUploader({
  onUploadSuccess,
  resourceType = 'image',
  maxFileSize = resourceType === 'image' ? 5 : 50,
  buttonText = resourceType === 'image' ? 'Upload Image' : 'Upload Video',
  folder,
}: DirectUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${maxFileSize}MB.`);
      return;
    }
    
    setIsLoading(true);
    setFileName(file.name);
    
    try {
      // Instead of uploading directly to Cloudinary, use our server-side API
      // Convert file to base64 first
      const base64 = await fileToBase64(file);
      
      // Create a request to our server API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          resourceType,
          folder: folder || `courses/${resourceType}s`,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Upload failed: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      onUploadSuccess({
        secure_url: data.secure_url,
        public_id: data.public_id,
        resource_type: data.resource_type,
        format: data.format,
        duration: data.duration,
        bytes: data.bytes,
        width: data.width,
        height: data.height,
      });
      
      toast.success(`${resourceType === 'image' ? 'Image' : 'Video'} uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFileName(null);
    onUploadSuccess({
      secure_url: '',
      public_id: '',
      resource_type: resourceType,
      format: '',
      bytes: 0,
    });
  };

  return (
    <div className="flex flex-col items-center">
      {fileName ? (
        <div className="flex items-center gap-2 mb-4">
          {resourceType === 'image' ? (
            <Image className="h-6 w-6 text-blue-400" />
          ) : (
            <Video className="h-6 w-6 text-blue-400" />
          )}
          <span className="text-gray-400">{fileName}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={handleClear}
          >
            Change
          </Button>
        </div>
      ) : resourceType === 'video' ? (
        <Video className="h-12 w-12 text-gray-400 mb-4" />
      ) : (
        <Image className="h-12 w-12 text-gray-400 mb-4" />
      )}
      
      <div className="flex flex-col items-center">
        <input
          type="file"
          id={`file-upload-${resourceType}`}
          className="hidden"
          accept={resourceType === 'image' ? "image/*" : "video/*"}
          onChange={handleFileUpload}
          disabled={isLoading}
        />
        <label htmlFor={`file-upload-${resourceType}`}>
          <Button
            variant="outline"
            className="border-gray-800 text-gray-400 cursor-pointer"
            disabled={isLoading}
            onClick={() => document.getElementById(`file-upload-${resourceType}`)?.click()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {buttonText}
              </>
            )}
          </Button>
        </label>
      </div>
      
      <p className="mt-2 text-sm text-gray-400">
        {resourceType === 'image' 
          ? "Recommended size: 1280x720px (16:9 ratio)"
          : `Max file size: ${maxFileSize} MB`
        }
      </p>
    </div>
  );
}