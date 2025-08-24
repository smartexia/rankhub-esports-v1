import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Trophy, 
  Users, 
  User,
  Target, 
  Crown, 
  Zap,
  TrendingUp,
  Activity,
  Calendar,
  Star,
  Award
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChampionships: 0,
    activeChampionships: 0,
    totalTeams: 0,
    totalPlayers: 0,
    avgKillsPerMatch: 0,
    topTeamWins: 0
  });
  const [recentResults, setRecentResults] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔍 Iniciando carregamento do dashboard...');
      console.log('👤 Usuário atual:', user.email, user.id);
      
      // Verificar se o usuário existe na tabela users
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      
      console.log('📊 Usuário na tabela users:', currentUser);
      if (userError) {
        console.error('❌ Erro ao buscar usuário:', userError);
      }
      
      // Carregar dados básicos com tratamento de erro individual
      const [usersResponse, championshipsResponse, teamsResponse, matchesResponse] = await Promise.allSettled([
        supabase.from('users').select('*'),
        supabase.from('championships').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('matches').select('*')
      ]);
      
      console.log('📈 Respostas das consultas:');
      console.log('Users:', usersResponse);
      console.log('Championships:', championshipsResponse);
      console.log('Teams:', teamsResponse);
      console.log('Matches:', matchesResponse);
      
      // Extrair dados das respostas
      const usuarios = usersResponse.status === 'fulfilled' ? usersResponse.value.data : [];
      const championships = championshipsResponse.status === 'fulfilled' ? championshipsResponse.value.data : [];
      const teams = teamsResponse.status === 'fulfilled' ? teamsResponse.value.data : [];
      const matches = matchesResponse.status === 'fulfilled' ? matchesResponse.value.data : [];
      
      // Atualizar estatisticas
      const activeChampionships = championships?.filter(c => c.status === 'active')?.length || 0;
      
      setStats({
        totalChampionships: championships?.length || 0,
        activeChampionships: activeChampionships,
        totalTeams: teams?.length || 0,
        totalPlayers: usuarios?.length || 0,
        avgKillsPerMatch: matches?.length > 0 ? 
          Math.round(matches.reduce((acc, match) => acc + (match.total_kills || 0), 0) / matches.length) : 0,
        topTeamWins: teams?.length > 0 ? 
          Math.max(...teams.map(team => team.wins || 0)) : 0
      });
      
      console.log('📊 Estatísticas calculadas:', {
        totalPlayers: usuarios?.length || 0,
        activeChampionships: activeChampionships,
        totalChampionships: championships?.length || 0,
        totalTeams: teams?.length || 0
      });
      
      // Atividade recente baseada em dados reais
      const recentActivity = [];
      
      if (championships && championships.length > 0) {
        const recentChampionships = championships
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 2)
          .map((championship, index) => ({
            id: index + 1,
            action: "Novo Campeonato",
            details: `Campeonato: ${championship.nome}`,
            time: new Date(championship.created_at || Date.now()).toLocaleString('pt-BR')
          }));
        recentActivity.push(...recentChampionships);
      }
      
      if (teams && teams.length > 0) {
        const recentTeam = teams
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 1)
          .map((team, index) => ({
            id: recentActivity.length + index + 1,
            action: "Novo Time",
            details: `Time: ${team.nome}`,
            time: new Date(team.created_at || Date.now()).toLocaleString('pt-BR')
          }));
        recentActivity.push(...recentTeam);
      }
      
      if (recentActivity.length === 0) {
        recentActivity.push(
          { id: 1, action: "Sistema iniciado", details: "Dashboard carregado com sucesso", time: "Agora" }
        );
      }
      
      setRecentActivity(recentActivity.slice(0, 3));
      
      // Por enquanto, dados vazios para resultados e top players
      setRecentResults([]);
      setTopPlayers([]);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  return (
    <Layout 
      title="Dashboard" 
      description="Visao geral dos seus campeonatos e estatisticas"
    >
      <div className="space-y-6">
        {/* Estatisticas Chave */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-dark border-primary/20 glow-red">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-rajdhani font-medium">Campeonatos Ativos</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-orbitron font-bold text-primary">
                {loading ? "..." : stats.activeChampionships}
              </div>
              <p className="text-xs text-muted-foreground">de {loading ? "..." : stats.totalChampionships} total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-success/20 glow-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-rajdhani font-medium">Times Cadastrados</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-orbitron font-bold text-success">
                {loading ? "..." : stats.totalTeams}
              </div>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-warning/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-rajdhani font-medium">Usuarios</CardTitle>
              <User className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-orbitron font-bold text-warning">
                {loading ? "..." : stats.totalPlayers}
              </div>
              <p className="text-xs text-muted-foreground">cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-rajdhani font-medium">Media de Kills</CardTitle>
              <Target className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-orbitron font-bold text-accent">
                {loading ? "..." : stats.avgKillsPerMatch}
              </div>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-rajdhani font-medium">Top Team Wins</CardTitle>
              <Crown className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-orbitron font-bold text-purple-400">
                {loading ? "..." : stats.topTeamWins}
              </div>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-rajdhani font-medium">Sistema</CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-orbitron font-bold text-blue-400">Online</div>
              <p className="text-xs text-muted-foreground">funcionando</p>
            </CardContent>
          </Card>
        </div>

        {/* Resultados Recentes e Top Players */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resultados Recentes */}
          <Card className="bg-gradient-dark border-border/50">
            <CardHeader>
              <CardTitle className="font-orbitron flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resultados Recentes
              </CardTitle>
              <CardDescription className="font-rajdhani">
                Ultimas quedas processadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-muted-foreground font-rajdhani">Carregando...</div>
                ) : recentResults.length > 0 ? (
                  recentResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-rajdhani font-medium">{result.winner}</p>
                        <p className="text-sm text-muted-foreground">{result.championship}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-orbitron font-bold text-primary">{result.kills} kills</p>
                        <p className="text-xs text-muted-foreground">{result.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground font-rajdhani">Nenhum resultado disponivel</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Players */}
          <Card className="bg-gradient-dark border-border/50">
            <CardHeader>
              <CardTitle className="font-orbitron flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Top Players
              </CardTitle>
              <CardDescription className="font-rajdhani">
                Melhores jogadores por kills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-muted-foreground font-rajdhani">Carregando...</div>
                ) : topPlayers.length > 0 ? (
                  topPlayers.map((player, index) => (
                    <div key={player.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-orbitron font-bold ${
                        index === 0 ? 'bg-warning/20 text-warning' :
                        index === 1 ? 'bg-muted/20 text-muted' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-rajdhani font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.team}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-orbitron font-bold text-primary">{player.kills}</p>
                        <p className="text-xs text-muted-foreground">{player.wins} wins</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground font-rajdhani">Nenhum jogador disponivel</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atividade Recente */}
        <Card className="bg-gradient-dark border-border/50">
          <CardHeader>
            <CardTitle className="font-orbitron flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Atividade Recente
            </CardTitle>
            <CardDescription className="font-rajdhani">
              Ultimas acoes no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground font-rajdhani">Carregando atividades...</div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 animate-pulse"></div>
                    <div className="flex-1">
                      <p className="font-rajdhani font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;