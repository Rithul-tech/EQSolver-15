import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, X, Image, File } from "lucide-react";
import { AttachedFile } from "../types";

interface FileAttachmentZoneProps {
  file: AttachedFile | null;
  onFileChange: (file: AttachedFile | null) => void;
  maxSizeMB?: number;
}

export default function FileAttachmentZone({
  file,
  onFileChange,
  maxSizeMB = 10
}: FileAttachmentZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (rawFile: globalThis.File) => {
    setErrorMsg("");

    // Check size limit (default 10MB)
    const limitBytes = maxSizeMB * 1024 * 1024;
    if (rawFile.size > limitBytes) {
      setErrorMsg(`File exceeds the maximum size of ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setErrorMsg("Failed to read file contents.");
        return;
      }

      const parts = dataUrl.split(",");
      const base64Data = parts[1];
      const mimeType = rawFile.type || "application/octet-stream";

      onFileChange({
        name: rawFile.name,
        mimeType,
        data: base64Data,
        size: rawFile.size
      });
    };

    reader.onerror = () => {
      setErrorMsg("An error occurred while reading the file.");
    };

    // Read file as Data URL to support both image rendering and base64 retrieval
    reader.readAsDataURL(rawFile);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const rawFile = e.dataTransfer.files[0];
      processFile(rawFile);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const rawFile = e.target.files[0];
      processFile(rawFile);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    setErrorMsg("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImage = file?.mimeType.startsWith("image/");
  const isPdf = file?.mimeType === "application/pdf";

  return (
    <div className="w-full flex flex-col gap-1.5" id="file-attachment-zone-container">
      {file ? (
        <div 
          className="relative flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg shadow-sm transition-all animate-fade-in"
          id="file-preview-card"
        >
          {/* File Thumbnail or Icon representation */}
          {isImage ? (
            <div className="w-12 h-12 rounded border border-indigo-200 overflow-hidden bg-white flex items-center justify-center shrink-0">
              <img 
                src={`data:${file.mimeType};base64,${file.data}`} 
                alt={file.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded border border-indigo-200 bg-white flex items-center justify-center shrink-0 text-indigo-600">
              {isPdf ? (
                <FileText className="w-6 h-6" />
              ) : (
                <File className="w-6 h-6" />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {formatSize(file.size)} • {file.mimeType}
            </p>
          </div>

          <button
            onClick={handleClear}
            className="p-1.5 rounded-full hover:bg-indigo-100/80 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
            title="Remove attachment"
            id="btn-remove-attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/30 text-indigo-700"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 text-slate-500"
          }`}
          id="dropzone-area"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf,text/*"
            className="hidden"
          />
          <Upload className={`w-5 h-5 mb-1.5 transition-transform ${isDragging ? "translate-y-[-2px] text-indigo-500" : "text-slate-400"}`} />
          <p className="text-xs font-semibold text-slate-700">
            Drop or click to attach image, PDF, or document
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Supports PNG, JPG, WEBP, PDF, and plain text files up to {maxSizeMB}MB
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="text-[10px] text-rose-500 font-semibold px-1 animate-pulse" id="upload-error-msg">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
