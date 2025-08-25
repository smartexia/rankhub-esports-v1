import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Define the possible statuses using the same type as in the database
type ChampionshipStatus = 'rascunho' | 'ativo' | 'finalizado';

interface ChampionshipStatusManagerProps {
  championshipId: string;
  currentStatus: ChampionshipStatus;
  onStatusChange: (newStatus: ChampionshipStatus) => void;
}

const ChampionshipStatusManager = ({
  championshipId,
  currentStatus,
  onStatusChange,
}: ChampionshipStatusManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateStatus = async (newStatus: ChampionshipStatus) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('update_championship_status', {
        p_championship_id: championshipId,
        p_new_status: newStatus,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        const updatedChampionship = data[0];
        onStatusChange(updatedChampionship.status);
        toast({
          title: 'Status atualizado com sucesso!',
          description: `O campeonato agora está ${updatedChampionship.status}.`,
          variant: 'default',
        });
      } else {
         throw new Error('A atualização de status não retornou dados.');
      }
    } catch (error: any) {
      console.error('Error updating championship status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNextAction = () => {
    switch (currentStatus) {
      case 'rascunho':
        return {
          label: 'Ativar Campeonato',
          action: () => handleUpdateStatus('ativo'),
          variant: 'default'
        };
      case 'ativo':
        return {
          label: 'Finalizar Campeonato',
          action: () => handleUpdateStatus('finalizado'),
          variant: 'destructive'
        };
      case 'finalizado':
        return {
          label: 'Reabrir (Rascunho)',
          action: () => handleUpdateStatus('rascunho'),
          variant: 'secondary'
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Gerenciar Status</h3>
          <p className="text-sm text-muted-foreground">
            Status atual: <span className="font-bold">{currentStatus}</span>
          </p>
        </div>
        {nextAction && (
          <Button
            onClick={nextAction.action}
            disabled={isLoading}
            variant={nextAction.variant as any}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {nextAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChampionshipStatusManager;