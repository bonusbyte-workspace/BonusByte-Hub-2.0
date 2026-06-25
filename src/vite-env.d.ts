/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_ADMIN_ROUTE: string;
  readonly VITE_MAX_CPS: string;
  readonly VITE_MAX_ENERGY: string;
  readonly VITE_REGEN_RATE: string;
  readonly VITE_COINS_PER_TAP: string;
  readonly VITE_ENERGY_PER_TAP: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
