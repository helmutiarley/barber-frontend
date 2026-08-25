/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SHOP_TIMEZONE: string;
  readonly VITE_CANCELLATION_WINDOW_HOURS?: string;
  readonly VITE_CARD_FEE_RATE_DEBIT?: string;
  readonly VITE_CARD_FEE_RATE_CREDIT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
