import { supabase } from '../integrations/supabase/client';
import { processMatchImage, MatchResultData } from './geminiApi';

// Old match prints functions removed - replaced by direct match results processing

export const getMatchesByChampionship = async (championshipId: string) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('championship_id', championshipId)
    .order('match_number', { ascending: true });

  return { data, error };
};

export const createMatch = async (matchData: { championship_id: string; match_number: number; scheduled_time?: string; status?: string; }) => {
  const { data, error } = await supabase
    .from('matches')
    .insert([{
      championship_id: matchData.championship_id,
      match_number: matchData.match_number,
      scheduled_time: matchData.scheduled_time ? new Date(matchData.scheduled_time).toISOString() : null,
      status: matchData.status === 'agendada' ? 'pendente' : (matchData.status || 'pendente'),
      ordem_queda: matchData.match_number, // Manter compatibilidade com sistema antigo
      data_hora_queda: matchData.scheduled_time ? new Date(matchData.scheduled_time).toISOString() : new Date().toISOString()
    }])
    .select();

  return { data, error };
};

export const updateMatch = async (matchId: string, updates: { scheduled_time?: string; status?: string; }) => {
  const updateData: any = {};
  
  if (updates.scheduled_time) {
    updateData.scheduled_time = new Date(updates.scheduled_time).toISOString();
    updateData.data_hora_queda = updateData.scheduled_time; // Manter compatibilidade
  }
  
  if (updates.status) {
    updateData.status = updates.status === 'agendada' ? 'pendente' : updates.status;
  }

  const { data, error } = await supabase
    .from('matches')
    .update(updateData)
    .eq('id', matchId)
    .select();

  return { data, error };
};

export const deleteMatch = async (matchId: string) => {
  const { data, error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId);

  return { data, error };
};

export const getRanking = async (championshipId: string) => {
  const { data, error } = await supabase
    .from('rankings')
    .select('*, teams(*)')
    .eq('championship_id', championshipId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data;
};

export const calculateRanking = async (championshipId: string) => {
  const { error } = await supabase.rpc('calculate_ranking', { p_championship_id: championshipId });
  if (error) throw error;
};

// ===== NEW MATCH RESULTS API =====
// Functions for the optimized match results processing

/**
 * Process match image and save result directly
 * @param imageFile - Image file to process
 * @param matchId - Match ID
 * @param teamId - Team ID
 * @returns Promise with saved result data
 */
export const processAndSaveMatchResult = async (
  imageFile: File, 
  matchId: string, 
  teamId: string
) => {
  try {
    // Process image with Gemini AI
    const extractedData = await processMatchImage(imageFile);
    
    // Save result to database
    const { data, error } = await supabase
      .from('match_results')
      .insert([{
        match_id: matchId,
        team_id: teamId,
        ...extractedData
      }])
      .select('*, teams(nome_time)');
      
    return { data, error };
  } catch (error) {
    console.error('Error in processAndSaveMatchResult:', error);
    return { 
      data: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Erro desconhecido no processamento'
      } 
    };
  }
};

/**
 * Save match result directly with processed data (no image processing)
 * @param matchId - Match ID
 * @param teamId - Team ID
 * @param resultData - Already processed result data
 * @returns Promise with saved result data
 */
export const saveMatchResultDirect = async (
  matchId: string,
  teamId: string,
  resultData: {
    placement: number;
    kills: number;
    placement_points: number;
    kill_points: number;
    total_points: number;
    confidence_score?: number;
  }
) => {
  try {
    // Save result directly to database
    const { data, error } = await supabase
      .from('match_results')
      .insert([{
        match_id: matchId,
        team_id: teamId,
        placement: resultData.placement,
        kills: resultData.kills,
        placement_points: resultData.placement_points,
        kill_points: resultData.kill_points,
        total_points: resultData.total_points,
        confidence_score: resultData.confidence_score || 0.9,
        processed_at: new Date().toISOString()
      }])
      .select('*, teams(nome_time)');
      
    return { data, error };
  } catch (error) {
    console.error('Error in saveMatchResultDirect:', error);
    return { 
      data: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Erro ao salvar resultado'
      } 
    };
  }
};

/**
 * Get all results for a specific match
 * @param matchId - Match ID
 * @returns Promise with match results
 */
export const getMatchResults = async (matchId: string) => {
  const { data, error } = await supabase
    .from('match_results')
    .select('*, teams(nome_time)')
    .eq('match_id', matchId)
    .order('placement', { ascending: true });
    
  return { data, error };
};

/**
 * Update a match result
 * @param resultId - Result ID to update
 * @param updates - Fields to update
 * @returns Promise with updated result
 */
export const updateMatchResult = async (resultId: string, updates: Partial<MatchResultData>) => {
  const { data, error } = await supabase
    .from('match_results')
    .update(updates)
    .eq('id', resultId)
    .select('*, teams(nome_time)');
    
  return { data, error };
};

/**
 * Delete a match result
 * @param resultId - Result ID to delete
 * @returns Promise with deletion result
 */
export const deleteMatchResult = async (resultId: string) => {
  const { data, error } = await supabase
    .from('match_results')
    .delete()
    .eq('id', resultId);
    
  return { data, error };
};

/**
 * Get results for a specific team across all matches in a championship
 * @param teamId - Team ID
 * @param championshipId - Championship ID
 * @returns Promise with team results
 */
export const getTeamResults = async (teamId: string, championshipId: string) => {
  const { data, error } = await supabase
    .from('match_results')
    .select('*, matches!inner(championship_id, match_number)')
    .eq('team_id', teamId)
    .eq('matches.championship_id', championshipId)
    .order('matches.match_number', { ascending: true });
    
  return { data, error };
};

/**
 * Get championship ranking based on match results
 * @param championshipId - Championship ID
 * @returns Promise with ranking data
 */
export const getChampionshipRanking = async (championshipId: string) => {
  const { data, error } = await supabase
    .rpc('calculate_championship_ranking', {
      championship_id: championshipId
    });
    
  return { data, error };
};