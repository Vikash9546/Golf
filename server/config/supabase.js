import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ CRITICAL: Supabase credentials missing from .env');
    console.error('URL:', supabaseUrl ? 'Found' : 'MISSING');
    console.error('Key:', supabaseKey ? 'Found' : 'MISSING');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
