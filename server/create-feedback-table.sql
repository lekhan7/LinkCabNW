-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rating integer NULL,
  feedback_type character varying(50) NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status character varying(20) NULL DEFAULT 'pending'::character varying,
  priority character varying(10) NULL DEFAULT 'medium'::character varying,
  admin_response text NULL,
  admin_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at timestamp with time zone NULL,
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users (id) ON DELETE SET NULL,
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT feedback_status_check CHECK (
    (
      (status)::text = ANY (
        (ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[]
      )
    )
  ),
  CONSTRAINT feedback_priority_check CHECK (
    (
      (priority)::text = ANY (
        (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]
      )
    )
  ),
  CONSTRAINT feedback_feedback_type_check CHECK (
    (
      (feedback_type)::text = ANY (
        (ARRAY['bug_report'::character varying, 'feature_request'::character varying, 'general_feedback'::character varying, 'complaint'::character varying, 'suggestion'::character varying, 'compliment'::character varying])::text[]
      )
    )
  ),
  CONSTRAINT feedback_rating_check CHECK (
    (
      (rating >= 1)
      AND (rating <= 5)
    )
  )
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback USING btree (priority) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback USING btree (feedback_type) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
BEFORE UPDATE ON feedback 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
