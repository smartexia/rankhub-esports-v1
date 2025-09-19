-- Criar a tabela de rankings
CREATE TABLE public.rankings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  championship_id uuid NOT NULL,
  team_id uuid NOT NULL,
  "position" integer,
  points integer DEFAULT 0,
  kills integer DEFAULT 0,
  matches_played integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rankings_pkey PRIMARY KEY (id),
  CONSTRAINT rankings_championship_id_fkey FOREIGN KEY (championship_id) REFERENCES public.championships(id),
  CONSTRAINT rankings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);

-- Adicionar um comentário à tabela
COMMENT ON TABLE public.rankings IS 'Armazena o ranking dos times em cada campeonato.';