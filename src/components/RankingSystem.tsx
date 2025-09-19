import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Users, Target, Filter, Layers } from 'lucide-react';

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
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
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

  // Carregar dados de ranking
  const loadRankings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('results')
        .select(`
          *,
          team:teams!inner(
            id,
            nome_time,
            nome_line,
            tag,
            group_id
          ),
          match:matches!inner(
            id,
            status,
            championship_id,
            phase_id,
            group_id
          )
        `)
        .eq('match.championship_id', championshipId)
        .eq('match.status', 'finalizada');

      // Filtrar por fase se selecionada
      if (selectedPhase !== 'all') {
        query = query.eq('match.phase_id', selectedPhase);
      }

      // Filtrar por grupo se selecionado
      if (selectedGroup !== 'all') {
        query = query.eq('match.group_id', selectedGroup);
      }

      const { data: results, error: resultsError } = await query;

      if (resultsError) {
        console.error('Erro ao carregar resultados:', resultsError);
        return;
      }

      // Processar dados para calcular estatísticas
      const teamStatsMap = new Map<string, TeamStats>();

      results?.forEach((result: any) => {
        const teamId = result.team.id;
        const team = result.team;
        const position = result.posicao_final || 999;
        const points = result.pontos_obtidos || 0;
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
          ?.filter((r: any) => r.team.id === stats.team.id)
          .map((r: any) => r.posicao_final || 999) || [];
        
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

      setRankings(rankingsArray);
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

  // Obter badge de performance
  const getPerformanceBadge = (stats: TeamStats) => {
    const winRate = stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0;
    
    if (winRate >= 50) return { label: 'Excelente', variant: 'default' as const };
    if (winRate >= 30) return { label: 'Bom', variant: 'secondary' as const };
    if (winRate >= 15) return { label: 'Regular', variant: 'outline' as const };
    return { label: 'Iniciante', variant: 'destructive' as const };
  };

  useEffect(() => {
    if (championshipId) {
      loadPhases();
      loadGroups();
      loadRankings();
    }
  }, [championshipId]);

  useEffect(() => {
    if (championshipId) {
      loadRankings();
    }
  }, [selectedPhase, selectedGroup]);

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
          {/* Top 3 Podium */}
          {rankings.slice(0, 3).length > 0 && (
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Top 3 - Pódio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rankings.slice(0, 3).map((stats, index) => {
                    const { icon: Icon, color } = getPositionIcon(index + 1);
                    const performance = getPerformanceBadge(stats);
                    
                    return (
                      <div key={stats.team.id} className="text-center p-4 bg-card rounded-lg border">
                        <div className="flex items-center justify-center mb-3">
                          <Icon className={`h-8 w-8 ${color}`} />
                        </div>
                        <h3 className="font-semibold text-lg">{stats.team.nome_time}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{stats.team.nome_line}</p>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-primary">{stats.totalPoints} pts</p>
                          <Badge variant={performance.variant} className="text-xs">
                            {performance.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Ranking List */}
          <Card className="bg-gradient-dark border-primary/20">
            <CardHeader>
              <CardTitle>Classificação Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankings.map((stats, index) => {
                  const { icon: Icon, color } = getPositionIcon(index + 1);
                  const performance = getPerformanceBadge(stats);
                  const winRate = stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0;
                  
                  return (
                    <div key={stats.team.id} className="flex items-center justify-between p-4 bg-card rounded-lg border hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-full">
                          <Icon className={`h-5 w-5 ${color}`} />
                          <span className="text-xs font-bold ml-1">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{stats.team.nome_time}</h3>
                          <p className="text-sm text-muted-foreground">{stats.team.nome_line}</p>
                          {stats.team.tag && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {stats.team.tag}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-primary">{stats.totalPoints}</p>
                          <p className="text-xs text-muted-foreground">Pontos</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{stats.totalKills}</p>
                          <p className="text-xs text-muted-foreground">Kills</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{stats.matchesPlayed}</p>
                          <p className="text-xs text-muted-foreground">Partidas</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{winRate.toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant={performance.variant}>
                          {performance.label}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          Melhor: #{stats.bestPosition === 999 ? '-' : stats.bestPosition}
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
                    <div className="space-y-3">
                      {groupRankings.map((stats, index) => {
                        const { icon: Icon, color } = getPositionIcon(index + 1);
                        const performance = getPerformanceBadge(stats);
                        const winRate = stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0;
                        
                        return (
                          <div key={stats.team.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border hover:border-primary/40 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full">
                                <Icon className={`h-4 w-4 ${color}`} />
                                <span className="text-xs font-bold ml-1">#{index + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-medium">{stats.team.nome_time}</h4>
                                <p className="text-xs text-muted-foreground">{stats.team.nome_line}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <p className="font-bold text-primary">{stats.totalPoints}</p>
                                <p className="text-xs text-muted-foreground">Pts</p>
                              </div>
                              <div>
                                <p className="font-bold">{stats.matchesPlayed}</p>
                                <p className="text-xs text-muted-foreground">Jogos</p>
                              </div>
                              <div>
                                <p className="font-bold">{winRate.toFixed(0)}%</p>
                                <p className="text-xs text-muted-foreground">Win</p>
                              </div>
                            </div>
                            
                            <Badge variant={performance.variant} className="text-xs">
                              {performance.label}
                            </Badge>
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