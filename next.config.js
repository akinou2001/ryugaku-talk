/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  webpack: (config, { isServer }) => {
    // three-mesh-bvhのBatchedMeshエラーを回避するため、three-mesh-bvhを無視
    config.resolve.alias = {
      ...config.resolve.alias,
      'three-mesh-bvh': false,
    }
    
    // @react-three/dreiからBvhを除外
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-three/drei/core/Bvh': false,
      }
    }
    
    return config
  },
}

module.exports = nextConfig
