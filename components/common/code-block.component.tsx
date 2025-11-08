'use client';

import { cn } from '@/lib/utils';
import { Highlight, themes } from 'prism-react-renderer';
import { useState } from 'react';

interface Props {
  children: string;
  language?: string;
  className?: string;
}

export const CodeBlock = ({
  children,
  language = 'json',
  className,
}: Props) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group relative', className)}>
      <button
        onClick={copyToClipboard}
        className='absolute top-2 right-2 rounded-md bg-gray-800 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100'
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <Highlight theme={themes.vsDark} code={children} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(className, 'overflow-auto rounded-lg p-4')}
            style={style}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};
