-- Fix feedback constraint to include 'compliment' type
-- Drop the existing constraint and recreate it with compliment included

-- Drop the existing constraint
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_feedback_type_check;

-- Recreate the constraint with compliment included
ALTER TABLE public.feedback 
ADD CONSTRAINT feedback_feedback_type_check CHECK (
  (feedback_type)::text = ANY (
    (ARRAY['bug_report'::character varying, 'feature_request'::character varying, 'general_feedback'::character varying, 'complaint'::character varying, 'suggestion'::character varying, 'compliment'::character varying])::text[]
  )
);

-- Verify the constraint was added
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.feedback'::regclass 
AND conname = 'feedback_feedback_type_check';
