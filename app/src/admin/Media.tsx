/**
 * Media Management Page
 * Upload and manage images
 */

import React, { useState, useCallback } from 'react';
import { Upload, X, Copy, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadAPI } from '@/services/api';

interface UploadedImage {
  url: string;
  publicId: string;
  originalName?: string;
  size?: number;
}

const Media: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.length) {
      await uploadFiles(Array.from(files));
    }
  }, []);

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);

    try {
      for (const file of files) {
        const response = await uploadAPI.uploadImage(file);
        setUploadedImages((prev) => [response.data.data, ...prev]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload some files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      await uploadFiles(Array.from(files));
    }
  };

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <p className="text-gray-500">Upload and manage your images</p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive
            ? 'border-gray-900 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center">
          {isUploading ? (
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
          )}
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isUploading ? 'Uploading...' : 'Drop images here'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse from your computer
          </p>
          <p className="text-xs text-gray-400">
            Supports: JPG, PNG, GIF, WebP (max 5MB each)
          </p>
        </div>
      </div>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recently Uploaded ({uploadedImages.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="aspect-square">
                  <img
                    src={image.url}
                    alt={image.originalName || 'Uploaded image'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-500 truncate mb-1">
                    {image.originalName || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(image.size)}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyToClipboard(image.url, image.publicId)}
                    className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === image.publicId ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => removeImage(index)}
                    className="p-2 bg-white rounded-lg shadow-lg hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {uploadedImages.length === 0 && !isUploading && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-500">Upload your first image to get started</p>
        </div>
      )}
    </div>
  );
};

export default Media;
