import { config } from 'dotenv';
import { defineConfig } from 'orval';

// Load environment variables from .env.local or .env
config({ path: '.env.local' });
config({ path: '.env' });

const KODKAFA_API_URL = process.env.KODKAFA_API_URL;

if (!KODKAFA_API_URL) {
  throw new Error(
    'KODKAFA_API_URL environment variable is required. Please set it in .env.local or .env file.'
  );
}

const TARGET = `${KODKAFA_API_URL}/doc-json`;

export default defineConfig({
  zodSchemas: {
    input: {
      target: TARGET,
      override: {
        transformer: './lib/api/orval-transformer.mjs',
      },
    },
    output: {
      target: 'kodkafa/zod',
      client: 'zod',
      fileExtension: '.zod.ts',
      clean: true,
      override: {
        zod: {
          dateTimeOptions: { local: true, offset: true, precision: 3 },
          timeOptions: { precision: -1 },
        },
      },
    },
  },
  ssrFetch: {
    input: {
      target: TARGET,
      override: {
        transformer: './lib/api/orval-transformer.mjs',
      },
    },
    output: {
      target: 'kodkafa/ssr',
      client: 'fetch',
      baseUrl: '/api',
      httpClient: 'fetch',
      mode: 'tags-split',
      schemas: 'kodkafa/schemas',
      clean: true,
      override: {
        mutator: { path: 'lib/api/ssr.mutator.ts', name: 'ssrMutator' },
      },
    },
  },
  rqClient: {
    input: {
      target: TARGET,
      override: {
        transformer: './lib/api/orval-transformer.mjs',
      },
    },
    output: {
      target: 'kodkafa/rq',
      client: 'react-query',
      baseUrl: '/api',
      httpClient: 'fetch',
      mode: 'tags-split',
      clean: true,
      override: {
        mutator: { path: 'lib/api/client.mutator.ts', name: 'clientMutator' },
        query: {
          useQuery: true,
          useInfinite: true,
          useMutation: true,
          signal: true,
          options: {
            staleTime: 30_000,
            gcTime: 300_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      },
    },
  },
});
