import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lqbyfdunpkminhxmbvgv.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxYnlmZHVucGttaW5oeG1idmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNTczMzMsImV4cCI6MjA5MDkzMzMzM30.CEkdsfeMtg5glPlsSPM7FEWr0ONRO94iAlyrbRu7llU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
