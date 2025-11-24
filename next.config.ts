import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['ckeditor5', '@ckeditor/ckeditor5-react', '@wiris/mathtype-ckeditor5']
};

export default nextConfig;
