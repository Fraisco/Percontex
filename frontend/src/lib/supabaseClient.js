import { createClient } from '@supabase/supabase-js'

// Sintaxis correcta para Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Las variables de entorno de Supabase no están configuradas' + supabaseUrl + ' ' + supabaseAnonKey)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,     // ✅ guarda sesión en localStorage
    autoRefreshToken: true,   // ✅ refresca tokens automáticamente
    detectSessionInUrl: true, // ✅ útil para OAuth/redirecciones
  },
})
