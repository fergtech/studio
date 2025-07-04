import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Twitter, Facebook, Link2 } from 'lucide-react';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
  defaultMessage?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ open, onOpenChange, url, title = 'Share', defaultMessage }) => {
  const [customMessage, setCustomMessage] = useState(defaultMessage || '');
  const [copied, setCopied] = useState(false);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(customMessage)}%20${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Share this with others to grow the community.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full">
                <Twitter className="h-4 w-4 mr-2" /> Twitter
              </Button>
            </a>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full">
                <Facebook className="h-4 w-4 mr-2" /> Facebook
              </Button>
            </a>
            <Button variant="outline" className="flex-1" onClick={handleCopy}>
              <Link2 className="h-4 w-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Custom Message</Label>
            <Textarea
              placeholder="Add a message to your share..."
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
