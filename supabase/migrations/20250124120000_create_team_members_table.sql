-- Create team_members table to manage players in teams
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'player' CHECK (role IN ('captain', 'player')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for team_members

-- Users can view team members in their tenant
CREATE POLICY "Users can view team members in their tenant" ON public.team_members
    FOR SELECT USING (
        team_id IN (
            SELECT t.id FROM public.teams t
            JOIN public.championships c ON t.championship_id = c.id
            WHERE c.tenant_id IN (
                SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Team captains and managers can manage team members
CREATE POLICY "Team captains and managers can manage team members" ON public.team_members
    FOR ALL USING (
        -- User is a manager/co-manager in the tenant
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.teams t ON team_members.team_id = t.id
            JOIN public.championships c ON t.championship_id = c.id
            WHERE u.auth_user_id = auth.uid()
            AND u.tenant_id = c.tenant_id
            AND u.role IN ('manager', 'co-manager')
        )
        OR
        -- User is a team captain of this team
        EXISTS (
            SELECT 1 FROM public.team_members tm
            JOIN public.users u ON tm.user_id = u.id
            WHERE tm.team_id = team_members.team_id
            AND u.auth_user_id = auth.uid()
            AND tm.role = 'captain'
        )
    );

-- Players can view their own team membership
CREATE POLICY "Players can view their own team membership" ON public.team_members
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_role ON public.team_members(role);

-- Add comment to table
COMMENT ON TABLE public.team_members IS 'Relaciona usuários (jogadores) aos times com suas respectivas funções';
COMMENT ON COLUMN public.team_members.role IS 'Função do membro no time: captain (capitão) ou player (jogador)';
COMMENT ON COLUMN public.team_members.joined_at IS 'Data em que o usuário entrou no time';