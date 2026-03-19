// Environment configuration for the client
export const config = {
  // API base URL - change this to match your server configuration
  apiBaseUrl: import.meta.env.VITE_API_URL || 'https://linkcab-0t9d.onrender.com/api',
  
  // Alternative base URL for development (when server is on different port)
  devApiBaseUrl: 'https://linkcab-0t9d.onrender.com/api',
  
  // Other environment variables can be added here
  environment: import.meta.env.MODE || 'development',
  
  // Supabase configuration (directly configured)
  supabaseUrl: 'https://noqifjjjrvlptyovteih.supabase.co',
  supabaseAnonKey: 'sb_publishable_CVmKkTkJqsoBwl8ySKM6DQ_ee7TSoZR',
};
