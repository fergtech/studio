"use client";
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon } from 'lucide-react';

interface EditSocietyDialogProps {
  society: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: { name: string; description: string; imageFile?: File | null; clearImage?: boolean }) => Promise<void>;
}

export function EditSocietyDialog({ society, isOpen, onClose, onSave }: EditSocietyDialogProps) {
  const [name, setName] = useState(society.name);
  const [description, setDescription] = useState(society.description);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(society.imageUrl || society.image || null);
  const [imageCleared, setImageCleared] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ name, description, imageFile: selectedImage, clearImage: imageCleared });
      onClose();
    } catch (error) {
      console.error('Error saving society:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImageCleared(false);
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
        setName(society.name);
        setDescription(society.description);
        setSelectedImage(null);
        setImagePreview(society.imageUrl || society.image || null);
        setImageCleared(false);
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Society</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter society name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter society description"
              className="min-h-[150px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Banner Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Banner preview"
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
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 