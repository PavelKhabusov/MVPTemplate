const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot]

// Let Metro resolve packages from the monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Fix tslib ESM/CJS interop issue for web (Tamagui v2 RC + framer-motion)
// Metro follows "import" → "node" path in tslib exports, which breaks on web.
// Redirect tslib to its proper ESM build for web platform.
const originalResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'tslib') {
    const tslibEsm = path.resolve(
      monorepoRoot,
      'node_modules/tslib/tslib.es6.mjs'
    )
    return { filePath: tslibEsm, type: 'sourceFile' }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

// Replace import.meta.env in ALL files (including node_modules) for web.
// Babel plugins only apply to project code, so we need a transformer-level fix.
config.transformer.babelTransformerPath = require.resolve(
  './web-import-meta-transformer.js'
)

module.exports = config
