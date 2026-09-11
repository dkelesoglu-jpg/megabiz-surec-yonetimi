"use client";
import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

declare global {
  interface Window {
    __MEGA_HRMS_PUBLIC_CONFIG__?: {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
    };
  }
}

/** Tarayıcıda tek bir Supabase istemcisi paylaşılır; oturum çerezlerde tutulur. */
export function getSupabaseBrowserClient() {
  if (!client) {
    const runtimeConfig = window.__MEGA_HRMS_PUBLIC_CONFIG__;
    client = createBrowserClient(
      runtimeConfig?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      runtimeConfig?.supabaseAnonKey ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
