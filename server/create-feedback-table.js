const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createFeedbackTable() {
  try {
    console.log('Creating feedback table...');
    
    // First, let's check if the table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'feedback');
    
    if (tablesError) {
      console.error('Error checking table existence:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Feedback table already exists');
      return;
    }
    
    console.log('Creating feedback table...');
    
    // Create the table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.feedback (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        rating integer NULL,
        feedback_type character varying(50) NOT NULL,
        subject text NOT NULL,
        message text NOT NULL,
        status character varying(20) NULL DEFAULT 'pending',
        priority character varying(10) NULL DEFAULT 'medium',
        admin_response text NULL,
        admin_id uuid NULL,
        created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at timestamp with time zone NULL,
        CONSTRAINT feedback_pkey PRIMARY KEY (id),
        CONSTRAINT feedback_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users (id) ON DELETE SET NULL,
        CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
        CONSTRAINT feedback_status_check CHECK (
          (status)::text = ANY (ARRAY['pending', 'reviewed', 'resolved', 'dismissed']::text[])
        ),
        CONSTRAINT feedback_priority_check CHECK (
          (priority)::text = ANY (ARRAY['low', 'medium', 'high', 'urgent']::text[])
        ),
        CONSTRAINT feedback_feedback_type_check CHECK (
          (feedback_type)::text = ANY (ARRAY['bug_report', 'feature_request', 'general_feedback', 'complaint', 'suggestion']::text[])
        ),
        CONSTRAINT feedback_rating_check CHECK (
          (rating >= 1) AND (rating <= 5)
        )
      );
      
      CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback USING btree (user_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback USING btree (status);
      CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback USING btree (created_at);
      CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback USING btree (priority);
      CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback USING btree (feedback_type);
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('Error creating table:', createError);
      
      // Try alternative approach - create table step by step
      console.log('Trying alternative approach...');
      
      // Simple table creation without complex constraints first
      const simpleSQL = `
        CREATE TABLE IF NOT EXISTS public.feedback (
          id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id uuid NOT NULL,
          rating integer NULL,
          feedback_type character varying(50) NOT NULL,
          subject text NOT NULL,
          message text NOT NULL,
          status character varying(20) NULL DEFAULT 'pending',
          priority character varying(10) NULL DEFAULT 'medium',
          admin_response text NULL,
          admin_id uuid NULL,
          created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
          resolved_at timestamp with time zone NULL
        );
      `;
      
      const { error: simpleError } = await supabase.rpc('exec_sql', { sql: simpleSQL });
      
      if (simpleError) {
        console.error('Error with simple table creation:', simpleError);
      } else {
        console.log('✅ Simple feedback table created successfully');
        
        // Add indexes
        const indexSQL = `
          CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback (user_id);
          CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback (status);
          CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at);
        `;
        
        const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
        
        if (indexError) {
          console.error('Error creating indexes:', indexError);
        } else {
          console.log('✅ Indexes created successfully');
        }
      }
    } else {
      console.log('✅ Feedback table created successfully');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createFeedbackTable();
