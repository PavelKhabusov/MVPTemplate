import * as net from 'net'
import * as dns from 'dns'
import * as os from 'os'
import { spawn } from 'child_process'
import { proxyRepository } from './proxy.repository'

function buildProxyUrl(proxy: { host: string; protocol: string; httpPort: number | null; socks5Port: number | null; username: string | null; password: string | null }) {
  const isSocks = proxy.protocol === 'socks5'
  const port = isSocks ? (proxy.socks5Port || 1080) : (proxy.httpPort || 8080)
  const scheme = isSocks ? 'socks5' : 'http'

  if (proxy.username && proxy.password) {
    const u = encodeURIComponent(proxy.username)
    const p = encodeURIComponent(proxy.password)
    return `${scheme}://${u}:${p}@${proxy.host}:${port}`
  }
  return `${scheme}://${proxy.host}:${port}`
}

function getServerIp(): string {
  try {
    const nets = os.networkInterfaces()
    for (const name of Object.keys(nets)) {
      for (const iface of nets[name] ?? []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address
        }
      }
    }
  } catch {
    // ignore
  }
  return 'unknown'
}

/**
 * Full HTTPS test via curl spawn (works reliably in Docker)
 */
export async function testProxy(proxyId: string): Promise<{
  success: boolean
  message: string
  latency?: number
  details?: { proxyHost: string; proxyPort: number; testUrl: string; errorCode?: string; errorType?: string; timestamp: string }
}> {
  const proxy = await proxyRepository.findByIdRaw(proxyId)
  if (!proxy) throw new Error('Proxy not found')

  const isSocks = proxy.protocol === 'socks5'

  if (isSocks && !proxy.socks5Port) {
    return {
      success: false,
      message: 'Protocol is SOCKS5 but SOCKS5 port is not set',
      details: { proxyHost: proxy.host, proxyPort: 0, testUrl: '', errorType: 'CONFIGURATION_ERROR', timestamp: new Date().toISOString() },
    }
  }
  if (!isSocks && !proxy.httpPort) {
    return {
      success: false,
      message: 'Protocol is HTTP but HTTP port is not set',
      details: { proxyHost: proxy.host, proxyPort: 0, testUrl: '', errorType: 'CONFIGURATION_ERROR', timestamp: new Date().toISOString() },
    }
  }

  const port = isSocks ? (proxy.socks5Port || 1080) : (proxy.httpPort || 8080)
  const testUrl = 'https://httpbin.org/ip'

  await proxyRepository.updateCheckStatus(proxyId, 'pending', 'Testing...')

  const startTime = Date.now()

  try {
    const curlArgs: string[] = ['-s', '-S', '--max-time', '20']

    if (isSocks) {
      curlArgs.push('--socks5-hostname', `${proxy.host}:${port}`)
      if (proxy.username && proxy.password) {
        curlArgs.push('--proxy-user', `${proxy.username}:${proxy.password}`)
      }
    } else {
      curlArgs.push('--proxy', `http://${proxy.host}:${port}`)
      if (proxy.username && proxy.password) {
        curlArgs.push('--proxy-user', `${proxy.username}:${proxy.password}`)
      }
    }

    curlArgs.push(testUrl)

    const stdout = await new Promise<string>((resolve, reject) => {
      let stdoutData = ''
      let stderrData = ''

      const proc = spawn('curl', curlArgs)
      proc.stdout.on('data', (d) => { stdoutData += d.toString() })
      proc.stderr.on('data', (d) => { stderrData += d.toString() })
      proc.on('error', (err) => reject(new Error(`Failed to start curl: ${err.message}`)))
      proc.on('close', (code) => {
        if (code === 0) resolve(stdoutData + stderrData)
        else {
          const e: any = new Error(`curl exited with code ${code}`)
          e.stdout = stdoutData + stderrData
          reject(e)
        }
      })
      setTimeout(() => { proc.kill(); reject(new Error('Curl timeout after 35s')) }, 35000)
    })

    const latency = Date.now() - startTime

    if (stdout && stdout.trim().length > 0) {
      const msg = `Proxy working! Latency: ${latency}ms`
      await proxyRepository.updateCheckStatus(proxyId, 'success', msg)
      return { success: true, message: msg, latency, details: { proxyHost: proxy.host, proxyPort: port, testUrl, timestamp: new Date().toISOString() } }
    } else {
      throw new Error('Empty response from curl')
    }
  } catch (error: any) {
    const latency = Date.now() - startTime
    let errorMessage = `Test failed: ${error.message}`
    let errorType = 'CURL_ERROR'

    if (error.message.includes('timed out') || error.message.includes('timeout')) {
      errorMessage = 'Timeout: proxy not responding'
      errorType = 'TIMEOUT'
    } else if (error.message.includes('Could not resolve')) {
      errorMessage = `DNS error: cannot resolve ${proxy.host}`
      errorType = 'DNS_ERROR'
    } else if (error.message.includes('Connection refused')) {
      errorMessage = `Connection refused on ${proxy.host}:${port}`
      errorType = 'CONNECTION_REFUSED'
    } else if (error.message.includes('407')) {
      errorMessage = 'Proxy requires authentication (407)'
      errorType = 'AUTH_REQUIRED'
    }

    await proxyRepository.updateCheckStatus(proxyId, 'failed', errorMessage)
    return { success: false, message: errorMessage, details: { proxyHost: proxy.host, proxyPort: port, testUrl: 'https://httpbin.org/ip', errorType, timestamp: new Date().toISOString() } }
  }
}

/**
 * TCP connectivity test
 */
export async function testProxyConnectivity(proxyId: string): Promise<{
  success: boolean
  message: string
  latency?: number
  details?: { proxyHost: string; proxyPort: number; errorCode?: string; errorType?: string; timestamp: string }
}> {
  const proxy = await proxyRepository.findByIdRaw(proxyId)
  if (!proxy) throw new Error('Proxy not found')

  const isSocks = proxy.protocol === 'socks5'
  const port = isSocks ? (proxy.socks5Port || 1080) : (proxy.httpPort || 8080)

  return new Promise((resolve) => {
    const startTime = Date.now()
    const timeout = 10000

    const socket = net.createConnection({ host: proxy.host, port, timeout })

    socket.on('connect', () => {
      const latency = Date.now() - startTime
      socket.destroy()
      resolve({
        success: true,
        message: `TCP connection established! Latency: ${latency}ms`,
        latency,
        details: { proxyHost: proxy.host, proxyPort: port, timestamp: new Date().toISOString() },
      })
    })

    socket.on('error', (error: any) => {
      const latency = Date.now() - startTime
      let errorMessage = `TCP error: ${error.message}`
      let errorType = 'TCP_ERROR'

      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused (${proxy.host}:${port}). Server IP: ${getServerIp()}`
        errorType = 'TCP_REFUSED'
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = `DNS error: cannot resolve ${proxy.host}`
        errorType = 'DNS_ERROR'
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = `TCP timeout (${timeout}ms). Proxy not responding.`
        errorType = 'TCP_TIMEOUT'
      } else if (error.code === 'ENETUNREACH') {
        errorMessage = `Network unreachable for ${proxy.host}`
        errorType = 'NETWORK_UNREACHABLE'
      }

      resolve({
        success: false,
        message: errorMessage,
        details: { proxyHost: proxy.host, proxyPort: port, errorCode: error.code || 'UNKNOWN', errorType, timestamp: new Date().toISOString() },
      })
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve({
        success: false,
        message: `TCP timeout (${timeout}ms). Proxy not responding.`,
        details: { proxyHost: proxy.host, proxyPort: port, errorType: 'TCP_TIMEOUT', timestamp: new Date().toISOString() },
      })
    })
  })
}

/**
 * Network diagnostics
 */
export async function diagnoseNetwork(proxyId: string): Promise<{
  success: boolean
  diagnostics: {
    dnsResolution?: string
    tcpConnect?: string
    containerInfo?: string
    networkInterfaces?: any
  }
}> {
  const proxy = await proxyRepository.findByIdRaw(proxyId)
  if (!proxy) throw new Error('Proxy not found')

  const diagnostics: any = {}

  // Network interfaces
  try {
    const nets = os.networkInterfaces()
    diagnostics.networkInterfaces = Object.keys(nets).map((name) => ({
      name,
      addresses: (nets[name] ?? []).filter((n: any) => n.family === 'IPv4'),
    }))
    diagnostics.containerInfo = `Hostname: ${os.hostname()}, Platform: ${os.platform()}`
  } catch (error: any) {
    diagnostics.networkInterfaces = `Error: ${error.message}`
  }

  // DNS resolution
  try {
    const addresses = await dns.promises.resolve4(proxy.host)
    diagnostics.dnsResolution = `DNS resolved: ${proxy.host} -> ${addresses.join(', ')}`
  } catch (error: any) {
    diagnostics.dnsResolution = `DNS failed: ${error.message}`
  }

  // TCP connectivity
  const isSocks = proxy.protocol === 'socks5'
  const port = isSocks ? (proxy.socks5Port || 1080) : (proxy.httpPort || 8080)

  diagnostics.tcpConnect = await new Promise<string>((resolve) => {
    const socket = net.createConnection({ host: proxy.host, port, timeout: 5000 })
    socket.on('connect', () => { socket.destroy(); resolve(`TCP connection successful to ${proxy.host}:${port}`) })
    socket.on('error', (error: any) => resolve(`TCP connection failed: ${error.message} (code: ${error.code})`))
    socket.on('timeout', () => { socket.destroy(); resolve('TCP connection timeout') })
  })

  return { success: true, diagnostics }
}
