import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { parse as parseUrl } from 'node:url'
import https from 'node:https'
import http from 'node:http'

function arkBaseTarget(explicitBase) {
  const raw = (explicitBase || 'https://ark.cn-beijing.volces.com/api/v3').replace(
    /\/$/,
    '',
  )
  const u = new URL(raw)
  const origin = `${u.protocol}//${u.host}`
  let prefix = u.pathname
  if (!prefix || prefix === '/') prefix = '/api/v3'
  return { origin, prefix }
}

function allowImageProxyHost(hostname) {
  return (
    hostname.endsWith('.volces.com') ||
    hostname.endsWith('.volcengine.com') ||
    hostname.endsWith('.byteimg.com') ||
    hostname.includes('volces.com')
  )
}

function mountArkImageProxy(middlewares) {
  middlewares.use('/__dev-proxy/ark-image', (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.end()
      return
    }
    const parsed = parseUrl(req.url || '', true)
    const raw = parsed.query?.url
    const imageUrl =
      typeof raw === 'string'
        ? decodeURIComponent(raw)
        : Array.isArray(raw)
          ? decodeURIComponent(raw[0] || '')
          : ''
    if (!imageUrl) {
      res.statusCode = 400
      res.end('missing url')
      return
    }
    let remote
    try {
      remote = new URL(imageUrl)
    } catch {
      res.statusCode = 400
      res.end('bad url')
      return
    }
    if (remote.protocol !== 'https:' && remote.protocol !== 'http:') {
      res.statusCode = 400
      res.end('bad protocol')
      return
    }
    if (!allowImageProxyHost(remote.hostname)) {
      res.statusCode = 403
      res.end('forbidden host')
      return
    }
    const client = remote.protocol === 'https:' ? https : http
    client
      .get(
        imageUrl,
        { headers: { 'User-Agent': 'spirit-gesture-tarot/dev-image-proxy' } },
        (r) => {
          if (r.statusCode && r.statusCode >= 400) {
            res.statusCode = r.statusCode
            r.resume()
            res.end()
            return
          }
          const ct = r.headers['content-type'] || 'application/octet-stream'
          res.statusCode = 200
          res.setHeader('Content-Type', Array.isArray(ct) ? ct[0] : ct)
          res.setHeader('Access-Control-Allow-Origin', '*')
          r.pipe(res)
        },
      )
      .on('error', (err) => {
        res.statusCode = 502
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(String(err?.message || err))
      })
  })
}

function arkImageProxyPlugin() {
  return {
    name: 'ark-image-download-proxy',
    configureServer(server) {
      mountArkImageProxy(server.middlewares)
    },
    configurePreviewServer(server) {
      mountArkImageProxy(server.middlewares)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const { origin, prefix } = arkBaseTarget(env.VITE_DOUBAO_BASE_URL)

  return {
    plugins: [react(), arkImageProxyPlugin()],
    server: {
      proxy: {
        '/__dev-proxy/ark-api': {
          target: origin,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/__dev-proxy\/ark-api/, prefix),
        },
      },
    },
    preview: {
      proxy: {
        '/__dev-proxy/ark-api': {
          target: origin,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/__dev-proxy\/ark-api/, prefix),
        },
      },
    },
  }
})
