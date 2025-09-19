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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Calendar, Clock, Users, Play, Settings, Zap, Trophy, AlertCircle } from 'lucide-react';
import { TournamentPhase } from './PhaseManager';

interface Group {
  id: string;
  championship_id: string;
  phase_id?: string;
  nome_grupo: string;
  capacidade_times: number;
  created_at: string;
  teams?: Team[];
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

interface ScheduleConfig {
  startDate: string;
  startTime: string;
  matchInterval: number; // minutos entre partidas
  matchesPerDay: number;
  selectedGroups: string[];
  selectedPhase: string;
  roundRobin: boolean; // todos contra todos
  doubleRoundRobin: boolean; // ida e volta
}

interface GroupSchedulerProps {
  championshipId: string;
}

export default function GroupScheduler({ championshipId }: GroupSchedulerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    startDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    matchInterval: 30,
    matchesPerDay: 8,
    selectedGroups: [],
    selectedPhase: '',
    roundRobin: true,
    doubleRoundRobin: false
  });

  useEffect(() => {
    if (championshipId) {
      loadPhases();
      loadGroups();
    }
  }, [championshipId]);

  const loadPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_phases')
        .select('*')
        .eq('championship_id', championshipId)
        .order('ordem_fase', { ascending: true });

      if (error) throw error;
      setPhases(data || []);
    } catch (error) {
      console.error('Erro ao carregar fases:', error);
      toast.error('Erro ao carregar fases do torneio');
    }
  };

  const loadGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('championship_id', championshipId)
        .order('nome_grupo');

      if (groupsError) throw groupsError;

      // Carregar times para cada grupo
      const groupsWithTeams = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .select('*')
            .eq('group_id', group.id);

          if (teamsError) {
            console.error('Erro ao carregar times do grupo:', teamsError);
            return { ...group, teams: [] };
          }

          return { ...group, teams: teamsData || [] };
        })
      );

      setGroups(groupsWithTeams);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      toast.error('Erro ao carregar grupos');
    }
  };

  const generateMatches = (teams: Team[], config: ScheduleConfig) => {
    const matches = [];
    const teamCount = teams.length;

    if (teamCount < 2) {
      return [];
    }

    // Algoritmo Round Robin
    if (config.roundRobin) {
      for (let i = 0; i < teamCount; i++) {
        for (let j = i + 1; j < teamCount; j++) {
          matches.push({
            team1: teams[i],
            team2: teams[j],
            round: 1
          });
        }
      }

      // Duplo turno (ida e volta)
      if (config.doubleRoundRobin) {
        const firstRoundMatches = [...matches];
        firstRoundMatches.forEach(match => {
          matches.push({
            team1: match.team2,
            team2: match.team1,
            round: 2
          });
        });
      }
    }

    return matches;
  };

  const scheduleMatches = async () => {
    if (scheduleConfig.selectedGroups.length === 0) {
      toast.error('Selecione pelo menos um grupo');
      return;
    }

    setLoading(true);
    try {
      let totalMatches = 0;
      let currentDate = new Date(`${scheduleConfig.startDate}T${scheduleConfig.startTime}`);
      let matchesScheduledToday = 0;

      for (const groupId of scheduleConfig.selectedGroups) {
        const group = groups.find(g => g.id === groupId);
        if (!group || !group.teams || group.teams.length < 2) {
          toast.warning(`Grupo ${group?.nome_grupo || groupId} não tem times suficientes`);
          continue;
        }

        const matches = generateMatches(group.teams, scheduleConfig);
        
        for (let i = 0; i < matches.length; i++) {
          // Verificar se precisa mudar de dia
          if (matchesScheduledToday >= scheduleConfig.matchesPerDay) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(parseInt(scheduleConfig.startTime.split(':')[0]));
            currentDate.setMinutes(parseInt(scheduleConfig.startTime.split(':')[1]));
            matchesScheduledToday = 0;
          }

          const matchData = {
            championship_id: championshipId,
            phase_id: scheduleConfig.selectedPhase || null,
            group_id: groupId,
            ordem_queda: totalMatches + i + 1,
            data_hora_queda: currentDate.toISOString(),
            status: 'pendente' as const
          };

          const { error } = await supabase
            .from('matches')
            .insert(matchData);

          if (error) {
            console.error('Erro ao criar partida:', error);
            throw error;
          }

          // Avançar horário para próxima partida
          currentDate.setMinutes(currentDate.getMinutes() + scheduleConfig.matchInterval);
          matchesScheduledToday++;
        }

        totalMatches += matches.length;
      }

      toast.success(`${totalMatches} partidas agendadas com sucesso!`);
      setShowScheduleDialog(false);
      
      // Reset config
      setScheduleConfig({
        startDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        matchInterval: 30,
        matchesPerDay: 8,
        selectedGroups: [],
        selectedPhase: '',
        roundRobin: true,
        doubleRoundRobin: false
      });

    } catch (error) {
      console.error('Erro ao agendar partidas:', error);
      toast.error('Erro ao agendar partidas');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    if (checked) {
      setScheduleConfig(prev => ({
        ...prev,
        selectedGroups: [...prev.selectedGroups, groupId]
      }));
    } else {
      setScheduleConfig(prev => ({
        ...prev,
        selectedGroups: prev.selectedGroups.filter(id => id !== groupId)
      }));
    }
  };

  const calculateTotalMatches = () => {
    let total = 0;
    scheduleConfig.selectedGroups.forEach(groupId => {
      const group = groups.find(g => g.id === groupId);
      if (group && group.teams) {
        const teamCount = group.teams.length;
        if (teamCount >= 2) {
          // Combinações de times (C(n,2))
          let matches = (teamCount * (teamCount - 1)) / 2;
          if (scheduleConfig.doubleRoundRobin) {
            matches *= 2;
          }
          total += matches;
        }
      }
    });
    return total;
  };

  const estimatedDays = Math.ceil(calculateTotalMatches() / scheduleConfig.matchesPerDay);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agendador de Grupos</h2>
          <p className="text-muted-foreground">Agende partidas automaticamente para os grupos</p>
        </div>
        
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendar Partidas
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configurar Agendamento</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Seleção de Fase */}
              {phases.length > 0 && (
                <div>
                  <Label>Fase (Opcional)</Label>
                  <Select 
                    value={scheduleConfig.selectedPhase} 
                    onValueChange={(value) => setScheduleConfig(prev => ({ ...prev, selectedPhase: value }))}
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
              
              {/* Seleção de Grupos */}
              <div>
                <Label className="text-base font-medium">Grupos para Agendar</Label>
                <div className="mt-2 space-y-3 max-h-40 overflow-y-auto">
                  {groups
                    .filter(group => !scheduleConfig.selectedPhase || group.phase_id === scheduleConfig.selectedPhase)
                    .map((group) => (
                    <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={group.id}
                        checked={scheduleConfig.selectedGroups.includes(group.id)}
                        onCheckedChange={(checked) => handleGroupSelection(group.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-medium">{group.nome_grupo}</span>
                          <Badge variant="outline">
                            {group.teams?.length || 0} times
                          </Badge>
                        </div>
                        {(group.teams?.length || 0) < 2 && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Times insuficientes para partidas</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Configurações de Data e Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={scheduleConfig.startDate}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Horário de Início</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={scheduleConfig.startTime}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Configurações de Intervalo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="matchInterval">Intervalo entre Partidas (min)</Label>
                  <Input
                    id="matchInterval"
                    type="number"
                    min="15"
                    max="120"
                    value={scheduleConfig.matchInterval}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, matchInterval: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="matchesPerDay">Partidas por Dia</Label>
                  <Input
                    id="matchesPerDay"
                    type="number"
                    min="1"
                    max="20"
                    value={scheduleConfig.matchesPerDay}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, matchesPerDay: parseInt(e.target.value) || 8 }))}
                  />
                </div>
              </div>
              
              {/* Opções de Formato */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Formato das Partidas</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="roundRobin"
                      checked={scheduleConfig.roundRobin}
                      onCheckedChange={(checked) => setScheduleConfig(prev => ({ ...prev, roundRobin: checked as boolean }))}
                    />
                    <Label htmlFor="roundRobin">Todos contra todos (Round Robin)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="doubleRoundRobin"
                      checked={scheduleConfig.doubleRoundRobin}
                      onCheckedChange={(checked) => setScheduleConfig(prev => ({ ...prev, doubleRoundRobin: checked as boolean }))}
                    />
                    <Label htmlFor="doubleRoundRobin">Duplo turno (ida e volta)</Label>
                  </div>
                </div>
              </div>
              
              {/* Resumo */}
              {scheduleConfig.selectedGroups.length > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-medium">Resumo do Agendamento</span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• {scheduleConfig.selectedGroups.length} grupo(s) selecionado(s)</p>
                      <p>• {calculateTotalMatches()} partidas serão criadas</p>
                      <p>• Estimativa: {estimatedDays} dia(s) de competição</p>
                      <p>• Início: {new Date(`${scheduleConfig.startDate}T${scheduleConfig.startTime}`).toLocaleString('pt-BR')}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={scheduleMatches} 
                  disabled={loading || scheduleConfig.selectedGroups.length === 0}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Settings className="h-4 w-4 mr-2 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Agendar {calculateTotalMatches()} Partidas
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowScheduleDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Lista de Grupos */}
      {groups.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="bg-gradient-dark border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {group.nome_grupo}
                  </CardTitle>
                  <Badge variant="outline">
                    {group.teams?.length || 0}/{group.capacidade_times}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.teams && group.teams.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Times:</p>
                      <div className="space-y-1">
                        {group.teams.map((team) => (
                          <div key={team.id} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span>{team.nome_time}</span>
                            {team.tag && (
                              <Badge variant="secondary" className="text-xs">
                                {team.tag}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum time neste grupo</p>
                  )}
                  
                  {group.teams && group.teams.length >= 2 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Trophy className="h-3 w-3" />
                        <span>
                          {Math.floor((group.teams.length * (group.teams.length - 1)) / 2)} partidas possíveis
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-dark border-primary/20">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
            <p className="text-muted-foreground">Crie grupos primeiro para poder agendar partidas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}