import { createClient } from '@supabase/supabase-js';
import { createMockSupabase } from './supabase-mock';

const supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const httpProto = 'http' + '://';
const httpsProto = 'https' + '://';
const isValidUrl = supabaseUrlRaw.startsWith(httpProto) || supabaseUrlRaw.startsWith(httpsProto);

const finalSupabaseUrl = isValidUrl ? supabaseUrlRaw : (httpsProto + 'placeholder.supabase.co');
const finalSupabaseKey = supabaseKey || 'dummy-key-for-build';

const isMockMode = !isValidUrl || supabaseUrlRaw.includes('your-supabase-project-url') || process.env.NEXT_PUBLIC_STANDALONE_MODE === 'true';

// ブラウザ完結 / モックモードに対応
export const supabase = isMockMode 
  ? (createMockSupabase() as any)
  : createClient(finalSupabaseUrl, finalSupabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
