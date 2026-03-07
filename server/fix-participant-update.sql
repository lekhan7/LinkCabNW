-- Simple RPC function to update participant status without triggers
CREATE OR REPLACE FUNCTION update_participant_status(
    participant_id UUID,
    new_status VARCHAR(20)
)
RETURNS TABLE (
    id UUID,
    announcement_id UUID,
    user_id UUID,
    joined_at TIMESTAMP,
    status VARCHAR(20),
    paid BOOLEAN,
    chat_id UUID
) AS $$
BEGIN
    -- Update participant status directly without triggering updated_at
    UPDATE announcement_participants 
    SET status = new_status
    WHERE id = participant_id
    RETURNING id, announcement_id, user_id, joined_at, status, paid, chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_participant_status TO authenticated, anon;
