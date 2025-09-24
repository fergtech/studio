'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Plus, Trash2, Pencil } from 'lucide-react';
import type { Initiative } from "@/lib/types";

interface EditInitiativeDialogProps {
  initiative: Initiative;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: { title: string; description: string; imageFile?: File | null; clearImage?: boolean; roles: string[] }) => Promise<void>;
}

export function EditInitiativeDialog({
  initiative,
  isOpen,
  onClose,
  onSave
}: EditInitiativeDialogProps) {
  const [title, setTitle] = useState(initiative.title);
  const [description, setDescription] = useState(initiative.description);
  const [roles, setRoles] = useState<string[]>(initiative.roles || []);
  const [newRole, setNewRole] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initiative.imageUrl || null);
  const [imageCleared, setImageCleared] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ title, description, imageFile: selectedImage, clearImage: imageCleared, roles });
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

  const handleAddRole = () => {
    if (newRole.trim() && !roles.includes(newRole.trim())) {
      setRoles([...roles, newRole.trim()]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setRoles(roles.filter(r => r !== role));
  };

  const handleEditRole = (index: number, value: string) => {
    const updated = [...roles];
    updated[index] = value;
    setRoles(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setTitle(initiative.title);
        setDescription(initiative.description);
        setRoles(initiative.roles || []);
        setNewRole('');
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
                  <Image
                    src={imagePreview}
                    alt="Cover preview"
                    fill
                    className="object-cover"
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
          <div className="space-y-2">
            <Label>Roles/Skills Needed</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {roles.map((role, idx) => (
                <div key={role} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                  <Input
                    value={role}
                    onChange={e => handleEditRole(idx, e.target.value)}
                    className="w-28 text-xs px-1 py-0 h-7"
                  />
                  <button type="button" onClick={() => handleRemoveRole(role)} className="text-destructive hover:bg-destructive/10 rounded p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="Add new role/skill"
                className="w-40 text-xs px-2 py-1 h-8"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRole(); } }}
              />
              <Button type="button" size="sm" onClick={handleAddRole} className="h-8 px-2">
                <Plus className="h-4 w-4 mr-1" /> Add Role
              </Button>
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