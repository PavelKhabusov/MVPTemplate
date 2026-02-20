module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Transform import.meta.env → process.env for Metro web compatibility
      // (Zustand, Tamagui, and other libs use import.meta.env which is ESM-only)
      importMetaEnvPlugin,
      'react-native-reanimated/plugin',
    ],
  }
}

function importMetaEnvPlugin({ template }) {
  const ast = template.expression('process.env.NODE_ENV')
  return {
    visitor: {
      MetaProperty(path) {
        const { node, parent } = path
        if (node.meta.name !== 'import' || node.property.name !== 'meta') return

        // import.meta.env.MODE → process.env.NODE_ENV
        if (
          parent.type === 'MemberExpression' &&
          parent.property.name === 'env'
        ) {
          const grandParent = path.parentPath.parent
          if (
            grandParent &&
            grandParent.type === 'MemberExpression' &&
            grandParent.property.name === 'MODE'
          ) {
            path.parentPath.parentPath.replaceWith(ast())
            return
          }
          // import.meta.env → { MODE: process.env.NODE_ENV }
          path.parentPath.replaceWith(
            template.expression('({ MODE: process.env.NODE_ENV })')()
          )
          return
        }

        // import.meta.url → "" (fallback)
        if (
          parent.type === 'MemberExpression' &&
          parent.property.name === 'url'
        ) {
          path.parentPath.replaceWith(template.expression('""')())
          return
        }

        // Bare import.meta → { env: { MODE: process.env.NODE_ENV } }
        path.replaceWith(
          template.expression(
            '({ env: { MODE: process.env.NODE_ENV }, url: "" })'
          )()
        )
      },
    },
  }
}
