import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  Upload
} from "lucide-react";

interface Championship {
  id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  max_participantes?: number;
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

export default function Championship() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      fetchChampionshipData();
    }
  }, [id]);

  const fetchChampionshipData = async () => {
    try {
      setLoading(true);

      // Fetch championship details
      const { data: championshipData, error: championshipError } = await supabase
        .from("championships")
        .select("*")
        .eq("id", id)
        .single();

      if (championshipError) {
        console.error("Error fetching championship:", championshipError);
        return;
      }

      setChampionship(championshipData);

      // Fetch teams for this championship
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("championship_id", id);

      if (teamsError) {
        console.error("Error fetching teams:", teamsError);
      } else {
        setTeams(teamsData || []);
      }

      // Fetch matches for this championship
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .eq("championship_id", id)
        .order("ordem_queda", { ascending: true });

      if (matchesError) {
        console.error("Error fetching matches:", matchesError);
      } else {
        setMatches(matchesData || []);
      }

      // Calculate team statistics
      if (teamsData && matchesData) {
        const stats = calculateTeamStats(teamsData, matchesData);
        setTeamStats(stats);
      }
    } catch (error) {
      console.error("Error in fetchChampionshipData:", error);
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
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => navigate("/championships")} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-orbitron font-bold text-glow">{championship.nome}</h1>
            <p className="text-muted-foreground">Campeonato de e-sports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Times</p>
              <p className="text-2xl font-bold">{teams.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50">
            <Users className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-muted-foreground">Partidas</p>
              <p className="text-2xl font-bold">{matches.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50">
            <Clock className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Progresso</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50">
            <DollarSign className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-sm text-muted-foreground">Prize Pool</p>
              <p className="text-xl font-bold">{championship.premiacao || 'Não definido'}</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-card rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Organizador</span>
            </div>
            <p className="font-medium">{championship.organizador || 'Não informado'}</p>
          </div>

          <div className="p-4 bg-card rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duração</span>
            </div>
            <p className="font-medium">
              {championship.data_inicio ? new Date(championship.data_inicio).toLocaleDateString('pt-BR') : 'Não definido'}
              {championship.data_fim && ` - ${new Date(championship.data_fim).toLocaleDateString('pt-BR')}`}
            </p>
          </div>

          <div className="p-4 bg-card rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Partidas em Andamento</span>
            </div>
            <p className="font-medium">{matches.filter(m => m.status === 'em_andamento').length} ativas</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
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
                      <p className="text-sm text-muted-foreground">Máximo de Participantes</p>
                      <p className="font-medium">{championship.max_participantes || 'Ilimitado'}</p>
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

          <TabsContent value="ranking" className="space-y-6">
            <Card className="bg-gradient-dark border-primary/20">
              <CardHeader>
                <CardTitle className="font-orbitron">Ranking dos Times</CardTitle>
              </CardHeader>
              <CardContent>
                {teamStats.length > 0 ? (
                  <div className="space-y-3">
                    {teamStats.map((team, index) => (
                      <div key={team.team_id} className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border/50">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{team.team_name}</h3>
                          <p className="text-sm text-muted-foreground">{team.matches_played} partidas jogadas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{team.total_points} pts</p>
                          <p className="text-sm text-muted-foreground">{team.wins}W - {team.losses}L</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum time encontrado</h3>
                    <p className="text-muted-foreground">Os times aparecerão aqui quando forem adicionados ao campeonato</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-orbitron font-bold">Partidas</h2>
              <Button variant="default">
                <Upload className="h-4 w-4" />
                Upload Results
              </Button>
            </div>

            <div className="space-y-4">
              {matches.length > 0 ? (
                matches.map((match) => (
                  <Card key={match.id} className="bg-gradient-dark border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold">Partida #{match.ordem_queda}</h4>
                          <p className="text-muted-foreground">Campeonato: {championship.nome}</p>
                          {match.data_hora_queda && (
                            <p className="text-sm text-muted-foreground">
                              Data: {new Date(match.data_hora_queda).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {getMatchStatusBadge(match.status)}
                          {match.status === "finalizada" && (
                            <Button variant="ghost" size="sm" className="ml-2">
                              Ver Resultados
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gradient-dark border-primary/20">
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma partida encontrada</h3>
                    <p className="text-muted-foreground">As partidas aparecerão aqui quando forem criadas</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}