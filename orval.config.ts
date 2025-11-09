import { defineConfig } from 'orval';

const TARGET = process.env.KODKAFA_API_URL + '/doc-json';

export default defineConfig({
  kodkafa: {
    input: {
      target: TARGET,
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
      target: TARGET,
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
  kodkafaQuery: {
    input: {
      target: TARGET,
      override: {
        transformer: './kodkafa/orval-transformer.mjs',
      },
    },
    output: {
      target: './kodkafa/client',
      client: 'react-query',
      mode: 'tags-split',
      schemas: './kodkafa/client/schemas',
      mock: false,
      override: {
        mutator: {
          path: './kodkafa/client/mutator-client.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useInfinite: true,
          useMutation: true,
          signal: true,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});
