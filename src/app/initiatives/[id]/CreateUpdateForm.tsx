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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
              {selectedImage && (
                <span className="text-sm text-muted-foreground">
                  {selectedImage.name}
                </span>
              )}
            </div>
            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              Post Update
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 