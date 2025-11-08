# KODKAFA Client - Next.js (SEO) Template

An enterprise-grade, server-first Next.js application template built for optimal SEO, performance, and developer experience. This template follows a strict server-side rendering (SSR/SSG) architecture with zero client-side JavaScript goals, powered by Next.js App Router and TypeScript.

## 🎯 Overview

This is a production-ready Next.js template designed for content-driven websites with a focus on:

- **Server-First Architecture**: 100% server-side rendering with minimal client-side JavaScript
- **SEO Optimized**: Built-in metadata generation, structured data (JSON-LD), sitemap generation
- **Type Safety**: End-to-end type safety with Orval-generated API clients and Zod validation
- **Performance**: Static generation, image optimization, and intelligent caching
- **Enterprise Standards**: SOLID principles, clean code, and maintainable architecture

## 🏗️ Architecture

### Server-First Design

This application strictly adheres to a server-first architecture:

- **No Client Components**: The `'use client'` directive is avoided wherever possible
- **Server Components Only**: All data fetching and business logic run on the server
- **Direct API Access**: Server components access the API directly (no BFF layer)
- **Zero Client JS Goal**: Minimal JavaScript shipped to the browser

### Data Layer

- **Orval**: Auto-generates type-safe API clients from OpenAPI specifications
- **Zod Validation**: Runtime validation of all API responses using generated Zod schemas
- **Type Safety**: Full TypeScript coverage with strict mode enabled

## 🚀 Tech Stack

### Core

- **Next.js 16** - App Router with React Server Components
- **React 19** - Latest React with Server Components support
- **TypeScript 5** - Strict mode, no `any` types allowed

### Styling & UI

- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Accessible component primitives
- **Lucide React** - Icon library
- **Geist Font** - Optimized font loading

### Data & Validation

- **Orval** - OpenAPI client generator
- **Zod** - Schema validation
- **@tanstack/react-query** - Client-side data fetching (minimal usage)

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

### Other

- **Sharp** - Image optimization
- **Markdoc** - Markdown processing
- **Vercel Analytics** - Performance monitoring

## 📋 Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** 8+ (package manager)
- **KODKAFA API** - Backend API access

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd next.client.kodkafa
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the example environment file and configure it:

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Domain Configuration
DOMAIN=your_domain_here

# API Configuration
KODKAFA_API_URL=http://localhost:3388
KODKAFA_CLIENT_ID=your_client_id
KODKAFA_CLIENT_SECRET=your_client_secret

# Optional: Analytics & Third-Party Services
NEXT_PUBLIC_HOTJAR_ID=
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_GPTS_URL=
```

### 4. Generate API Client

Generate type-safe API clients from your OpenAPI specification:

```bash
pnpm run codegen
```

This command:

- Fetches the OpenAPI spec from your API
- Generates TypeScript clients in `api/client/`
- Generates Zod validation schemas in `api/client/schemas/`

**Important**: Run `pnpm run codegen` after any backend API changes.

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:4010](http://localhost:4010)

## 📜 Available Scripts

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `pnpm dev`           | Start development server on port 4010  |
| `pnpm build`         | Build production bundle                |
| `pnpm start`         | Start production server                |
| `pnpm lint`          | Run ESLint with auto-fix               |
| `pnpm format`        | Format code with Prettier              |
| `pnpm codegen`       | Generate API clients from OpenAPI spec |
| `pnpm codegen:watch` | Watch mode for API client generation   |

## 📁 Project Structure

```
next.client.kodkafa/
├── app/                      # Next.js App Router
│   ├── (statics)/           # Static pages (cookies, privacy)
│   ├── [slug]/              # Dynamic post pages
│   ├── tags/[tags]/         # Tag-based post listings
│   ├── api/                 # API routes (revalidate, og-image)
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   ├── error.tsx            # Error boundary
│   ├── not-found.tsx        # 404 page
│   ├── loading.tsx          # Loading states
│   ├── sitemap.ts           # Dynamic sitemap generation
│   └── robots.ts            # Robots.txt
│
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── common/              # Reusable generic components
│   └── features/            # Domain-specific components
│
├── api/
│   ├── client/              # Orval-generated API clients
│   │   ├── schemas/         # TypeScript types & Zod schemas
│   │   └── ...              # API endpoint clients
│   └── orval-transformer.mjs # Orval configuration
│
├── config/                  # Configuration files
│   ├── constants.ts         # App constants
│   ├── navigation.ts        # Navigation structure
│   └── metadata.config.ts   # SEO metadata config
│
├── lib/                     # Utility libraries
│   ├── api/                 # API utilities
│   ├── auth/                # Authentication helpers
│   ├── seo/                 # SEO utilities
│   └── utils.ts             # General utilities
│
├── providers/               # React context providers
├── styles/                  # Global styles
└── public/                  # Static assets
```

## 🔑 Key Concepts

### Server Components

All components are Server Components by default. They can:

- Fetch data directly from APIs
- Access server-only resources (env vars, databases)
- Run on the server only (no client bundle)

### Data Fetching Pattern

```typescript
// ✅ Correct: Server Component with direct API call
export default async function Page() {
  const domain = getApiDomain();
  const response = await postsControllerFindAll({ domain, ... });

  // Validate with Zod
  const validationResult = postsQueryControllerFindAllResponse.safeParse(
    response.data
  );

  if (!validationResult.success) {
    // Handle validation error
  }

  return <PostList posts={validationResult.data.items} />;
}
```

### Error Handling

- **404 Errors**: Use `notFound()` from `next/navigation`
- **Unexpected Errors**: Let `error.tsx` handle them (rethrow in catch blocks)
- **Validation Errors**: Use Zod's `safeParse()` for graceful handling

### Loading States

Next.js automatically uses `loading.tsx` files for route transitions. Create loading files for async routes:

```typescript
// app/[slug]/loading.tsx
export default function Loading() {
  return <LoadingSpinner />;
}
```

## 🎨 Component Organization

### Component Hierarchy

1. **`components/ui/`** - Design primitives (shadcn/ui wrappers)
2. **`components/common/`** - Reusable generic patterns (tables, dialogs, breadcrumbs)
3. **`components/features/`** - Domain-aware components (Post, Category, Profile)

### Adding New Components

1. **UI Primitives**: Use `npx shadcn@latest add [component]`
2. **Common Components**: Create in `components/common/`
3. **Feature Components**: Create in `components/features/`

## 🔐 Security

### Environment Variables

- **Never** use `NEXT_PUBLIC_*` prefix for secrets
- All API keys, tokens, and secrets are server-only
- Client-side code cannot access server environment variables

### API Authentication

The application uses OAuth 2.1 with automatic token management:

```typescript
// Token is automatically added by mutator.ts
const response = await postsControllerFindAll({ domain, ... });
```

## 📊 SEO Features

### Metadata Generation

Automatic metadata generation for all pages:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  // Fetch data and generate metadata
  return metadataGenerator(post, { ogType: 'article' });
}
```

### Structured Data (JSON-LD)

Automatic structured data generation:

- WebSite schema
- Article schema
- BreadcrumbList schema
- CollectionPage schema

### Sitemap

Dynamic sitemap generation with pagination support:

- Static pages
- Dynamic post pages
- Automatic updates

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables for Production

Ensure all required environment variables are set in your deployment platform:

- `DOMAIN`
- `KODKAFA_API_URL`
- `KODKAFA_CLIENT_ID`
- `KODKAFA_CLIENT_SECRET`

### Build Process

```bash
pnpm build
```

The build process:

1. Generates API clients (if needed)
2. Builds Next.js application
3. Optimizes images and assets
4. Generates static pages where possible

## 🧪 Development Guidelines

### Code Standards

- **No `any` types**: Use proper types, interfaces, or `unknown`
- **Strict TypeScript**: All code must pass strict type checking
- **SOLID Principles**: Follow SOLID principles for maintainability
- **Server-First**: Prefer Server Components over Client Components

### Error Handling

```typescript
try {
  const response = await apiCall();
  // Handle response
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }
  // Handle error appropriately
  throw error; // Let error.tsx handle unexpected errors
}
```

### Console Statements

All console statements must be wrapped in development checks:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}
```

## 📝 Code Generation Workflow

### After Backend Changes

1. Update your backend API
2. Run `pnpm run codegen`
3. Review generated types in `api/client/schemas/`
4. Update your Server Components to use new types
5. Test and commit

### Orval Configuration

Orval is configured in `orval.config.ts`:

- Fetches OpenAPI spec from `${API_URL}/doc-json`
- Generates clients in `api/client/`
- Generates Zod schemas in `api/client/schemas/`

## 🐛 Troubleshooting

### API Client Generation Fails

- Check `KODKAFA_API_URL` is correct
- Ensure API is accessible
- Verify OpenAPI spec endpoint (`/doc-json`)

### Type Errors After Codegen

- Delete `api/client/` folder
- Run `pnpm run codegen` again
- Restart TypeScript server in your IDE

### Build Fails

- Check all environment variables are set
- Ensure `pnpm run codegen` has been run
- Verify no `any` types in codebase

## 🤝 Contributing

This is a template project. When contributing:

1. Follow the established architecture patterns
2. Maintain server-first approach
3. Add proper error handling
4. Include loading states for async routes
5. Write type-safe code (no `any`)
6. Run `pnpm lint` and `pnpm format` before committing

## 📄 License

This project is licensed under the MIT License.

Copyright (c) 2024 KODKAFA

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🙏 Acknowledgments

- **KODKAFA API** - Backend infrastructure
- **Next.js Team** - Amazing framework
- **shadcn** - Beautiful component library
- **Vercel** - Deployment platform

## 📞 Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Contact: goker@kodkafa.com

---

**Built with ❤️ using Next.js, TypeScript, and a server-first architecture.**
