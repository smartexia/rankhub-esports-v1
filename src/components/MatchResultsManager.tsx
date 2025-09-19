/**
 * MatchResultsManager Component
 * Replaces MatchPrintsManager with direct AI processing (no image storage)
 * Processes match screenshots directly with Gemini AI and saves results to match_results table
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  processAndSaveMatchResult, 
  saveMatchResultDirect,
  getMatchResults
} from '@/services/api';
import { isGeminiConfigured, getGeminiStatus } from '@/services/geminiApi';
import { Loader2, Check, X, AlertCircle, ExternalLink } from 'lucide-react';
// Imports de edição removidos - não utilizados na interface simplificada

interface Team {
  id: string;
  name: string;
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

interface MatchResultsManagerProps {
  matchId: string;
  teams: Team[];
  onResultsChange?: () => void;
}

const MatchResultsManager: React.FC<MatchResultsManagerProps> = ({ 
  matchId, 
  teams, 
  onResultsChange 
}) => {
  const navigate = useNavigate();
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Estado removido - não mais necessário
  // Estados removidos - interface simplificada com apenas 1 botão
  const [geminiStatus, setGeminiStatus] = useState({
    configured: false,
    working: false,
    error: null as string | null
  });
  
  // Funções removidas - relacionadas aos componentes não utilizados
  const { toast } = useToast();

  // Check Gemini configuration on mount
  useEffect(() => {
    const checkGeminiStatus = async () => {
      try {
        const configured = isGeminiConfigured();
        const status = await getGeminiStatus();
        setGeminiStatus({
          configured,
          working: status.working,
          error: status.error
        });
      } catch (error) {
        console.error('Error checking Gemini status:', error);
        setGeminiStatus({
          configured: false,
          working: false,
          error: 'Erro ao verificar status do Gemini'
        });
      }
    };

    checkGeminiStatus();
  }, []);

  // Load existing results
  useEffect(() => {
    loadResults();
  }, [matchId]);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getMatchResults(matchId);
      
      if (error) {
        console.error('Error loading results:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar resultados da partida",
          variant: "destructive"
        });
        setResults([]);
        return;
      }
      
      setResults(data || []);
    } catch (error) {
      console.error('Error loading results:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar resultados da partida",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };



  // Funções de edição e exclusão removidas - não necessárias no modal de envio

  const handleBatchResultsProcessed = async (processedResults: any[]) => {
    try {
      // Processamento simplificado
      
      // Save each result to the database using real processed data
      const savePromises = processedResults.map(async (result) => {
        return saveMatchResultDirect(
          matchId,
          result.teamId,
          {
            placement: result.placement,
            kills: result.kills,
            placement_points: result.placementPoints,
            kill_points: result.killPoints,
            total_points: result.totalPoints,
            confidence_score: result.confidence
          }
        );
      });
      
      const results = await Promise.all(savePromises);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        toast({
          title: "Erro Parcial",
          description: `${errors.length} resultados falharam ao salvar`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso!",
          description: `${processedResults.length} resultados salvos com sucesso`,
          variant: "default"
        });
      }
      
      // Reload results and close batch processor
      await loadResults();
      // Estado removido
      
      if (onResultsChange) {
        onResultsChange();
      }
      
    } catch (error: any) {
      console.error('Error saving batch results:', error);
      toast({
        title: "Erro no Salvamento",
        description: error.message || "Erro ao salvar resultados em lote",
        variant: "destructive"
      });
    } finally {
      // Estado removido
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gemini Status Indicator */}
      <div className={`p-3 rounded-lg border flex items-center gap-3 ${
        geminiStatus.configured && geminiStatus.working
          ? 'bg-green-50 border-green-200 text-green-800'
          : geminiStatus.configured && !geminiStatus.working
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        {geminiStatus.configured && geminiStatus.working ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : geminiStatus.configured && !geminiStatus.working ? (
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        ) : (
          <X className="h-5 w-5 text-red-600" />
        )}
        <div>
          <p className="font-medium">
            {geminiStatus.configured && geminiStatus.working
              ? 'Gemini AI Configurado e Funcionando'
              : geminiStatus.configured && !geminiStatus.working
              ? 'Gemini AI Configurado mas com Problemas'
              : 'Gemini AI Não Configurado'
            }
          </p>
          {geminiStatus.error && (
            <p className="text-sm opacity-90">{geminiStatus.error}</p>
          )}
          {!geminiStatus.configured && (
            <p className="text-sm opacity-90">
              Configure a chave da API do Gemini nas configurações para processar imagens
            </p>
          )}
        </div>
      </div>

      {/* Processamento de Resultados */}
      <div className="flex justify-center">
        <Button
          onClick={() => navigate(`/battle-royale-processor/${matchId}`)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          size="lg"
        >
          <ExternalLink className="mr-3 h-5 w-5" />
          🚀 Processar Resultados Battle Royale
        </Button>
      </div>
      
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        💡 Página dedicada com suporte a múltiplas imagens e logs detalhados
      </div>
      
      {/* Info sobre página dedicada */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Novo:</strong> Use a <strong>Página Dedicada</strong> para melhor experiência de debug! 
          Os logs aparecem corretamente no console do navegador.
        </p>
      </div>

      {/* Componentes removidos - interface simplificada */}



      {/* Seção de Resultados Processados removida - deve aparecer apenas no modal VER RESULTADOS */}

    </div>
  );
};

export default MatchResultsManager;