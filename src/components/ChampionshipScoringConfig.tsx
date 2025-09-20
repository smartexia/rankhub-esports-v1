import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, RotateCcw, Target, Trophy } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ScoringRules {
  posicao: Record<string, number>;
  kill: number;
}

interface ChampionshipScoringConfigProps {
  scoringRules?: ScoringRules;
  onScoringRulesChange?: (rules: ScoringRules) => void;
  maxTeams: number;
  championshipId?: string;
  initialScoringRules?: any;
}

// Regras padrão baseadas no tipo de campeonato
const getDefaultScoringRules = (maxTeams: number): ScoringRules => {
  const posicao: Record<string, number> = {};
  
  // Pontuação dinâmica baseada no número máximo de times
  for (let i = 1; i <= Math.min(maxTeams, 25); i++) {
    if (i === 1) posicao[i.toString()] = 20;
    else if (i === 2) posicao[i.toString()] = 15;
    else if (i === 3) posicao[i.toString()] = 12;
    else if (i === 4) posicao[i.toString()] = 10;
    else if (i === 5) posicao[i.toString()] = 8;
    else if (i === 6) posicao[i.toString()] = 6;
    else if (i === 7) posicao[i.toString()] = 5;
    else if (i === 8) posicao[i.toString()] = 4;
    else if (i === 9) posicao[i.toString()] = 3;
    else if (i === 10) posicao[i.toString()] = 2;
    else posicao[i.toString()] = 1;
  }
  
  return {
    posicao,
    kill: 1
  };
};

export function ChampionshipScoringConfig({ 
  scoringRules, 
  onScoringRulesChange, 
  maxTeams, 
  championshipId, 
  initialScoringRules 
}: ChampionshipScoringConfigProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado local das regras de pontuação
  const [localRules, setLocalRules] = useState<ScoringRules>(() => {
    if (scoringRules) return scoringRules;
    if (initialScoringRules) return initialScoringRules;
    return getDefaultScoringRules(maxTeams);
  });

  // Atualizar regras locais quando props mudarem
  useEffect(() => {
    if (scoringRules) {
      setLocalRules(scoringRules);
    } else if (initialScoringRules) {
      setLocalRules(initialScoringRules);
    }
  }, [scoringRules, initialScoringRules]);

  const handlePositionChange = (position: string, points: string) => {
    const numericPoints = parseInt(points) || 0;
    if (numericPoints < 0) return;
    
    const newRules = {
      ...localRules,
      posicao: {
        ...localRules.posicao,
        [position]: numericPoints
      }
    };
    
    setLocalRules(newRules);
    onScoringRulesChange?.(newRules);
  };

  const handleKillPointsChange = (points: string) => {
    const numericPoints = parseInt(points) || 0;
    if (numericPoints < 0) return;
    
    const newRules = {
      ...localRules,
      kill: numericPoints
    };
    
    setLocalRules(newRules);
    onScoringRulesChange?.(newRules);
  };

  const handleSave = async () => {
    if (!championshipId) {
      toast({
        title: "Erro",
        description: "ID do campeonato não encontrado",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('championships')
        .update({ regras_pontuacao: localRules })
        .eq('id', championshipId);

      if (error) throw error;

      toast({
        title: "Pontuação Atualizada! 🎯",
        description: "As regras de pontuação foram salvas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar regras de pontuação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as regras de pontuação",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultRules = getDefaultScoringRules(maxTeams);
    setLocalRules(defaultRules);
    onScoringRulesChange?.(defaultRules);
    
    toast({
      title: "Regras Resetadas",
      description: "As regras de pontuação foram restauradas para os valores padrão"
    });
  };

  // Calcular total de posições a mostrar (máximo 25 para interface)
  const positionsToShow = Math.min(maxTeams, 25);
  const positions = Array.from({ length: positionsToShow }, (_, i) => (i + 1).toString());

  return (
    <div className="space-y-4">
      {/* Resumo das Regras */}
      <Card className="bg-secondary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Resumo da Pontuação
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-primary/10">
                1º lugar: {localRules.posicao['1'] || 0} pts
              </Badge>
              <Badge variant="outline" className="bg-secondary">
                Kill: {localRules.kill} pt{localRules.kill !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configuração Detalhada */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Configuração Detalhada</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 mt-4">
          {/* Pontos por Kill */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pontos por Kill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="killPoints" className="min-w-0">
                  Pontos por Kill:
                </Label>
                <Input
                  id="killPoints"
                  type="number"
                  min="0"
                  value={localRules.kill}
                  onChange={(e) => handleKillPointsChange(e.target.value)}
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pontos por Posição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pontos por Posição</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure os pontos para cada posição (1º ao {positionsToShow}º lugar)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {positions.map((position) => (
                  <div key={position} className="space-y-2">
                    <Label htmlFor={`pos-${position}`} className="text-sm font-medium">
                      {position}º lugar
                    </Label>
                    <Input
                      id={`pos-${position}`}
                      type="number"
                      min="0"
                      value={localRules.posicao[position] || 0}
                      onChange={(e) => handlePositionChange(position, e.target.value)}
                      className="text-center"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview da Tabela */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Preview da Pontuação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {positions.slice(0, 12).map((position) => (
                  <div key={position} className="flex justify-between p-2 bg-secondary/50 rounded">
                    <span>{position}º:</span>
                    <span className="font-medium">{localRules.posicao[position] || 0} pts</span>
                  </div>
                ))}
              </div>
              {positions.length > 12 && (
                <p className="text-xs text-muted-foreground mt-2">
                  ... e mais {positions.length - 12} posições
                </p>
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          {championshipId && (
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}