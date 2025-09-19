import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Users, Calendar, Plus, Edit, Trash2, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Team {
  id: string;
  nome_time: string;
  nome_line: string;
  tag?: string;
}

interface BracketMatch {
  id: string;
  round: number;
  position: number;
  team1_id?: string;
  team2_id?: string;
  winner_id?: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  data_hora?: string;
  team1?: Team;
  team2?: Team;
  winner?: Team;
  phase_id: string;
}

interface Phase {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  ordem: number;
}

interface EliminationBracketProps {
  championshipId: string;
}

export default function EliminationBracket({ championshipId }: EliminationBracketProps) {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [newMatch, setNewMatch] = useState({
    round: 1,
    position: 1,
    team1_id: '',
    team2_id: '',
    data_hora: ''
  });

  // Carregar fases eliminatórias
  const loadPhases = async () => {
    try {
      const { data: phasesData, error: phasesError } = await supabase
        .from('tournament_phases')
        .select('*')
        .eq('championship_id', championshipId)
        .eq('tipo_fase', 'eliminatoria')
        .order('ordem_fase');

      if (phasesError) {
        console.error('Erro ao carregar fases:', phasesError);
        return;
      }

      setPhases(phasesData || []);
      if (phasesData && phasesData.length > 0 && !selectedPhase) {
        setSelectedPhase(phasesData[0].id);
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar fases:', error);
    }
  };

  // Carregar times
  const loadTeams = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('championship_id', championshipId)
        .order('nome_time');

      if (teamsError) {
        console.error('Erro ao carregar times:', teamsError);
        return;
      }

      setTeams(teamsData || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar times:', error);
    }
  };

  // Carregar partidas do chaveamento
  const loadMatches = async () => {
    if (!selectedPhase) return;
    
    setLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          team1:teams!matches_team1_id_fkey(
            id,
            nome_time,
            nome_line,
            tag
          ),
          team2:teams!matches_team2_id_fkey(
            id,
            nome_time,
            nome_line,
            tag
          ),
          winner:teams!matches_winner_id_fkey(
            id,
            nome_time,
            nome_line,
            tag
          )
        `)
        .eq('championship_id', championshipId)
        .eq('phase_id', selectedPhase)
        .order('round')
        .order('position');

      if (matchesError) {
        console.error('Erro ao carregar partidas:', matchesError);
        return;
      }

      setMatches(matchesData || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar partidas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova partida
  const createMatch = async () => {
    if (!selectedPhase || !newMatch.team1_id || !newMatch.team2_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('matches')
        .insert({
          championship_id: championshipId,
          phase_id: selectedPhase,
          round: newMatch.round,
          position: newMatch.position,
          team1_id: newMatch.team1_id,
          team2_id: newMatch.team2_id,
          data_hora: newMatch.data_hora || null,
          status: 'pendente'
        });

      if (error) {
        console.error('Erro ao criar partida:', error);
        toast.error('Erro ao criar partida');
        return;
      }

      toast.success('Partida criada com sucesso!');
      setShowCreateDialog(false);
      setNewMatch({
        round: 1,
        position: 1,
        team1_id: '',
        team2_id: '',
        data_hora: ''
      });
      loadMatches();
    } catch (error) {
      console.error('Erro inesperado ao criar partida:', error);
      toast.error('Erro inesperado ao criar partida');
    }
  };

  // Atualizar resultado da partida
  const updateMatchResult = async (matchId: string, winnerId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          winner_id: winnerId,
          status: 'concluido'
        })
        .eq('id', matchId);

      if (error) {
        console.error('Erro ao atualizar resultado:', error);
        toast.error('Erro ao atualizar resultado');
        return;
      }

      toast.success('Resultado atualizado com sucesso!');
      loadMatches();
    } catch (error) {
      console.error('Erro inesperado ao atualizar resultado:', error);
      toast.error('Erro inesperado ao atualizar resultado');
    }
  };

  // Deletar partida
  const deleteMatch = async (matchId: string) => {
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

  // Obter badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline">Pendente</Badge>;
      case 'em_andamento':
        return <Badge variant="secondary">Em Andamento</Badge>;
      case 'concluido':
        return <Badge variant="default">Concluído</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Organizar partidas por rodadas
  const getMatchesByRound = () => {
    const roundsMap = new Map<number, BracketMatch[]>();
    
    matches.forEach(match => {
      if (!roundsMap.has(match.round)) {
        roundsMap.set(match.round, []);
      }
      roundsMap.get(match.round)!.push(match);
    });

    return Array.from(roundsMap.entries()).sort(([a], [b]) => a - b);
  };

  // Gerar chaveamento automático
  const generateBracket = async () => {
    if (!selectedPhase || teams.length < 2) {
      toast.error('Selecione uma fase e certifique-se de ter pelo menos 2 times');
      return;
    }

    try {
      // Calcular número de rodadas necessárias
      const numTeams = teams.length;
      const numRounds = Math.ceil(Math.log2(numTeams));
      const firstRoundMatches = Math.ceil(numTeams / 2);

      // Criar partidas da primeira rodada
      const matchesToCreate = [];
      for (let i = 0; i < firstRoundMatches; i++) {
        const team1 = teams[i * 2];
        const team2 = teams[i * 2 + 1];
        
        if (team1 && team2) {
          matchesToCreate.push({
            championship_id: championshipId,
            phase_id: selectedPhase,
            round: 1,
            position: i + 1,
            team1_id: team1.id,
            team2_id: team2.id,
            status: 'pendente'
          });
        }
      }

      // Criar partidas das rodadas seguintes (sem times definidos)
      for (let round = 2; round <= numRounds; round++) {
        const matchesInRound = Math.ceil(firstRoundMatches / Math.pow(2, round - 1));
        for (let pos = 1; pos <= matchesInRound; pos++) {
          matchesToCreate.push({
            championship_id: championshipId,
            phase_id: selectedPhase,
            round: round,
            position: pos,
            status: 'pendente'
          });
        }
      }

      const { error } = await supabase
        .from('matches')
        .insert(matchesToCreate);

      if (error) {
        console.error('Erro ao gerar chaveamento:', error);
        toast.error('Erro ao gerar chaveamento');
        return;
      }

      toast.success('Chaveamento gerado com sucesso!');
      loadMatches();
    } catch (error) {
      console.error('Erro inesperado ao gerar chaveamento:', error);
      toast.error('Erro inesperado ao gerar chaveamento');
    }
  };

  useEffect(() => {
    if (championshipId) {
      loadPhases();
      loadTeams();
    }
  }, [championshipId]);

  useEffect(() => {
    if (selectedPhase) {
      loadMatches();
    }
  }, [selectedPhase]);

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
            <h2 className="text-2xl font-orbitron font-bold">Chaveamento Eliminatório</h2>
            <p className="text-muted-foreground">Visualização e gerenciamento do mata-mata</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={generateBracket} variant="outline">
              <Trophy className="h-4 w-4 mr-2" />
              Gerar Chaveamento
            </Button>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="round">Rodada</Label>
                      <Input
                        id="round"
                        type="number"
                        min="1"
                        value={newMatch.round}
                        onChange={(e) => setNewMatch({ ...newMatch, round: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Posição</Label>
                      <Input
                        id="position"
                        type="number"
                        min="1"
                        value={newMatch.position}
                        onChange={(e) => setNewMatch({ ...newMatch, position: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="team1">Time 1</Label>
                    <Select value={newMatch.team1_id} onValueChange={(value) => setNewMatch({ ...newMatch, team1_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar time 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.nome_time} - {team.nome_line}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="team2">Time 2</Label>
                    <Select value={newMatch.team2_id} onValueChange={(value) => setNewMatch({ ...newMatch, team2_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar time 2" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(team => team.id !== newMatch.team1_id).map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.nome_time} - {team.nome_line}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="datetime">Data e Hora (opcional)</Label>
                    <Input
                      id="datetime"
                      type="datetime-local"
                      value={newMatch.data_hora}
                      onChange={(e) => setNewMatch({ ...newMatch, data_hora: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createMatch}>
                      Criar Partida
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Seletor de Fase */}
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Fase:</span>
          </div>
          <Select value={selectedPhase} onValueChange={setSelectedPhase}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Selecionar fase eliminatória" />
            </SelectTrigger>
            <SelectContent>
              {phases.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.nome_fase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chaveamento */}
      {matches.length > 0 ? (
        <div className="space-y-6">
          {getMatchesByRound().map(([round, roundMatches]) => (
            <Card key={round} className="bg-gradient-dark border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Rodada {round}
                  <Badge variant="outline" className="ml-2">
                    {roundMatches.length} partidas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roundMatches.map((match) => (
                    <Card key={match.id} className="bg-card border hover:border-primary/40 transition-colors">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Posição {match.position}</span>
                            {getStatusBadge(match.status)}
                          </div>
                          
                          <div className="space-y-2">
                            <div className={`p-2 rounded border ${
                              match.winner_id === match.team1_id ? 'bg-primary/20 border-primary' : 'bg-muted'
                            }`}>
                              <p className="font-medium">
                                {match.team1 ? match.team1.nome_time : 'TBD'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {match.team1 ? match.team1.nome_line : 'A definir'}
                              </p>
                            </div>
                            
                            <div className="text-center text-xs text-muted-foreground">VS</div>
                            
                            <div className={`p-2 rounded border ${
                              match.winner_id === match.team2_id ? 'bg-primary/20 border-primary' : 'bg-muted'
                            }`}>
                              <p className="font-medium">
                                {match.team2 ? match.team2.nome_time : 'TBD'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {match.team2 ? match.team2.nome_line : 'A definir'}
                              </p>
                            </div>
                          </div>
                          
                          {match.data_hora && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(match.data_hora).toLocaleString('pt-BR')}
                            </div>
                          )}
                          
                          <div className="flex gap-1">
                            {match.team1_id && match.team2_id && match.status !== 'concluido' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMatchResult(match.id, match.team1_id!)}
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Time 1
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMatchResult(match.id, match.team2_id!)}
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Time 2
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteMatch(match.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-dark border-primary/20">
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum chaveamento encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {selectedPhase ? 'Crie partidas ou gere um chaveamento automático' : 'Selecione uma fase eliminatória'}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{teams.length} times disponíveis</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}