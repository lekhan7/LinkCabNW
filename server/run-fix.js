require('dotenv').config();
const { supabase } = require('./config/supabase');

async function runFix() {
  try {
    console.log('🔧 Applying database fix for participant status mapping...');
    console.log('📋 This script will provide the SQL needed to fix the stored procedure.');
    console.log('');
    console.log('The issue is that the notification system is sending "accept"/"reject"');
    console.log('but the database constraint expects "accepted"/"rejected".');
    console.log('');
    console.log('🔍 CURRENT ISSUE:');
    console.log('- Database constraint: CHECK (status IN (\'requested\', \'pending\', \'accepted\', \'rejected\', \'completed\'))');
    console.log('- Notification route sends: "accept", "reject"');
    console.log('- Database expects: "accepted", "rejected"');
    console.log('');
    console.log('🛠️  SOLUTION:');
    console.log('Run the following SQL in your Supabase SQL editor:');
    console.log('');
    console.log('-- Drop the existing function');
    console.log('DROP FUNCTION IF EXISTS update_participant_status(UUID, VARCHAR, UUID);');
    console.log('');
    console.log('-- Create the corrected function with status mapping');
    console.log(`CREATE OR REPLACE FUNCTION update_participant_status(
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_participant_status TO authenticated, anon;`);
    
    console.log('');
    console.log('📝 ALTERNATIVE QUICK FIX:');
    console.log('If you want a faster solution, you can also modify the notification route');
    console.log('in server/routes/notifications.js line 91-93 to map the status before calling the RPC:');
    console.log('');
    console.log('// Replace this:');
    console.log('const { data: result, error: updateError } = await supabase');
    console.log('  .rpc(\'update_participant_status\', {');
    console.log('    p_participant_id: notification.request_id,');
    console.log('    p_new_status: action,');
    console.log('    p_current_user_id: req.user.id');
    console.log('  });');
    console.log('');
    console.log('// With this:');
    console.log('const mappedAction = action === \'accept\' ? \'accepted\' : \'rejected\';');
    console.log('const { data: result, error: updateError } = await supabase');
    console.log('  .rpc(\'update_participant_status\', {');
    console.log('    p_participant_id: notification.request_id,');
    console.log('    p_new_status: mappedAction,');
    console.log('    p_current_user_id: req.user.id');
    console.log('  });');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runFix();
