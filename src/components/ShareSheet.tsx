"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Mail,
  MessageSquare,
  Share,
  Check,
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { cn } from '@/lib/utils';

// Social media icons as simple SVG components
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

interface ShareOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  bgColor: string;
}

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
  contentType?: string;
}

export function ShareSheet({
  isOpen,
  onClose,
  url,
  title,
  description,
  contentType = 'content'
}: ShareSheetProps) {
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

  // Safe clipboard copy with multiple fallbacks
  const copyToClipboard = async () => {
    triggerHaptic(hapticPatterns.medium);

    // Try modern Clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast({
          title: "Link copied!",
          description: "Share it anywhere you like",
        });
        setTimeout(() => setCopied(false), 2000);
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
        inputRef.current.setSelectionRange(0, 99999); // For mobile
        document.execCommand('copy');
        setCopied(true);
        toast({
          title: "Link copied!",
          description: "Share it anywhere you like",
        });
        setTimeout(() => setCopied(false), 2000);
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
          console.error('Native share failed:', error);
        }
      }
    }
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
    triggerHaptic(hapticPatterns.medium);
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    triggerHaptic(hapticPatterns.medium);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    triggerHaptic(hapticPatterns.medium);
  };

  const shareViaTelegram = () => {
    const text = encodeURIComponent(title);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
    triggerHaptic(hapticPatterns.medium);
  };

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    triggerHaptic(hapticPatterns.medium);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description || title}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    triggerHaptic(hapticPatterns.medium);
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(`${title} ${url}`);
    // iOS uses &body=, Android uses ?body=
    const smsUrl = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? `sms:&body=${text}`
      : `sms:?body=${text}`;
    window.location.href = smsUrl;
    triggerHaptic(hapticPatterns.medium);
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />,
      action: copyToClipboard,
      color: copied ? 'text-green-600' : 'text-gray-700 dark:text-gray-300',
      bgColor: copied ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      action: shareViaWhatsApp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      id: 'twitter',
      label: 'X',
      icon: <TwitterIcon />,
      action: shareViaTwitter,
      color: 'text-gray-900 dark:text-white',
      bgColor: 'bg-gray-100 dark:bg-gray-800'
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon />,
      action: shareViaFacebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: <TelegramIcon />,
      action: shareViaTelegram,
      color: 'text-sky-500',
      bgColor: 'bg-sky-100 dark:bg-sky-900/30'
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: <LinkedInIcon />,
      action: shareViaLinkedIn,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail className="w-5 h-5" />,
      action: shareViaEmail,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      id: 'sms',
      label: 'Message',
      icon: <MessageSquare className="w-5 h-5" />,
      action: shareViaSMS,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
  ];

  // Add native share at the beginning if available on mobile
  if (typeof navigator !== 'undefined' && 'share' in navigator && isMobile) {
    shareOptions.unshift({
      id: 'native',
      label: 'More',
      icon: <Share className="w-5 h-5" />,
      action: shareViaNative,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
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
            className="fixed inset-0 bg-black/50 z-[999999]"
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
              "fixed z-[999999] bg-background border border-border",
              isMobile
                ? "bottom-0 left-0 right-0 rounded-t-3xl pb-8"
                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl w-full max-w-md shadow-2xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag indicator for mobile */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="font-semibold text-lg">Share</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-8 h-8 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content Preview */}
            <div className="px-4 pb-4">
              <div className="bg-muted/50 rounded-xl p-3 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{title}</p>
                  <p className="text-xs text-muted-foreground truncate">{url}</p>
                </div>
              </div>
            </div>

            {/* Share Options Grid */}
            <div className="px-4 pb-4">
              <div className="grid grid-cols-4 gap-3">
                {shareOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.action}
                    className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      option.bgColor,
                      option.color
                    )}>
                      {option.icon}
                    </div>
                    <span className="text-xs font-medium text-center">{option.label}</span>
                  </button>
                ))}
              </div>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document root
  if (typeof document === 'undefined') return null;
  return createPortal(sheetContent, document.body);
}
