/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_DFX_NETWORK: string;
  readonly VITE_HOST: string;
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}