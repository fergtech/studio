"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ImageIcon, VideoIcon, FileIcon, X } from "lucide-react";
import Image from 'next/image';

interface CreateDebateTopicFormProps {
  setOpen: (open: boolean) => void;
  onCreated?: (topic: any) => void;
}

export function CreateDebateTopicForm({ setOpen, onCreated }: CreateDebateTopicFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Clear video if image is selected
      setSelectedVideo(null);
      setVideoPreview(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      // Clear image if video is selected
      setSelectedFile(null);
      setImagePreview(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setSelectedVideo(null);
    setVideoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for your debate topic.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | undefined;

      // Upload media if present
      const fileToUpload = selectedFile || selectedVideo;
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('filePath', 'debates/media');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResponse.ok && uploadResult.imageUrl) {
          imageUrl = uploadResult.imageUrl;
        } else {
          toast({
            title: "Media Upload Failed",
            description: uploadResult.message || "Could not upload the media file.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Create debate topic
      const response = await fetch('/api/debates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create debate topic');
      }

      const newTopic = await response.json();

      toast({
        title: "Debate Topic Created!",
        description: "Your debate topic has been created and is now live for discussion.",
      });

      // Reset form
      setTitle('');
      setContent('');
      removeMedia();

      // Call callbacks
      onCreated?.(newTopic);

      // Close modal
      setOpen(false);

      // Refresh the page to show the new debate with correct data from server
      window.location.reload();

    } catch (error) {
      console.error('Error creating debate topic:', error);
      toast({
        title: "Error",
        description: "Failed to create debate topic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Debate Topic Title *
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What topic should people debate about?"
          maxLength={200}
          disabled={loading}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {title.length}/200 characters
        </p>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Description & Context *
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Provide context, background information, or specific questions you want people to debate..."
          rows={4}
          maxLength={2000}
          disabled={loading}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {content.length}/2000 characters
        </p>
      </div>

      {/* Media Upload Section */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Add Media (Optional)
        </label>
        <div className="flex gap-2 mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Add Image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => videoInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <VideoIcon className="w-4 h-4" />
            Add Video
          </Button>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="relative w-40 h-40 mb-3">
            <Image 
              src={imagePreview} 
              alt="Preview" 
              fill 
              className="object-cover rounded border" 
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={removeMedia}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Video Preview */}
        {videoPreview && selectedVideo && (
          <div className="relative w-60 mb-3">
            <video 
              src={videoPreview} 
              controls 
              className="w-full max-h-40 rounded border bg-black"
              preload="metadata"
            />
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <p className="font-medium">{selectedVideo.name}</p>
              <p className="text-muted-foreground text-xs">
                {(selectedVideo.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={removeMedia}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
          className="hidden"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Debate'
          )}
        </Button>
      </div>
    </form>
  );
}