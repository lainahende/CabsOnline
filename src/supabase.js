import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qzaypsrbxyaanqmemgsn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6YXlwc3JieHlhYW5xbWVtZ3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTI3NzQsImV4cCI6MjA5NDAyODc3NH0.2Q5yPgakpiVAqkdtj3L8qaRyFam-o6FSxCg594ufjmY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
