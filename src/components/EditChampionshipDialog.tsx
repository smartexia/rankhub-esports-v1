import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trophy, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Championship {
  id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  horario_inicio?: string;
  tipo_campeonato?: string;
  premiacao?: string;
  status: string;
  tenant_id: string;
}

interface EditChampionshipDialogProps {
  championship: Championship;
  onChampionshipUpdated?: (championship: Championship) => void;
  trigger?: React.ReactNode;
}

export function EditChampionshipDialog({ championship, onChampionshipUpdated, trigger }: EditChampionshipDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    championshipType: "individual",
    maxTeams: "100", // Será calculado automaticamente baseado no tipo
    startDate: "",
    startTime: "19:00",
    prize: ""
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

  // Preencher formulário com dados do campeonato quando o diálogo abrir
  useEffect(() => {
    if (open && championship) {
      const championshipType = championship.tipo_campeonato || "individual";
      const maxTeams = calculateMaxTeams(championshipType);
      
      setFormData({
        name: championship.nome || "",
        description: championship.descricao || "",
        championshipType: championshipType,
        maxTeams: maxTeams,
        startDate: championship.data_inicio ? championship.data_inicio.split('T')[0] : "",
        startTime: championship.horario_inicio || "19:00",
        prize: championship.premiacao || ""
      });
    }
  }, [open, championship]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Buscar dados do usuário para verificar permissões
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("tenant_id, role")
        .eq("auth_user_id", user.id)
        .single();

      if (userError) {
        throw new Error("Erro ao buscar dados do usuário: " + userError.message);
      }

      // Verificar se o usuário tem permissão para editar este campeonato
      if (userData.role !== 'super_admin' && userData.tenant_id !== championship.tenant_id) {
        throw new Error("Você não tem permissão para editar este campeonato");
      }

      // Validar dados do formulário
      if (!formData.name || !formData.startDate) {
        throw new Error("Nome e data de início são obrigatórios");
      }

      // Atualizar campeonato no banco de dados
      const championshipData = {
        nome: formData.name,
        descricao: formData.description || null,
        data_inicio: formData.startDate,
        horario_inicio: formData.startTime || null,
        tipo_campeonato: formData.championshipType,
        premiacao: formData.prize || null,
        updated_at: new Date().toISOString()
      };

      const { data: updatedChampionship, error: championshipError } = await supabase
        .from("championships")
        .update(championshipData)
        .eq("id", championship.id)
        .select()
        .single();

      if (championshipError) {
        throw new Error("Erro ao atualizar campeonato: " + championshipError.message);
      }

      onChampionshipUpdated?.(updatedChampionship);
      
      toast({
        title: "Campeonato Atualizado! 🏆",
        description: "As informações do campeonato foram atualizadas com sucesso.",
      });

      setOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar campeonato:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar campeonato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="font-orbitron">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-gradient-dark border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl flex items-center gap-2">
            <Edit className="h-6 w-6 text-primary" />
            Editar Campeonato
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do campeonato. Certifique-se de que todas as informações estão corretas.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-rajdhani font-medium">
                Nome do Campeonato
              </Label>
              <Input
                id="name"
                placeholder="Digite o nome do campeonato..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-secondary/50 border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-rajdhani font-medium">
                Descrição
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva seu campeonato..."
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="font-rajdhani font-medium">
                  Data de Início
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
              Cancelar
            </Button>
            <Button type="submit" variant="default" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Zap className="h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  Atualizar Campeonato
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}