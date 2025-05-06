"use client";

import React, { useState, useRef } from 'react'; // Import useRef
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Palette } from 'lucide-react'; // Add Palette icon
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover

// Placeholder for user data - replace with actual auth context later
const currentUser = {
  name: "Current User",
  avatarUrl: "/placeholder-avatar.png", // Replace with actual user avatar
  id: "user123",
};

// Placeholder for the function to create a post - replace with actual API call
// Update function signature to accept optional background
async function createPostOnBackend(content: string, media?: File, background?: string) {
  console.log("Creating post:", { content, media, background });
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, this would return the created post object or handle errors
  return { success: true };
}

// Define some background options
const backgroundOptions = [
  'linear-gradient(to right, #ff7e5f, #feb47b)', // Peach
  'linear-gradient(to right, #6a11cb, #2575fc)', // Purple/Blue
  'linear-gradient(to right, #00c6ff, #0072ff)', // Sky Blue
  'linear-gradient(to right, #f7971e, #ffd200)', // Orange/Yellow
  'linear-gradient(to right, #d38312, #a83279)', // Brown/Pink
  '#333333', // Dark Grey
];

export function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(backgroundOptions[1]); // Default background
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Basic fallback for avatar
  const fallback = currentUser.name?.substring(0, 2).toUpperCase() || 'CU';

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSelectedBackground(''); // Clear background if media is selected
    } else {
      setSelectedMedia(null);
      setMediaPreview(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Pass background only if no media is selected
      const backgroundToSend = selectedMedia ? undefined : selectedBackground;
      const result = await createPostOnBackend(content, selectedMedia ?? undefined, backgroundToSend);
      if (result.success) {
        setContent('');
        setSelectedMedia(null);
        setMediaPreview(null);
        setSelectedBackground(backgroundOptions[1]); // Reset to default background
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear file input
        }
        onPostCreated(); // Callback to refresh the feed or show success
      } else {
        // Handle error (e.g., show toast)
        console.error("Failed to create post");
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 shadow-sm border-none bg-card/80 backdrop-blur overflow-hidden">
      {/* Media Preview or Selected Background Preview */}
      {(mediaPreview || !selectedMedia) && (
        <div
          className="h-32 bg-cover bg-center relative flex items-center justify-center text-muted-foreground"
          style={{
            backgroundImage: mediaPreview ? `url(${mediaPreview})` : undefined,
            background: !mediaPreview ? selectedBackground : undefined,
          }}
        >
          {!mediaPreview && <Palette className="w-8 h-8" />} {/* Show palette icon on color bg */}
          {mediaPreview && <div className="absolute inset-0 bg-black/20"></div>} {/* Overlay on image */}
        </div>
      )}

      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10 mt-1">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent min-h-[60px] placeholder:text-muted-foreground/70"
              rows={2} // Start with 2 rows, can expand
            />
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleMediaChange}
                accept="image/*,video/*" // Accept images and videos
                style={{ display: 'none' }}
              />
              {/* Attachment Button */}
              <Button variant="ghost" size="icon" type="button" onClick={triggerFileInput} className="text-muted-foreground hover:text-primary">
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">Attach media</span>
              </Button>

              {/* Background Selector - Show only if no media selected */}
              {!selectedMedia && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" type="button" className="text-muted-foreground hover:text-primary">
                      <Palette className="h-5 w-5" />
                      <span className="sr-only">Choose background</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {backgroundOptions.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          className={`w-8 h-8 rounded border ${selectedBackground === bg ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          style={{ background: bg }}
                          onClick={() => setSelectedBackground(bg)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <Button type="submit" disabled={!content.trim() || isSubmitting} size="sm">
              {isSubmitting ? 'Posting...' : <>Post <Send className="ml-1 h-4 w-4" /></>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
