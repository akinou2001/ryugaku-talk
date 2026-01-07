/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  webpack: (config, { isServer }) => {
    // three-mesh-bvhの互換性問題を回避
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    // three-mesh-bvhのESM/CJS混在問題を回避
    // MeshRefractionMaterialの自動読み込みを防ぐ
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    
    // three-mesh-bvhのバージョン互換性問題を回避
    config.optimization = {
      ...config.optimization,
      sideEffects: false,
    }
    
    return config
  },
}

module.exports = nextConfig
