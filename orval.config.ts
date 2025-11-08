import { defineConfig } from 'orval';

export default defineConfig({
  kodkafa: {
    input: {
      target: `${process.env.API_URL || 'http://localhost:3388'}/doc-json`,
      override: {
        transformer: './kodkafa/orval-transformer.mjs',
      },
    },
    output: {
      target: './kodkafa/client',
      client: 'fetch',
      mode: 'tags-split',
      schemas: './kodkafa/client/schemas',
      mock: false,
      override: {
        mutator: {
          path: './kodkafa/client/mutator.ts',
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
        transformer: './kodkafa/orval-transformer.mjs',
      },
    },
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: './kodkafa/client/schemas',
      fileExtension: '.zod.ts',
    },
  },
});
