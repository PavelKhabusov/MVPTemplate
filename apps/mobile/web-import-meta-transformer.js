/**
 * Custom Metro transformer that replaces `import.meta.env` with process.env
 * equivalents for web platform. This is needed because Metro wraps modules
 * in CommonJS functions where `import.meta` is invalid syntax.
 *
 * Applies to ALL files (including node_modules) unlike babel.config.js plugins.
 */
const upstreamTransformer = require('@expo/metro-config/babel-transformer')

module.exports.transform = function transform({ src, filename, options, ...rest }) {
  if (options.platform === 'web' && src.includes('import.meta')) {
    // Order matters: most specific patterns first
    src = src.replace(/\bimport\.meta\.env\.MODE\b/g, 'process.env.NODE_ENV')
    src = src.replace(
      /\bimport\.meta\.env\b/g,
      '({ MODE: process.env.NODE_ENV })'
    )
    src = src.replace(/\bimport\.meta\.url\b/g, '""')
    src = src.replace(
      /\bimport\.meta\b/g,
      '({ env: { MODE: process.env.NODE_ENV }, url: "" })'
    )
  }
  return upstreamTransformer.transform({ src, filename, options, ...rest })
}
