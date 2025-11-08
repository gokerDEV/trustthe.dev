'use client';

import { cn } from '@/lib/utils';
import { Send, TextCursorInput } from 'lucide-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

const GokerIshPrompt = ({ prompt = '' }: { prompt?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    setIsOpen(el.scrollHeight > 80);
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        adjustHeight();
      } else {
        e.preventDefault();
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [prompt]);

  return (
    <form
      method='GET'
      target='_blank'
      action={process.env.NEXT_PUBLIC_GPTS_URL}
      className={cn(
        'group bg-secondary/50 border-primary flex w-full items-center rounded-full border-2 pl-2',
        isOpen && 'items-end rounded-md pl-0'
      )}
    >
      {!isOpen && <TextCursorInput className='icon-search text-2xl' />}

      <div className='flex h-full max-h-64 w-full items-end overflow-y-auto px-2'>
        <textarea
          name='prompt'
          ref={textareaRef}
          placeholder='Ask anything to goker-ish'
          className='w-full resize-none overflow-hidden border-0 bg-transparent py-2.5 outline-0'
          rows={1}
          defaultValue={prompt}
          onInput={adjustHeight}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button
        aria-label='Send'
        type='submit'
        className={cn(
          'bg-primary text-background -m-0.5 rounded-full border-0 p-3',
          isOpen && 'rounded-none rounded-tl-md'
        )}
      >
        <Send className='icon-search text-2xl' />
      </button>
    </form>
  );
};

export default GokerIshPrompt;
