import fs from 'fs';
import path from 'path';

interface RegistryItem {
  $schema: string;
  name: string;
  title: string;
  type: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: {
    type: string;
    path: string;
    content: string;
  }[];
  docs?: string;
  categories?: string[];
  author?: string;
}

function generateRegistry(
  componentPath: string,
  options: {
    name: string;
    title: string;
    description: string;
    dependencies: string[];
    registryDependencies: string[];
    docs?: string;
    categories?: string[];
    author?: string;
    targetPath?: string;
    type: 'registry:component' | 'registry:ui';
  }
) {
  // Read the component file
  const content = fs.readFileSync(componentPath, 'utf-8');

  const folder = options.type === 'registry:component' ? 'common' : 'ui';

  // Create registry item
  const registry: RegistryItem = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: options.name,
    title: options.title,
    type: options.type,
    description: options.description,
    dependencies: options.dependencies,
    registryDependencies: options.registryDependencies,
    files: [
      {
        type: options.type,
        path: `components/${folder}/${path.basename(componentPath)}`,
        content: content,
      },
    ],
    docs: options.docs,
    categories: options.categories,
    author: options.author,
  };

  // Ensure registry directory exists
  const registryDir = path.join(process.cwd(), 'public/r');
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }

  // Write registry file
  fs.writeFileSync(
    path.join(registryDir, `${options.name}.json`),
    JSON.stringify(registry, null, 2)
  );

  // Create component directory in registry
  // const componentDir = path.join(registryDir, options.name);
  // if (!fs.existsSync(componentDir)) {
  //     fs.mkdirSync(componentDir, { recursive: true });
  // }

  // Copy component file to registry
  // fs.writeFileSync(
  //     path.join(componentDir, path.basename(componentPath)),
  //     content
  // );

  console.log(`✓ Generated registry for ${options.name}`);
  console.log(`  └─ ${path.join(registryDir, `${options.name}.json`)}`);
}

// Example usage for theme customizer
const components = [
  {
    name: 'version',
    title: 'Version',
    type: 'registry:component',
    path: 'src/components/common/version.tsx',
    targetPath: 'components/common/version.tsx',
    description:
      'A component for developers who build with transparency, versioning, and soul.',
    docs: `This component displays a persistent version tag derived from your package.json.
It includes information about the project repository, author, recent commit, and tech stack.
It promotes developer transparency by surfacing metadata in the UI — useful for bots, curious users, and future maintainers.`,
    dependencies: [],
    registryDependencies: ['card'],
    categories: ['version', 'developer', 'transparency'],
    author: 'goker <goker@goker.dev>',
  },
];

// Generate registry for each component
components.forEach((component) => {
  generateRegistry(component.path, {
    name: component.name,
    title: component.title,
    description: component.description,
    dependencies: component.dependencies,
    registryDependencies: component.registryDependencies,
    docs: component.docs,
    categories: component.categories,
    author: component.author,
    targetPath: component.targetPath,
    type: component.type as 'registry:component' | 'registry:ui',
  });
});
