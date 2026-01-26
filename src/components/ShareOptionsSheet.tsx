"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Mail, MessageSquare, Link, Twitter, Facebook, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface ShareOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color?: string;
}

interface ShareOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
}

export function ShareOptionsSheet({
  isOpen,
  onClose,
  url,
  title,
  description
}: ShareOptionsSheetProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setCopied(false);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    triggerHaptic(hapticPatterns.light);
    onClose();
  };

  const copyToClipboard = async () => {
    triggerHaptic(hapticPatterns.medium);

    // Try modern Clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Link copied to clipboard",
        });
        setTimeout(() => {
          setCopied(false);
          handleClose();
        }, 1000);
        return;
      } catch (error) {
        console.log('Clipboard API failed, trying fallback');
      }
    }

    // Fallback: Use input element and execCommand
    try {
      if (inputRef.current) {
        inputRef.current.value = url;
        inputRef.current.select();
        inputRef.current.setSelectionRange(0, 99999);
        document.execCommand('copy');
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Link copied to clipboard",
        });
        setTimeout(() => {
          setCopied(false);
          handleClose();
        }, 1000);
        return;
      }
    } catch (error) {
      console.log('execCommand fallback failed');
    }

    // Last resort: Show the URL for manual copy
    toast({
      title: "Copy this link",
      description: url,
      duration: 10000,
    });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this debate: ${title}`);
    const body = encodeURIComponent(`I thought you might be interested in this debate:\n\n${title}\n\n${description || ''}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    triggerHaptic(hapticPatterns.medium);
    handleClose();
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(`Check out this debate: ${title} ${url}`);
    window.open(`sms:?body=${text}`, '_blank');
    triggerHaptic(hapticPatterns.medium);
    handleClose();
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Check out this important debate: ${title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
    triggerHaptic(hapticPatterns.medium);
    handleClose();
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    triggerHaptic(hapticPatterns.medium);
    handleClose();
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url,
        });
        triggerHaptic([...hapticPatterns.success]);
        handleClose();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  const downloadAsImage = () => {
    // This would generate a shareable image of the debate
    // For now, just show a toast
    toast({
      title: "Coming Soon",
      description: "Image sharing will be available soon!",
    });
    triggerHaptic(hapticPatterns.medium);
    handleClose();
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />,
      action: copyToClipboard,
      color: copied ? 'text-green-600' : 'text-blue-600'
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail className="w-5 h-5" />,
      action: shareViaEmail,
      color: 'text-gray-600'
    },
    {
      id: 'sms',
      label: 'Message',
      icon: <MessageSquare className="w-5 h-5" />,
      action: shareViaSMS,
      color: 'text-green-600'
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      action: shareViaTwitter,
      color: 'text-blue-400'
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      action: shareViaFacebook,
      color: 'text-blue-700'
    },
    {
      id: 'image',
      label: 'Save Image',
      icon: <Download className="w-5 h-5" />,
      action: downloadAsImage,
      color: 'text-purple-600'
    }
  ];

  // Add native share option if available
  if (typeof navigator !== 'undefined' && 'share' in navigator && isMobile) {
    shareOptions.unshift({
      id: 'native',
      label: 'Share',
      icon: <Link className="w-5 h-5" />,
      action: shareViaNative,
      color: 'text-primary'
    });
  }

  // Mobile: slide up from bottom
  const mobileVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" }
  };

  // Desktop: modal center
  const desktopVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const sheetContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={handleClose}
          />

          {/* Sheet Content */}
          <motion.div
            variants={isMobile ? mobileVariants : desktopVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "fixed z-[100] bg-background border border-border",
              isMobile
                ? "bottom-0 left-0 right-0 rounded-t-3xl"
                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl w-full max-w-md shadow-2xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Share Debate</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Debate Preview */}
              <div className="bg-muted rounded-lg p-3 mb-4">
                <h4 className="font-medium text-sm line-clamp-2 mb-1">{title}</h4>
                {description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
                )}
              </div>

              {/* Share Options Grid */}
              <div className={cn(
                "grid gap-3",
                isMobile ? "grid-cols-3" : "grid-cols-2"
              )}>
                {shareOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    onClick={option.action}
                    className={cn(
                      "h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/50",
                      option.color
                    )}
                  >
                    {option.icon}
                    <span className="text-xs font-medium">{option.label}</span>
                  </Button>
                ))}
              </div>

              {/* URL Preview */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Share URL:</p>
                <p className="text-xs font-mono break-all">{url}</p>
              </div>

              {/* Hidden input for clipboard fallback */}
              <input
                ref={inputRef}
                type="text"
                value={url}
                readOnly
                className="sr-only"
                aria-hidden="true"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document root, escaping parent stacking contexts
  if (typeof document === 'undefined') return null;
  return createPortal(sheetContent, document.body);
}