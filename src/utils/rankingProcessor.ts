/**
 * Ranking Processor Utility
 * Processes multiple ranking images and extracts team results
 * Integrates with existing team data for accurate mapping
 */

interface Team {
  id: string;
  name: string;
}

interface ProcessedResult {
  teamId: string;
  teamName: string;
  placement: number;
  kills: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  confidence: number;
}

interface RankingData {
  teamIdentifier: string;
  placement: number;
  kills: number;
  points?: number;
  teamId?: string;
  teamName?: string;
}

/**
 * Standard PUBG scoring system
 */
const PLACEMENT_POINTS = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

const KILL_POINTS_PER_KILL = 1;

/**
 * Calculate points based on placement and kills
 */
function calculatePoints(placement: number, kills: number): {
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
} {
  const placementPoints = PLACEMENT_POINTS[placement as keyof typeof PLACEMENT_POINTS] || 0;
  const killPoints = kills * KILL_POINTS_PER_KILL;
  const totalPoints = placementPoints + killPoints;
  
  return {
    placementPoints,
    killPoints,
    totalPoints
  };
}

/**
 * Extract ranking data from image using OCR/AI processing
 * This is a simplified version - in production, this would use actual OCR/AI
 * Now generates results for all 25 teams automatically
 */
async function extractRankingFromImage(file: File, teams: Team[]): Promise<RankingData[]> {
  // Simulate OCR/AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Generate results for all 25 teams automatically
  const results: RankingData[] = [];
  
  // Shuffle teams to randomize placements
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(25, shuffledTeams.length); i++) {
    const team = shuffledTeams[i];
    const placement = i + 1;
    
    // Generate realistic kills based on placement (better placement = more kills tendency)
    let kills = 0;
    if (placement <= 5) {
      kills = Math.floor(Math.random() * 8) + 3; // 3-10 kills for top 5
    } else if (placement <= 10) {
      kills = Math.floor(Math.random() * 6) + 1; // 1-6 kills for 6-10th
    } else if (placement <= 15) {
      kills = Math.floor(Math.random() * 4); // 0-3 kills for 11-15th
    } else {
      kills = Math.floor(Math.random() * 2); // 0-1 kills for 16th+
    }
    
    results.push({
      teamIdentifier: `EQUIPE${i + 1}`,
      placement,
      kills,
      teamId: team.id,
      teamName: team.name
    });
  }
  
  return results;
}

/**
 * Map team identifiers to actual team data
 */
function mapTeamIdentifiers(rankingData: RankingData[], teams: Team[]): ProcessedResult[] {
  const results: ProcessedResult[] = [];
  
  for (const data of rankingData) {
    // Try to find matching team by name similarity
    let matchedTeam = teams.find(team => 
      team.name.toLowerCase().includes(data.teamIdentifier.toLowerCase()) ||
      data.teamIdentifier.toLowerCase().includes(team.name.toLowerCase())
    );
    
    // If no direct match, try to match by team identifier patterns
    if (!matchedTeam) {
      const teamIndex = data.teamIdentifier.match(/\d+/)?.[0];
      if (teamIndex) {
        const index = parseInt(teamIndex) - 1;
        matchedTeam = teams[index];
      }
    }
    
    // If still no match, skip this result
    if (!matchedTeam) {
      console.warn(`Could not match team identifier: ${data.teamIdentifier}`);
      continue;
    }
    
    const points = calculatePoints(data.placement, data.kills);
    
    results.push({
      teamId: matchedTeam.id,
      teamName: matchedTeam.name,
      placement: data.placement,
      kills: data.kills,
      placementPoints: points.placementPoints,
      killPoints: points.killPoints,
      totalPoints: points.totalPoints,
      confidence: 0.85 + Math.random() * 0.1 // Mock confidence score
    });
  }
  
  return results.sort((a, b) => a.placement - b.placement);
}

/**
 * Consolidate results from multiple images
 */
function consolidateResults(allResults: ProcessedResult[]): ProcessedResult[] {
  const teamResults = new Map<string, ProcessedResult[]>();
  
  // Group results by team
  for (const result of allResults) {
    if (!teamResults.has(result.teamId)) {
      teamResults.set(result.teamId, []);
    }
    teamResults.get(result.teamId)!.push(result);
  }
  
  // For each team, take the result with highest confidence
  const consolidatedResults: ProcessedResult[] = [];
  
  for (const [teamId, results] of teamResults) {
    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    consolidatedResults.push(bestResult);
  }
  
  return consolidatedResults.sort((a, b) => a.placement - b.placement);
}

/**
 * Main function to process multiple ranking images
 */
export async function processRankingImages(
  files: File[],
  teams: Team[]
): Promise<ProcessedResult[]> {
  if (files.length === 0) {
    throw new Error('Nenhuma imagem fornecida para processamento');
  }
  
  if (teams.length === 0) {
    throw new Error('Nenhum time fornecido para mapeamento');
  }
  
  try {
    // Process the first image (for Battle Royale, one image contains all teams)
    const rankingData = await extractRankingFromImage(files[0], teams);
    
    if (rankingData.length === 0) {
      throw new Error('Nenhum dado de ranking foi extraído da imagem');
    }
    
    // Convert to ProcessedResult format
    const results: ProcessedResult[] = rankingData.map((data) => {
      const { placementPoints, killPoints, totalPoints } = calculatePoints(data.placement, data.kills);
      
      return {
        teamId: data.teamId || `team_${data.placement}`,
        teamName: data.teamName || data.teamIdentifier,
        placement: data.placement,
        kills: data.kills,
        placementPoints,
        killPoints,
        totalPoints,
        confidence: 0.85 + Math.random() * 0.1 // Mock confidence score
      };
    });
    
    return results.sort((a, b) => a.placement - b.placement);
    
  } catch (error) {
    console.error('Error processing ranking images:', error);
    throw error;
  }
}

/**
 * Validate ranking results for consistency
 */
export function validateRankingResults(results: ProcessedResult[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for duplicate placements
  const placements = results.map(r => r.placement);
  const uniquePlacements = new Set(placements);
  if (placements.length !== uniquePlacements.size) {
    errors.push('Colocações duplicadas encontradas');
  }
  
  // Check for sequential placements starting from 1
  const sortedPlacements = [...placements].sort((a, b) => a - b);
  for (let i = 0; i < sortedPlacements.length; i++) {
    if (sortedPlacements[i] !== i + 1) {
      errors.push('Colocações não são sequenciais a partir de 1');
      break;
    }
  }
  
  // Check for duplicate teams
  const teamIds = results.map(r => r.teamId);
  const uniqueTeamIds = new Set(teamIds);
  if (teamIds.length !== uniqueTeamIds.size) {
    errors.push('Times duplicados encontrados');
  }
  
  // Check for negative values
  for (const result of results) {
    if (result.kills < 0 || result.placement < 1 || result.totalPoints < 0) {
      errors.push(`Valores inválidos para o time ${result.teamName}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate ranking report
 */
export function generateRankingReport(results: ProcessedResult[]): string {
  const sortedResults = [...results].sort((a, b) => a.placement - b.placement);
  
  let report = '=== RELATÓRIO DE RANKING ===\n\n';
  
  sortedResults.forEach((result, index) => {
    report += `${index + 1}º Lugar: ${result.teamName}\n`;
    report += `   Kills: ${result.kills}\n`;
    report += `   Pontos de Colocação: ${result.placementPoints}\n`;
    report += `   Pontos de Kill: ${result.killPoints}\n`;
    report += `   Total: ${result.totalPoints} pontos\n`;
    report += `   Confiança: ${(result.confidence * 100).toFixed(1)}%\n\n`;
  });
  
  const totalKills = sortedResults.reduce((sum, r) => sum + r.kills, 0);
  const totalPoints = sortedResults.reduce((sum, r) => sum + r.totalPoints, 0);
  const avgConfidence = sortedResults.reduce((sum, r) => sum + r.confidence, 0) / sortedResults.length;
  
  report += '=== ESTATÍSTICAS GERAIS ===\n';
  report += `Total de Kills: ${totalKills}\n`;
  report += `Total de Pontos: ${totalPoints}\n`;
  report += `Confiança Média: ${(avgConfidence * 100).toFixed(1)}%\n`;
  report += `Times Processados: ${sortedResults.length}\n`;
  
  return report;
}