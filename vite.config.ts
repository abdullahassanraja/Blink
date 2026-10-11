import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Keep in sync with src/config/app.ts
const APP_NAME = 'Blink'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'local-gemini-proxy',
        configureServer(server) {
          server.middlewares.use(async (req: any, res: any, next: any) => {
            if (req.url === '/api/gemini' && req.method === 'POST') {
              let raw = ''
              req.on('data', (chunk: any) => {
                raw += chunk
              })
              req.on('end', async () => {
                try {
                  const body = JSON.parse(raw)
                  const { handleGeminiRequest } = await server.ssrLoadModule('./api/gemini.ts')
                  const clientIp = req.socket?.remoteAddress || '127.0.0.1'
                  const result = await handleGeminiRequest(body, clientIp)
                  res.statusCode = result.status
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(result.data))
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.stack || err.message : String(err)
                  console.error('Local Gemini Proxy Error:', message)
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: message }))
                }
              })
              return
            }
            next()
          })
        },
      },
    VitePWA({
      registerType: 'autoUpdate',
      // Use injectManifest so we control the SW file directly.
      // This avoids a workbox-build bug where absolute node_modules paths
      // containing apostrophes (from the project folder name) break the
      // generated SW template. With injectManifest, workbox only injects
      // the precache manifest array into our pre-compiled sw.ts.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: 'One tap. One sentence. Voice-first camera assistant for blind and low-vision users.',
        theme_color: '#EDF17B',
        background_color: '#EDF17B',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },
      devOptions: {
        enabled: false, // SW not needed in dev
      },
    }),
  ],
  }
})
