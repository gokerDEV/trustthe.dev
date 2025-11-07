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
