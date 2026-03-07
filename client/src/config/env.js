// Environment configuration for the client
export const config = {
  // API base URL - change this to match your server configuration
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  
  // Other environment variables can be added here
  environment: import.meta.env.MODE || 'development',
  
  // Supabase configuration (if needed on client side)
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};
