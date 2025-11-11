/**
 * Transformer function for orval.
 * Remove ALL /projects/* endpoints from OpenAPI spec
 * Client has NO access to admin endpoints
 *
 * @param {Record<string, unknown>} inputSchema
 * @return {Record<string, unknown>}
 */
const transformer = (inputSchema) => {
  const paths = {};

  for (const [path, pathItem] of Object.entries(inputSchema.paths || {})) {
    // CRITICAL: Skip ALL paths containing /projects/
    if (
      path.includes('/projects/{') ||
      path.startsWith('/projects/') ||
      /\/projects\/\{/.test(path) ||
      /\/projects\/[^/]+\//.test(path) // Also catch /projects/something/ (just in case)
    ) {
      console.log(`[Orval Transformer] Filtering out admin endpoint: ${path}`);
      continue;
    }
    paths[path] = pathItem;
  }

  console.log(
    `[Orval Transformer] Filtered paths: ${Object.keys(inputSchema.paths || {}).length} -> ${Object.keys(paths).length}`
  );

  return {
    ...inputSchema,
    paths,
  };
};

export default transformer;
