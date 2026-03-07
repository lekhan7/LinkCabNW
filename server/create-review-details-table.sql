-- ============================================
-- REVIEW_DETAILS TABLE
-- ============================================
CREATE TABLE review_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id), -- Person who wrote the review
    reviewee_id UUID NOT NULL REFERENCES users(id), -- Person being reviewed
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    review_description TEXT,
    report_type VARCHAR(100),
    report_description TEXT,
    announcement_id UUID REFERENCES announcements(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for review_details
CREATE INDEX idx_review_details_user_id ON review_details(user_id);
CREATE INDEX idx_review_details_reviewee_id ON review_details(reviewee_id);
CREATE INDEX idx_review_details_stars ON review_details(stars);
CREATE INDEX idx_review_details_report_type ON review_details(report_type);
CREATE INDEX idx_review_details_created_at ON review_details(created_at);

-- Apply updated_at trigger
CREATE TRIGGER update_review_details_updated_at BEFORE UPDATE ON review_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE review_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_details
CREATE POLICY "Allow all inserts" ON review_details FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all selects" ON review_details FOR SELECT USING (true);
CREATE POLICY "Users can view own reviews" ON review_details FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own reviews" ON review_details FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Admins can view all reviews" ON review_details FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = TRUE)
);
