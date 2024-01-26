/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly SYNC_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
