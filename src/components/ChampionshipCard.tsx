import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, Zap, Trash2 } from "lucide-react";
import { deleteChampionship } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Championship {
  id: string;
  name: string;
  description: string;
  status: "active" | "upcoming" | "finished";
  teams: number;
  maxTeams: number;
  participantLabel?: string;
  gameMode?: string;
  startDate: string;
  endDate?: string;
  organizer: string;
}

interface ChampionshipCardProps {
  championship: Championship;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
  isManager?: boolean;
}

export function ChampionshipCard({ championship, onView, onDelete, isManager }: ChampionshipCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const getStatusColor = (status: Championship["status"]) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground animate-pulse";
      case "upcoming":
        return "bg-warning text-warning-foreground";
      case "finished":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary";
    }
  };

  const getStatusIcon = (status: Championship["status"]) => {
    switch (status) {
      case "active":
        return <Zap className="h-3 w-3" />;
      case "upcoming":
        return <Calendar className="h-3 w-3" />;
      case "finished":
        return <Trophy className="h-3 w-3" />;
    }
  };

  const handleDelete = async () => {
    // Confirmação dupla para segurança
    const confirmDelete = window.confirm(
      `⚠️ ATENÇÃO: Você está prestes a deletar o campeonato "${championship.name}".\n\n` +
      `Esta ação é IRREVERSÍVEL e irá remover:\n` +
      `• Todas as partidas do campeonato\n` +
      `• Todos os resultados e rankings\n` +
      `• Todas as evidências (prints)\n\n` +
      `Tem certeza que deseja continuar?`
    );

    if (!confirmDelete) return;

    const finalConfirm = window.confirm(
      `🚨 CONFIRMAÇÃO FINAL\n\n` +
      `Campeonato: ${championship.name}\n` +
      `Esta é sua última chance de cancelar.\n\n` +
      `Deletar definitivamente?`
    );

    if (!finalConfirm) return;

    try {
      setIsDeleting(true);
      
      const { error } = await deleteChampionship(championship.id);
      
      if (error) {
        toast({
          title: "Erro ao Deletar",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Campeonato Deletado",
        description: `O campeonato "${championship.name}" foi deletado com sucesso.`,
        variant: "default",
      });

      // Chamar callback se fornecido
      if (onDelete) {
        onDelete(championship.id);
      }
      
    } catch (error) {
      console.error('Erro ao deletar campeonato:', error);
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro inesperado ao deletar o campeonato.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-dark border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-card group">
      <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="font-orbitron text-foreground group-hover:text-glow">
              {championship.name}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {championship.description}
            </CardDescription>
          </div>
          <Badge 
            className={`${getStatusColor(championship.status)} flex items-center gap-1 font-rajdhani font-medium`}
          >
            {getStatusIcon(championship.status)}
            {championship.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-accent" />
            <span>{championship.teams}/{championship.maxTeams} {championship.participantLabel || 'Teams'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{new Date(championship.startDate).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground">Organizer</p>
          <p className="font-medium text-foreground">{championship.organizer}</p>
        </div>
      </CardContent>

      <CardFooter className="relative z-10">
        <div className="flex gap-2 w-full">
          <Button 
            variant="gamer" 
            className="flex-1" 
            onClick={() => onView(championship.id)}
          >
            <Trophy className="h-4 w-4" />
            View Details
          </Button>
          
          <Button 
             variant="destructive" 
             size="icon"
             onClick={handleDelete}
             disabled={isDeleting}
             className="shrink-0 hover:bg-red-600 transition-colors"
             title="Deletar Campeonato"
           >
             <Trash2 className="h-4 w-4" />
           </Button>
        </div>
      </CardFooter>
    </Card>
  );
}