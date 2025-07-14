'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image as ImageIcon } from 'lucide-react';

interface CreateUpdateFormProps {
  initiativeId: string;
  onPostUpdate: (updateData: { content: string; imageUrl?: string }) => void;
}

export function CreateUpdateForm({ initiativeId, onPostUpdate }: CreateUpdateFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('initiativeId', initiativeId);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        imageUrl = data.url;
      }

      onPostUpdate({ content, imageUrl });
      setContent('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error posting update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Share an update about the initiative..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          {/* Emoji Picker UI (UI only, no logic) */}
          <div className="mt-2 flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" title="Add Emoji" disabled>
              <span role="img" aria-label="emoji">😊</span>
            </Button>
            <span className="text-xs text-muted-foreground">Add emoji</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            {/* Horizontally scrollable action buttons */}
            <div className="relative w-0 flex-1">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent max-w-full pr-8">
                {/* Image Upload */}
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label htmlFor="image-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Image
                  </Button>
                </label>
                {/* Video Upload (UI only) */}
                <input
                  type="file"
                  id="video-upload"
                  accept="video/*"
                  className="hidden"
                  disabled
                />
                <label htmlFor="video-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled
                  >
                    <span role="img" aria-label="video">🎥</span>
                    Add Video
                  </Button>
                </label>
                {/* File Upload (docs, UI only) */}
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                  className="hidden"
                  disabled
                />
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled
                  >
                    <span role="img" aria-label="file">📄</span>
                    Add File
                  </Button>
                </label>
                {/* Link Attachment (UI only) */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled
                >
                  <span role="img" aria-label="link">🔗</span>
                  Add Link
                </Button>
                {selectedImage && (
                  <span className="text-sm text-muted-foreground">
                    {selectedImage.name}
                  </span>
                )}
              </div>
              {/* Right-side gradient overlay */}
              <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-card to-transparent z-10" />
            </div>
            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              Post Update
            </Button>
          </div>
          {/* Static Emoji Reactions Bar (UI only) */}
          <div className="mt-4 flex gap-2 items-center">
            <span className="text-xs text-muted-foreground mr-2">Preview reactions:</span>
            <Button type="button" variant="ghost" size="icon" disabled><span role="img" aria-label="like">👍</span></Button>
            <Button type="button" variant="ghost" size="icon" disabled><span role="img" aria-label="love">❤️</span></Button>
            <Button type="button" variant="ghost" size="icon" disabled><span role="img" aria-label="celebrate">🎉</span></Button>
            <Button type="button" variant="ghost" size="icon" disabled><span role="img" aria-label="insight">💡</span></Button>
            <Button type="button" variant="ghost" size="icon" disabled><span role="img" aria-label="wow">😮</span></Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 