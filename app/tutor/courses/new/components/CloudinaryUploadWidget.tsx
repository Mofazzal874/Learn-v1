'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Video } from 'lucide-react';
import { toast } from 'sonner';

// Add global type for window with Cloudinary
declare global {
  interface Window {
    cloudinary?: any;
  }
}

// Define the Cloudinary widget options interface
interface CloudinaryWidgetOptions {
  cloudName: string;
  uploadPreset: string;
  sources: string[];
  multiple: boolean;
  folder: string;
  resourceType: string;
  clientAllowedFormats: string[];
  maxFileSize: number;
}

// Define the props for the component
interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (result: {
    secure_url: string;
    public_id: string;
    resource_type: string;
    format: string;
    duration?: number;
    bytes: number;
    width?: number;
    height?: number;
  }) => void;
  resourceType: 'image' | 'video';
  maxFileSize?: number; // in MB
  buttonText?: string;
}

// Cloudinary widget component
export default function CloudinaryUploadWidget({
  onUploadSuccess,
  resourceType = 'image',
  maxFileSize = resourceType === 'image' ? 5 : 50, // Default to 5MB for images, 50MB for videos
  buttonText = resourceType === 'image' ? 'Upload Image' : 'Upload Video',
}: CloudinaryUploadWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const cloudinaryRef = useRef<any>(null);
  const widgetRef = useRef<any>(null);

  // Load the Cloudinary script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if script already exists
    if (document.querySelector('script[src="https://upload-widget.cloudinary.com/global/all.js"]')) {
      setScriptLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Cloudinary script');
      toast.error('Failed to load upload functionality. Please refresh and try again.');
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Cleanup not needed as we want to keep the script loaded
    };
  }, []);
  
  // Initialize widget after script is loaded
  useEffect(() => {
    if (!scriptLoaded) return;
    
    // Wait a moment to ensure Cloudinary is fully initialized
    const timer = setTimeout(() => {
      if (window.cloudinary) {
        cloudinaryRef.current = window.cloudinary;
        initWidget();
      } else {
        console.error('Cloudinary not found on window object');
        toast.error('Upload functionality could not be initialized properly.');
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [scriptLoaded]);

  const initWidget = () => {
    if (!cloudinaryRef.current) {
      console.error('Cloudinary reference not set');
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dr0l80kc6';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'learn_v1';
    
    console.log('Initializing widget with:', { cloudName, uploadPreset });
    
    try {
      const options: CloudinaryWidgetOptions = {
        cloudName,
        uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        folder: `courses/${resourceType}s`,
        resourceType,
        clientAllowedFormats: resourceType === 'image' 
          ? ['png', 'jpg', 'jpeg', 'gif'] 
          : ['mp4', 'mov', 'avi', 'webm'],
        maxFileSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
      };

      widgetRef.current = cloudinaryRef.current.createUploadWidget(
        options,
        (error: any, result: any) => {
          if (error) {
            console.error('Cloudinary widget error:', error);
            toast.error(`Upload error: ${error.message || 'Something went wrong'}`);
            setIsLoading(false);
            return;
          }
          
          if (result?.event === 'success') {
            const { info } = result;
            setFileName(info.original_filename);
            onUploadSuccess({
              secure_url: info.secure_url,
              public_id: info.public_id,
              resource_type: info.resource_type,
              format: info.format,
              duration: info.duration,
              bytes: info.bytes,
              width: info.width,
              height: info.height,
            });
            setIsLoading(false);
            toast.success(`${resourceType === 'image' ? 'Image' : 'Video'} uploaded successfully!`);
          } else if (result?.event === 'close') {
            setIsLoading(false);
          } else if (result?.event === 'start') {
            setIsLoading(true);
          }
        }
      );
    } catch (error) {
      console.error('Error creating Cloudinary upload widget:', error);
      toast.error('Failed to initialize upload functionality.');
    }
  };

  const handleOpenWidget = () => {
    if (!widgetRef.current) {
      toast.error('Upload widget is not ready yet. Please try again in a moment.');
      return;
    }
    
    try {
      widgetRef.current.open();
    } catch (error) {
      console.error('Error opening Cloudinary widget:', error);
      toast.error('Failed to open upload dialog. Please refresh and try again.');
    }
  };

  // Fallback direct upload method
  const handleDirectFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      // Create a form data object to upload the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'learn_v1');
      formData.append('folder', `courses/${resourceType}s`);
      
      // Upload directly to Cloudinary API
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dr0l80kc6';
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error('Upload failed');
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
      console.error('Direct upload error:', error);
      toast.error('Upload failed. Please try again.');
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {resourceType === 'video' && fileName ? (
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-6 w-6 text-blue-400" />
          <span className="text-gray-400">{fileName}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => {
              setFileName(null);
              onUploadSuccess({
                secure_url: '',
                public_id: '',
                resource_type: resourceType,
                format: '',
                bytes: 0,
              });
            }}
          >
            Change
          </Button>
        </div>
      ) : resourceType === 'video' ? (
        <Video className="h-12 w-12 text-gray-400 mb-4" />
      ) : null}
      
      <div className="flex flex-col gap-4 items-center">
        <Button
          variant="outline"
          className="border-gray-800 text-gray-400"
          onClick={handleOpenWidget}
          disabled={isLoading || !scriptLoaded}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {buttonText} (Widget)
            </>
          )}
        </Button>
        
        <p className="text-center text-sm text-gray-400 my-2">- OR -</p>
        
        {/* Direct upload fallback option */}
        <div className="flex flex-col items-center">
          <input
            type="file"
            id={`file-upload-${resourceType}`}
            className="hidden"
            accept={resourceType === 'image' ? "image/*" : "video/*"}
            onChange={handleDirectFileUpload}
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
                  Direct Upload
                </>
              )}
            </Button>
          </label>
        </div>
      </div>
      
      {resourceType === 'video' && (
        <p className="mt-2 text-sm text-gray-400">
          Max file size: {maxFileSize} MB
        </p>
      )}
      {resourceType === 'image' && (
        <p className="mt-2 text-sm text-gray-400">
          Recommended size: 1280x720px (16:9 ratio)
        </p>
      )}
    </div>
  );
}