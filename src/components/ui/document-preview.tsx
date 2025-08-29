"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Download, ExternalLink, File, FileType } from 'lucide-react';
import { Button } from './button';

interface DocumentMetadata {
  url: string;
  filename: string;
  fileType: string;
  fileSize: number;
  extension: string;
  title?: string;
  description?: string;
}

interface DocumentPreviewProps {
  metadata: DocumentMetadata;
  className?: string;
  compact?: boolean;
  creationMode?: boolean; // Hide action buttons during post creation
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file icon
const getFileIcon = (extension: string) => {
  const ext = extension.toLowerCase();
  switch (ext) {
    case '.pdf':
      return <FileText className="w-8 h-8 text-red-500" />;
    case '.docx':
    case '.doc':
      return <FileType className="w-8 h-8 text-blue-500" />;
    case '.txt':
    case '.md':
    case '.rtf':
      return <File className="w-8 h-8 text-gray-500" />;
    default:
      return <File className="w-8 h-8 text-gray-500" />;
  }
};

// Helper function to get file type color
const getFileTypeColor = (extension: string) => {
  const ext = extension.toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'text-red-600 bg-red-50 border-red-200';
    case '.docx':
    case '.doc':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case '.txt':
    case '.md':
    case '.rtf':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export function DocumentPreview({ metadata, className = '', compact = false, creationMode = false }: DocumentPreviewProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(metadata.url, '_blank');
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(metadata.url, '_blank');
  };

  if (compact) {
    return (
      <div className={cn(
        "border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors p-3",
        className
      )}>
        <div className="flex items-center gap-3">
          {getFileIcon(metadata.extension)}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {metadata.title || metadata.filename}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn(
                "px-1.5 py-0.5 rounded border text-xs font-medium",
                getFileTypeColor(metadata.extension)
              )}>
                {metadata.extension.replace('.', '').toUpperCase()}
              </span>
              <span>{formatFileSize(metadata.fileSize)}</span>
            </div>
          </div>
          {!creationMode && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpen}
                className="h-8 w-8"
                title="Open document"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8"
                title="Download document"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors",
      className
    )}>
      <div className="p-4">
        {/* Header with icon and file info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            {getFileIcon(metadata.extension)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">
              {metadata.title || metadata.filename}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "px-2 py-1 rounded border text-xs font-medium",
                getFileTypeColor(metadata.extension)
              )}>
                {metadata.extension.replace('.', '').toUpperCase()}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatFileSize(metadata.fileSize)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {metadata.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {metadata.description}
          </p>
        )}

        {/* Actions */}
        {!creationMode && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpen}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        )}
      </div>

      {/* PDF Preview (if applicable) */}
      {metadata.extension.toLowerCase() === '.pdf' && (
        <div className="border-t border-border">
          <div className="p-2 bg-muted/30">
            <iframe
              src={`${metadata.url}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-48 rounded border"
              title={`Preview of ${metadata.filename}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}