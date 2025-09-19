import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Users, Trophy, Calendar, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type TournamentFormat = 'simples' | 'grupos' | 'eliminatorio' | 'misto';

export interface TournamentPhase {
  id: string;
  nome_fase: string;
  tipo_fase: 'classificatoria' | 'eliminatoria' | 'final' | 'playoff';
  ordem_fase: number;
  numero_quedas?: number;
  numero_classificados?: number;
  configuracao?: any;
}

export interface TournamentConfig {
  formato_torneio: TournamentFormat;
  numero_fases: number;
  numero_grupos: number;
  times_por_grupo: number;
  fases: TournamentPhase[];
  configuracao_avancada: {
    permitir_empates: boolean;
    pontos_vitoria: number;
    pontos_empate: number;
    pontos_derrota: number;
    criterios_desempate: string[];
  };
}

interface TournamentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigComplete: (config: TournamentConfig) => void;
  maxTeams?: number;
}

const TOURNAMENT_FORMATS = {
  simples: {
    name: 'Torneio Simples',
    description: 'Todos os times jogam entre si em uma única fase',
    icon: Trophy,
    minTeams: 2,
    maxTeams: 50
  },
  grupos: {
    name: 'Por Grupos',
    description: 'Times divididos em grupos, com classificação posterior',
    icon: Users,
    minTeams: 4,
    maxTeams: 50
  },
  eliminatorio: {
    name: 'Eliminatório',
    description: 'Sistema de mata-mata com chaveamento',
    icon: Trophy,
    minTeams: 4,
    maxTeams: 64
  },
  misto: {
    name: 'Formato Misto',
    description: 'Combinação de grupos e eliminatórias',
    icon: Settings,
    minTeams: 8,
    maxTeams: 50
  }
};

const DEFAULT_CONFIG: TournamentConfig = {
  formato_torneio: 'simples',
  numero_fases: 1,
  numero_grupos: 1,
  times_por_grupo: 8,
  fases: [],
  configuracao_avancada: {
    permitir_empates: true,
    pontos_vitoria: 3,
    pontos_empate: 1,
    pontos_derrota: 0,
    criterios_desempate: ['pontos', 'saldo_gols', 'gols_marcados']
  }
};

export function TournamentWizard({ open, onOpenChange, onConfigComplete, maxTeams = 50 }: TournamentWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<TournamentConfig>(DEFAULT_CONFIG);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setConfig(DEFAULT_CONFIG);
      setErrors([]);
    }
  }, [open]);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: string[] = [];

    switch (currentStep) {
      case 1:
        if (!config.formato_torneio) {
          newErrors.push('Selecione um formato de torneio');
        }
        break;
      case 2:
        if (config.formato_torneio === 'grupos' || config.formato_torneio === 'misto') {
          if (config.numero_grupos < 2) {
            newErrors.push('Número de grupos deve ser pelo menos 2');
          }
          if (config.times_por_grupo < 2) {
            newErrors.push('Cada grupo deve ter pelo menos 2 times');
          }
          if (config.numero_grupos * config.times_por_grupo > maxTeams) {
            newErrors.push(`Total de times (${config.numero_grupos * config.times_por_grupo}) excede o máximo permitido (${maxTeams})`);
          }
        }
        break;
      case 3:
        if (config.fases.length === 0) {
          newErrors.push('Configure pelo menos uma fase');
        }
        break;
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setErrors([]);
  };

  const generatePhases = () => {
    const phases: TournamentPhase[] = [];

    switch (config.formato_torneio) {
      case 'simples':
        phases.push({
          id: 'fase-1',
          nome: 'Fase Única',
          tipo: 'grupos',
          numero_grupos: 1,
          times_por_grupo: maxTeams,
          descricao: 'Todos os times jogam entre si'
        });
        break;
      case 'grupos':
        phases.push({
          id: 'fase-1',
          nome: 'Fase de Grupos',
          tipo: 'grupos',
          numero_grupos: config.numero_grupos,
          times_por_grupo: config.times_por_grupo,
          descricao: `${config.numero_grupos} grupos com ${config.times_por_grupo} times cada`
        });
        break;
      case 'eliminatorio':
        const totalTeams = Math.pow(2, Math.ceil(Math.log2(maxTeams)));
        phases.push({
          id: 'fase-1',
          nome: 'Eliminatórias',
          tipo: 'eliminatorio',
          descricao: `Sistema mata-mata com ${totalTeams} times`
        });
        break;
      case 'misto':
        phases.push({
          id: 'fase-1',
          nome: 'Fase de Grupos',
          tipo: 'grupos',
          numero_grupos: config.numero_grupos,
          times_por_grupo: config.times_por_grupo,
          classificados_por_grupo: 2,
          descricao: `${config.numero_grupos} grupos, ${config.times_por_grupo} times cada, 2 classificados por grupo`
        });
        phases.push({
          id: 'fase-2',
          nome: 'Eliminatórias',
          tipo: 'eliminatorio',
          descricao: 'Mata-mata com os classificados da fase de grupos'
        });
        break;
    }

    setConfig(prev => ({ ...prev, fases: phases, numero_fases: phases.length }));
  };

  const updatePhase = (phaseId: string, updates: Partial<TournamentPhase>) => {
    setConfig(prev => ({
      ...prev,
      fases: prev.fases.map(phase => 
        phase.id === phaseId ? { ...phase, ...updates } : phase
      )
    }));
  };

  const handleComplete = () => {
    if (validateStep(step)) {
      onConfigComplete(config);
      onOpenChange(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Escolha o Formato do Torneio</h3>
        <p className="text-sm text-muted-foreground">Selecione o formato que melhor se adequa ao seu campeonato</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(TOURNAMENT_FORMATS).map(([key, format]) => {
          const Icon = format.icon;
          const isSelected = config.formato_torneio === key;
          
          return (
            <Card 
              key={key} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => setConfig(prev => ({ ...prev, formato_torneio: key as TournamentFormat }))}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-base">{format.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {format.description}
                </CardDescription>
                <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                  <span>Min: {format.minTeams} times</span>
                  <span>Max: {format.maxTeams} times</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (config.formato_torneio === 'simples' || config.formato_torneio === 'eliminatorio') {
      generatePhases();
      setStep(3);
      return null;
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Configuração de Grupos</h3>
          <p className="text-sm text-muted-foreground">Defina como os times serão divididos em grupos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="numero-grupos">Número de Grupos</Label>
              <Input
                id="numero-grupos"
                type="number"
                min="2"
                max="10"
                value={config.numero_grupos}
                onChange={(e) => setConfig(prev => ({ ...prev, numero_grupos: parseInt(e.target.value) || 2 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="times-por-grupo">Times por Grupo</Label>
              <Input
                id="times-por-grupo"
                type="number"
                min="2"
                max="12"
                value={config.times_por_grupo}
                onChange={(e) => setConfig(prev => ({ ...prev, times_por_grupo: parseInt(e.target.value) || 4 }))}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Resumo da Configuração</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total de Grupos:</span>
                <Badge variant="secondary">{config.numero_grupos}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Times por Grupo:</span>
                <Badge variant="secondary">{config.times_por_grupo}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total de Times:</span>
                <Badge variant="outline">{config.numero_grupos * config.times_por_grupo}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Partidas por Grupo:</span>
                <Badge variant="outline">{(config.times_por_grupo * (config.times_por_grupo - 1)) / 2}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    if (config.fases.length === 0) {
      generatePhases();
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Configuração das Fases</h3>
          <p className="text-sm text-muted-foreground">Revise e ajuste as fases do seu torneio</p>
        </div>

        <div className="space-y-4">
          {config.fases.map((phase, index) => (
            <Card key={phase.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Fase {index + 1}: {phase.nome_fase}</span>
                  <Badge variant={phase.tipo_fase === 'classificatoria' ? 'default' : 'destructive'}>
                    {phase.tipo_fase === 'classificatoria' ? 'Classificatória' : phase.tipo_fase === 'eliminatoria' ? 'Eliminatório' : phase.tipo_fase === 'final' ? 'Final' : 'Playoff'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {phase.tipo_fase === 'classificatoria' && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {phase.numero_classificados && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Classificados</Label>
                        <p className="font-medium">{phase.numero_classificados}</p>
                      </div>
                    )}
                    {phase.numero_quedas && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Quedas</Label>
                        <p className="font-medium">{phase.numero_quedas}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações Avançadas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="pontos-vitoria" className="text-xs">Pontos por Vitória</Label>
                <Input
                  id="pontos-vitoria"
                  type="number"
                  min="1"
                  value={config.configuracao_avancada.pontos_vitoria}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    configuracao_avancada: {
                      ...prev.configuracao_avancada,
                      pontos_vitoria: parseInt(e.target.value) || 3
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="pontos-empate" className="text-xs">Pontos por Empate</Label>
                <Input
                  id="pontos-empate"
                  type="number"
                  min="0"
                  value={config.configuracao_avancada.pontos_empate}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    configuracao_avancada: {
                      ...prev.configuracao_avancada,
                      pontos_empate: parseInt(e.target.value) || 1
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="pontos-derrota" className="text-xs">Pontos por Derrota</Label>
                <Input
                  id="pontos-derrota"
                  type="number"
                  min="0"
                  value={config.configuracao_avancada.pontos_derrota}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    configuracao_avancada: {
                      ...prev.configuracao_avancada,
                      pontos_derrota: parseInt(e.target.value) || 0
                    }
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Configurar Torneio</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > stepNumber ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <Separator />

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={step === 1}
            >
              Anterior
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              
              {step < 3 ? (
                <Button onClick={nextStep}>
                  Próximo
                </Button>
              ) : (
                <Button onClick={handleComplete}>
                  Finalizar Configuração
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}