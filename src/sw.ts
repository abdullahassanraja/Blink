/**
 * Blink Service Worker
 * Strategy: injectManifest (vite-plugin-pwa injects self.__WB_MANIFEST at build time)
 *
 * Offline caching is fully wired in Feature 7.
 * For now: cache-first for precached assets, network-first for everything else.
 */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

// Take control immediately on install/activate
clientsClaim()
self.addEventListener('install', () => (self as unknown as { skipWaiting: () => void }).skipWaiting())

// Remove stale precache entries from previous SW versions
cleanupOutdatedCaches()

// Precache all assets listed by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST)
