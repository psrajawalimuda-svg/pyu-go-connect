import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-slot'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-map': ['leaflet', 'react-leaflet'],
          'vendor-utils': ['date-fns', 'zustand', 'sonner'],
          
          // Split admin features (lazy loaded)
          'admin-bundle': [
            'src/pages/admin/AdminDrivers.tsx',
            'src/pages/admin/AdminOverview.tsx',
            'src/components/admin/DriverEarningsAnalytics.tsx',
          ],
          
          // Split driver features
          'driver-bundle': [
            'src/pages/driver/DriverDashboard.tsx',
            'src/pages/driver/DriverProfile.tsx',
          ],
          
          // Split shuttle features
          'shuttle-bundle': [
            'src/pages/Shuttle.tsx',
            'src/components/shuttle/PickupSelector.tsx',
            'src/components/shuttle/SeatSelector.tsx',
          ],
        },
      },
    },
  },
}));
