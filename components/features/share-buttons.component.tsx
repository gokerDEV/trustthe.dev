'use client';

import { cn } from '@/lib/utils';
import {
  Facebook,
  Linkedin,
  Link as LinkIcon,
  Share2,
  Twitter,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
  description: string;
  image: string;
  className?: string;
}

export function ShareButtons({
  url,
  title,
  description,
  image,
  className,
}: ShareButtonsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Move navigator.share check to useEffect to avoid hydration mismatch
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
    }, 0);
  }, []);

  const shareData = {
    title: title,
    url: url,
    text: description,
    image: image,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Native Share Button (Mobile) */}
      {canShare && (
        <button
          onClick={handleShare}
          className='rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
          aria-label='Share'
        >
          <Share2 className='h-5 w-5' />
        </button>
      )}

      {/* Social Media Buttons */}
      <div className='flex items-center gap-2'>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}&image=${encodeURIComponent(image)}`}
          target='_blank'
          rel='noopener noreferrer'
          className='rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
          aria-label='Share on Twitter'
        >
          <Twitter className='h-5 w-5' />
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(image)}`}
          target='_blank'
          rel='noopener noreferrer'
          className='rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
          aria-label='Share on Facebook'
        >
          <Facebook className='h-5 w-5' />
        </a>

        <a
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(image)}`}
          target='_blank'
          rel='noopener noreferrer'
          className='rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
          aria-label='Share on LinkedIn'
        >
          <Linkedin className='h-5 w-5' />
        </a>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className='rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
          aria-label={isCopied ? 'Link copied!' : 'Copy link'}
        >
          <LinkIcon className='h-5 w-5' />
          {isCopied && (
            <span className='absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white'>
              Copied!
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
