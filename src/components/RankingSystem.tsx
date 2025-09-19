import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Users, Target, Filter, Layers, Calendar } from 'lucide-react';

interface Team {
  id: string;
  nome_time: string;
  nome_line: string;
  tag?: string;
  group_id?: string;
}

interface Phase {
  id: string;
  nome_fase: string;
  tipo_fase: string;
  status: string;
  ordem_fase: number;
}

interface Group {
  id: string;
  nome_grupo: string;
  phase_id?: string;
  championship_id: string;
  capacidade_times: number;
  created_at: string;
}

interface Match {
  id: string;
  championship_id: string;
  match_number?: number;
  data_hora_queda?: string;
  status: string;
}

interface TeamStats {
  team: Team;
  totalPoints: number;
  totalKills: number;
  matchesPlayed: number;
  averagePosition: number;
  bestPosition: number;
  worstPosition: number;
  wins: number; // posições 1-3
  topFive: number; // posições 1-5
}

interface RankingSystemProps {
  championshipId: string;
}

export default function RankingSystem({ championshipId }: RankingSystemProps) {
  const [rankings, setRankings] = useState<TeamStats[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Carregar fases
  const loadPhases = async () => {
    try {
      const { data: phasesData, error: phasesError } = await supabase
        .from('tournament_phases')
        .select('*')
        .eq('championship_id', championshipId)
        .order('ordem_fase');

      if (phasesError) {
        console.error('Erro ao carregar fases:', phasesError);
        return;
      }

      setPhases(phasesData || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar fases:', error);
    }
  };

  // Carregar grupos
  const loadGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('championship_id', championshipId)
        .order('nome_grupo');

      if (groupsError) {
        console.error('Erro ao carregar grupos:', groupsError);
        return;
      }

      setGroups(groupsData || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar grupos:', error);
    }
  };

  // Carregar partidas
  const loadMatches = async () => {
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, championship_id, match_number, data_hora_queda, status')
        .eq('championship_id', championshipId)
        .order('match_number', { ascending: true });

      if (matchesError) {
        console.error('Erro ao carregar partidas:', matchesError);
        return;
      }

      console.log('🎯 MATCHES: Partidas encontradas:', matchesData?.length || 0);
      setMatches(matchesData || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar partidas:', error);
    }
  };

  // Carregar dados de ranking
  const loadRankings = async () => {
    setLoading(true);
    try {
      console.log('🔍 RANKING: Buscando dados para championship:', championshipId);
      
      let query = supabase
        .from('match_results')
        .select(`
          *,
          teams!inner(
            id,
            nome_time,
            nome_line,
            tag,
            group_id
          ),
          matches!inner(
            id,
            status,
            championship_id,
            phase_id,
            group_id
          )
        `)
        .eq('matches.championship_id', championshipId);

      // Filtrar por fase se selecionada
      if (selectedPhase !== 'all') {
        query = query.eq('matches.phase_id', selectedPhase);
      }

      // Filtrar por grupo se selecionado
      if (selectedGroup !== 'all') {
        query = query.eq('matches.group_id', selectedGroup);
      }

      // Filtrar por partida específica se selecionada
      if (selectedMatch !== 'all') {
        query = query.eq('matches.id', selectedMatch);
      }

      const { data: results, error: resultsError } = await query;

      console.log('📊 RANKING: Resultados encontrados:', results?.length || 0);
      console.log('📊 RANKING: Dados:', results);
      
      if (resultsError) {
        console.error('❌ RANKING: Erro ao carregar resultados:', resultsError);
        return;
      }

      // Processar dados para calcular estatísticas
      const teamStatsMap = new Map<string, TeamStats>();

      results?.forEach((result: any) => {
        const teamId = result.teams.id;
        const team = result.teams;
        const position = result.placement || 999;
        const points = result.total_points || 0;
        const kills = result.kills || 0;

        if (!teamStatsMap.has(teamId)) {
          teamStatsMap.set(teamId, {
            team,
            totalPoints: 0,
            totalKills: 0,
            matchesPlayed: 0,
            averagePosition: 0,
            bestPosition: 999,
            worstPosition: 0,
            wins: 0,
            topFive: 0
          });
        }

        const stats = teamStatsMap.get(teamId)!;
        stats.totalPoints += points;
        stats.totalKills += kills;
        stats.matchesPlayed += 1;
        stats.bestPosition = Math.min(stats.bestPosition, position);
        stats.worstPosition = Math.max(stats.worstPosition, position);
        
        if (position <= 3) stats.wins += 1;
        if (position <= 5) stats.topFive += 1;
      });

      // Calcular média de posições e ordenar por pontos
      const rankingsArray = Array.from(teamStatsMap.values()).map(stats => {
        const positions = results
          ?.filter((r: any) => r.teams.id === stats.team.id)
          .map((r: any) => r.placement || 999) || [];
        
        stats.averagePosition = positions.length > 0 
          ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length 
          : 0;
        
        return stats;
      }).sort((a, b) => {
        // Ordenar por pontos totais (decrescente), depois por média de posição (crescente)
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return a.averagePosition - b.averagePosition;
      });
      
      console.log('🏆 RANKING: Rankings calculados:', rankingsArray.length);
      console.log('🏆 RANKING: Top 3:', rankingsArray.slice(0, 3).map(r => ({ team: r.team.nome_time, points: r.totalPoints })));

      setRankings(rankingsArray);
      
      // 🎯 DEMO: Se não há dados reais, criar dados de exemplo para demonstração
      if (rankingsArray.length === 0) {
        console.log('📊 DEMO: Criando dados de exemplo para demonstração do ranking');
        const demoTeams = [
          { id: '1', nome_time: 'Team Alpha', nome_line: 'Alpha Gaming', tag: 'ALPHA', group_id: null },
          { id: '2', nome_time: 'Beta Squad', nome_line: 'Beta Esports', tag: 'BETA', group_id: null },
          { id: '3', nome_time: 'Gamma Force', nome_line: 'Gamma Pro', tag: 'GAMMA', group_id: null },
          { id: '4', nome_time: 'Delta Warriors', nome_line: 'Delta Team', tag: 'DELTA', group_id: null },
          { id: '5', nome_time: 'Epsilon Elite', nome_line: 'Epsilon Gaming', tag: 'EPS', group_id: null },
          { id: '6', nome_time: 'Zeta Legends', nome_line: 'Zeta Esports', tag: 'ZETA', group_id: null },
          { id: '7', nome_time: 'Theta Storm', nome_line: 'Theta Pro', tag: 'THETA', group_id: null },
          { id: '8', nome_time: 'Omega Champions', nome_line: 'Omega Gaming', tag: 'OMEGA', group_id: null }
        ];
        
        const demoRankings: TeamStats[] = demoTeams.map((team, index) => {
          const basePoints = 150 - (index * 15); // Pontos decrescentes
          const variation = Math.floor(Math.random() * 20) - 10; // Variação aleatória
          const totalPoints = Math.max(basePoints + variation, 10);
          const matchesPlayed = 3 + Math.floor(Math.random() * 2); // 3-4 partidas
          const totalKills = Math.floor(totalPoints * 0.3) + Math.floor(Math.random() * 10);
          const wins = Math.floor(matchesPlayed * (totalPoints / 200)); // Proporção de vitórias
          
          return {
            team,
            totalPoints,
            totalKills,
            matchesPlayed,
            averagePosition: Math.max(1, Math.floor(20 - (totalPoints / 10))),
            bestPosition: Math.max(1, Math.floor(Math.random() * 5) + 1),
            worstPosition: Math.min(20, Math.floor(Math.random() * 10) + 10),
            wins,
            topFive: Math.min(matchesPlayed, wins + 1)
          };
        }).sort((a, b) => b.totalPoints - a.totalPoints);
        
        setRankings(demoRankings);
        console.log('🏆 DEMO: Rankings de exemplo criados:', demoRankings.length);
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obter rankings agrupados por grupo
  const getRankingsByGroup = () => {
    const groupedRankings = new Map<string, TeamStats[]>();
    
    rankings.forEach(ranking => {
      const groupId = ranking.team.group_id || 'sem-grupo';
      if (!groupedRankings.has(groupId)) {
        groupedRankings.set(groupId, []);
      }
      groupedRankings.get(groupId)!.push(ranking);
    });

    return groupedRankings;
  };

  // Obter ícone e cor baseado na posição
  const getPositionIcon = (position: number) => {
    if (position === 1) return { icon: Trophy, color: 'text-yellow-500' };
    if (position === 2) return { icon: Medal, color: 'text-gray-400' };
    if (position === 3) return { icon: Award, color: 'text-amber-600' };
    return { icon: Users, color: 'text-muted-foreground' };
  };



  useEffect(() => {
    if (championshipId) {
      loadPhases();
      loadGroups();
      loadMatches();
      loadRankings();
    }
  }, [championshipId]);

  useEffect(() => {
    if (championshipId) {
      loadRankings();
    }
  }, [selectedPhase, selectedGroup, selectedMatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-orbitron font-bold">Sistema de Ranking</h2>
            <p className="text-muted-foreground">Classificação baseada em pontos e performance</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{rankings.length} times classificados</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Selecionar fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fases</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.nome_fase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Selecionar grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {groups
                  .filter(group => selectedPhase === 'all' || group.phase_id === selectedPhase)
                  .map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.nome_grupo}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMatch} onValueChange={setSelectedMatch}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Selecionar partida" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as partidas</SelectItem>
                {matches
                  .filter(match => {
                    // Filtrar partidas baseado na fase e grupo selecionados
                    if (selectedPhase !== 'all' || selectedGroup !== 'all') {
                      // Para simplificar, vamos mostrar todas as partidas por enquanto
                      // Em uma implementação mais complexa, você filtraria por fase/grupo
                      return true;
                    }
                    return true;
                  })
                  .map((match) => (
                    <SelectItem key={match.id} value={match.id}>
                      {match.match_number ? `Partida ${match.match_number}` : `Partida ${match.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Ranking Content */}
      {rankings.length > 0 ? (
        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="geral">Ranking Geral</TabsTrigger>
            <TabsTrigger value="grupos">Por Grupos</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
          {/* Top 3 Podium - Layout Olímpico */}
          {rankings.slice(0, 3).length > 0 && (
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {selectedMatch !== 'all' 
                    ? `Top 3 - ${matches.find(m => m.id === selectedMatch)?.match_number ? `Partida ${matches.find(m => m.id === selectedMatch)?.match_number}` : 'Partida Específica'}`
                    : 'Top 3 - Ranking Geral'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-8 px-8">
                  {/* 2º Lugar - Esquerda */}
                  {rankings[1] && (
                    <div className="flex flex-col items-center">
                      <div className="text-center p-6 bg-gradient-to-b from-slate-300 to-slate-500 rounded-lg border-2 border-slate-400 shadow-lg transform transition-all hover:scale-105" style={{height: '180px', width: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                        <div className="flex items-center justify-center mb-2">
                          <Medal className="h-10 w-10 text-slate-300" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-white">{rankings[1].team.nome_time}</h3>
                          <p className="text-sm text-slate-200 mb-1">{rankings[1].team.nome_line}</p>
                          <p className="text-3xl font-bold text-white">{rankings[1].totalPoints} pts</p>
                        </div>
                      </div>
                      <div className="bg-slate-400 text-white font-bold text-lg px-6 py-2 rounded-b-lg">
                        2º
                      </div>
                    </div>
                  )}

                  {/* 1º Lugar - Centro (Mais Alto) */}
                  {rankings[0] && (
                    <div className="flex flex-col items-center">
                      <div className="text-center p-8 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-lg border-2 border-yellow-500 shadow-xl transform transition-all hover:scale-105" style={{height: '220px', width: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                        <div className="flex items-center justify-center mb-3">
                          <Trophy className="h-12 w-12 text-yellow-100 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl text-white">{rankings[0].team.nome_time}</h3>
                          <p className="text-sm text-yellow-100 mb-1">{rankings[0].team.nome_line}</p>
                          <p className="text-4xl font-bold text-white">{rankings[0].totalPoints} pts</p>
                        </div>
                      </div>
                      <div className="bg-yellow-500 text-white font-bold text-xl px-8 py-3 rounded-b-lg">
                        🏆 1º
                      </div>
                    </div>
                  )}

                  {/* 3º Lugar - Direita */}
                  {rankings[2] && (
                    <div className="flex flex-col items-center">
                      <div className="text-center p-6 bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg border-2 border-amber-700 shadow-lg transform transition-all hover:scale-105" style={{height: '160px', width: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                        <div className="flex items-center justify-center mb-2">
                          <Award className="h-8 w-8 text-amber-300" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-white">{rankings[2].team.nome_time}</h3>
                          <p className="text-sm text-amber-200 mb-1">{rankings[2].team.nome_line}</p>
                          <p className="text-3xl font-bold text-white">{rankings[2].totalPoints} pts</p>
                        </div>
                      </div>
                      <div className="bg-amber-700 text-white font-bold text-lg px-6 py-2 rounded-b-lg">
                        3º
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Ranking List */}
          <Card className="bg-gradient-dark border-primary/20">
            <CardHeader>
              <CardTitle>
                {selectedMatch !== 'all' 
                  ? `Classificação - ${matches.find(m => m.id === selectedMatch)?.match_number ? `Partida ${matches.find(m => m.id === selectedMatch)?.match_number}` : 'Partida Específica'}`
                  : 'Classificação Geral (Todas as Partidas)'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rankings.map((stats, index) => {
                  const { icon: Icon, color } = getPositionIcon(index + 1);
                  
                  return (
                    <div key={stats.team.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-card to-card/80 rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20">
                          <div className="flex items-center gap-1">
                            <Icon className={`h-4 w-4 ${color}`} />
                            <span className="text-sm font-bold">{index + 1}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl">{stats.team.nome_time}</h3>
                          <p className="text-sm text-muted-foreground/80">{stats.team.nome_line}</p>
                          {stats.team.tag && (
                            <Badge variant="outline" className="text-xs mt-1 bg-primary/10 border-primary/20">
                              {stats.team.tag}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">{stats.totalPoints}</p>
                          <p className="text-xs text-muted-foreground">Pontos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold">{stats.totalKills}</p>
                          <p className="text-xs text-muted-foreground">Kills</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold">{stats.matchesPlayed}</p>
                          <p className="text-xs text-muted-foreground">Partidas</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="grupos" className="space-y-4">
            {Array.from(getRankingsByGroup().entries()).map(([groupId, groupRankings]) => {
              const group = groups.find(g => g.id === groupId);
              const groupName = group ? group.nome : 'Sem Grupo';
              
              return (
                <Card key={groupId} className="bg-gradient-dark border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {groupName}
                      <Badge variant="outline" className="ml-2">
                        {groupRankings.length} times
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {groupRankings.map((stats, index) => {
                        const { icon: Icon, color } = getPositionIcon(index + 1);
                        
                        return (
                          <div key={stats.team.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-card/60 to-card/40 rounded-xl border border-primary/10 hover:border-primary/25 transition-all duration-300 hover:shadow-md">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/20">
                                <div className="flex items-center gap-1">
                                  <Icon className={`h-3 w-3 ${color}`} />
                                  <span className="text-xs font-bold">{index + 1}</span>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-bold text-xl">{stats.team.nome_time}</h4>
                                <p className="text-xs text-muted-foreground">{stats.team.nome_line}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-primary">{stats.totalPoints}</p>
                                <p className="text-xs text-muted-foreground">Pts</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold">{stats.totalKills}</p>
                                <p className="text-xs text-muted-foreground">Kills</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold">{stats.matchesPlayed}</p>
                                <p className="text-xs text-muted-foreground">Jogos</p>
                              </div>
                            </div>
                            

                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="bg-gradient-dark border-primary/20">
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ranking disponível</h3>
            <p className="text-muted-foreground mb-4">
              Os rankings serão exibidos após as primeiras partidas serem concluídas
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Aguardando resultados das partidas</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}