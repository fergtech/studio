"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import Image from 'next/image';
import { useRef } from "react";
import { Image as ImageIcon, Video, File as FileIcon, Link as LinkIcon, Smile } from 'lucide-react';

interface CreateSocietyPostFormProps {
  societyId: string;
  userId: string | undefined;
  onPostCreated: (post: any) => void;
}

export function CreateSocietyPostForm({ societyId, userId, onPostCreated }: CreateSocietyPostFormProps) {
  const [type, setType] = useState("GENERAL");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!userId) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    let imageUrl: string | undefined = undefined;
    try {
      // Upload image if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('filePath', `societies/posts/${societyId}`);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (response.ok && result.imageUrl) {
          imageUrl = result.imageUrl;
        } else {
          toast({ title: 'Image Upload Failed', description: result.message || result.error || 'Could not upload the image.', variant: 'destructive' });
          setLoading(false);
          return;
        }
      }
      const res = await fetch(`/api/societies/${societyId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, userId, imageUrl }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      const post = await res.json();
      setContent("");
      setType("GENERAL");
      setSelectedFile(null);
      setImagePreview(null);
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
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2 opacity-50 cursor-not-allowed" disabled>
          <Video className="w-4 h-4" /> Add Video
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2 opacity-50 cursor-not-allowed" disabled>
          <FileIcon className="w-4 h-4" /> Add File
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2 opacity-50 cursor-not-allowed" disabled>
          <LinkIcon className="w-4 h-4" /> Add Link
        </Button>
      </div>
      {imagePreview && (
        <div className="relative w-40 h-40 mb-2">
          <Image src={imagePreview} alt="Preview" fill className="object-contain rounded border" />
          <Button type="button" size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => { setSelectedFile(null); setImagePreview(null); }}>Remove</Button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex justify-end">
        <Button type="submit" className="px-6 py-2 text-base" disabled={loading || !content.trim()}>{loading ? "Posting..." : "Post"}</Button>
      </div>
    </form>
  );
} 