// / <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_HTTPS?: string;
  readonly VITE_BASE_API: string;
  readonly VITE_BASE_SERVER: string;
  readonly VITE_COOKIE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
