import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trophy, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreateChampionshipDialogProps {
  onChampionshipCreated?: (championship: any) => void;
  trigger?: React.ReactNode;
}

export function CreateChampionshipDialog({ onChampionshipCreated, trigger }: CreateChampionshipDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxTeams: "20",
    startDate: "",
    endDate: "",
    gameMode: "battle_royale"
  });

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
        throw new Error("Erro ao buscar dados do usuário");
      }

      let tenantId = userData.tenant_id;

      // Se o usuário não tem tenant_id e não é super admin, criar um tenant automaticamente
      if (!tenantId && userData.role !== 'super_admin') {
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

      // Criar campeonato no banco de dados
       const { data: championship, error: championshipError } = await supabase
         .from("championships")
         .insert({
           nome: formData.name,
           data_inicio: formData.startDate,
           data_fim: formData.endDate || null,
           status: "rascunho",
           tenant_id: tenantId
         })
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
        endDate: "",
        gameMode: "battle_royale"
      });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="lg" className="font-orbitron">
            <Plus className="h-5 w-5" />
            Create Championship
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-gradient-dark border-primary/30">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTeams" className="font-rajdhani font-medium">
                  Max Teams
                </Label>
                <Select value={formData.maxTeams} onValueChange={(value) => setFormData({ ...formData, maxTeams: value })}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 Teams</SelectItem>
                    <SelectItem value="15">15 Teams</SelectItem>
                    <SelectItem value="20">20 Teams</SelectItem>
                    <SelectItem value="25">25 Teams</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="endDate" className="font-rajdhani font-medium">
                  End Date (Optional)
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                />
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
  );
}