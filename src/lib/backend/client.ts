import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { validatePublicConfig } from './public-config';
function createBackendClient() {
  const { url, key } = validatePublicConfig(import.meta.env['VITE_SUPABASE_URL'], import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']);
  return createClient<Database>(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: { fetch: (input, init) => {
      const headers = new Headers(input instanceof Request ? input.headers : undefined);
      new Headers(init?.headers).forEach((v, k) => headers.set(k, v));
      if (key.startsWith('sb_publishable_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
}
let client: ReturnType<typeof createBackendClient> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof createBackendClient>, {
  get(_, prop) { client ??= createBackendClient(); return Reflect.get(client, prop); },
});
