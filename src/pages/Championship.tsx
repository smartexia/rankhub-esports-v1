import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import Layout from "../components/Layout";
import ChampionshipStatusManager from '../components/ChampionshipStatusManager';
import TeamManagement from '../components/TeamManagement';
import ChampionshipMatchManager from '../components/ChampionshipMatchManager';
import RankingSystem from '../components/RankingSystem';
import MatchResultsManager from '../components/MatchResultsManager';
import { EditChampionshipDialog } from '../components/EditChampionshipDialog';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useSupabaseRealtime } from "../hooks/useSupabaseRealtime";
import { useToast } from "../hooks/use-toast";
import { deleteMatch, createMatch } from "../services/api";
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  Clock,
  DollarSign,
  User,
  Info,
  Target,
  Crown,
  Medal,
  Award,
  Upload,
  Camera,
  AlertTriangle,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
  PlayCircle,
  Trash2,
  Plus
} from "lucide-react";
import { RankingTable } from '@/components/RankingTable';

interface Championship {
  id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  horario_inicio?: string;
  tipo_campeonato?: string;
  premiacao?: string;
  organizador?: string;
  status: string;
  tenant_id: string;
}

interface Team {
  id: string;
  nome: string;
  tenant_id: string;
}

interface Match {
  id: string;
  championship_id: string;
  team1_id?: string;
  team2_id?: string;
  status: string;
  data_hora_queda?: string;
  ordem_queda?: number;
}

interface TeamStats {
  team_id: string;
  team_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  total_points: number;
}

interface MatchResult {
  id: string;
  match_id: string;
  team_id: string;
  placement: number;
  kills: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
  confidence_score: number;
  processed_at: string;
  teams?: { name: string };
}

export default function Championship() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("matches");
  const [matchFilter, setMatchFilter] = useState<'all' | 'aguardando_prints' | 'em_analise' | 'finalizadas'>('all');
  const [selectedMatchForResults, setSelectedMatchForResults] = useState<string | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [newMatchData, setNewMatchData] = useState({
    scheduledTime: '',
    status: 'pendente' as 'pendente' | 'em_andamento' | 'finalizada'
  });
  const { toast } = useToast();

  // Calcular partidas aguardando prints
  const matchesAwaitingPrints = matches.filter(match => 
    match.status === 'finalizada' && !match.resultado_processado
  );
  const matchesInAnalysis = matches.filter(match => 
    match.status === 'em_analise'
  );
  const completedMatchesWithResults = matches.filter(match => 
    match.status === 'finalizada' && match.resultado_processado
  );

  const handleStatusChange = (newStatus: 'rascunho' | 'ativo' | 'finalizado') => {
    setChampionship((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  const handleChampionshipUpdated = (updatedChampionship: Championship) => {
    setChampionship(updatedChampionship);
    toast({
      title: "Campeonato Atualizado",
      description: "As informações do campeonato foram atualizadas com sucesso.",
    });
  };

  useEffect(() => {
    if (id) {
      fetchChampionshipData();
    }
  }, [id]);

  const handleChampionshipUpdate = useCallback(() => {
    toast({
      title: "Campeonato Atualizado",
      description: "Os dados do campeonato foram atualizados em tempo real.",
    });
    fetchChampionshipData();
  }, [id, toast]);

  useSupabaseRealtime({
    channel: `championship-details-${id}`,
    table: 'championships',
    filter: `id=eq.${id}`,
    onUpdate: handleChampionshipUpdate,
  });

  const fetchChampionshipData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const {
        data: championshipData,
        error: championshipError
      } = await supabase
        .from("championships")
        .select("*",)
        .eq("id", id)
        .single();

      if (championshipError || !championshipData) {
        console.error("Erro ao buscar campeonato:", championshipError);
        setChampionship(null);
        setLoading(false);
        return;
      }

      setChampionship(championshipData);

      const [teamsResponse, matchesResponse] = await Promise.allSettled([
        supabase.from("teams").select("*").eq("championship_id", id),
        supabase.from("matches").select("*").eq("championship_id", id).order("ordem_queda", { ascending: true })
      ]);

      const teamsData = teamsResponse.status === 'fulfilled' ? teamsResponse.value.data : [];
      const matchesData = matchesResponse.status === 'fulfilled' ? matchesResponse.value.data : [];

      setTeams(teamsData || []);
      setMatches(matchesData || []);

      // Buscar resultados das partidas se existirem partidas
      if (matchesData && matchesData.length > 0) {
        const matchIds = matchesData.map(m => m.id);
        const { data: resultsData } = await supabase
          .from("match_results")
          .select("*, teams(name)")
          .in("match_id", matchIds);
        
        setResults(resultsData || []);
      } else {
        setResults([]);
      }

      if (teamsData && matchesData) {
        const stats = calculateTeamStats(teamsData, matchesData);
        setTeamStats(stats);
      }

    } catch (error) {
      console.error("Erro inesperado ao carregar dados do campeonato:", error);
      setChampionship(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateTeamStats = (teams: Team[], matches: Match[]): TeamStats[] => {
    const stats: { [key: string]: TeamStats } = {};

    // Initialize stats for all teams
    teams.forEach(team => {
      stats[team.id] = {
        team_id: team.id,
        team_name: team.nome,
        matches_played: 0,
        wins: 0,
        losses: 0,
        total_points: 0
      };
    });

    // Calculate stats from matches
    matches.forEach(match => {
      if (match.status === 'finalizada' && match.team1_id && match.team2_id) {
        if (stats[match.team1_id]) {
          stats[match.team1_id].matches_played++;
        }
        if (stats[match.team2_id]) {
          stats[match.team2_id].matches_played++;
        }
        // Note: Win/loss logic would need match results data
      }
    });

    // Convert to array and sort by points
    return Object.values(stats).sort((a, b) => b.total_points - a.total_points);
  };

  const handleDeleteMatch = async () => {
    if (!matchToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteMatch(matchToDelete);
      
      if (error) {
        console.error('Erro ao deletar partida:', error);
        toast({
          title: "Erro",
          description: "Erro ao deletar a partida. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Partida deletada com sucesso!",
      });
      
      // Recarregar dados
      await fetchChampionshipData();
      
    } catch (error) {
      console.error('Erro inesperado ao deletar partida:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao deletar a partida.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setMatchToDelete(null);
    }
  };

  const handleCreateMatch = async () => {
    if (!championship?.id) return;

    setIsCreatingMatch(true);
    try {
      // Calcular próximo número da partida
      const nextMatchNumber = Math.max(...matches.map(m => m.ordem_queda || 0), 0) + 1;
      
      const { data, error } = await createMatch({
        championship_id: championship.id,
        match_number: nextMatchNumber,
        scheduled_time: newMatchData.scheduledTime || undefined,
        status: newMatchData.status
      });
      
      if (error) {
        toast({
          title: "Erro ao criar partida",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Partida criada com sucesso!",
        description: `Partida #${nextMatchNumber} foi criada e está pronta para o Battle Royale.`,
      });
      
      // Recarregar dados e fechar modal
      fetchChampionshipData();
      setShowCreateMatchModal(false);
      resetCreateMatchForm();
    } catch (error) {
      console.error('Erro ao criar partida:', error);
      toast({
        title: "Erro ao criar partida",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const resetCreateMatchForm = () => {
    setNewMatchData({
      scheduledTime: '',
      status: 'pendente'
    });
  };

  const handleCloseCreateModal = () => {
    setShowCreateMatchModal(false);
    resetCreateMatchForm();
  };

  const getMatchStatusBadge = (status: string) => {
    const statusConfig = {
      'agendada': { label: 'Agendada', variant: 'secondary' as const },
      'em_andamento': { label: 'Em Andamento', variant: 'default' as const },
      'finalizada': { label: 'Finalizada', variant: 'outline' as const },
      'cancelada': { label: 'Cancelada', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Layout title="Carregando..." description="Carregando dados do campeonato">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados do campeonato...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!championship) {
    return (
      <Layout title="Campeonato não encontrado" description="O campeonato solicitado não foi encontrado">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Campeonato não encontrado</h2>
            <p className="text-muted-foreground mb-4">O campeonato que você está procurando não existe ou foi removido.</p>
            <Button onClick={() => navigate("/championships")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Campeonatos
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const completedMatches = matches.filter(m => m.status === 'finalizada').length;
  const totalMatches = matches.length;
  const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <Layout title={championship.nome} description="Detalhes e estatísticas do campeonato">
      {/* Header */}
      <div className="bg-gradient-dark border-b border-border/50 -m-6 mb-6 p-6">
        <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/championships")} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-orbitron font-bold text-glow">{championship.nome}</h1>
              <p className="text-sm text-gray-500 mt-1">De {championship.data_inicio ? new Date(championship.data_inicio).toLocaleDateString() : 'N/A'} a {championship.data_fim ? new Date(championship.data_fim).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EditChampionshipDialog 
              championship={championship} 
              onChampionshipUpdated={handleChampionshipUpdated}
            />
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
            <div className="bg-primary/20 rounded-full p-2">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Times</p>
              <p className="text-2xl font-bold">{teams.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50 hover:border-red-500/50 transition-colors">
            <div className="bg-red-500/20 rounded-full p-2">
              <Camera className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aguardando Prints</p>
              <p className="text-2xl font-bold text-red-500">{matchesAwaitingPrints.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50 hover:border-yellow-500/50 transition-colors">
            <div className="bg-yellow-500/20 rounded-full p-2">
              <Eye className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em Análise</p>
              <p className="text-2xl font-bold text-yellow-500">{matchesInAnalysis.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50 hover:border-green-500/50 transition-colors">
            <div className="bg-green-500/20 rounded-full p-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Finalizadas</p>
              <p className="text-2xl font-bold text-green-500">{completedMatchesWithResults.length}</p>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" 
                onClick={() => { setActiveTab('matches'); setMatchFilter('aguardando_prints'); }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 rounded-full p-2">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary">Enviar Prints</p>
                  <p className="text-sm text-muted-foreground">Processar resultados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer" 
                onClick={() => setActiveTab('ranking')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 rounded-full p-2">
                  <Trophy className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-blue-500">Ver Ranking</p>
                  <p className="text-sm text-muted-foreground">Classificação atual</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer" 
                onClick={() => setActiveTab('teams')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 rounded-full p-2">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-green-500">Gerenciar Times</p>
                  <p className="text-sm text-muted-foreground">{teams.length} times</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Banner de Alerta para Partidas Aguardando Prints */}
      {matchesAwaitingPrints.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 border border-red-500 rounded-lg p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Partida em andamento! Você tem {matchesAwaitingPrints.length} partidas aguardando prints
                </h3>
                <p className="text-red-100 text-sm">
                  Envie os prints dos resultados rapidamente para gerar os rankings automaticamente
                </p>
              </div>
            </div>
            <Button 
              onClick={() => {
                setActiveTab('matches');
                setMatchFilter('aguardando_prints');
              }}
              className="bg-white text-red-600 hover:bg-red-50 font-bold px-6 py-2 shadow-lg"
            >
              <Camera className="h-4 w-4 mr-2" />
              Enviar Prints Agora
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {championship && (
          <ChampionshipStatusManager
            championshipId={championship.id}
            currentStatus={championship.status as 'rascunho' | 'ativo' | 'finalizado'}
            onStatusChange={handleStatusChange}
          />
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Times</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="matches" className="relative">
              Matches
              {matchesAwaitingPrints.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {matchesAwaitingPrints.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-dark border-primary/20">
                <CardHeader>
                  <CardTitle className="font-orbitron">Informações do Campeonato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="font-medium">{championship.descricao || 'Nenhuma descrição disponível'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Máximo de {championship.tipo_campeonato === 'individual' ? 'Participantes' : 'Times'}</p>
                      <p className="font-medium">
                        {(() => {
                          const tipo = championship.tipo_campeonato;
                          if (tipo === 'individual') return '100 participantes';
                          if (tipo === 'duplas') return '50 duplas';
                          if (tipo === 'trios') return '33 trios';
                          if (tipo === 'squad') return '25 squads';
                          return 'Não definido';
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Início</p>
                      <p className="font-medium">
                        {championship.data_inicio ? new Date(championship.data_inicio).toLocaleDateString('pt-BR') : 'Não definido'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-dark border-primary/20">
                <CardHeader>
                  <CardTitle className="font-orbitron">Top 3 Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  {teamStats.length > 0 ? (
                    <div className="space-y-4">
                      {teamStats.slice(0, 3).map((team, index) => {
                        const icons = [Crown, Medal, Award];
                        const colors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];
                        const Icon = icons[index];
                        
                        return (
                          <div key={team.team_id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50">
                            <Icon className={`h-6 w-6 ${colors[index]}`} />
                            <div className="flex-1">
                              <p className="font-semibold">{team.team_name}</p>
                              <p className="text-sm text-muted-foreground">{team.total_points} pts</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{team.wins}W {team.losses}L</p>
                              <p className="text-xs text-muted-foreground">{team.matches_played} jogos</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum time encontrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <TeamManagement championshipId={championship.id} />
          </TabsContent>

          <TabsContent value="partidas" className="space-y-6">
            <ChampionshipMatchManager championshipId={championship.id} />
          </TabsContent>

          <TabsContent value="ranking" className="space-y-6">
            <RankingSystem championshipId={championship.id} />
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            {/* Botão de Criar Nova Partida */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Partidas Battle Royale</h2>
              <Button 
                onClick={() => setShowCreateMatchModal(true)}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                + Nova Partida Battle Royale
              </Button>
            </div>
            
            {/* Filtros de Status */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMatchFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  matchFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Todas ({matches.length})
              </button>
              <button
                onClick={() => setMatchFilter('aguardando_prints')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  matchFilter === 'aguardando_prints'
                    ? 'bg-red-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Aguardando Prints ({matchesAwaitingPrints.length})
              </button>
              <button
                onClick={() => setMatchFilter('em_analise')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  matchFilter === 'em_analise'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Em Análise ({matchesInAnalysis.length})
              </button>
              <button
                onClick={() => setMatchFilter('finalizadas')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  matchFilter === 'finalizadas'
                    ? 'bg-green-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Finalizadas ({completedMatchesWithResults.length})
              </button>
            </div>

            {/* Cards de Partidas Redesenhados */}
            <div className="grid gap-4">
              {matches
                .filter(match => {
                  if (matchFilter === 'all') return true;
                  if (matchFilter === 'aguardando_prints') return match.status === 'finalizada' && !match.resultado_processado;
                  if (matchFilter === 'em_analise') return match.status === 'em_analise';
                  if (matchFilter === 'finalizadas') return match.status === 'finalizada' && match.resultado_processado;
                  return true;
                })
                .map((match) => {
                  const isAwaitingPrint = match.status === 'finalizada' && !match.resultado_processado;
                  const isInAnalysis = match.status === 'em_analise';
                  const isCompleted = match.status === 'finalizada' && match.resultado_processado;
                  
                  return (
                    <Card key={match.id} className={`p-6 transition-all hover:shadow-lg ${
                      isAwaitingPrint ? 'border-red-500 border-2 bg-red-50/50 dark:bg-red-950/20' : 
                      isInAnalysis ? 'border-yellow-500 border-2 bg-yellow-50/50 dark:bg-yellow-950/20' :
                      isCompleted ? 'border-green-500 border-2 bg-green-50/50 dark:bg-green-950/20' :
                      'border-border'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Partida #{match.ordem_queda}</span>
                          {isAwaitingPrint && (
                            <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Aguardando Prints
                            </Badge>
                          )}
                          {isInAnalysis && (
                            <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">
                              <Eye className="w-3 h-3 mr-1" />
                              Em Análise
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Finalizada
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {match.data_hora_queda && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(match.data_hora_queda).toLocaleString('pt-BR')}
                            </p>
                          )}
                          <button
                            onClick={() => setMatchToDelete(match.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                            title="Deletar partida"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-6 w-full">
                          <div className="flex-1 text-center">
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-4">
                              <p className="font-bold text-xl">🏆 BATTLE ROYALE</p>
                              <p className="text-sm opacity-90">25 Times Competindo</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Resultados Processados</p>
                              <p className="font-bold text-lg">
                                {/* Contar quantos times já têm resultados para esta partida */}
                                {(() => {
                                  const matchResults = results.filter(r => r.match_id === match.id);
                                  const uniqueTeams = new Set(matchResults.map(r => r.team_id));
                                  return `${uniqueTeams.size}/25`;
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        {isAwaitingPrint && (
                          <button 
                            onClick={() => setSelectedMatchForResults(match.id)}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <Camera className="w-5 h-5" />
                            📸 Enviar Print do Resultado
                          </button>
                        )}
                        {isInAnalysis && (
                          <button 
                            onClick={() => setSelectedMatchForResults(match.id)}
                            className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Eye className="w-5 h-5" />
                            👁️ Acompanhar Análise
                          </button>
                        )}
                        {isCompleted && (
                          <button 
                            onClick={() => setSelectedMatchForResults(match.id)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            ✅ Ver Resultado Completo
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedMatchForResults(match.id)}
                          className="bg-muted hover:bg-muted/80 text-foreground font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                          Gerenciar Resultados
                        </button>
                      </div>
                    </Card>
                  );
                })}
            </div>
            
            {/* Modal para Gerenciar Resultados da Partida */}
            <Dialog open={!!selectedMatchForResults} onOpenChange={() => setSelectedMatchForResults(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Gerenciar Resultados - Partida #{matches.find(m => m.id === selectedMatchForResults)?.ordem_queda}
                  </DialogTitle>
                </DialogHeader>
                {selectedMatchForResults && (
                  <MatchResultsManager 
                    matchId={selectedMatchForResults}
                    teams={teams.map(team => ({ id: team.id, name: team.nome }))}
                    onResultsChange={() => {
                      // Recarregar dados quando resultados mudarem
                      fetchChampionshipData();
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
            
            {/* Dialog de Confirmação para Deletar Partida */}
            <Dialog open={!!matchToDelete} onOpenChange={() => setMatchToDelete(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tem certeza que deseja deletar a partida #{matches.find(m => m.id === matchToDelete)?.ordem_queda}?
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    Esta ação não pode ser desfeita e todos os resultados associados serão perdidos.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setMatchToDelete(null)}
                      disabled={isDeleting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteMatch}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deletando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Modal de Criação de Nova Partida */}
            <Dialog open={showCreateMatchModal} onOpenChange={handleCloseCreateModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Nova Partida Battle Royale
                  </DialogTitle>
                  <DialogDescription>
                    Crie uma nova partida para 25 times competirem no modo Battle Royale.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="match-number">Número da Partida</Label>
                    <Input 
                      id="match-number"
                      value={`#${Math.max(...matches.map(m => m.ordem_queda || 0), 0) + 1}`}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Número gerado automaticamente
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-time">Data e Hora (Opcional)</Label>
                    <Input 
                      id="scheduled-time"
                      type="datetime-local"
                      value={newMatchData.scheduledTime}
                      onChange={(e) => setNewMatchData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para usar a data/hora atual
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status Inicial</Label>
                    <select 
                      id="status"
                      value={newMatchData.status}
                      onChange={(e) => setNewMatchData(prev => ({ ...prev, status: e.target.value as 'pendente' | 'em_andamento' | 'finalizada' }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="finalizada">Finalizada</option>
                    </select>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Battle Royale - 25 Times
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Esta partida será configurada automaticamente para o modo Battle Royale com 25 times competindo.
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleCloseCreateModal}
                      disabled={isCreatingMatch}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateMatch}
                      disabled={isCreatingMatch}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      {isCreatingMatch ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Criando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Partida
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}