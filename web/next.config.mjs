/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxy to a local ComfyUI so the browser avoids CORS. Override with COMFY_URL.
    const target = process.env.COMFY_URL || "http://127.0.0.1:8188";
    return [{ source: "/comfy/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
