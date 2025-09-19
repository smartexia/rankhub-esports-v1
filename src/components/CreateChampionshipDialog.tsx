import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trophy, Zap, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TournamentWizard, TournamentConfig } from "@/components/TournamentWizard";

interface CreateChampionshipDialogProps {
  onChampionshipCreated?: (championship: any) => void;
  trigger?: React.ReactNode;
}

export function CreateChampionshipDialog({ onChampionshipCreated, trigger }: CreateChampionshipDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTournamentWizard, setShowTournamentWizard] = useState(false);
  const [tournamentConfig, setTournamentConfig] = useState<TournamentConfig | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxTeams: "100", // Será calculado automaticamente baseado no tipo
    startDate: "",
    startTime: "19:00",
    gameMode: "battle_royale",
    championshipType: "individual",
    prize: "",
    rules: ""
  });

  // Função para calcular o máximo de times baseado no tipo de campeonato
  const calculateMaxTeams = (type: string) => {
    switch (type) {
      case "individual":
        return "100"; // 100 participantes individuais
      case "duplas":
        return "50";  // 50 duplas (100 participantes)
      case "trios":
        return "33";  // 33 trios (99 participantes)
      case "squad":
        return "25";  // 25 squads (100 participantes)
      default:
        return "100";
    }
  };

  // Atualizar maxTeams automaticamente quando championshipType mudar
  const handleChampionshipTypeChange = (value: string) => {
    const newMaxTeams = calculateMaxTeams(value);
    setFormData({ 
      ...formData, 
      championshipType: value,
      maxTeams: newMaxTeams
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Buscar dados do usuário para obter tenant_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("tenant_id, role, email, nome_usuario")
        .eq("auth_user_id", user.id)
        .single();

      if (userError) {
        throw new Error("Erro ao buscar dados do usuário: " + userError.message);
      }

      if (!userData) {
        throw new Error("Usuário não encontrado na base de dados");
      }

      let tenantId = userData.tenant_id;

      // Verificar se o tenant_id é válido
      if (!tenantId) {
        if (userData.role === 'super_admin') {
          // Para super admin, usar o primeiro tenant disponível ou criar um
          const { data: existingTenants, error: tenantsError } = await supabase
            .from("tenants")
            .select("id")
            .limit(1)
            .single();

          if (existingTenants && !tenantsError) {
            tenantId = existingTenants.id;
          } else {
            const { data: newTenant, error: tenantError } = await supabase
              .from("tenants")
              .insert({
                nome: "Organização Principal",
                descricao: "Organização criada automaticamente para super admin",
                status: "ativo"
              })
              .select()
              .single();

            if (tenantError) {
              throw new Error("Erro ao criar organização: " + tenantError.message);
            }
            tenantId = newTenant.id;
          }
        } else {
          // Criar tenant automaticamente para usuário regular
          const { data: newTenant, error: tenantError } = await supabase
            .from("tenants")
            .insert({
              nome: `Organização de ${userData.nome_usuario || userData.email}`,
              descricao: "Organização criada automaticamente",
              status: "ativo"
            })
            .select()
            .single();

          if (tenantError) {
            throw new Error("Erro ao criar organização: " + tenantError.message);
          }

          // Atualizar o usuário com o novo tenant_id
          const { error: updateUserError } = await supabase
            .from("users")
            .update({ tenant_id: newTenant.id })
            .eq("auth_user_id", user.id);

          if (updateUserError) {
            throw new Error("Erro ao associar usuário à organização: " + updateUserError.message);
          }

          tenantId = newTenant.id;
        }
      }

      // Validação final do tenant_id
      if (!tenantId) {
        throw new Error("Não foi possível determinar a organização do usuário");
      }

      // Validar dados do formulário
      if (!formData.name || !formData.startDate) {
        throw new Error("Nome e data de início são obrigatórios");
      }

      // Criar campeonato no banco de dados
      const championshipData = {
        nome: formData.name,
        descricao: formData.description || null,
        data_inicio: formData.startDate,
        horario_inicio: formData.startTime || null,
        tipo_campeonato: formData.championshipType,
        premiacao: formData.prize || null,
        status: "rascunho" as const,
        tenant_id: tenantId,
        // Novos campos para suporte a torneios avançados
        formato_torneio: tournamentConfig?.formato_torneio || 'simples',
        numero_fases: tournamentConfig?.numero_fases || 1,
        numero_grupos: tournamentConfig?.numero_grupos || 1,
        times_por_grupo: tournamentConfig?.times_por_grupo || parseInt(formData.maxTeams),
        configuracao_fases: tournamentConfig?.fases ? JSON.stringify(tournamentConfig.fases) : null,
        configuracao_avancada: tournamentConfig?.configuracao_avancada ? JSON.stringify(tournamentConfig.configuracao_avancada) : null
      };

      const { data: championship, error: championshipError } = await supabase
        .from("championships")
        .insert(championshipData)
        .select()
        .single();

      if (championshipError) {
        throw new Error("Erro ao criar campeonato: " + championshipError.message);
      }

      onChampionshipCreated?.(championship);
      
      toast({
        title: "Campeonato Criado! 🏆",
        description: "Seu campeonato foi criado com sucesso.",
      });

      setOpen(false);
      setFormData({
        name: "",
        description: "",
        maxTeams: "20",
        startDate: "",
        startTime: "19:00",
        gameMode: "battle_royale",
        championshipType: "individual",
        prize: "",
        rules: ""
      });
      setTournamentConfig(null);
    } catch (error) {
      console.error("Erro ao criar campeonato:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao criar campeonato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTournamentConfig = (config: TournamentConfig) => {
    setTournamentConfig(config);
    // Atualizar maxTeams baseado na configuração do torneio
    const totalTeams = config.numero_grupos * config.times_por_grupo;
    setFormData(prev => ({ ...prev, maxTeams: totalTeams.toString() }));
    
    toast({
      title: "Configuração Salva! ⚙️",
      description: `Torneio configurado: ${config.formato_torneio} com ${config.numero_fases} fase(s)`,
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="lg" className="font-orbitron">
            <Plus className="h-5 w-5" />
            Create Championship
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-gradient-dark border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Create New Championship
          </DialogTitle>
          <DialogDescription>
            Set up your COD Mobile Battle Royale tournament. Configure the basic settings to get started.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-rajdhani font-medium">
                Championship Name
              </Label>
              <Input
                id="name"
                placeholder="Enter championship name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-secondary/50 border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-rajdhani font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your championship..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-secondary/50 border-border/50 focus:border-primary resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="championshipType" className="font-rajdhani font-medium">
                Tipo de Campeonato
              </Label>
              <Select value={formData.championshipType} onValueChange={handleChampionshipTypeChange}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual (100 participantes)</SelectItem>
                  <SelectItem value="duplas">Duplas (50 times - 100 participantes)</SelectItem>
                  <SelectItem value="trios">Trios (33 times - 99 participantes)</SelectItem>
                  <SelectItem value="squad">Squad (25 times - 100 participantes)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTeams" className="font-rajdhani font-medium">
                  Máximo de Times/Participantes
                </Label>
                <Input
                  id="maxTeams"
                  value={`${formData.maxTeams} ${formData.championshipType === 'individual' ? 'participantes' : 'times'}`}
                  readOnly
                  className="bg-secondary/30 border-border/50 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameMode" className="font-rajdhani font-medium">
                  Game Mode
                </Label>
                <Select value={formData.gameMode} onValueChange={(value) => setFormData({ ...formData, gameMode: value })}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="battle_royale">Battle Royale</SelectItem>
                    <SelectItem value="multiplayer">Multiplayer (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Configuração Avançada de Torneio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-rajdhani font-medium">
                  Configuração de Torneio
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTournamentWizard(true)}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configurar Formato
                </Button>
              </div>
              {tournamentConfig && (
                <div className="p-3 bg-secondary/30 rounded-md border border-border/50">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Formato:</span>
                      <span className="font-medium capitalize">{tournamentConfig.formato_torneio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fases:</span>
                      <span className="font-medium">{tournamentConfig.numero_fases}</span>
                    </div>
                    {tournamentConfig.numero_grupos > 1 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grupos:</span>
                        <span className="font-medium">{tournamentConfig.numero_grupos} grupos de {tournamentConfig.times_por_grupo} times</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize" className="font-rajdhani font-medium">
                Premiação (Opcional)
              </Label>
              <Input
                id="prize"
                placeholder="Ex: R$ 5.000,00 em prêmios"
                value={formData.prize}
                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                className="bg-secondary/50 border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules" className="font-rajdhani font-medium">
                Regras Especiais (Opcional)
              </Label>
              <Textarea
                id="rules"
                placeholder="Descreva regras específicas do campeonato..."
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                className="bg-secondary/50 border-border/50 focus:border-primary resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="font-rajdhani font-medium">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="font-rajdhani font-medium">
                  Horário de Início
                </Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(value) => setFormData({ ...formData, startTime: value })}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      const timeValue = `${hour}:00`;
                      const displayValue = `${i}h`;
                      return (
                        <SelectItem key={timeValue} value={timeValue}>
                          {displayValue}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Zap className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  Create Championship
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    <TournamentWizard
      open={showTournamentWizard}
      onOpenChange={setShowTournamentWizard}
      onConfigComplete={handleTournamentConfig}
      maxTeams={parseInt(formData.maxTeams)}
    />
    </>
  );
}