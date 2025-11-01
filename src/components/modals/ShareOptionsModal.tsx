"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Twitter, Facebook, MessageCircle, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ShareOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  debate: {
    id: string;
    title: string;
    content: string;
    creator: {
      name: string;
    };
  };
}

export function ShareOptionsModal({
  isOpen,
  onClose,
  debate
}: ShareOptionsModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    triggerHaptic(hapticPatterns.light);
    onClose();
  };

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/debates/${debate.id}` 
    : '';

  const shareText = `Check out this debate: "${debate.title}" by ${debate.creator.name}`;

  const handleNativeShare = async () => {
    triggerHaptic(hapticPatterns.medium);
    
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: debate.title,
          text: shareText,
          url: shareUrl,
        });
        
        toast({
          title: "Shared successfully!",
          description: "Thanks for spreading the conversation.",
        });
        
        triggerHaptic([...hapticPatterns.success]);
        onClose();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    triggerHaptic(hapticPatterns.medium);
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      toast({
        title: "Link copied!",
        description: "Share this link anywhere you'd like.",
      });
      
      triggerHaptic([...hapticPatterns.success]);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: "Couldn't copy link",
        description: "Please try again or share manually.",
        variant: "destructive"
      });
    }
  };

  const handleTwitterShare = () => {
    triggerHaptic(hapticPatterns.medium);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleFacebookShare = () => {
    triggerHaptic(hapticPatterns.medium);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleWhatsAppShare = () => {
    triggerHaptic(hapticPatterns.medium);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const shareOptions = [
    ...(typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? [{
      label: 'Share via...',
      icon: Share2,
      onClick: handleNativeShare,
      description: 'Use device share menu'
    }] : []),
    {
      label: copied ? 'Link copied!' : 'Copy link',
      icon: Copy,
      onClick: handleCopyLink,
      description: 'Copy URL to clipboard'
    },
    {
      label: 'Twitter',
      icon: Twitter,
      onClick: handleTwitterShare,
      description: 'Share on Twitter'
    },
    {
      label: 'Facebook', 
      icon: Facebook,
      onClick: handleFacebookShare,
      description: 'Share on Facebook'
    },
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      onClick: handleWhatsAppShare,
      description: 'Share on WhatsApp'
    }
  ];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-semibold text-lg">Share Debate</h3>
                <p className="text-sm text-muted-foreground truncate max-w-[250px] mt-1">
                  {debate.title}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-8 h-8 p-0 hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Share Options */}
            <div className="p-6 space-y-3">
              {shareOptions.map((option, index) => (
                <Button
                  key={option.label}
                  variant="outline"
                  className={cn(
                    "w-full h-auto p-4 justify-start hover:bg-muted/50 transition-colors",
                    copied && option.label.includes('copied') && "bg-green-50 border-green-200 text-green-700"
                  )}
                  onClick={option.onClick}
                >
                  <option.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                </Button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sharing helps grow our community and encourages thoughtful civic discussion.
                </p>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document root, escaping parent stacking contexts
  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}