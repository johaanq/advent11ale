import { createClient } from '@supabase/supabase-js'

// Estas variables deben estar en tu archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jieojrhobmrvwiqvbsye.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZW9qcmhvYm1ydndpcXZic3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjg4NjQsImV4cCI6MjA4MDY0NDg2NH0.nv4EjbdwhJ2MLs-8XPThl6_nLxwm1syLUGQM6N7e-9s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface OpenedGift {
  id: string
  gift_id: number
  opened_at: string
  created_at: string
}

