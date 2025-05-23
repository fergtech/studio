'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon } from 'lucide-react';
import type { Initiative } from "@/lib/types";

interface EditInitiativeDialogProps {
  initiative: Initiative;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: { title: string; description: string; imageFile?: File | null; clearImage?: boolean }) => Promise<void>;
}

export function EditInitiativeDialog({
  initiative,
  isOpen,
  onClose,
  onSave
}: EditInitiativeDialogProps) {
  const [title, setTitle] = useState(initiative.title);
  const [description, setDescription] = useState(initiative.description);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initiative.imageUrl || null);
  const [imageCleared, setImageCleared] = useState(false); // New state to track if image should be cleared
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ title, description, imageFile: selectedImage, clearImage: imageCleared });
      // Reset imageCleared state after successful save if needed, or rely on dialog close to reset all states
      // setImageCleared(false); 
      onClose();
    } catch (error) {
      console.error('Error saving initiative:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImageCleared(false); // If a new image is selected, it shouldn\'t be cleared
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageCleared(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Reset state on close
        setTitle(initiative.title);
        setDescription(initiative.description);
        setSelectedImage(null);
        setImagePreview(initiative.imageUrl || null);
        setImageCleared(false);
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Initiative</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter initiative title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter initiative description"
              className="min-h-[150px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleUploadButtonClick}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {selectedImage ? 'Change Image' : (imagePreview ? 'Change Image' : 'Upload Image')}
                </Button>
                {imagePreview && !selectedImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleRemoveImage}
                  >
                    Remove Image
                  </Button>
                )}
                {selectedImage && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {selectedImage.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}