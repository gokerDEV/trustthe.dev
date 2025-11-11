import type { RenderableTreeNodes } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';

const fence = {
  render: 'Fence',
  attributes: {
    language: {
      type: String,
    },
  },
};

export function parseMarkdown(markdown: string): RenderableTreeNodes {
  return Markdoc.transform(Markdoc.parse(markdown), {
    nodes: {
      fence,
      document: {
        render: 'section',
        attributes: {
          className: {
            type: String,
            default: 'markdown prose dark:prose-invert max-w-none',
          },
        },
      },
    },
  });
}

/**
 * Converts markdown to plain text by stripping all markdown syntax.
 * Useful for reading time calculation and text analysis.
 */
export function markdownToPlainText(markdown: string): string {
  let text = markdown;

  // Remove Markdoc tags ({% ... %})
  text = text.replace(/\{%[\s\S]*?%\}/g, '');

  // Remove code blocks (```code```)
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code (`code`)
  text = text.replace(/`[^`]+`/g, '');

  // Remove images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');

  // Remove links [text](url) but keep the text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // Remove headers (# ## ###)
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');

  // Remove horizontal rules (---, ***, ___)
  text = text.replace(/^[-*_]{3,}$/gm, '');

  // Remove blockquotes (>)
  text = text.replace(/^>\s+/gm, '');

  // Remove list markers (-, *, +, 1.)
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // Remove bold (**text** or __text__)
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');

  // Remove italic (*text* or _text_)
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // Remove strikethrough (~~text~~)
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Remove HTML entities (decode common ones)
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace: multiple spaces to single space
  text = text.replace(/[ \t]+/g, ' ');

  // Clean up multiple newlines to double newline (paragraph break)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Remove leading/trailing whitespace from each line
  text = text
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // Remove leading/trailing whitespace from entire text
  return text.trim();
}
