"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ImageIcon, VideoIcon, FileIcon, X, Image as ImageSearchIcon } from "lucide-react";
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { UnsplashImagePicker } from '@/components/UnsplashImagePicker';

interface CreateDebateTopicFormProps {
  setOpen?: (open: boolean) => void;
  onCreated?: (topic: any) => void;
}

export function CreateDebateTopicForm({ setOpen, onCreated }: CreateDebateTopicFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false);
  const [unsplashImageUrl, setUnsplashImageUrl] = useState<string | null>(null);
  const [unsplashAttribution, setUnsplashAttribution] = useState<{
    photographerName: string;
    photographerUsername: string;
    photographerUrl: string;
  } | null>(null);
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRecorderRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start video recording
  const startRecording = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera Not Available",
          description: "Video recording requires HTTPS. Please use the 'Upload Video' option instead.",
          variant: "destructive",
        });
        setShowRecorder(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });

      if (videoRecorderRef.current) {
        videoRecorderRef.current.srcObject = stream;
        videoRecorderRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
        
        setSelectedVideo(file);
        const url = URL.createObjectURL(blob);
        setVideoPreview(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setShowRecorder(false);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to record videos.",
        variant: "destructive",
      });
      setShowRecorder(false);
    }
  };

  // Stop video recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      const stream = videoRecorderRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setShowRecorder(false);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear video if image is selected
      setSelectedVideo(null);
      setVideoPreview(null);

      try {
        // Compress image to ensure it's under 4MB (Vercel limit)
        const options = {
          maxSizeMB: 3.5, // Target 3.5MB to stay safely under 4MB limit
          maxWidthOrHeight: 1920, // Max dimension
          useWebWorker: true,
          fileType: 'image/jpeg' as const // Convert to JPEG for better compression
        };

        const compressedFile = await imageCompression(file, options);

        // Show compression result
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        console.log(`Image compressed: ${originalSize}MB → ${compressedSize}MB`);

        setSelectedFile(compressedFile);

        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);

      } catch (error) {
        console.error('Error compressing image:', error);
        toast({
          title: "Image Compression Failed",
          description: "Could not process the image. Please try a different image.",
          variant: "destructive",
        });
      }
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's actually a video file
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid video file.",
          variant: "destructive",
        });
        // Reset input
        if (videoInputRef.current) videoInputRef.current.value = '';
        return;
      }

      setSelectedVideo(file);
      // Clear image if video is selected
      setSelectedFile(null);
      setImagePreview(null);
      
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoPreview(reader.result as string);
        };
        reader.onerror = () => {
          toast({
            title: "Video Load Error",
            description: "Could not load the video. Please try again.",
            variant: "destructive",
          });
          setSelectedVideo(null);
          if (videoInputRef.current) videoInputRef.current.value = '';
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error loading video:', error);
        toast({
          title: "Video Load Error",
          description: "Could not load the video. Please try again.",
          variant: "destructive",
        });
        setSelectedVideo(null);
        if (videoInputRef.current) videoInputRef.current.value = '';
      }
    } else {
      // User cancelled the camera/file picker
      console.log('Video selection cancelled');
    }
  };

  const removeMedia = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setSelectedVideo(null);
    setVideoPreview(null);
    setUnsplashImageUrl(null);
    setUnsplashAttribution(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleUnsplashSelect = (photo: any) => {
    // Clear other media
    setSelectedFile(null);
    setImagePreview(null);
    setSelectedVideo(null);
    setVideoPreview(null);

    // Set Unsplash image URL (use regular size for good quality)
    setUnsplashImageUrl(photo.urls.regular);
    
    // Store attribution info
    setUnsplashAttribution({
      photographerName: photo.user.name,
      photographerUsername: photo.user.username,
      photographerUrl: photo.user.links.html,
    });

    toast({
      title: "Image selected!",
      description: `Photo by ${photo.user.name} from Unsplash`,
    });
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

      // Use Unsplash image URL if selected
      if (unsplashImageUrl) {
        imageUrl = unsplashImageUrl;
      }
      // Otherwise upload media if present
      else if (selectedFile || selectedVideo) {
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

      // Close modal if in modal mode
      setOpen?.(false);

      // Navigate to the new debate page
      router.push(`/debates/${newTopic.id}`);
      router.refresh();

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
        <div className="flex gap-2 mb-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Upload Image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUnsplashPicker(true)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ImageSearchIcon className="w-4 h-4" />
            Search Unsplash
          </Button>
          {/* Only show Record Video button on HTTPS (production) */}
          {typeof window !== 'undefined' && window.location.protocol === 'https:' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRecorder(true)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <VideoIcon className="w-4 h-4" />
              Record Video
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => videoInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <VideoIcon className="w-4 h-4" />
            Upload Video
          </Button>
        </div>

        {/* Video Recorder Interface */}
        {showRecorder && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex-1 relative">
              <video
                ref={videoRecorderRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  {formatTime(recordingTime)}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-black/90 p-6 flex items-center justify-center gap-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={cancelRecording}
                className="rounded-full w-16 h-16"
              >
                <X className="w-6 h-6" />
              </Button>

              {!isRecording ? (
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  onClick={startRecording}
                  className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600"
                >
                  <div className="w-6 h-6 bg-white rounded-full" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  onClick={stopRecording}
                  className="rounded-full w-20 h-20 bg-white hover:bg-gray-200"
                >
                  <div className="w-6 h-6 bg-red-500 rounded" />
                </Button>
              )}

              <div className="w-16" />
            </div>
          </div>
        )}

        {/* Unsplash Image Preview */}
        {unsplashImageUrl && unsplashAttribution && (
          <div className="relative w-full max-w-md mb-3">
            <div className="relative w-full aspect-video">
              <Image 
                src={unsplashImageUrl} 
                alt="Selected from Unsplash" 
                fill 
                className="object-cover rounded-lg border" 
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
            <p className="text-xs text-muted-foreground mt-2">
              Photo by{' '}
              <a
                href={`${unsplashAttribution.photographerUrl}?utm_source=studio&utm_medium=referral`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                {unsplashAttribution.photographerName}
              </a>
              {' '}on{' '}
              <a
                href="https://unsplash.com?utm_source=studio&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Unsplash
              </a>
            </p>
          </div>
        )}

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
          aria-label="Upload image"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*,video/mp4,video/quicktime"
          onChange={handleVideoChange}
          className="hidden"
          aria-label="Upload or record video"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {setOpen && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
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

      {/* Unsplash Image Picker Modal */}
      <UnsplashImagePicker
        isOpen={showUnsplashPicker}
        onClose={() => setShowUnsplashPicker(false)}
        onSelect={handleUnsplashSelect}
      />
    </form>
  );
}