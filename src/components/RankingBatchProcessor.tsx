/**
 * RankingBatchProcessor Component
 * Processes multiple ranking screenshots at once and extracts results for all teams
 * Integrates with MatchResultsManager for seamless match result processing
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { processRankingImages } from '@/utils/rankingProcessor';
import { Loader2, Upload, FileImage, X, Check, Trophy, Target, Zap, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Team {
  id: string;
  name: string;
}

interface ProcessedResult {
  teamId: string;
  teamName: string;
  placement: number;
  kills: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  confidence: number;
}

interface RankingBatchProcessorProps {
  teams: Team[];
  onResultsProcessed: (results: ProcessedResult[]) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

const RankingBatchProcessor: React.FC<RankingBatchProcessorProps> = ({
  teams,
  onResultsProcessed,
  onCancel,
  disabled = false
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast({
        title: "Arquivos Inválidos",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive"
      });
      return;
    }

    // Validate file sizes (max 10MB each)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Arquivos Muito Grandes",
        description: "Cada arquivo deve ter no máximo 10MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFiles(files);
    setShowResults(false);
    setProcessedResults([]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessRankings = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Nenhuma Imagem Selecionada",
        description: "Selecione pelo menos uma imagem de ranking",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Process all ranking images with team mapping
      const results = await processRankingImages(selectedFiles, teams);
      
      if (results.length === 0) {
        toast({
          title: "Nenhum Resultado Encontrado",
          description: "Não foi possível extrair resultados das imagens",
          variant: "destructive"
        });
        return;
      }

      setProcessedResults(results);
      setShowResults(true);
      
      toast({
        title: "Processamento Concluído!",
        description: `${results.length} resultados extraídos com sucesso`,
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error processing rankings:', error);
      toast({
        title: "Erro no Processamento",
        description: error.message || "Erro ao processar as imagens de ranking",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmResults = () => {
    onResultsProcessed(processedResults);
    
    // Reset form
    setSelectedFiles([]);
    setProcessedResults([]);
    setShowResults(false);
    
    // Reset file input
    const fileInput = document.getElementById('ranking-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleCancelResults = () => {
    setShowResults(false);
    setProcessedResults([]);
  };

  return (
    <Card className="w-full border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="bg-white/20 rounded-full p-2">
            <FileImage className="h-6 w-6" />
          </div>
          🏆 Battle Royale - Processamento Automático (25 Times)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {!showResults ? (
          <>
            {/* File Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors">
              <Label htmlFor="ranking-upload" className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                📸 Imagens de Ranking
              </Label>
              <Input
                id="ranking-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={isProcessing || disabled}
                className="mt-3 text-base border-2 border-gray-300 focus:border-blue-500 rounded-lg p-3"
              />
              <p className="text-base text-gray-700 dark:text-gray-300 mt-3 font-medium">
                🎯 Envie o print do ranking final e todos os 25 times serão processados automaticamente
              </p>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border-2 border-green-200">
                <Label className="text-lg font-bold text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Star className="h-5 w-5 text-green-600" />
                  ✅ Arquivos Selecionados ({selectedFiles.length})
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-300 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 dark:bg-green-900 rounded-full p-2">
                          <FileImage className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <span className="text-base font-semibold text-gray-800 dark:text-gray-200 truncate block max-w-[200px]">{file.name}</span>
                          <Badge variant="secondary" className="text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mt-1">
                            📁 {(file.size / 1024 / 1024).toFixed(1)}MB
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isProcessing}
                        className="hover:bg-red-100 hover:text-red-600 rounded-full p-2"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={handleProcessRankings}
                disabled={selectedFiles.length === 0 || isProcessing || disabled}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    🔄 Processando {selectedFiles.length} imagens...
                  </>
                ) : (
                  <>
                    <Zap className="mr-3 h-6 w-6" />
                    🚀 Processar Battle Royale ({selectedFiles.length} imagem)
                  </>
                )}
              </Button>
              {onCancel && (
                <Button 
                  variant="outline"
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <X className="mr-2 h-5 w-5" />
                  ❌ Cancelar
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Results Preview */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-xl p-6 border-2 border-yellow-300">
              <Label className="text-xl font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-600" />
                🏆 Resultados Processados ({processedResults.length})
              </Label>
              <div className="space-y-4 mt-6 max-h-96 overflow-y-auto">
                {processedResults.map((result, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 border-2 border-yellow-400 rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-2">
                          <Target className="h-5 w-5 text-yellow-600" />
                        </div>
                        🎯 {result.teamName}
                      </h4>
                      <Badge variant="outline" className="text-base font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1">
                        ✅ Confiança: {(result.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border-2 border-blue-200">
                        <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">🥇 Colocação:</span>
                        <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{result.placement}º</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border-2 border-red-200">
                        <span className="text-red-700 dark:text-red-300 font-semibold text-sm">💀 Kills:</span>
                        <div className="text-2xl font-bold text-red-800 dark:text-red-200">{result.kills}</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border-2 border-green-200">
                        <span className="text-green-700 dark:text-green-300 font-semibold text-sm">📍 Pts Colocação:</span>
                        <div className="text-2xl font-bold text-green-800 dark:text-green-200">{result.placementPoints}</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border-2 border-purple-200">
                        <span className="text-purple-700 dark:text-purple-300 font-semibold text-sm">🏆 Total:</span>
                        <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{result.totalPoints} pts</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <Button 
                onClick={handleConfirmResults}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-lg"
              >
                <Check className="mr-3 h-6 w-6" />
                ✅ Confirmar e Salvar Resultados
              </Button>
              <Button 
                variant="outline"
                onClick={handleCancelResults}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0 font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-lg"
              >
                <X className="mr-3 h-6 w-6" />
                🚫 Cancelar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingBatchProcessor;