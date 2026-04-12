import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(__dirname, '../..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forge/engine', '@forge/schema'],
  turbopack: {
    // Pin the Turbopack workspace root so Next doesn't walk up the tree
    // and pick an unrelated lockfile above /Volumes/workspace.
    root: workspaceRoot
  }
}

export default nextConfig
