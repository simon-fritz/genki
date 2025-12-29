import path from "path"
import tailwindcss from "@tailwindcss/vite"
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'


const backendTarget =
    process.env.DOCKER === "true"
        ? "http://backend:8000"
        : "http://localhost:8000";


// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            // Browser calls http://localhost:5173/api/...
            // Vite forwards inside Docker to http://backend:8000/api/...
            "/api": {target: backendTarget, changeOrigin: true, secure: false},
        },
    },
})
