/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_CESIUM_ION_TOKEN: string;
  readonly VITE_SITE_NAME: string;
  readonly VITE_CESIUM_MATERIAL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
