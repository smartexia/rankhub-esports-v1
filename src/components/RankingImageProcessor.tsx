import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  RankingProcessor, 
  ConsolidatedRanking, 
  FinalRanking, 
  RankingStats,
  TeamRankingData,
  TEAM_MAPPING 
} from '../services/rankingProcessor';
import { Trophy, Target, Clock, Users, TrendingUp, Award } from 'lucide-react';

interface RankingImageProcessorProps {
  onDataProcessed?: (data: ConsolidatedRanking, finalRanking: FinalRanking[], stats: RankingStats) => void;
}

export const RankingImageProcessor: React.FC<RankingImageProcessorProps> = ({ onDataProcessed }) => {
  const [rawData, setRawData] = useState<string>('');
  const [processedData, setProcessedData] = useState<ConsolidatedRanking | null>(null);
  const [finalRanking, setFinalRanking] = useState<FinalRanking[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('input');

  // Dados de exemplo baseados nas imagens fornecidas
  const exampleData = `{
  "rodada_1": {
    "equipes": [
      { "identificador": "EQUIPE1", "posicao": 1, "baixas": 38, "tempo_sobrevivencia": "18:20", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE15", "posicao": 2, "baixas": 12, "tempo_sobrevivencia": "18:45", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE2", "posicao": 3, "baixas": 25, "tempo_sobrevivencia": "17:50", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE7", "posicao": 4, "baixas": 13, "tempo_sobrevivencia": "16:32", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE11", "posicao": 5, "baixas": 45, "tempo_sobrevivencia": "17:17", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE12", "posicao": 6, "baixas": 34, "tempo_sobrevivencia": "16:28", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE19", "posicao": 7, "baixas": 23, "tempo_sobrevivencia": "17:12", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE20", "posicao": 8, "baixas": 3, "tempo_sobrevivencia": "16:52", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE23", "posicao": 9, "baixas": 12, "tempo_sobrevivencia": "16:36", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE16", "posicao": 10, "baixas": 23, "tempo_sobrevivencia": "15:27", "pontuacao_calculada": 0 }
    ]
  },
  "rodada_2": {
    "equipes": [
      { "identificador": "EQUIPE22", "posicao": 11, "baixas": 15, "tempo_sobrevivencia": "17:24", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE10", "posicao": 12, "baixas": 13, "tempo_sobrevivencia": "15:26", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE24", "posicao": 13, "baixas": 4, "tempo_sobrevivencia": "16:39", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE25", "posicao": 14, "baixas": 8, "tempo_sobrevivencia": "16:13", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE14", "posicao": 15, "baixas": 13, "tempo_sobrevivencia": "17:02", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE21", "posicao": 16, "baixas": 19, "tempo_sobrevivencia": "16:24", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE4", "posicao": 17, "baixas": 13, "tempo_sobrevivencia": "15:53", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE3", "posicao": 18, "baixas": 16, "tempo_sobrevivencia": "15:22", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE5", "posicao": 19, "baixas": 15, "tempo_sobrevivencia": "11:46", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE13", "posicao": 20, "baixas": 10, "tempo_sobrevivencia": "10:56", "pontuacao_calculada": 0 }
    ]
  },
  "rodada_3": {
    "equipes": [
      { "identificador": "EQUIPE8", "posicao": 21, "baixas": 11, "tempo_sobrevivencia": "11:37", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE9", "posicao": 22, "baixas": 22, "tempo_sobrevivencia": "10:10", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE18", "posicao": 23, "baixas": 3, "tempo_sobrevivencia": "9:41", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE17", "posicao": 24, "baixas": 9, "tempo_sobrevivencia": "4:58", "pontuacao_calculada": 0 },
      { "identificador": "EQUIPE6", "posicao": 25, "baixas": 7, "tempo_sobrevivencia": "3:08", "pontuacao_calculada": 0 }
    ]
  }
}`;

  const handleProcessData = () => {
    try {
      const parsedData: ConsolidatedRanking = JSON.parse(rawData || exampleData);
      
      // Valida os dados
      const validation = RankingProcessor.validateData(parsedData);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }
      
      setValidationErrors([]);
      
      // Processa os dados
      const processed = RankingProcessor.processRankingData(parsedData);
      const final = RankingProcessor.generateFinalRanking(processed);
      const statistics = RankingProcessor.generateStats(processed);
      
      setProcessedData(processed);
      setFinalRanking(final);
      setStats(statistics);
      setActiveTab('results');
      
      // Callback para componente pai
      onDataProcessed?.(processed, final, statistics);
      
    } catch (error) {
      setValidationErrors([`Erro ao processar JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
    }
  };

  const handleLoadExample = () => {
    setRawData(exampleData);
  };

  const renderFinalRanking = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        Classificação Final
      </h3>
      <div className="grid gap-2">
        {finalRanking.map((team, index) => (
          <Card key={team.identificador} className={`${index < 3 ? 'border-yellow-200 bg-yellow-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? 'default' : 'secondary'} className="text-sm">
                    {index + 1}º
                  </Badge>
                  <div>
                    <p className="font-medium">{team.nome_real || team.identificador}</p>
                    <p className="text-sm text-gray-500">{team.identificador}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{team.pontuacao_total} pts</p>
                  <p className="text-sm text-gray-500">{team.total_baixas} baixas</p>
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-sm text-gray-600">
                <span>Melhor: {team.melhor_posicao}º</span>
                <span>Participações: {team.participacoes}</span>
                <span>Tempo médio: {team.tempo_medio_sobrevivencia}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-green-500" />
        Estatísticas do Campeonato
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-red-500" />
              <span className="font-medium">Mais Baixas</span>
            </div>
            <p className="text-lg font-bold">{TEAM_MAPPING[stats?.equipe_mais_baixas.identificador || ''] || stats?.equipe_mais_baixas.identificador}</p>
            <p className="text-sm text-gray-500">{stats?.equipe_mais_baixas.total_baixas} eliminações</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Maior Sobrevivência</span>
            </div>
            <p className="text-lg font-bold">{TEAM_MAPPING[stats?.maior_tempo_sobrevivencia.identificador || ''] || stats?.maior_tempo_sobrevivencia.identificador}</p>
            <p className="text-sm text-gray-500">{stats?.maior_tempo_sobrevivencia.tempo} ({stats?.maior_tempo_sobrevivencia.rodada})</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Mais Consistente</span>
            </div>
            <p className="text-lg font-bold">{TEAM_MAPPING[stats?.mais_consistente.identificador || ''] || stats?.mais_consistente.identificador}</p>
            <p className="text-sm text-gray-500">Posição média: {stats?.mais_consistente.posicao_media}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRoundDetails = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="h-5 w-5 text-indigo-500" />
        Detalhes por Rodada
      </h3>
      {processedData && Object.keys(processedData).map(rodada => (
        <Card key={rodada}>
          <CardHeader>
            <CardTitle className="text-base">{rodada.replace('_', ' ').toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {processedData[rodada].equipes
                .sort((a, b) => a.posicao - b.posicao)
                .map(equipe => (
                <div key={equipe.identificador} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{equipe.posicao}º</Badge>
                    <span className="font-medium">{TEAM_MAPPING[equipe.identificador] || equipe.identificador}</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>{equipe.baixas} baixas</span>
                    <span>{equipe.tempo_sobrevivencia}</span>
                    <span className="font-medium text-blue-600">{equipe.pontuacao_calculada} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Processador de Rankings de Competição</CardTitle>
          <p className="text-gray-600">
            Extraia e processe dados de screenshots de ranking para gerar classificações consolidadas
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="input">Entrada de Dados</TabsTrigger>
              <TabsTrigger value="results">Classificação Final</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="input" className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleLoadExample} variant="outline">
                    Carregar Exemplo
                  </Button>
                  <Button onClick={handleProcessData} className="bg-blue-600 hover:bg-blue-700">
                    Processar Dados
                  </Button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Dados JSON das Rodadas:
                  </label>
                  <Textarea
                    value={rawData}
                    onChange={(e) => setRawData(e.target.value)}
                    placeholder="Cole aqui os dados JSON extraídos das imagens..."
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
                
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Erros encontrados:</p>
                        {validationErrors.map((error, index) => (
                          <p key={index} className="text-sm">• {error}</p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="results">
              {finalRanking.length > 0 ? renderFinalRanking() : (
                <p className="text-gray-500 text-center py-8">Nenhum dado processado ainda. Use a aba "Entrada de Dados" para começar.</p>
              )}
            </TabsContent>
            
            <TabsContent value="stats">
              {stats ? renderStats() : (
                <p className="text-gray-500 text-center py-8">Nenhuma estatística disponível ainda.</p>
              )}
            </TabsContent>
            
            <TabsContent value="details">
              {processedData ? renderRoundDetails() : (
                <p className="text-gray-500 text-center py-8">Nenhum detalhe disponível ainda.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingImageProcessor;