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
  getMatchResults, 
  updateMatchResult, 
  deleteMatchResult 
} from '@/services/api';
import { isGeminiConfigured, getGeminiStatus } from '@/services/geminiApi';
import { Loader2, Upload, Check, X, Edit, Trash2, AlertCircle, FileImage, ExternalLink } from 'lucide-react';
import RankingBatchProcessor from './RankingBatchProcessor';
import BattleRoyaleProcessor from './BattleRoyaleProcessor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  const [editingResult, setEditingResult] = useState<MatchResult | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [showBattleRoyaleProcessor, setShowBattleRoyaleProcessor] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState({
    configured: false,
    working: false,
    error: null as string | null
  });
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



  const handleDeleteResult = async (resultId: string) => {
    try {
      const { error } = await deleteMatchResult(resultId);
      
      if (error) {
        console.error('Error deleting result:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover resultado",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Sucesso",
        description: "Resultado removido com sucesso",
        variant: "default"
      });
      await loadResults();
      if (onResultsChange) {
        onResultsChange();
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover resultado",
        variant: "destructive"
      });
    }
  };

  const handleSaveEdit = async (updates: Partial<MatchResult>) => {
    if (!editingResult) return;

    try {
      const { error } = await updateMatchResult(editingResult.id, updates);
      
      if (error) {
        console.error('Error updating result:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar resultado",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Sucesso",
        description: "Resultado atualizado com sucesso",
        variant: "default"
      });
      setEditingResult(null);
      await loadResults();
      if (onResultsChange) {
        onResultsChange();
      }
    } catch (error) {
      console.error('Error updating result:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar resultado",
        variant: "destructive"
      });
    }
  };

  const handleBatchResultsProcessed = async (processedResults: any[]) => {
    try {
      setIsBatchProcessing(true);
      
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
      setShowBatchProcessor(false);
      
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
      setIsBatchProcessing(false);
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

      {/* Processor Toggle Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => navigate(`/battle-royale-processor/${matchId}`)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          🚀 Battle Royale - Página Dedicada
        </Button>
        
        <Button
          variant={showBattleRoyaleProcessor ? "default" : "outline"}
          onClick={() => {
            setShowBattleRoyaleProcessor(!showBattleRoyaleProcessor);
            if (showBatchProcessor) setShowBatchProcessor(false);
          }}
          disabled={isBatchProcessing}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <FileImage className="mr-2 h-4 w-4" />
          🏆 {showBattleRoyaleProcessor ? "Ocultar" : "Battle Royale"} (Modal)
        </Button>
        
        <Button
          variant={showBatchProcessor ? "default" : "outline"}
          onClick={() => {
            setShowBatchProcessor(!showBatchProcessor);
            if (showBattleRoyaleProcessor) setShowBattleRoyaleProcessor(false);
          }}
          disabled={isBatchProcessing}
        >
          <FileImage className="mr-2 h-4 w-4" />
          {showBatchProcessor ? "Ocultar" : "Mostrar"} Processamento em Lote
        </Button>
      </div>
      
      {/* Info sobre página dedicada */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Novo:</strong> Use a <strong>Página Dedicada</strong> para melhor experiência de debug! 
          Os logs aparecem corretamente no console do navegador.
        </p>
      </div>

      {/* Battle Royale Processor */}
      {showBattleRoyaleProcessor && (
        <BattleRoyaleProcessor
          teams={teams}
          onResultsProcessed={handleBatchResultsProcessed}
          disabled={isBatchProcessing || !geminiStatus.configured}
        />
      )}

      {/* Batch Processor */}
      {showBatchProcessor && (
        <RankingBatchProcessor
          teams={teams}
          onResultsProcessed={handleBatchResultsProcessed}
          disabled={isBatchProcessing || !geminiStatus.configured}
        />
      )}



      {/* Results List */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Resultados Processados ({results.length})</h3>
        
        {results.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum resultado processado ainda
          </p>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="font-semibold text-lg">
                        {result.teams?.name || `Time ${result.team_id}`}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                          {result.placement}º lugar
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                          {result.kills} kills
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                          {result.total_points} pts
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Pontos Colocação:</span>
                        <br />
                        {result.placement_points}
                      </div>
                      <div>
                        <span className="font-medium">Pontos Kills:</span>
                        <br />
                        {result.kill_points}
                      </div>
                      <div>
                        <span className="font-medium">Confiança:</span>
                        <br />
                        {(result.confidence_score * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Processado:</span>
                        <br />
                        {new Date(result.processed_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingResult(result)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este resultado? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteResult(result.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingResult && (
        <EditResultDialog
          result={editingResult}
          onSave={handleSaveEdit}
          onCancel={() => setEditingResult(null)}
        />
      )}
    </div>
  );
};

// Edit Result Dialog Component
interface EditResultDialogProps {
  result: MatchResult;
  onSave: (updates: Partial<MatchResult>) => void;
  onCancel: () => void;
}

const EditResultDialog: React.FC<EditResultDialogProps> = ({ result, onSave, onCancel }) => {
  const [placement, setPlacement] = useState(result.placement.toString());
  const [kills, setKills] = useState(result.kills.toString());

  const handleSave = () => {
    const placementNum = parseInt(placement);
    const killsNum = parseInt(kills);

    if (isNaN(placementNum) || isNaN(killsNum) || placementNum < 1 || placementNum > 20 || killsNum < 0) {
      return;
    }

    // Calculate points based on standard PUBG scoring
    const placement_points = Math.max(0, 21 - placementNum);
    const kill_points = killsNum;
    const total_points = placement_points + kill_points;

    onSave({
      placement: placementNum,
      kills: killsNum,
      placement_points,
      kill_points,
      total_points
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Editar Resultado</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-placement">Colocação (1-20)</Label>
            <Input
              id="edit-placement"
              type="number"
              min="1"
              max="20"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="edit-kills">Kills</Label>
            <Input
              id="edit-kills"
              type="number"
              min="0"
              value={kills}
              onChange={(e) => setKills(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} className="flex-1">
            Salvar
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchResultsManager;