import { defineConfig } from 'orval';

export default defineConfig({
  kodkafa: {
    input: {
      target: `${process.env.API_URL || 'http://localhost:3388'}/doc-json`,
      override: {
        transformer: './api/orval-transformer.mjs',
      },
    },
    output: {
      target: './api/client',
      client: 'fetch',
      mode: 'tags-split',
      schemas: './api/client/schemas',
      mock: false,
      override: {
        mutator: {
          path: './api/client/mutator.ts',
          name: 'customInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
  kodkafaZod: {
    input: {
      target: `${process.env.API_URL || 'http://localhost:3388'}/doc-json`,
      override: {
        transformer: './api/orval-transformer.mjs',
      },
    },
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: './api/client/schemas',
      fileExtension: '.zod.ts',
    },
  },
});
