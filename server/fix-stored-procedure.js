const { supabase } = require('./config/supabase');

async function fixStoredProcedure() {
  try {
    console.log('🔧 Fixing update_participant_status stored procedure...');
    
    // Drop and recreate the function with correct mapping
    const { data, error } = await supabase
      .rpc('exec', {
        sql: `
          DROP FUNCTION IF EXISTS update_participant_status(UUID, VARCHAR, UUID);
          
          CREATE OR REPLACE FUNCTION update_participant_status(
              p_participant_id UUID,
              p_new_status VARCHAR,
              p_current_user_id UUID
          )
          RETURNS JSON
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
              mapped_status VARCHAR(20);
              participant_record RECORD;
              user_phone VARCHAR(15);
          BEGIN
              -- Map the incoming status to the correct database value
              IF p_new_status = 'accept' THEN
                  mapped_status := 'accepted';
              ELSIF p_new_status = 'reject' THEN
                  mapped_status := 'rejected';
              ELSE
                  mapped_status := p_new_status;
              END IF;
              
              -- Validate that the mapped status is allowed
              IF mapped_status NOT IN ('requested', 'pending', 'accepted', 'rejected', 'completed') THEN
                  RETURN json_build_object(
                      'success', false,
                      'error', 'Invalid status: ' || mapped_status
                  );
              END IF;
              
              -- Update participant status and get the updated record
              UPDATE announcement_participants 
              SET status = mapped_status 
              WHERE id = p_participant_id
              RETURNING * INTO participant_record;
              
              -- Get user phone number for notification
              SELECT phone_number INTO user_phone 
              FROM users 
              WHERE id = participant_record.user_id;
              
              RETURN json_build_object(
                  'success', true,
                  'message', 'Status updated successfully',
                  'participant_updated', json_build_object(
                      'id', participant_record.id,
                      'user_id', participant_record.user_id,
                      'status', participant_record.status,
                      'phone_number', user_phone
                  )
              );
          END;
          $$;
          
          GRANT EXECUTE ON FUNCTION update_participant_status TO authenticated, anon;
        `
      });
    
    if (error) {
      console.error('❌ Error fixing stored procedure:', error);
      
      // Try using raw SQL through a different approach
      console.log('🔄 Trying direct SQL execution...');
      
      // Since we can't execute DDL directly via RPC, let's create a simple script
      // that can be run manually in the Supabase dashboard
      console.log(`
📋 MANUAL FIX REQUIRED:

Please run the following SQL in your Supabase SQL editor:

1. First, drop the existing function:
\`\`\`sql
DROP FUNCTION IF EXISTS update_participant_status(UUID, VARCHAR, UUID);
\`\`\`

2. Then create the new function with correct mapping:
\`\`\`sql
CREATE OR REPLACE FUNCTION update_participant_status(
    p_participant_id UUID,
    p_new_status VARCHAR,
    p_current_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    mapped_status VARCHAR(20);
    participant_record RECORD;
    user_phone VARCHAR(15);
BEGIN
    -- Map the incoming status to the correct database value
    IF p_new_status = 'accept' THEN
        mapped_status := 'accepted';
    ELSIF p_new_status = 'reject' THEN
        mapped_status := 'rejected';
    ELSE
        mapped_status := p_new_status;
    END IF;
    
    -- Validate that the mapped status is allowed
    IF mapped_status NOT IN ('requested', 'pending', 'accepted', 'rejected', 'completed') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid status: ' || mapped_status
        );
    END IF;
    
    -- Update participant status and get the updated record
    UPDATE announcement_participants 
    SET status = mapped_status 
    WHERE id = p_participant_id
    RETURNING * INTO participant_record;
    
    -- Get user phone number for notification
    SELECT phone_number INTO user_phone 
    FROM users 
    WHERE id = participant_record.user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Status updated successfully',
        'participant_updated', json_build_object(
            'id', participant_record.id,
            'user_id', participant_record.user_id,
            'status', participant_record.status,
            'phone_number', user_phone
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_participant_status TO authenticated, anon;
\`\`\`
      `);
      
    } else {
      console.log('✅ Stored procedure fixed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Failed to fix stored procedure:', error.message);
  }
}

fixStoredProcedure();
