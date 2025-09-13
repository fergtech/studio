import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface CreateSocietyFormProps {
  setOpen: (open: boolean) => void;
  onCreated?: (society: any) => void;
}

export function CreateSocietyForm({ setOpen, onCreated }: CreateSocietyFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create a society.',
        variant: 'destructive',
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Society name is required.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/societies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          image: image.trim() || undefined,
          userId: session.user.id,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create society');
      }
      const society = await res.json();
      toast({
        title: 'Society Created!',
        description: `"${society.name}" is now live.`,
        variant: 'default',
      });
      setOpen(false);
      setName('');
      setDescription('');
      setImage('');
      if (onCreated) onCreated(society);
      // Optionally redirect to the new society's detail page:
      // router.push(`/societies/${society.id}`);
    } catch (error: any) {
      toast({
        title: 'Error Creating Society',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Society Name"
        required
        disabled={isSubmitting}
        className="min-h-[44px]"
      />
      <Textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional)"
        disabled={isSubmitting}
        className="min-h-[80px] sm:min-h-[60px]"
      />
      <Input
        value={image}
        onChange={e => setImage(e.target.value)}
        placeholder="Image URL (optional)"
        disabled={isSubmitting}
        className="min-h-[44px]"
      />
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="min-h-[44px]">Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">Create Society</Button>
      </div>
    </form>
  );
} 