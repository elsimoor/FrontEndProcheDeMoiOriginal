"use client";

import { useState } from "react";
import { UploadCloud, X } from "lucide-react";

interface ImageUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  uploading: boolean;
  multiple?: boolean;
}

export function ImageUpload({ onUpload, uploading, multiple = false }: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (multiple) {
        setFiles((prevFiles) => [...prevFiles, ...Array.from(e.target.files)]);
      } else {
        setFiles(Array.from(e.target.files));
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      if (multiple) {
        setFiles((prevFiles) => [...prevFiles, ...Array.from(e.dataTransfer.files)]);
      } else {
        setFiles(Array.from(e.dataTransfer.files));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleUploadClick = async () => {
    if (files.length === 0) return;
    await onUpload(files);
    setFiles([]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop your files here or{" "}
          <label className="text-blue-600 hover:underline cursor-pointer">
            browse
            <input
              type="file"
              multiple={multiple}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Selected Files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 bg-gray-100 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                  <span className="text-sm text-gray-800">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={handleUploadClick}
        disabled={uploading || files.length === 0}
        className={`w-full px-4 py-2 rounded text-white ${
          uploading || files.length === 0 ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {uploading ? "Uploading..." : `Upload ${files.length} file(s)`}
      </button>
    </div>
  );
}
