/* 
 * Cliente Supabase - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 11:15
 * @version 1.3.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ncthxqkygkflmgshuola.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdGh4cWt5Z2tmbG1nc2h1b2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODEwODYsImV4cCI6MjA4NDY1NzA4Nn0.LdNxTQmgvFPF1iCf7mzaGGHj6Ad_oGsqsvpWmK7mGaQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para logs em desenvolvimento
export const logSupabaseError = (context: string, error: unknown) => {
    if (import.meta.env.DEV) {
        console.error(`[Supabase ${context}]`, error);
    }
};
