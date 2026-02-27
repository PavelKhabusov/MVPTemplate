import fs from 'fs'
import path from 'path'

export function getEnvFilePath(): string {
  return path.resolve(process.cwd(), '.env')
}

export function parseEnvFile(filePath: string): { lines: string[]; values: Record<string, string | null> } {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const values: Record<string, string | null> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    // Active variable: KEY=VALUE
    const activeMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (activeMatch) {
      values[activeMatch[1]] = activeMatch[2]
      continue
    }
    // Commented variable: # KEY=VALUE
    const commentMatch = trimmed.match(/^#\s*([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (commentMatch) {
      if (!(commentMatch[1] in values)) {
        values[commentMatch[1]] = null // null means commented out
      }
    }
  }
  return { lines, values }
}

export function updateEnvFile(filePath: string, updates: Record<string, string | boolean | null>): Record<string, string | null> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const updatedKeys = new Set<string>()

  const newLines = lines.map((line) => {
    const trimmed = line.trim()

    // Check active variable
    const activeMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (activeMatch && activeMatch[1] in updates) {
      const key = activeMatch[1]
      const newValue = updates[key]
      updatedKeys.add(key)
      if (newValue === null || newValue === '') {
        return `# ${key}=${activeMatch[2]}`
      }
      const val = typeof newValue === 'boolean' ? String(newValue) : newValue
      return `${key}=${val}`
    }

    // Check commented variable
    const commentMatch = trimmed.match(/^#\s*([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (commentMatch && commentMatch[1] in updates) {
      const key = commentMatch[1]
      if (updatedKeys.has(key)) return line
      const newValue = updates[key]
      updatedKeys.add(key)
      if (newValue === null || newValue === '') {
        return line
      }
      if (newValue === '__TOGGLE_ON__') {
        return `${key}=${commentMatch[2]}`
      }
      const val = typeof newValue === 'boolean' ? String(newValue) : newValue
      return `${key}=${val}`
    }

    return line
  })

  // Add any new keys that weren't found in the file
  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key) && value !== null && value !== '') {
      const val = typeof value === 'boolean' ? String(value) : value
      newLines.push(`${key}=${val}`)
    }
  }

  fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8')
  return parseEnvFile(filePath).values
}
