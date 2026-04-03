import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Keep Supabase active — pings every 4 days to prevent free tier pause
const FOUR_DAYS = 4 * 24 * 60 * 60 * 1000
setInterval(async () => {
  await supabase.from('menu_items').select('id').limit(1)
}, FOUR_DAYS)