CREATE OR REPLACE FUNCTION public.calculate_ranking(p_championship_id uuid)
RETURNS void AS $$
DECLARE
    team_result RECORD;
    match_result RECORD;
    ranking_row RECORD;
    score_rules jsonb;
    position_points jsonb;
    kill_points integer;
    total_points integer;
BEGIN
    -- Buscar as regras de pontuação do campeonato
    SELECT regras_pontuacao INTO score_rules FROM public.championships WHERE id = p_championship_id;
    position_points := score_rules->'posicao';
    kill_points := (score_rules->>'kill')::integer;

    -- Limpar o ranking existente para este campeonato
    DELETE FROM public.rankings WHERE championship_id = p_championship_id;

    -- Inserir todos os times do campeonato no ranking com valores zerados
    INSERT INTO public.rankings (championship_id, team_id, "position", points, kills, matches_played)
    SELECT p_championship_id, id, 0, 0, 0, 0
    FROM public.teams
    WHERE championship_id = p_championship_id;

    -- Iterar sobre cada partida do campeonato
    FOR match_result IN
        SELECT id FROM public.matches WHERE championship_id = p_championship_id AND status = 'concluido'
    LOOP
        -- Iterar sobre cada resultado de time na partida
        FOR team_result IN
            SELECT team_id, posicao_final, kills FROM public.results WHERE match_id = match_result.id
        LOOP
            -- Calcular os pontos da partida
            total_points := COALESCE((position_points->>(team_result.posicao_final::text))::integer, 0) + (team_result.kills * kill_points);

            -- Atualizar o ranking do time
            UPDATE public.rankings
            SET
                points = points + total_points,
                kills = kills + team_result.kills,
                matches_played = matches_played + 1
            WHERE championship_id = p_championship_id AND team_id = team_result.team_id;
        END LOOP;
    END LOOP;

    -- Atualizar a posição final no ranking
    WITH ranked_teams AS (
        SELECT
            team_id,
            ROW_NUMBER() OVER (ORDER BY points DESC, kills DESC) as team_position
        FROM public.rankings
        WHERE championship_id = p_championship_id
    )
    UPDATE public.rankings r
    SET "position" = rt.team_position
    FROM ranked_teams rt
    WHERE r.championship_id = p_championship_id AND r.team_id = rt.team_id;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_ranking(uuid) IS 'Calcula e atualiza o ranking de um campeonato com base nos resultados das partidas.';