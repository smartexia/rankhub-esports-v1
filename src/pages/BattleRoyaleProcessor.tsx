/**
 * Battle Royale Processor Page
 * Página dedicada para processamento de rankings do Battle Royale
 * Movido da modal para resolver problemas de logs
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BattleRoyaleProcessor from '../components/BattleRoyaleProcessor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  line: string;
  tag: string;
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

const BattleRoyaleProcessorPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchInfo, setMatchInfo] = useState<any>(null);

  // TESTE: Log simples para verificar se a página carrega
  console.log('🚀 TESTE: Battle Royale Processor Page iniciada');
  console.log('🎯 TESTE: Match ID:', matchId);

  useEffect(() => {
    console.log('🔄 TESTE: useEffect executado');
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    console.log('📡 TESTE: Buscando dados...');
    try {
      setLoading(true);

      // Buscar informações da partida
      if (matchId) {
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();

        if (matchError) {
          console.error('❌ TESTE: Erro ao buscar partida:', matchError);
          throw matchError;
        }

        console.log('✅ TESTE: Partida encontrada:', match);
        setMatchInfo(match);

        // 🚨 DEBUG CRÍTICO: Log do championship_id sendo usado
        console.log('🎯 CHAMPIONSHIP_ID USADO:', match.championship_id);
        console.log('🎯 MATCH COMPLETO:', match);
        
        // Verificar se existe championship_id na partida
        if (!match.championship_id) {
          console.error('❌ ERRO CRÍTICO: championship_id não encontrado na partida!');
          throw new Error('Championship ID não encontrado na partida');
        }

        // Buscar times do campeonato - ORDENAÇÃO CONSISTENTE POR ID
        console.log('🔍 BUSCANDO EQUIPES PARA CHAMPIONSHIP:', match.championship_id);
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, nome_time, nome_line, tag')
          .eq('championship_id', match.championship_id)
          .order('id', { ascending: true }); // Ordenação consistente por ID

        if (teamsError) {
          console.error('❌ TESTE: Erro ao buscar times:', teamsError);
          throw teamsError;
        }

        console.log('✅ TESTE: Times encontrados:', teamsData?.length);
        console.log('📋 TESTE: Dados dos times:', teamsData);
        
        // 🚨 DEBUG CRÍTICO: Verificar se encontrou equipes
        if (!teamsData || teamsData.length === 0) {
          console.error('❌ ERRO CRÍTICO: Nenhuma equipe encontrada para o championship:', match.championship_id);
          console.error('🔍 POSSÍVEIS CAUSAS:');
          console.error('   1. Championship ID incorreto');
          console.error('   2. Equipes não cadastradas neste campeonato');
          console.error('   3. Problema na query do banco');
          
          // Verificar se é o campeonato com 25 equipes
          if (match.championship_id === 'efb7e954-7b76-4e82-ae63-5db12e047cf1') {
            console.log('✅ Este é o campeonato com 25 equipes! Problema na query.');
          } else {
            console.log('❌ Este NÃO é o campeonato com 25 equipes.');
            console.log('🎯 Championship correto seria: efb7e954-7b76-4e82-ae63-5db12e047cf1');
          }
        }
        
        const formattedTeams = teamsData?.map((team, index) => {
          const formattedTeam = {
            id: team.id,
            name: team.nome_time,
            line: team.nome_line,
            tag: team.tag
          };
          
          // Log detalhado de cada equipe
          console.log(`   ${index + 1}. EQUIPE${index + 1} → ${formattedTeam.name} (ID: ${formattedTeam.id})`);
          return formattedTeam;
        }) || [];
        
        console.log('🎯 TOTAL DE EQUIPES FORMATADAS:', formattedTeams.length);
        setTeams(formattedTeams);
      }
    } catch (error) {
      console.error('❌ TESTE: Erro geral:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados da partida",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('🏁 TESTE: Carregamento finalizado');
    }
  };

  const handleResultsProcessed = async (results: ProcessedResult[]) => {
    console.log('💾 TESTE: Salvando resultados:', results.length);
    try {
      // Salvar resultados no banco
      const resultsToSave = results.map(result => ({
        match_id: matchId,
        team_id: result.teamId,
        placement: result.placement,
        kills: result.kills,
        placement_points: result.placementPoints,
        kill_points: result.killPoints,
        total_points: result.totalPoints,
        confidence_score: result.confidence,
        processed_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('match_results')
        .insert(resultsToSave);

      if (error) {
        console.error('❌ TESTE: Erro ao salvar:', error);
        throw error;
      }

      console.log('✅ TESTE: Resultados salvos com sucesso!');
      toast({
        title: "Resultados Salvos!",
        description: `${results.length} resultados foram processados e salvos com sucesso.`,
        variant: "default"
      });

      // Voltar para a página da partida
      navigate(-1);
    } catch (error) {
      console.error('❌ TESTE: Erro ao salvar resultados:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os resultados",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Battle Royale Processor
                </h1>
                <p className="text-muted-foreground">
                  {matchInfo ? `Partida #${matchInfo.ordem_queda}` : 'Processamento de Ranking'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              📊 <strong>Página Dedicada:</strong> Esta página foi criada especialmente para o processamento de rankings, 
              garantindo que todos os logs apareçam corretamente no console do navegador.
            </p>
          </div>
        </div>

        {/* Battle Royale Processor */}
        <div className="max-w-4xl mx-auto">
          <BattleRoyaleProcessor
            teams={teams}
            onResultsProcessed={handleResultsProcessed}
            disabled={false}
          />
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-2">🔧 Debug Info:</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Match ID: {matchId}</p>
            <p>• Teams carregados: {teams.length}</p>
            <p>• Console logs ativos: ✅</p>
            <p>• Página dedicada: ✅</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BattleRoyaleProcessorPage;