/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
    readonly SYNC_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
