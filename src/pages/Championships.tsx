import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChampionshipCard } from "@/components/ChampionshipCard";
import { CreateChampionshipDialog } from "@/components/CreateChampionshipDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Search, Filter, Trophy, Calendar, Users } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import Layout from "@/components/Layout";

type Championship = Database["public"]["Tables"]["championships"]["Row"] & {
  teams_count?: number;
};

type ChampionshipStatus = Database["public"]["Enums"]["championship_status"];

export default function Championships() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChampionshipStatus | "all">("all");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    finished: 0
  });

  const loadChampionships = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Verificar se o usuário é super admin
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, tenant_id")
        .eq("auth_user_id", user.id)
        .single();

      if (userError) {
        console.error("Erro ao carregar dados do usuário:", userError);
        toast.error("Erro ao carregar dados do usuário");
        return;
      }

      // Se não é super admin e não tem tenant_id, não pode ver campeonatos
      if (userData.role !== 'super_admin' && !userData.tenant_id) {
        setChampionships([]);
        setStats({ total: 0, active: 0, upcoming: 0, finished: 0 });
        return;
      }
      
      // Buscar campeonatos com contagem de times
      let query = supabase
        .from("championships")
        .select(`
          *,
          teams(count)
        `);

      // Se não é super admin, filtrar por tenant_id
      if (userData.role !== 'super_admin') {
        query = query.eq("tenant_id", userData.tenant_id);
      }

      const { data: championshipsData, error: championshipsError } = await query
        .order("created_at", { ascending: false });

      if (championshipsError) {
        console.error("Erro ao carregar campeonatos:", championshipsError);
        toast.error("Erro ao carregar campeonatos");
        return;
      }

      // Processar dados para incluir contagem de times
      const processedChampionships = championshipsData?.map(championship => ({
        ...championship,
        teams_count: championship.teams?.[0]?.count || 0
      })) || [];

      setChampionships(processedChampionships);

      // Calcular estatísticas
      const total = processedChampionships.length;
      const active = processedChampionships.filter(c => c.status === "ativo").length;
      const upcoming = processedChampionships.filter(c => c.status === "rascunho").length;
      const finished = processedChampionships.filter(c => c.status === "finalizado").length;

      setStats({ total, active, upcoming, finished });

    } catch (error) {
      console.error("Erro ao carregar campeonatos:", error);
      toast.error("Erro ao carregar campeonatos");
    } finally {
      setLoading(false);
    }
  }, [user?.tenant_id]);

  useEffect(() => {
    loadChampionships();
  }, [loadChampionships]);

  const handleChampionshipCreated = () => {
    loadChampionships();
    toast.success("Campeonato criado com sucesso!");
  };

  const handleViewChampionship = (id: string) => {
    navigate(`/championship/${id}`);
  };

  const filteredChampionships = championships.filter(championship => {
    const matchesSearch = championship.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || championship.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ChampionshipStatus) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-success text-success-foreground animate-pulse">ATIVO</Badge>;
      case "rascunho":
        return <Badge className="bg-warning text-warning-foreground">RASCUNHO</Badge>;
      case "finalizado":
        return <Badge className="bg-muted text-muted-foreground">FINALIZADO</Badge>;
      default:
        return <Badge className="bg-secondary">DESCONHECIDO</Badge>;
    }
  };

  const convertToChampionshipCardFormat = (championship: Championship) => ({
    id: championship.id,
    name: championship.nome,
    description: `Campeonato ${championship.status}`,
    status: championship.status === "ativo" ? "active" as const : 
            championship.status === "rascunho" ? "upcoming" as const : "finished" as const,
    teams: championship.teams_count || 0,
    maxTeams: 20, // Valor padrão, pode ser configurável
    startDate: championship.data_inicio || new Date().toISOString(),
    endDate: championship.data_fim || undefined,
    organizer: "Organizador" // Pode ser obtido do tenant
  });

  return (
    <Layout 
      title="Campeonatos" 
      description="Gerencie todos os seus campeonatos de e-sports"
    >
      <div className="space-y-6">
        {/* Create Championship Button */}
        <div className="flex justify-end">
          <CreateChampionshipDialog 
            onChampionshipCreated={handleChampionshipCreated}
            trigger={
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Campeonato
              </Button>
            }
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-dark border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-success">{loading ? "..." : stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Rascunhos</p>
                  <p className="text-2xl font-bold text-warning">{loading ? "..." : stats.upcoming}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-dark border-muted/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Finalizados</p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.finished}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campeonatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ChampionshipStatus | "all")}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
              <SelectItem value="finalizado">Finalizados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Championships Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-gradient-dark border-primary/20 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredChampionships.length === 0 ? (
          <Card className="bg-gradient-dark border-primary/20">
            <CardContent className="p-12 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum campeonato encontrado</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca"
                  : "Crie seu primeiro campeonato para começar"
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <CreateChampionshipDialog 
                  onChampionshipCreated={handleChampionshipCreated}
                  trigger={
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Campeonato
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChampionships.map((championship) => (
              <ChampionshipCard
                key={championship.id}
                championship={convertToChampionshipCardFormat(championship)}
                onView={handleViewChampionship}
                isManager={user?.role === "manager" || user?.role === "super_admin"}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}