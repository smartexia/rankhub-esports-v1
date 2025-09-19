import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Calendar, 
  Clock, 
  Users, 
  Trophy, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Edit, 
  Trash2,
  Plus,
  ArrowRight,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentPhase {
  id: string;
  championship_id: string;
  nome_fase: string;
  tipo_fase: 'classificatoria' | 'eliminatoria' | 'final' | 'playoff';
  ordem_fase: number;
  status: 'pendente' | 'ativa' | 'concluida' | 'cancelada';
  data_inicio?: string;
  data_fim?: string;
  numero_quedas?: number;
  numero_classificados?: number;
  configuracao?: any;
  created_at: string;
  updated_at: string;
}

export interface PhaseStats {
  total_matches: number;
  completed_matches: number;
  pending_matches: number;
  total_teams: number;
  qualified_teams?: number;
}

interface PhaseManagerProps {
  championshipId: string;
  onPhaseUpdate?: (phase: TournamentPhase) => void;
}

const PHASE_STATUS_CONFIG = {
  pendente: {
    label: 'Pendente',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    icon: Clock
  },
  ativa: {
    label: 'Ativa',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    icon: Play
  },
  concluida: {
    label: 'Concluída',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    icon: CheckCircle
  },
  cancelada: {
    label: 'Cancelada',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    icon: AlertCircle
  }
};

const PHASE_TYPE_CONFIG = {
  classificatoria: {
    label: 'Fase Classificatória',
    description: 'Times divididos em grupos jogando entre si',
    icon: Users,
    color: 'bg-blue-100 text-blue-800'
  },
  eliminatoria: {
    label: 'Eliminatório',
    description: 'Sistema mata-mata com eliminação direta',
    icon: Trophy,
    color: 'bg-red-100 text-red-800'
  },
  final: {
    label: 'Final',
    description: 'Partida final do torneio',
    icon: Trophy,
    color: 'bg-yellow-100 text-yellow-800'
  },
  playoff: {
    label: 'Playoff',
    description: 'Partidas de desempate',
    icon: Target,
    color: 'bg-purple-100 text-purple-800'
  }
};

export function PhaseManager({ championshipId, onPhaseUpdate }: PhaseManagerProps) {
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
  const [phaseStats, setPhaseStats] = useState<Record<string, PhaseStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<TournamentPhase | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPhases();
  }, [championshipId]);

  const loadPhases = async () => {
    try {
      setLoading(true);
      
      const { data: phasesData, error: phasesError } = await supabase
        .from('tournament_phases')
        .select('*')
        .eq('championship_id', championshipId)
        .order('ordem', { ascending: true });

      if (phasesError) throw phasesError;

      setPhases(phasesData || []);
      
      // Carregar estatísticas para cada fase
      const stats: Record<string, PhaseStats> = {};
      for (const phase of phasesData || []) {
        const phaseStatsData = await loadPhaseStats(phase.id);
        stats[phase.id] = phaseStatsData;
      }
      setPhaseStats(stats);
      
    } catch (error) {
      console.error('Erro ao carregar fases:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar fases do torneio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPhaseStats = async (phaseId: string): Promise<PhaseStats> => {
    try {
      // Buscar partidas da fase
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, status')
        .eq('phase_id', phaseId);

      if (matchesError) throw matchesError;

      // Buscar times da fase
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('phase_id', phaseId);

      if (teamsError) throw teamsError;

      const totalMatches = matches?.length || 0;
      const completedMatches = matches?.filter(m => m.status === 'finalizada').length || 0;
      const pendingMatches = totalMatches - completedMatches;
      const totalTeams = teams?.length || 0;

      return {
        total_matches: totalMatches,
        completed_matches: completedMatches,
        pending_matches: pendingMatches,
        total_teams: totalTeams
      };
    } catch (error) {
      console.error('Erro ao carregar estatísticas da fase:', error);
      return {
        total_matches: 0,
        completed_matches: 0,
        pending_matches: 0,
        total_teams: 0
      };
    }
  };

  const updatePhaseStatus = async (phaseId: string, newStatus: TournamentPhase['status']) => {
    try {
      const { error } = await supabase
        .from('tournament_phases')
        .update({ 
          status: newStatus,
          ...(newStatus === 'ativa' && { data_inicio: new Date().toISOString() }),
          ...(newStatus === 'concluida' && { data_fim: new Date().toISOString() })
        })
        .eq('id', phaseId);

      if (error) throw error;

      await loadPhases();
      
      toast({
        title: "Status Atualizado",
        description: `Fase ${newStatus === 'ativa' ? 'iniciada' : newStatus} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status da fase:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da fase",
        variant: "destructive"
      });
    }
  };

  const deletePhase = async (phaseId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_phases')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;

      await loadPhases();
      
      toast({
        title: "Fase Removida",
        description: "Fase removida com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover fase:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover fase",
        variant: "destructive"
      });
    }
  };

  const createPhase = async (phaseData: Partial<TournamentPhase>) => {
    try {
      const maxOrder = Math.max(...phases.map(p => p.ordem_fase), 0);
      
      const { error } = await supabase
        .from('tournament_phases')
        .insert({
          championship_id: championshipId,
          nome_fase: phaseData.nome_fase,
          tipo_fase: phaseData.tipo_fase,
          ordem_fase: maxOrder + 1,
          status: 'pendente',
          numero_grupos: phaseData.numero_grupos,
          times_por_grupo: phaseData.times_por_grupo,
          classificados_por_grupo: phaseData.classificados_por_grupo,
          descricao: phaseData.descricao,
          configuracao: phaseData.configuracao
        });

      if (error) throw error;

      await loadPhases();
      setCreateDialogOpen(false);
      
      toast({
        title: "Fase Criada",
        description: "Nova fase adicionada ao torneio",
      });
    } catch (error) {
      console.error('Erro ao criar fase:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar fase",
        variant: "destructive"
      });
    }
  };

  const updatePhase = async (phaseId: string, updates: Partial<TournamentPhase>) => {
    try {
      const { error } = await supabase
        .from('tournament_phases')
        .update(updates)
        .eq('id', phaseId);

      if (error) throw error;

      await loadPhases();
      setEditDialogOpen(false);
      setSelectedPhase(null);
      
      toast({
        title: "Fase Atualizada",
        description: "Fase atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar fase:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar fase",
        variant: "destructive"
      });
    }
  };

  const getPhaseProgress = (phaseId: string): number => {
    const stats = phaseStats[phaseId];
    if (!stats || stats.total_matches === 0) return 0;
    return (stats.completed_matches / stats.total_matches) * 100;
  };

  const canStartPhase = (phase: TournamentPhase): boolean => {
    const phaseIndex = phases.findIndex(p => p.id === phase.id);
    if (phaseIndex === 0) return true; // Primeira fase pode sempre iniciar
    
    const previousPhase = phases[phaseIndex - 1];
    return previousPhase?.status === 'concluida';
  };

  const renderPhaseCard = (phase: TournamentPhase) => {
    const statusConfig = PHASE_STATUS_CONFIG[phase.status];
    const typeConfig = PHASE_TYPE_CONFIG[phase.tipo_fase];
    const StatusIcon = statusConfig.icon;
    const TypeIcon = typeConfig.icon;
    const stats = phaseStats[phase.id];
    const progress = getPhaseProgress(phase.id);

    return (
      <Card key={phase.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <TypeIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">{phase.nome_fase}</CardTitle>
              </div>
              <Badge className={typeConfig.color}>
                {typeConfig.label}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`${statusConfig.color} text-white`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              
              <div className="flex space-x-1">
                {phase.status === 'pendente' && canStartPhase(phase) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePhaseStatus(phase.id, 'ativa')}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                
                {phase.status === 'ativa' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePhaseStatus(phase.id, 'concluida')}
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPhase(phase);
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Fase</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover a fase "{phase.nome_fase}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePhase(phase.id)}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
          
          {phase.descricao && (
            <CardDescription>{phase.descricao}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Estatísticas da Fase */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.total_teams || 0}</div>
              <div className="text-xs text-muted-foreground">Times</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.total_matches || 0}</div>
              <div className="text-xs text-muted-foreground">Partidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.completed_matches || 0}</div>
              <div className="text-xs text-muted-foreground">Finalizadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats?.pending_matches || 0}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </div>
          </div>
          
          {/* Progresso */}
          {stats && stats.total_matches > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* Configurações Específicas */}
          {phase.tipo_fase === 'classificatoria' && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {phase.numero_grupos && (
                <Badge variant="secondary">{phase.numero_grupos} grupos</Badge>
              )}
              {phase.times_por_grupo && (
                <Badge variant="secondary">{phase.times_por_grupo} times/grupo</Badge>
              )}
              {phase.classificados_por_grupo && (
                <Badge variant="secondary">{phase.classificados_por_grupo} classificados/grupo</Badge>
              )}
            </div>
          )}
          
          {/* Datas */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>
                {phase.data_inicio 
                  ? `Iniciada: ${new Date(phase.data_inicio).toLocaleDateString()}`
                  : 'Não iniciada'
                }
              </span>
            </div>
            {phase.data_fim && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Finalizada: {new Date(phase.data_fim).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCreatePhaseDialog = () => {
    const [newPhase, setNewPhase] = useState<Partial<TournamentPhase>>({
      nome: '',
      tipo: 'grupos',
      numero_grupos: 2,
      times_por_grupo: 4,
      classificados_por_grupo: 2,
      descricao: ''
    });

    return (
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Fase</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Fase</Label>
              <Input
                id="nome"
                value={newPhase.nome_fase}
                onChange={(e) => setNewPhase(prev => ({ ...prev, nome_fase: e.target.value }))}
                placeholder="Ex: Fase de Grupos, Semifinais..."
              />
            </div>
            
            <div>
              <Label htmlFor="tipo">Tipo de Fase</Label>
              <Select 
                value={newPhase.tipo_fase} 
                onValueChange={(value: 'classificatoria' | 'eliminatoria') => 
                  setNewPhase(prev => ({ ...prev, tipo_fase: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classificatoria">Fase Classificatória</SelectItem>
                  <SelectItem value="eliminatoria">Eliminatório</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="playoff">Playoff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newPhase.tipo_fase === 'classificatoria' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_grupos">Número de Grupos</Label>
                    <Input
                      id="numero_grupos"
                      type="number"
                      min="1"
                      value={newPhase.numero_grupos}
                      onChange={(e) => setNewPhase(prev => ({ 
                        ...prev, 
                        numero_grupos: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="times_por_grupo">Times por Grupo</Label>
                    <Input
                      id="times_por_grupo"
                      type="number"
                      min="2"
                      value={newPhase.times_por_grupo}
                      onChange={(e) => setNewPhase(prev => ({ 
                        ...prev, 
                        times_por_grupo: parseInt(e.target.value) || 2 
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="classificados_por_grupo">Classificados por Grupo</Label>
                  <Input
                    id="classificados_por_grupo"
                    type="number"
                    min="1"
                    max={newPhase.times_por_grupo}
                    value={newPhase.classificados_por_grupo}
                    onChange={(e) => setNewPhase(prev => ({ 
                      ...prev, 
                      classificados_por_grupo: parseInt(e.target.value) || 1 
                    }))}
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="descricao">Descrição (Opcional)</Label>
              <Textarea
                id="descricao"
                value={newPhase.descricao}
                onChange={(e) => setNewPhase(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva as regras ou características desta fase..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createPhase(newPhase)} disabled={!newPhase.nome_fase}>
              Criar Fase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderEditPhaseDialog = () => {
    if (!selectedPhase) return null;

    const [editedPhase, setEditedPhase] = useState<Partial<TournamentPhase>>({
      nome_fase: selectedPhase.nome_fase,
      numero_quedas: selectedPhase.numero_quedas,
      numero_classificados: selectedPhase.numero_classificados,
      configuracao: selectedPhase.configuracao
    });

    return (
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Fase: {selectedPhase.nome_fase}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_nome">Nome da Fase</Label>
              <Input
                id="edit_nome"
                value={editedPhase.nome_fase}
                onChange={(e) => setEditedPhase(prev => ({ ...prev, nome_fase: e.target.value }))}
              />
            </div>
            
            {selectedPhase.tipo_fase === 'classificatoria' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_numero_grupos">Número de Grupos</Label>
                    <Input
                      id="edit_numero_grupos"
                      type="number"
                      min="1"
                      value={editedPhase.numero_grupos}
                      onChange={(e) => setEditedPhase(prev => ({ 
                        ...prev, 
                        numero_grupos: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_times_por_grupo">Times por Grupo</Label>
                    <Input
                      id="edit_times_por_grupo"
                      type="number"
                      min="2"
                      value={editedPhase.times_por_grupo}
                      onChange={(e) => setEditedPhase(prev => ({ 
                        ...prev, 
                        times_por_grupo: parseInt(e.target.value) || 2 
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit_classificados_por_grupo">Classificados por Grupo</Label>
                  <Input
                    id="edit_classificados_por_grupo"
                    type="number"
                    min="1"
                    max={editedPhase.times_por_grupo}
                    value={editedPhase.classificados_por_grupo}
                    onChange={(e) => setEditedPhase(prev => ({ 
                      ...prev, 
                      classificados_por_grupo: parseInt(e.target.value) || 1 
                    }))}
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="edit_descricao">Descrição</Label>
              <Textarea
                id="edit_descricao"
                value={editedPhase.descricao}
                onChange={(e) => setEditedPhase(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => updatePhase(selectedPhase.id, editedPhase)}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Fases</h2>
          <p className="text-muted-foreground">Controle as fases do seu torneio</p>
        </div>
        
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fase
        </Button>
      </div>
      
      {phases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma Fase Configurada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie fases para organizar seu torneio em etapas distintas
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Fase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div key={phase.id} className="relative">
              {renderPhaseCard(phase)}
              {index < phases.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {renderCreatePhaseDialog()}
      {renderEditPhaseDialog()}
    </div>
  );
}