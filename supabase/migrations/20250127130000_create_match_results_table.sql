-- Migration: Create match_results table for optimized print processing
-- This replaces the match_prints table with a direct result storage approach

-- Create match_results table
CREATE TABLE IF NOT EXISTS public.match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    placement INTEGER NOT NULL CHECK (placement >= 1 AND placement <= 20),
    kills INTEGER DEFAULT 0 CHECK (kills >= 0),
    placement_points INTEGER DEFAULT 0 CHECK (placement_points >= 0),
    kill_points INTEGER DEFAULT 0 CHECK (kill_points >= 0),
    total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
    confidence_score DECIMAL(3,2) DEFAULT 0.95 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Ensure unique result per match/team combination
    UNIQUE(match_id, team_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON public.match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_team_id ON public.match_results(team_id);
CREATE INDEX IF NOT EXISTS idx_match_results_tenant_id ON public.match_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_match_results_placement ON public.match_results(placement);
CREATE INDEX IF NOT EXISTS idx_match_results_total_points ON public.match_results(total_points DESC);

-- Enable Row Level Security
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view results in their tenant
CREATE POLICY "Users can view results in their tenant" ON public.match_results
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- RLS Policy: Managers can manage results
CREATE POLICY "Managers can manage results" ON public.match_results
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('manager', 'co-manager')
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_match_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row changes
CREATE TRIGGER update_match_results_updated_at_trigger
    BEFORE UPDATE ON public.match_results
    FOR EACH ROW
    EXECUTE FUNCTION update_match_results_updated_at();

-- Function to automatically calculate total_points
CREATE OR REPLACE FUNCTION calculate_match_result_total_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-calculate total points if not explicitly set
    IF NEW.total_points = 0 OR NEW.total_points IS NULL THEN
        NEW.total_points = COALESCE(NEW.placement_points, 0) + COALESCE(NEW.kill_points, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate total points
CREATE TRIGGER calculate_match_result_total_points_trigger
    BEFORE INSERT OR UPDATE ON public.match_results
    FOR EACH ROW
    EXECUTE FUNCTION calculate_match_result_total_points();

-- Grant necessary permissions
GRANT ALL ON public.match_results TO authenticated;
GRANT ALL ON public.match_results TO service_role;

-- Comment on table
COMMENT ON TABLE public.match_results IS 'Stores processed match results from AI analysis of match screenshots. Replaces the match_prints table for optimized direct processing.';
COMMENT ON COLUMN public.match_results.confidence_score IS 'AI confidence score for the extracted data (0.0 to 1.0)';
COMMENT ON COLUMN public.match_results.placement IS 'Final placement in the match (1-20)';
COMMENT ON COLUMN public.match_results.kills IS 'Number of kills/eliminations';
COMMENT ON COLUMN public.match_results.placement_points IS 'Points earned from final placement';
COMMENT ON COLUMN public.match_results.kill_points IS 'Points earned from kills';
COMMENT ON COLUMN public.match_results.total_points IS 'Total points (placement + kills), auto-calculated if not set';