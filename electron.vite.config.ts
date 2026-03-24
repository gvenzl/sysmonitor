import { defineConfig } from 'electron-vite';

export default defineConfig({
    main: {
        build: {
            lib: {
                entry: 'src/electron/main.ts'
            }
        }
    },
    preload: {
        build: {
            lib: {
                entry: 'src/electron/preload.ts'
            }
        }
    },
    renderer: {}
});
