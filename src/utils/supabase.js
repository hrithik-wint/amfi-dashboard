import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://hjpkzfoduccbpnlzpabb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcGt6Zm9kdWNjYnBubHpwYWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDYzOTEsImV4cCI6MjA5MDkyMjM5MX0.3Oyj2ILU-F3ryxOdF1J28FriOOPR103M7vA0aupHI2o'
)
