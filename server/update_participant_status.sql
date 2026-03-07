-- Create RPC function to update participant status without updated_at issues
CREATE OR REPLACE FUNCTION update_participant_status(
  participant_uuid UUID,
  new_status VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE announcement_participants 
  SET status = new_status 
  WHERE id = participant_uuid;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Status updated successfully'
  );
END;
$$;
