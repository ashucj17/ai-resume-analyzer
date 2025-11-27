import type { Config } from "@react-router/dev/config";

export default {
  // Disable SSR for static site generation (GitHub Pages)
  ssr: false,
  
  // Base path for GitHub Pages
  basename: process.env.NODE_ENV === "production" ? "/ai-resume-analyzer" : "/",
  
  // Future flags
  future: {
    unstable_singleFetch: true,
  },
} satisfies Config;