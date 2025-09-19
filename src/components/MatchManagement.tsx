import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Calendar, Clock, Trophy, Trash2, Play, Pause, CheckCircle, AlertCircle, Users, Filter } from 'lucide-react';
import { TournamentPhase } from './PhaseManager';

interface Match {
  id: string;
  championship_id: string;
  phase_id?: string;
  group_id?: string;
  ordem_queda: number;
  data_hora_queda: string;
  status: 'pendente' | 'processando' | 'finalizada' | 'erro_ia' | 'validacao_manual';
  created_at: string;
  phase?: TournamentPhase;
  group?: Group;
}

interface Group {
  id: string;
  championship_id: string;
  phase_id?: string;
  nome_grupo: string;
  capacidade_times: number;
  created_at: string;
}

interface Team {
  id: string;
  nome_time: string;
  nome_line: string;
  tag?: string;
  championship_id: string;
  group_id?: string;
  phase_id?: string;
}

interface MatchResult {
  id: string;
  match_id: string;
  team_id: string;
  posicao_final?: number;
  kills: number;
  pontos_obtidos: number;
  team?: Team;
}

interface Championship {
  id: string;
  nome: string;
  data_inicio?: string;
  horario_inicio?: string;
}

interface MatchManagementProps {
  championshipId: string;
}

export default function MatchManagement({ championshipId }: MatchManagementProps) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  // Função para obter data/hora padrão baseada no campeonato
  const getDefaultDateTime = () => {
    if (championship?.data_inicio && championship?.horario_inicio) {
      const date = new Date(championship.data_inicio);
      const [hours, minutes] = championship.horario_inicio.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toISOString().slice(0, 16);
    }
    return new Date().toISOString().slice(0, 16);
  };
  
  const [newMatch, setNewMatch] = useState({
    ordem_queda: 1,
    data_hora_queda: new Date().toISOString().slice(0, 16),
    phase_id: '',
    group_id: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadChampionship();
    loadMatches();
    loadTeams();
    loadPhases();
    loadGroups();
  }, [championshipId]);

  // Atualizar data padrão quando os dados do campeonato mudarem
  useEffect(() => {
    if (championship) {
      setNewMatch(prev => ({
        ...prev,
        data_hora_queda: getDefaultDateTime()
      }));
    }
  }, [championship]);

  // Carregar dados do campeonato
  const loadChampionship = async () => {
    try {
      const { data, error } = await supabase
        .from('championships')
        .select('id, nome, data_inicio, horario_inicio')
        .eq('id', championshipId)
        .single();

      if (error) {
        console.error('Erro ao carregar campeonato:', error);
        return;
      }

      setChampionship(data);
    } catch (error) {
      console.error('Erro inesperado ao carregar campeonato:', error);
    }
  };

  // Carregar partidas do campeonato
  const loadMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          phase:tournament_phases(*),
          group:groups(*)
        `)
        .eq('championship_id', championshipId)
        .order('ordem_queda', { ascending: true });

      if (error) {
        console.error('Erro ao carregar partidas:', error);
        toast.error('Erro ao carregar partidas');
        return;
      }

      setMatches(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar partidas:', error);
      toast.error('Erro inesperado ao carregar partidas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar times do campeonato
  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('championship_id', championshipId)
        .order('nome_time', { ascending: true });

      if (error) {
        console.error('Erro ao carregar times:', error);
        return;
      }

      setTeams(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar times:', error);
    }
  };

  // Carregar fases do campeonato
  const loadPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_phases')
        .select('*')
        .eq('championship_id', championshipId)
        .order('ordem_fase', { ascending: true });

      if (error) {
        console.error('Erro ao carregar fases:', error);
        return;
      }

      setPhases(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar fases:', error);
    }
  };

  // Carregar grupos do campeonato
  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('championship_id', championshipId)
        .order('nome_grupo', { ascending: true });

      if (error) {
        console.error('Erro ao carregar grupos:', error);
        return;
      }

      setGroups(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar grupos:', error);
    }
  };

  // Carregar resultados de uma partida
  const loadMatchResults = async (matchId: string) => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          team:teams(
            id,
            nome_time,
            nome_line,
            tag
          )
        `)
        .eq('match_id', matchId)
        .order('posicao_final', { ascending: true });

      if (error) {
        console.error('Erro ao carregar resultados:', error);
        return;
      }

      setResults(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar resultados:', error);
    }
  };

  // Criar nova partida
  const createMatch = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const matchData: any = {
        championship_id: championshipId,
        ordem_queda: newMatch.ordem_queda,
        data_hora_queda: new Date(newMatch.data_hora_queda).toISOString(),
        status: 'pendente'
      };

      if (newMatch.phase_id) {
        matchData.phase_id = newMatch.phase_id;
      }

      if (newMatch.group_id) {
        matchData.group_id = newMatch.group_id;
      }

      const { error } = await supabase
        .from('matches')
        .insert(matchData);

      if (error) {
        console.error('Erro ao criar partida:', error);
        toast.error('Erro ao criar partida');
        return;
      }

      toast.success('Partida criada com sucesso!');
      setNewMatch({
        ordem_queda: newMatch.ordem_queda + 1,
        data_hora_queda: getDefaultDateTime(),
        phase_id: newMatch.phase_id,
        group_id: newMatch.group_id
      });
      setShowCreateDialog(false);
      loadMatches();
    } catch (error) {
      console.error('Erro inesperado ao criar partida:', error);
      toast.error('Erro inesperado ao criar partida');
    }
  };

  // Atualizar status da partida
  const updateMatchStatus = async (matchId: string, newStatus: Match['status']) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: newStatus })
        .eq('id', matchId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status da partida');
        return;
      }

      toast.success('Status da partida atualizado!');
      loadMatches();
    } catch (error) {
      console.error('Erro inesperado ao atualizar status:', error);
      toast.error('Erro inesperado ao atualizar status');
    }
  };

  // Deletar partida
  const deleteMatch = async (matchId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta partida? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) {
        console.error('Erro ao deletar partida:', error);
        toast.error('Erro ao deletar partida');
        return;
      }

      toast.success('Partida deletada com sucesso!');
      loadMatches();
    } catch (error) {
      console.error('Erro inesperado ao deletar partida:', error);
      toast.error('Erro inesperado ao deletar partida');
    }
  };

  // Abrir diálogo de resultados
  const openResultsDialog = (match: Match) => {
    setSelectedMatch(match);
    loadMatchResults(match.id);
    setShowResultsDialog(true);
  };

  // Obter configuração do badge de status
  const getStatusBadge = (status: Match['status']) => {
    const statusConfig = {
      'pendente': { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      'processando': { label: 'Em Andamento', variant: 'default' as const, icon: Play },
      'finalizada': { label: 'Finalizada', variant: 'outline' as const, icon: CheckCircle },
      'erro_ia': { label: 'Erro IA', variant: 'destructive' as const, icon: AlertCircle },
      'validacao_manual': { label: 'Validação Manual', variant: 'secondary' as const, icon: Pause }
    };
    
    const config = statusConfig[status] || { label: status, variant: 'secondary' as const, icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Filtrar partidas
  const filteredMatches = matches.filter(match => {
    if (selectedPhase !== 'all' && match.phase_id !== selectedPhase) {
      return false;
    }
    if (selectedGroup !== 'all' && match.group_id !== selectedGroup) {
      return false;
    }
    return true;
  });

  // Agrupar partidas por fase e grupo
  const groupedMatches = filteredMatches.reduce((acc, match) => {
    const phaseKey = match.phase?.nome || 'Sem Fase';
    const groupKey = match.group?.nome_grupo || 'Sem Grupo';
    const key = `${phaseKey} - ${groupKey}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  useEffect(() => {
    if (championshipId) {
      loadMatches();
      loadTeams();
      loadPhases();
      loadGroups();
    }
  }, [championshipId]);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-orbitron font-bold">Gestão de Partidas</h2>
          <p className="text-muted-foreground">Gerencie as partidas e seus resultados</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Partida
            </Button>
          </DialogTrigger>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Partida</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ordem_queda">Número da Partida</Label>
                  <Input
                    id="ordem_queda"
                    type="number"
                    min="1"
                    value={newMatch.ordem_queda}
                    onChange={(e) => setNewMatch({ ...newMatch, ordem_queda: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                {phases.length > 0 && (
                  <div>
                    <Label htmlFor="phase_id">Fase (Opcional)</Label>
                    <Select 
                      value={newMatch.phase_id} 
                      onValueChange={(value) => setNewMatch({ ...newMatch, phase_id: value, group_id: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma fase" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma fase</SelectItem>
                        {phases.map((phase) => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.nome_fase}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {groups.length > 0 && (
                  <div>
                    <Label htmlFor="group_id">Grupo (Opcional)</Label>
                    <Select 
                      value={newMatch.group_id} 
                      onValueChange={(value) => setNewMatch({ ...newMatch, group_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum grupo</SelectItem>
                        {groups
                          .filter(group => !newMatch.phase_id || group.phase_id === newMatch.phase_id)
                          .map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.nome_grupo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="data_hora_queda">Data e Hora</Label>
                  <Input
                    id="data_hora_queda"
                    type="datetime-local"
                    value={newMatch.data_hora_queda}
                    onChange={(e) => setNewMatch({ ...newMatch, data_hora_queda: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={createMatch} className="flex-1">
                    Criar Partida
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      {(phases.length > 0 || groups.length > 0) && (
        <Card className="bg-gradient-dark border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              
              {phases.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="filter-phase" className="text-sm">Fase:</Label>
                  <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
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
              )}
              
              {groups.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="filter-group" className="text-sm">Grupo:</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
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
              )}
              
              <div className="ml-auto text-sm text-muted-foreground">
                {filteredMatches.length} partida{filteredMatches.length !== 1 ? 's' : ''} encontrada{filteredMatches.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Partidas */}
      {filteredMatches.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([groupKey, groupMatches]) => (
            <div key={groupKey} className="space-y-4">
              {Object.keys(groupedMatches).length > 1 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">{groupKey}</h3>
                  <Badge variant="outline">{groupMatches.length} partida{groupMatches.length !== 1 ? 's' : ''}</Badge>
                </div>
              )}
              
              <div className="space-y-3">
                {groupMatches.map((match) => (
                  <Card key={match.id} className="bg-gradient-dark border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-primary" />
                            <h4 className="text-lg font-semibold">Partida #{match.ordem_queda}</h4>
                            {getStatusBadge(match.status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(match.data_hora_queda).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(match.data_hora_queda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {match.phase && (
                              <Badge variant="secondary" className="text-xs">
                                {match.phase.nome_fase}
                              </Badge>
                            )}
                            {match.group && (
                              <Badge variant="outline" className="text-xs">
                                {match.group.nome_grupo}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {match.status === 'pendente' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMatchStatus(match.id, 'processando')}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Iniciar
                            </Button>
                          )}
                          {match.status === 'processando' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMatchStatus(match.id, 'finalizada')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalizar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResultsDialog(match)}
                          >
                            Ver Resultados
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMatch(match.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-dark border-primary/20">
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {matches.length === 0 ? 'Nenhuma partida encontrada' : 'Nenhuma partida corresponde aos filtros'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {matches.length === 0 
                ? 'Crie a primeira partida para este campeonato'
                : 'Ajuste os filtros ou crie uma nova partida'
              }
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {matches.length === 0 ? 'Criar Primeira Partida' : 'Nova Partida'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Resultados */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Resultados - Partida #{selectedMatch?.ordem_queda}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full">
                        <span className="text-sm font-bold">#{result.posicao_final || index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{result.team?.nome_time}</p>
                        <p className="text-sm text-muted-foreground">{result.team?.nome_line}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{result.pontos_obtidos} pts</p>
                      <p className="text-sm text-muted-foreground">{result.kills} kills</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum resultado encontrado para esta partida</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}