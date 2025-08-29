"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import Image from 'next/image';
import { useRef } from "react";
import { Image as ImageIcon, Video, File as FileIcon, Link as LinkIcon, Smile, Mic } from 'lucide-react';
import { AudioPlayer } from '@/components/ui/audio-player';
import { LinkPreview, LinkPreviewLoading, LinkPreviewError } from '@/components/ui/link-preview';
import { DocumentPreview } from '@/components/ui/document-preview';
import { Input } from '@/components/ui/input';

interface CreateSocietyPostFormProps {
  societyId: string;
  userId: string | undefined;
  isMember: boolean;
  onPostCreated: (post: any) => void;
}

export function CreateSocietyPostForm({ societyId, userId, isMember, onPostCreated }: CreateSocietyPostFormProps) {
  const [type, setType] = useState("GENERAL");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
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
  const MAX_LINKS = 5;
  const MAX_DOCUMENTS = 5;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Only allow members to create posts
  if (!userId || !isMember) {
    if (!userId) return null;
    
    // Show message for non-members
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">Join to Participate</h3>
          <p className="text-muted-foreground text-sm">
            You must be a member of this society to create posts and participate in discussions.
          </p>
        </div>
      </div>
    );
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Clear other media selections if image is selected
      setSelectedVideo(null);
      setVideoPreview(null);
      setSelectedAudio(null);
      setAudioPreview(null);
      setLinks([]);
      setDocuments([]);
      setShowLinkInput(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      // Clear other media selections if video is selected
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedAudio(null);
      setAudioPreview(null);
      setLinks([]);
      setDocuments([]);
      setShowLinkInput(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedVideo(null);
      setVideoPreview(null);
    }
  };

  const handleAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAudio(file);
      // Clear other media selections if audio is selected
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedVideo(null);
      setVideoPreview(null);
      setLinks([]);
      setShowLinkInput(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedAudio(null);
      setAudioPreview(null);
    }
  };

  const handleLinkButtonClick = () => {
    if (links.length >= MAX_LINKS) return;
    
    // Clear other media when link is selected
    setSelectedFile(null);
    setImagePreview(null);
    setSelectedVideo(null);
    setVideoPreview(null);
    setSelectedAudio(null);
    setAudioPreview(null);
    setShowLinkInput(true);
  };

  const handleAddLink = async (url: string) => {
    if (links.length >= MAX_LINKS) return;
    
    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return; // Invalid URL, don't add
    }
    
    // Check if URL already exists
    if (links.some(link => link.url === url)) {
      return; // Duplicate URL
    }
    
    const linkId = Math.random().toString(36).substr(2, 9);
    const newLink = {
      id: linkId,
      url,
      metadata: null,
      loading: true,
      error: null,
    };
    
    setLinks(prev => [...prev, newLink]);
    
    try {
      const response = await fetch('/api/link-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      const result = await response.json();
      
      setLinks(prev => prev.map(link => 
        link.id === linkId 
          ? {
              ...link,
              loading: false,
              metadata: response.ok && result.success ? result.metadata : null,
              error: response.ok && result.success ? null : (result.error || 'Failed to load link preview')
            }
          : link
      ));
    } catch (error) {
      setLinks(prev => prev.map(link => 
        link.id === linkId 
          ? { ...link, loading: false, error: 'Failed to load link preview' }
          : link
      ));
    }
  };

  const handleRemoveLink = (linkId: string) => {
    setLinks(prev => prev.filter(link => link.id !== linkId));
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(async (file) => {
      if (documents.length >= MAX_DOCUMENTS) return;
      
      // Check if document already exists
      if (documents.some(doc => doc.file.name === file.name && doc.file.size === file.size)) {
        return; // Duplicate document
      }
      
      // Clear other media selections if document is selected
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedVideo(null);
      setVideoPreview(null);
      setSelectedAudio(null);
      setAudioPreview(null);
      setLinks([]);
      setShowLinkInput(false);
      
      const documentId = Math.random().toString(36).substr(2, 9);
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const newDocument = {
        id: documentId,
        file,
        metadata: null,
        uploading: true,
        error: null,
      };
      
      setDocuments(prev => [...prev, newDocument]);
      
      try {
        // Upload document to Azure Storage
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', `societies/documents/${societyId}`);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        console.log('Document upload response:', { response: response.ok, result });
        
        if (response.ok && (result.imageUrl || result.message)) {
          const metadata = {
            url: result.imageUrl,
            filename: file.name,
            fileType: file.type,
            fileSize: file.size,
            extension,
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
          };
          
          setDocuments(prev => prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, uploading: false, metadata }
              : doc
          ));
        } else {
          console.error('Document upload failed:', result);
          setDocuments(prev => prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, uploading: false, error: result.error || result.message || 'Failed to upload document' }
              : doc
          ));
        }
      } catch (error) {
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, uploading: false, error: 'Failed to upload document' }
            : doc
        ));
      }
    });
    
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    let imageUrl: string | undefined = undefined;
    try {
      // Upload image, video, or audio if selected
      const fileToUpload = selectedFile || selectedVideo || selectedAudio;
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('filePath', `societies/posts/${societyId}`);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (response.ok && result.imageUrl) {
          imageUrl = result.imageUrl;
        } else {
          const fileType = selectedFile ? 'Image' : selectedVideo ? 'Video' : 'Audio';
          toast({ title: `${fileType} Upload Failed`, description: result.message || result.error || `Could not upload the ${fileType.toLowerCase()}.`, variant: 'destructive' });
          setLoading(false);
          return;
        }
      }
      // Prepare post data including link metadata
      const postData: any = { type, content, userId, imageUrl };
      
      // Include links data if present
      const validLinks = links.filter(link => link.metadata && !link.error);
      if (validLinks.length > 0) {
        postData.links = validLinks.map((link, index) => ({
          url: link.metadata.url,
          metadata: link.metadata,
          order: index
        }));
      }
      
      // Include documents data if present
      const validDocuments = documents.filter(doc => doc.metadata && !doc.error);
      if (validDocuments.length > 0) {
        postData.documents = validDocuments.map((doc, index) => ({
          url: doc.metadata!.url,
          metadata: doc.metadata,
          order: index
        }));
      }
      
      const res = await fetch(`/api/societies/${societyId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      if (!res.ok) throw new Error("Failed to create post");
      const post = await res.json();
      setContent("");
      setType("GENERAL");
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedVideo(null);
      setVideoPreview(null);
      setSelectedAudio(null);
      setAudioPreview(null);
      setLinks([]);
      setDocuments([]);
      setShowLinkInput(false);
      onPostCreated(post);
      toast({ title: "Post created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex gap-2 mb-2">
        <Button type="button" size="sm" variant={type === "GENERAL" ? "default" : "outline"} onClick={() => setType("GENERAL")}>General Post</Button>
        <Button type="button" size="sm" variant={type === "ISSUE" ? "default" : "outline"} onClick={() => setType("ISSUE")}>Issue</Button>
        <Button type="button" size="sm" variant={type === "IDEA" ? "default" : "outline"} onClick={() => setType("IDEA")}>Idea</Button>
      </div>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={`Share an update about the society...`}
        className="min-h-[80px] bg-background border-none focus:ring-0 text-base"
        disabled={loading}
      />
      <div className="flex items-center gap-2 mb-2">
        <Smile className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Add emoji</span>
      </div>
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 py-1.5 border-dashed border-2 border-primary/40 hover:border-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <ImageIcon className="w-4 h-4" /> Add Image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 py-1.5 border-dashed border-2 border-primary/40 hover:border-primary"
          onClick={() => videoInputRef.current?.click()}
          disabled={loading}
        >
          <Video className="w-4 h-4" /> Add Video
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 py-1.5 border-dashed border-2 border-primary/40 hover:border-primary"
          onClick={() => audioInputRef.current?.click()}
          disabled={loading}
        >
          <Mic className="w-4 h-4" /> Add Audio
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 px-3 py-1.5 border-dashed border-2 border-primary/40 hover:border-primary ${documents.length >= MAX_DOCUMENTS ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => documentInputRef.current?.click()}
          disabled={loading || documents.length >= MAX_DOCUMENTS}
        >
          <FileIcon className="w-4 h-4" /> Add Document {documents.length > 0 && `(${documents.length}/${MAX_DOCUMENTS})`}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 px-3 py-1.5 border-dashed border-2 border-primary/40 hover:border-primary ${links.length >= MAX_LINKS ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleLinkButtonClick}
          disabled={loading || links.length >= MAX_LINKS}
        >
          <LinkIcon className="w-4 h-4" /> Add Link {links.length > 0 && `(${links.length}/${MAX_LINKS})`}
        </Button>
      </div>
      {imagePreview && (
        <div className="relative w-40 h-40 mb-2">
          <Image src={imagePreview} alt="Preview" fill className="object-contain rounded border" />
          <Button type="button" size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => { setSelectedFile(null); setImagePreview(null); }}>Remove</Button>
        </div>
      )}
      {videoPreview && selectedVideo && (
        <div className="relative w-60 mb-2">
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
            variant="outline" 
            className="absolute top-2 right-2" 
            onClick={() => { 
              setSelectedVideo(null); 
              setVideoPreview(null); 
            }}
          >
            Remove
          </Button>
        </div>
      )}
      {audioPreview && selectedAudio && (
        <div className="relative w-full mb-2">
          <div className="p-3 bg-muted rounded border">
            <div className="mb-2">
              <p className="font-medium text-sm">{selectedAudio.name}</p>
              <p className="text-muted-foreground text-xs">
                {(selectedAudio.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <AudioPlayer 
              src={audioPreview} 
              compact={true}
              className="bg-background"
            />
          </div>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="absolute top-2 right-2" 
            onClick={() => { 
              setSelectedAudio(null); 
              setAudioPreview(null); 
            }}
          >
            Remove
          </Button>
        </div>
      )}
      {showLinkInput && (
        <div className="mb-2">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter a URL to share..."
              className="flex-1"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const url = e.currentTarget.value.trim();
                  if (url) {
                    handleAddLink(url);
                    e.currentTarget.value = '';
                    if (links.length + 1 >= MAX_LINKS) {
                      setShowLinkInput(false);
                    }
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLinkInput(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Press Enter to add link • {MAX_LINKS - links.length} remaining
          </p>
        </div>
      )}
      
      {/* Multiple Links Display */}
      {links.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Links ({links.length}/{MAX_LINKS})</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {links.map((link) => (
              <div key={link.id} className="flex-shrink-0 w-80">
                {link.loading && (
                  <LinkPreviewLoading compact={true} />
                )}
                {link.error && (
                  <LinkPreviewError
                    url={link.url}
                    error={link.error}
                    onRetry={() => handleAddLink(link.url)}
                    onRemove={() => handleRemoveLink(link.id)}
                  />
                )}
                {link.metadata && !link.loading && !link.error && (
                  <LinkPreview
                    metadata={link.metadata}
                    compact={true}
                    showRemove={true}
                    onRemove={() => handleRemoveLink(link.id)}
                    editable={true}
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Multiple Documents Display */}
      {documents.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Documents ({documents.length}/{MAX_DOCUMENTS})</span>
          </div>
          <div 
            className="flex gap-3 overflow-x-auto pb-2" 
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
            }}
          >
            {documents.map((document) => (
              <div key={document.id} className="flex-shrink-0 w-80">
                {document.uploading && (
                  <div className="border border-border rounded-lg bg-card p-3">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Uploading...</div>
                        <div className="text-xs text-muted-foreground">{document.file.name}</div>
                      </div>
                    </div>
                  </div>
                )}
                {document.error && (
                  <div className="border border-destructive rounded-lg bg-destructive/10 p-3">
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-8 h-8 text-destructive" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-destructive">Upload failed</div>
                        <div className="text-xs text-muted-foreground">{document.file.name}</div>
                        <div className="text-xs text-destructive">{document.error}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveDocument(document.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
                {document.metadata && !document.uploading && !document.error && (
                  <div className="relative">
                    <DocumentPreview
                      metadata={document.metadata}
                      compact={true}
                      creationMode={true}
                      className="w-full"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveDocument(document.id)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoChange}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioChange}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,text/markdown,application/rtf"
        onChange={handleDocumentChange}
        multiple
        className="hidden"
      />
      <div className="flex justify-end">
        <Button type="submit" className="px-6 py-2 text-base" disabled={loading || !content.trim()}>{loading ? "Posting..." : "Post"}</Button>
      </div>
    </form>
  );
} 