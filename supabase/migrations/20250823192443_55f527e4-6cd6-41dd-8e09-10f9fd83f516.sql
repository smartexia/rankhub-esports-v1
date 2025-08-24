-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE public.app_role AS ENUM ('manager', 'co-manager', 'team-captain', 'player', 'viewer');
CREATE TYPE public.championship_status AS ENUM ('rascunho', 'ativo', 'finalizado');
CREATE TYPE public.match_status AS ENUM ('pendente', 'processando', 'concluido', 'erro_ia', 'validacao_manual');
CREATE TYPE public.print_status AS ENUM ('pendente', 'processado', 'erro', 'baixa_qualidade');

-- Create Tenants table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    manager_id UUID,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'ativo'
);

-- Create Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nome_usuario TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'viewer',
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Update tenants to reference users
ALTER TABLE public.tenants ADD CONSTRAINT fk_tenants_manager 
    FOREIGN KEY (manager_id) REFERENCES public.users(id);

-- Create Championships table
CREATE TABLE public.championships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    regras_pontuacao JSONB DEFAULT '{"posicao": {"1": 20, "2": 15, "3": 12, "4": 10, "5": 8, "6": 6, "7": 5, "8": 4, "9": 3, "10": 2}, "kill": 1}',
    status championship_status DEFAULT 'rascunho',
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Groups table
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
    nome_grupo TEXT NOT NULL,
    capacidade_times INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    nome_time TEXT NOT NULL,
    nome_line TEXT NOT NULL,
    tag TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Matches (Quedas) table
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
    ordem_queda INTEGER NOT NULL,
    data_hora_queda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status match_status DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Results table
CREATE TABLE public.results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    posicao_final INTEGER,
    kills INTEGER DEFAULT 0,
    pontos_obtidos INTEGER DEFAULT 0,
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, team_id)
);

-- Create Print Evidence table
CREATE TABLE public.print_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    url_imagem TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id),
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_processamento print_status DEFAULT 'pendente',
    confidence_score DECIMAL(3,2),
    ai_extracted_data JSONB
);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_evidence ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for multi-tenant isolation

-- Tenants policies
CREATE POLICY "Users can view their own tenant" ON public.tenants
    FOR SELECT USING (manager_id = auth.uid() OR id IN (
        SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Managers can update their tenant" ON public.tenants
    FOR UPDATE USING (manager_id = auth.uid());

-- Users policies
CREATE POLICY "Users can view users in their tenant" ON public.users
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
        ) OR auth_user_id = auth.uid()
    );

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Managers can manage users in their tenant" ON public.users
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE manager_id = auth.uid()
        )
    );

-- Championships policies
CREATE POLICY "Users can view championships in their tenant" ON public.championships
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Managers and Co-managers can manage championships" ON public.championships
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('manager', 'co-manager')
        )
    );

-- Groups policies
CREATE POLICY "Users can view groups in their tenant championships" ON public.groups
    FOR SELECT USING (
        championship_id IN (
            SELECT id FROM public.championships
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Managers and Co-managers can manage groups" ON public.groups
    FOR ALL USING (
        championship_id IN (
            SELECT id FROM public.championships
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('manager', 'co-manager')
            )
        )
    );

-- Teams policies
CREATE POLICY "Users can view teams in their tenant championships" ON public.teams
    FOR SELECT USING (
        championship_id IN (
            SELECT id FROM public.championships
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Managers and Co-managers can manage teams" ON public.teams
    FOR ALL USING (
        championship_id IN (
            SELECT id FROM public.championships
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('manager', 'co-manager')
            )
        )
    );

-- Matches policies
CREATE POLICY "Users can view matches in their tenant championships" ON public.matches
    FOR SELECT USING (
        championship_id IN (
            SELECT id FROM public.championships
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Managers and Co-managers can manage matches" ON public.matches
    FOR ALL USING (
        championship_id IN (
            SELECT id FROM public.championships
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('manager', 'co-manager')
            )
        )
    );

-- Results policies
CREATE POLICY "Users can view results in their tenant" ON public.results
    FOR SELECT USING (
        match_id IN (
            SELECT id FROM public.matches
            WHERE championship_id IN (
                SELECT id FROM public.championships
                WHERE tenant_id IN (
                    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Managers and Co-managers can manage results" ON public.results
    FOR ALL USING (
        match_id IN (
            SELECT id FROM public.matches
            WHERE championship_id IN (
                SELECT id FROM public.championships
                WHERE tenant_id IN (
                    SELECT tenant_id FROM public.users 
                    WHERE auth_user_id = auth.uid() 
                    AND role IN ('manager', 'co-manager')
                )
            )
        )
    );

-- Print Evidence policies
CREATE POLICY "Users can view print evidence in their tenant" ON public.print_evidence
    FOR SELECT USING (
        match_id IN (
            SELECT id FROM public.matches
            WHERE championship_id IN (
                SELECT id FROM public.championships
                WHERE tenant_id IN (
                    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Managers and Co-managers can manage print evidence" ON public.print_evidence
    FOR ALL USING (
        match_id IN (
            SELECT id FROM public.matches
            WHERE championship_id IN (
                SELECT id FROM public.championships
                WHERE tenant_id IN (
                    SELECT tenant_id FROM public.users 
                    WHERE auth_user_id = auth.uid() 
                    AND role IN ('manager', 'co-manager')
                )
            )
        )
    );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_championships_updated_at
    BEFORE UPDATE ON public.championships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, nome_usuario, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'viewer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_championships_tenant_id ON public.championships(tenant_id);
CREATE INDEX idx_teams_championship_id ON public.teams(championship_id);
CREATE INDEX idx_matches_championship_id ON public.matches(championship_id);
CREATE INDEX idx_results_match_id ON public.results(match_id);
CREATE INDEX idx_results_team_id ON public.results(team_id);
CREATE INDEX idx_print_evidence_match_id ON public.print_evidence(match_id);