"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import Image from 'next/image';
import { Image as ImageIcon, Video, File as FileIcon, Link as LinkIcon, Smile, Mic, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AudioPlayer } from '@/components/ui/audio-player';
import { LinkPreview, LinkPreviewLoading, LinkPreviewError } from '@/components/ui/link-preview';
import { DocumentPreview } from '@/components/ui/document-preview';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateUpdateFormProps {
  initiativeId: string;
  onPostUpdate: (updateData: {
    content: string;
    imageUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    links?: any[];
    documents?: any[];
  }) => void;
}

export function CreateUpdateForm({ initiativeId, onPostUpdate }: CreateUpdateFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [resourceCategory, setResourceCategory] = useState<string>('');
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [links, setLinks] = useState<Array<{
    id: string;
    url: string;
    metadata: any | null;
    loading: boolean;
    error: string | null;
  }>>([]);
  const [documents, setDocuments] = useState<Array<{
    id: string;
    file: File;
    metadata: {
      url: string;
      filename: string;
      fileType: string;
      fileSize: number;
      extension: string;
      title?: string;
      description?: string;
    } | null;
    uploading: boolean;
    error: string | null;
  }>>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const MAX_LINKS = 5;
  const MAX_DOCUMENTS = 5;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Common emojis for the picker
  const emojiCategories = {
    "Faces": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳"],
    "Gestures": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏"],
    "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
    "Objects": ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🔥", "💯", "✨", "⭐", "🌟", "💫"]
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Clear other media
      setSelectedVideo(null);
      setVideoPreview(null);
      setSelectedAudio(null);
      setAudioPreview(null);
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
      // Clear other media
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedAudio(null);
      setAudioPreview(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAudio(file);
      // Clear other media
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedVideo(null);
      setVideoPreview(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLink = async (url: string) => {
    if (!url.trim()) return;
    if (links.length >= MAX_LINKS) {
      toast({
        title: "Maximum links reached",
        description: `You can only add up to ${MAX_LINKS} links per update.`,
        variant: "destructive"
      });
      return;
    }

    const linkId = Math.random().toString(36).substr(2, 9);
    const newLink = {
      id: linkId,
      url: url.trim(),
      metadata: null,
      loading: true,
      error: null
    };

    setLinks(prev => [...prev, newLink]);
    setShowLinkInput(false);

    // Fetch link preview metadata
    try {
      const response = await fetch('/api/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!response.ok) throw new Error('Failed to fetch preview');

      const metadata = await response.json();
      setLinks(prev => prev.map(link =>
        link.id === linkId
          ? { ...link, metadata, loading: false }
          : link
      ));
    } catch (error) {
      setLinks(prev => prev.map(link =>
        link.id === linkId
          ? { ...link, loading: false, error: 'Failed to load preview' }
          : link
      ));
    }
  };

  const handleRemoveLink = (linkId: string) => {
    setLinks(prev => prev.filter(link => link.id !== linkId));
  };

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (documents.length + files.length > MAX_DOCUMENTS) {
      toast({
        title: "Maximum documents reached",
        description: `You can only add up to ${MAX_DOCUMENTS} documents per update.`,
        variant: "destructive"
      });
      return;
    }

    const newDocs = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      metadata: null,
      uploading: true,
      error: null
    }));

    setDocuments(prev => [...prev, ...newDocs]);

    // Upload each document
    for (const doc of newDocs) {
      try {
        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('filePath', `initiatives/documents/${initiativeId}`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const result = await response.json();

        const metadata = {
          url: result.imageUrl,
          filename: doc.file.name,
          fileType: doc.file.type,
          fileSize: doc.file.size,
          extension: doc.file.name.split('.').pop() || '',
          title: doc.file.name.replace(/\.[^/.]+$/, ''),
          description: ''
        };

        setDocuments(prev => prev.map(d =>
          d.id === doc.id
            ? { ...d, metadata, uploading: false }
            : d
        ));
      } catch (error) {
        setDocuments(prev => prev.map(d =>
          d.id === doc.id
            ? { ...d, uploading: false, error: 'Upload failed' }
            : d
        ));
      }
    }

    // Reset file input
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleLinkButtonClick = () => {
    setShowLinkInput(!showLinkInput);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your update.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | undefined;
      let mediaType: 'image' | 'video' | 'audio' | undefined;

      // Upload media file if selected
      const fileToUpload = selectedFile || selectedVideo || selectedAudio;
      if (fileToUpload) {
        // Determine media type
        if (selectedFile) mediaType = 'image';
        else if (selectedVideo) mediaType = 'video';
        else if (selectedAudio) mediaType = 'audio';

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('filePath', `initiatives/posts/${initiativeId}`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload media');
        }

        const result = await response.json();
        imageUrl = result.imageUrl;
      }

      // Prepare links data
      const linksData = links
        .filter(link => link.metadata && !link.error)
        .map(link => ({
          url: link.url,
          title: link.metadata?.title || '',
          description: link.metadata?.description || '',
          imageUrl: link.metadata?.image || link.metadata?.imageUrl || null,
          siteName: link.metadata?.siteName || null,
          category: resourceCategory || null
        }));

      // Prepare documents data
      const documentsData = documents
        .filter(doc => doc.metadata && !doc.error)
        .map(doc => ({
          ...doc.metadata!,
          category: resourceCategory || null
        }));

      // Call parent callback
      onPostUpdate({
        content,
        imageUrl,
        mediaType,
        links: linksData.length > 0 ? linksData : undefined,
        documents: documentsData.length > 0 ? documentsData : undefined
      });

      // Reset form
      setContent("");
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedVideo(null);
      setVideoPreview(null);
      setSelectedAudio(null);
      setAudioPreview(null);
      setLinks([]);
      setDocuments([]);
      setShowLinkInput(false);
      setResourceCategory('');

      toast({
        title: "Update posted!",
        description: "Your update has been shared with the initiative.",
      });
    } catch (error) {
      console.error("Error posting update:", error);
      toast({
        title: "Error",
        description: "Failed to post update. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            ref={textareaRef}
            placeholder="Share an update about the initiative..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />

          {/* Resource Category Selection - shown when links or documents are added */}
          {(links.length > 0 || documents.length > 0) && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">
                Resource Category:
              </label>
              <Select value={resourceCategory} onValueChange={setResourceCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Reference">Reference</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                </SelectContent>
              </Select>
              {resourceCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setResourceCategory('')}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <Image src={imagePreview} alt="Preview" width={400} height={300} className="rounded-lg object-cover w-full" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedFile(null);
                  setImagePreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Video Preview */}
          {videoPreview && (
            <div className="relative">
              <video src={videoPreview} controls className="rounded-lg w-full max-h-96" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedVideo(null);
                  setVideoPreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Audio Preview */}
          {audioPreview && (
            <div className="relative">
              <AudioPlayer src={audioPreview} className="w-full" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedAudio(null);
                  setAudioPreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Link Previews */}
          {links.map(link => (
            <div key={link.id} className="relative">
              {link.loading && <LinkPreviewLoading />}
              {link.error && (
                <LinkPreviewError
                  url={link.url}
                  error={link.error}
                  onRemove={() => handleRemoveLink(link.id)}
                />
              )}
              {link.metadata && (
                <LinkPreview
                  metadata={{
                    url: link.url,
                    title: link.metadata.title,
                    description: link.metadata.description,
                    image: link.metadata.image || link.metadata.imageUrl,
                    siteName: link.metadata.siteName
                  }}
                  showRemove={true}
                  onRemove={() => handleRemoveLink(link.id)}
                  editable={true}
                />
              )}
            </div>
          ))}

          {/* Document Previews */}
          {documents.map(doc => (
            <div key={doc.id} className="relative">
              {doc.uploading && (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Uploading {doc.file.name}...</span>
                </div>
              )}
              {doc.error && (
                <div className="flex items-center justify-between gap-2 p-2 border border-destructive rounded bg-destructive/10">
                  <span className="text-sm text-destructive">{doc.error}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDocument(doc.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {doc.metadata && (
                <div className="relative">
                  <DocumentPreview
                    metadata={doc.metadata}
                    creationMode={true}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveDocument(doc.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Link Input */}
          {showLinkInput && (
            <div className="flex gap-2">
              <Input
                placeholder="Paste link URL..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLink(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLinkInput(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {/* Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!selectedVideo || !!selectedAudio}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>

              {/* Video Upload */}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={!!selectedFile || !!selectedAudio}
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>

              {/* Audio Upload */}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => audioInputRef.current?.click()}
                disabled={!!selectedFile || !!selectedVideo}
              >
                <Mic className="w-4 h-4 mr-2" />
                Audio
              </Button>

              {/* Document Upload */}
              <input
                ref={documentInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                multiple
                onChange={handleDocumentChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => documentInputRef.current?.click()}
                disabled={documents.length >= MAX_DOCUMENTS}
              >
                <FileIcon className="w-4 h-4 mr-2" />
                Document
              </Button>

              {/* Link */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLinkButtonClick}
                disabled={links.length >= MAX_LINKS}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Link
              </Button>

              {/* Emoji Picker */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    <Smile className="w-4 h-4 mr-2" />
                    Emoji
                  </Button>
                </PopoverTrigger>
                <PopoverContent ref={emojiPickerRef} className="w-80 p-2">
                  <div className="space-y-2">
                    {Object.entries(emojiCategories).map(([category, emojis]) => (
                      <div key={category}>
                        <p className="text-xs font-semibold mb-1">{category}</p>
                        <div className="flex flex-wrap gap-1">
                          {emojis.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              className="text-xl hover:bg-accent rounded p-1"
                              onClick={() => insertEmoji(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              type="submit"
              disabled={!content.trim() || loading}
            >
              {loading ? "Posting..." : "Post Update"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
