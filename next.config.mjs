/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com'
            }
        ]
    },
    allowedDevOrigins: [
      '*.trycloudflare.com',
      '*.lhr.life',
      'localhost:3000',
      '127.0.0.1:3000',
    ],
};

export default nextConfig;
