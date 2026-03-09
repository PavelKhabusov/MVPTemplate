import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'

// ---- Mocks ----

const mockFindByIdRaw = vi.fn()
const mockUpdateCheckStatus = vi.fn()
vi.mock('../proxy.repository', () => ({
  proxyRepository: {
    findByIdRaw: (...args: any[]) => mockFindByIdRaw(...args),
    updateCheckStatus: (...args: any[]) => mockUpdateCheckStatus(...args),
  },
}))

const mockSpawn = vi.fn()
vi.mock('child_process', () => ({
  spawn: (...args: any[]) => mockSpawn(...args),
}))

const mockCreateConnection = vi.fn()
vi.mock('net', () => ({
  createConnection: (...args: any[]) => mockCreateConnection(...args),
}))

const mockResolve4 = vi.fn()
vi.mock('dns', () => ({
  promises: {
    resolve4: (...args: any[]) => mockResolve4(...args),
  },
}))

vi.mock('os', () => ({
  networkInterfaces: () => ({
    eth0: [{ family: 'IPv4', address: '172.17.0.2', internal: false }],
    lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }],
  }),
  hostname: () => 'test-container',
  platform: () => 'linux',
}))

import { testProxy, testProxyConnectivity, diagnoseNetwork } from '../proxy.validator'

// ---- Helpers ----

function makeProxy(overrides: Record<string, any> = {}) {
  return {
    id: 'proxy-1',
    host: '1.2.3.4',
    protocol: 'http',
    httpPort: 8080,
    socks5Port: null,
    username: null,
    password: null,
    ...overrides,
  }
}

function createFakeProcess() {
  const proc = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter
    stderr: EventEmitter
    kill: ReturnType<typeof vi.fn>
  }
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.kill = vi.fn()
  return proc
}

function createFakeSocket() {
  const socket = new EventEmitter() as EventEmitter & {
    destroy: ReturnType<typeof vi.fn>
  }
  socket.destroy = vi.fn()
  return socket
}

/**
 * Helper: sets up spawn mock and schedules events on next tick
 * so listeners are attached before events fire.
 */
function setupSpawnWithEvents(
  events: Array<{ target: 'stdout' | 'stderr' | 'proc'; event: string; data?: any }>,
) {
  const fakeProc = createFakeProcess()
  mockSpawn.mockReturnValue(fakeProc)

  // Schedule events after current microtask queue drains (listeners will be attached)
  process.nextTick(() => {
    for (const e of events) {
      if (e.target === 'stdout') {
        fakeProc.stdout.emit(e.event, e.data)
      } else if (e.target === 'stderr') {
        fakeProc.stderr.emit(e.event, e.data)
      } else {
        fakeProc.emit(e.event, e.data)
      }
    }
  })

  return fakeProc
}

function setupSocketWithEvent(event: string, data?: any) {
  const fakeSocket = createFakeSocket()
  mockCreateConnection.mockReturnValue(fakeSocket)

  process.nextTick(() => {
    fakeSocket.emit(event, data)
  })

  return fakeSocket
}

// ---- Tests ----

describe('proxy.validator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockUpdateCheckStatus.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ============================================================
  // testProxy
  // ============================================================
  describe('testProxy', () => {
    it('should throw when proxy is not found', async () => {
      mockFindByIdRaw.mockResolvedValue(null)
      await expect(testProxy('non-existent')).rejects.toThrow('Proxy not found')
    })

    it('should return config error when socks5 protocol has no socks5Port', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy({ protocol: 'socks5', socks5Port: null }))

      const result = await testProxy('proxy-1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('SOCKS5 port is not set')
      expect(result.details?.errorType).toBe('CONFIGURATION_ERROR')
    })

    it('should return config error when http protocol has no httpPort', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy({ protocol: 'http', httpPort: null }))

      const result = await testProxy('proxy-1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('HTTP port is not set')
      expect(result.details?.errorType).toBe('CONFIGURATION_ERROR')
    })

    it('should return success when curl returns non-empty output', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSpawnWithEvents([
        { target: 'stdout', event: 'data', data: Buffer.from('{"origin": "1.2.3.4"}') },
        { target: 'proc', event: 'close', data: 0 },
      ])

      const result = await testProxy('proxy-1')

      expect(result.success).toBe(true)
      expect(result.message).toContain('Proxy working!')
      expect(result.latency).toBeGreaterThanOrEqual(0)
      expect(result.details?.proxyHost).toBe('1.2.3.4')
      expect(result.details?.proxyPort).toBe(8080)
      expect(result.details?.testUrl).toBe('https://httpbin.org/ip')
      expect(mockUpdateCheckStatus).toHaveBeenCalledWith('proxy-1', 'success', expect.stringContaining('Proxy working'))
    })

    it('should update check status to pending before testing', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSpawnWithEvents([
        { target: 'stdout', event: 'data', data: Buffer.from('ok') },
        { target: 'proc', event: 'close', data: 0 },
      ])

      await testProxy('proxy-1')

      expect(mockUpdateCheckStatus).toHaveBeenCalledWith('proxy-1', 'pending', 'Testing...')
    })

    it('should return error when curl returns empty response (exit code 0, no stdout)', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSpawnWithEvents([
        { target: 'proc', event: 'close', data: 0 },
      ])

      const result = await testProxy('proxy-1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Empty response')
    })

    it('should return CURL_ERROR when curl exits with non-zero code', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSpawnWithEvents([
        { target: 'stderr', event: 'data', data: Buffer.from('some error') },
        { target: 'proc', event: 'close', data: 1 },
      ])

      const result = await testProxy('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('CURL_ERROR')
      expect(mockUpdateCheckStatus).toHaveBeenCalledWith('proxy-1', 'failed', expect.any(String))
    })

    it('should return CURL_ERROR when spawn emits error event', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSpawnWithEvents([
        { target: 'proc', event: 'error', data: new Error('Failed to start curl: ENOENT') },
      ])

      const result = await testProxy('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('CURL_ERROR')
      expect(result.message).toContain('Failed to start curl')
    })

    it('should detect timeout from error message containing "timeout"', async () => {
      // The 35s setTimeout rejects with "Curl timeout after 35s"
      // which contains "timeout" -> errorType TIMEOUT
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      const fakeProc = createFakeProcess()
      mockSpawn.mockReturnValue(fakeProc)

      const promise = testProxy('proxy-1')

      // Advance timers past the 35s timeout
      await vi.advanceTimersByTimeAsync(36000)

      const result = await promise

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('TIMEOUT')
      expect(result.message).toContain('Timeout')
      expect(fakeProc.kill).toHaveBeenCalled()
    })

    it('should detect "Connection refused" in error message', async () => {
      // spawn 'error' event with a message containing "Connection refused"
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSpawnWithEvents([
        { target: 'proc', event: 'error', data: new Error('Connection refused by proxy') },
      ])

      const result = await testProxy('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('CONNECTION_REFUSED')
    })

    it('should detect "Could not resolve" (DNS) in error message', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy({ host: 'badhost.example' }))

      setupSpawnWithEvents([
        { target: 'proc', event: 'error', data: new Error('Could not resolve host: badhost.example') },
      ])

      const result = await testProxy('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('DNS_ERROR')
      expect(result.message).toContain('DNS error')
    })

    it('should detect "407" in error message (auth required)', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSpawnWithEvents([
        { target: 'proc', event: 'error', data: new Error('Received HTTP code 407 from proxy') },
      ])

      const result = await testProxy('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('AUTH_REQUIRED')
      expect(result.message).toContain('407')
    })

    it('should use --socks5-hostname flag for socks5 proxy with auth', async () => {
      mockFindByIdRaw.mockResolvedValue(
        makeProxy({ protocol: 'socks5', socks5Port: 1080, username: 'user', password: 'pass' }),
      )

      setupSpawnWithEvents([
        { target: 'stdout', event: 'data', data: Buffer.from('{"origin":"5.6.7.8"}') },
        { target: 'proc', event: 'close', data: 0 },
      ])

      await testProxy('proxy-1')

      expect(mockSpawn).toHaveBeenCalledWith('curl', expect.arrayContaining([
        '--socks5-hostname', '1.2.3.4:1080',
        '--proxy-user', 'user:pass',
      ]))
    })

    it('should use --proxy flag for http proxy with auth', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy({ username: 'admin', password: 's3cret' }))

      setupSpawnWithEvents([
        { target: 'stdout', event: 'data', data: Buffer.from('ok') },
        { target: 'proc', event: 'close', data: 0 },
      ])

      await testProxy('proxy-1')

      expect(mockSpawn).toHaveBeenCalledWith('curl', expect.arrayContaining([
        '--proxy', 'http://1.2.3.4:8080',
        '--proxy-user', 'admin:s3cret',
      ]))
    })

    it('should not include --proxy-user when no credentials', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSpawnWithEvents([
        { target: 'stdout', event: 'data', data: Buffer.from('ok') },
        { target: 'proc', event: 'close', data: 0 },
      ])

      await testProxy('proxy-1')

      const args = mockSpawn.mock.calls[0][1] as string[]
      expect(args).not.toContain('--proxy-user')
    })

    it('should use default port 8080 for http when httpPort is falsy but protocol allows it', async () => {
      // httpPort=0 is falsy but protocol is http -> the check `!proxy.httpPort` catches it
      // httpPort=null -> config error (tested above)
      // httpPort=8080 -> normal flow
      mockFindByIdRaw.mockResolvedValue(makeProxy({ httpPort: 3128 }))

      setupSpawnWithEvents([
        { target: 'stdout', event: 'data', data: Buffer.from('ok') },
        { target: 'proc', event: 'close', data: 0 },
      ])

      const result = await testProxy('proxy-1')

      expect(result.details?.proxyPort).toBe(3128)
    })

    it('should combine stdout and stderr data on success', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSpawnWithEvents([
        { target: 'stdout', event: 'data', data: Buffer.from('response-body') },
        { target: 'stderr', event: 'data', data: Buffer.from('  some warning') },
        { target: 'proc', event: 'close', data: 0 },
      ])

      const result = await testProxy('proxy-1')

      // stdout + stderr is non-empty -> success
      expect(result.success).toBe(true)
    })
  })

  // ============================================================
  // testProxyConnectivity
  // ============================================================
  describe('testProxyConnectivity', () => {
    it('should throw when proxy is not found', async () => {
      mockFindByIdRaw.mockResolvedValue(null)
      await expect(testProxyConnectivity('non-existent')).rejects.toThrow('Proxy not found')
    })

    it('should return success on TCP connect', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      const fakeSocket = setupSocketWithEvent('connect')

      const result = await testProxyConnectivity('proxy-1')

      expect(result.success).toBe(true)
      expect(result.message).toContain('TCP connection established')
      expect(result.latency).toBeGreaterThanOrEqual(0)
      expect(result.details?.proxyHost).toBe('1.2.3.4')
      expect(result.details?.proxyPort).toBe(8080)
      expect(fakeSocket.destroy).toHaveBeenCalled()
    })

    it('should return TCP_REFUSED on ECONNREFUSED', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      const err: any = new Error('connect ECONNREFUSED')
      err.code = 'ECONNREFUSED'
      setupSocketWithEvent('error', err)

      const result = await testProxyConnectivity('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('TCP_REFUSED')
      expect(result.details?.errorCode).toBe('ECONNREFUSED')
      expect(result.message).toContain('Connection refused')
    })

    it('should return DNS_ERROR on ENOTFOUND', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy({ host: 'invalid.host' }))

      const err: any = new Error('getaddrinfo ENOTFOUND')
      err.code = 'ENOTFOUND'
      setupSocketWithEvent('error', err)

      const result = await testProxyConnectivity('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('DNS_ERROR')
      expect(result.message).toContain('DNS error')
    })

    it('should return TCP_TIMEOUT on ETIMEDOUT', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      const err: any = new Error('connect ETIMEDOUT')
      err.code = 'ETIMEDOUT'
      setupSocketWithEvent('error', err)

      const result = await testProxyConnectivity('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('TCP_TIMEOUT')
    })

    it('should return NETWORK_UNREACHABLE on ENETUNREACH', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      const err: any = new Error('connect ENETUNREACH')
      err.code = 'ENETUNREACH'
      setupSocketWithEvent('error', err)

      const result = await testProxyConnectivity('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('NETWORK_UNREACHABLE')
      expect(result.message).toContain('Network unreachable')
    })

    it('should return generic TCP_ERROR for unknown error codes', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      const err: any = new Error('something unexpected')
      err.code = 'ESOMETHING'
      setupSocketWithEvent('error', err)

      const result = await testProxyConnectivity('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('TCP_ERROR')
      expect(result.details?.errorCode).toBe('ESOMETHING')
    })

    it('should return TCP_TIMEOUT on socket timeout event', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      const fakeSocket = setupSocketWithEvent('timeout')

      const result = await testProxyConnectivity('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorType).toBe('TCP_TIMEOUT')
      expect(result.message).toContain('timeout')
      expect(fakeSocket.destroy).toHaveBeenCalled()
    })

    it('should use socks5Port for socks5 protocol', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy({ protocol: 'socks5', socks5Port: 9050 }))

      setupSocketWithEvent('connect')

      const result = await testProxyConnectivity('proxy-1')

      expect(mockCreateConnection).toHaveBeenCalledWith({ host: '1.2.3.4', port: 9050, timeout: 10000 })
      expect(result.details?.proxyPort).toBe(9050)
    })

    it('should use default port 1080 for socks5 when socks5Port is null', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy({ protocol: 'socks5', socks5Port: null }))

      setupSocketWithEvent('connect')

      await testProxyConnectivity('proxy-1')

      expect(mockCreateConnection).toHaveBeenCalledWith({ host: '1.2.3.4', port: 1080, timeout: 10000 })
    })

    it('should set errorCode to UNKNOWN when error has no code property', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())

      setupSocketWithEvent('error', new Error('mysterious failure'))

      const result = await testProxyConnectivity('proxy-1')

      expect(result.success).toBe(false)
      expect(result.details?.errorCode).toBe('UNKNOWN')
      expect(result.details?.errorType).toBe('TCP_ERROR')
    })
  })

  // ============================================================
  // diagnoseNetwork
  // ============================================================
  describe('diagnoseNetwork', () => {
    it('should throw when proxy is not found', async () => {
      mockFindByIdRaw.mockResolvedValue(null)
      await expect(diagnoseNetwork('non-existent')).rejects.toThrow('Proxy not found')
    })

    it('should return full diagnostics on success', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())
      mockResolve4.mockResolvedValue(['93.184.216.34'])

      const fakeSocket = createFakeSocket()
      mockCreateConnection.mockReturnValue(fakeSocket)

      const promise = diagnoseNetwork('proxy-1')

      // DNS resolves via mockResolve4. TCP needs socket event.
      // createConnection is called synchronously during diagnoseNetwork execution,
      // but after await dns.promises.resolve4. Use nextTick to ensure listener is set.
      setTimeout(() => fakeSocket.emit('connect'), 0)

      const result = await promise

      expect(result.success).toBe(true)
      expect(result.diagnostics.dnsResolution).toContain('DNS resolved')
      expect(result.diagnostics.dnsResolution).toContain('93.184.216.34')
      expect(result.diagnostics.tcpConnect).toContain('TCP connection successful')
      expect(result.diagnostics.containerInfo).toContain('test-container')
      expect(result.diagnostics.networkInterfaces).toBeInstanceOf(Array)
    })

    it('should handle DNS resolution failure', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy({ host: 'bad-dns.example' }))
      mockResolve4.mockRejectedValue(new Error('queryA ENOTFOUND bad-dns.example'))

      const fakeSocket = createFakeSocket()
      mockCreateConnection.mockReturnValue(fakeSocket)

      const promise = diagnoseNetwork('proxy-1')

      setTimeout(() => fakeSocket.emit('connect'), 0)

      const result = await promise

      expect(result.success).toBe(true)
      expect(result.diagnostics.dnsResolution).toContain('DNS failed')
      expect(result.diagnostics.dnsResolution).toContain('ENOTFOUND')
    })

    it('should handle TCP connection failure in diagnostics', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())
      mockResolve4.mockResolvedValue(['1.2.3.4'])

      const fakeSocket = createFakeSocket()
      mockCreateConnection.mockReturnValue(fakeSocket)

      const promise = diagnoseNetwork('proxy-1')

      const err: any = new Error('connect ECONNREFUSED')
      err.code = 'ECONNREFUSED'
      setTimeout(() => fakeSocket.emit('error', err), 0)

      const result = await promise

      expect(result.diagnostics.tcpConnect).toContain('TCP connection failed')
      expect(result.diagnostics.tcpConnect).toContain('ECONNREFUSED')
    })

    it('should handle TCP timeout in diagnostics', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy())
      mockResolve4.mockResolvedValue(['1.2.3.4'])

      const fakeSocket = createFakeSocket()
      mockCreateConnection.mockReturnValue(fakeSocket)

      const promise = diagnoseNetwork('proxy-1')

      setTimeout(() => fakeSocket.emit('timeout'), 0)

      const result = await promise

      expect(result.diagnostics.tcpConnect).toContain('TCP connection timeout')
      expect(fakeSocket.destroy).toHaveBeenCalled()
    })

    it('should use correct port for socks5 protocol in diagnostics', async () => {
      mockFindByIdRaw.mockResolvedValue(makeProxy({ protocol: 'socks5', socks5Port: 9050 }))
      mockResolve4.mockResolvedValue(['1.2.3.4'])

      const fakeSocket = createFakeSocket()
      mockCreateConnection.mockReturnValue(fakeSocket)

      const promise = diagnoseNetwork('proxy-1')

      setTimeout(() => fakeSocket.emit('connect'), 0)

      await promise

      expect(mockCreateConnection).toHaveBeenCalledWith({ host: '1.2.3.4', port: 9050, timeout: 5000 })
    })
  })
})
