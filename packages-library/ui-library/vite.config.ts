import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, './src/components/index.tsx'),
            name: 'SimpleUI',
            fileName: 'simple-ui',
        },
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
    },
    plugins: [react(), tailwindcss(), tsconfigPaths()],
});
