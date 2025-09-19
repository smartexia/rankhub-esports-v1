import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, Eye, Edit, Trash2, Plus, Filter, Search, FileImage } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import RankingBatchProcessor from '@/components/RankingBatchProcessor';

type Match = Tables<'matches'>;
type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

const Matches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'all'>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [resultDescription, setResultDescription] = useState('');
  const [showRankingProcessor, setShowRankingProcessor] = useState(false);
  const [processingMatch, setProcessingMatch] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [user]);

  const fetchMatches = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          championship:championships(name),
          team1:teams!matches_team1_id_fkey(name),
          team2:teams!matches_team2_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Erro ao buscar partidas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as partidas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: MatchStatus) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      in_progress: { label: 'Em Andamento', variant: 'default' as const },
      completed: { label: 'Finalizada', variant: 'success' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleUploadResult = async () => {
    if (!selectedMatch || !evidenceFile || !resultDescription.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload da evidência
      const fileExt = evidenceFile.name.split('.').pop();
      const fileName = `${selectedMatch.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('match-evidence')
        .upload(fileName, evidenceFile);

      if (uploadError) throw uploadError;

      // Criar registro de evidência
      const { error: evidenceError } = await supabase
        .from('print_evidence')
        .insert({
          match_id: selectedMatch.id,
          file_path: fileName,
          uploaded_by: user!.id,
          status: 'pending'
        });

      if (evidenceError) throw evidenceError;

      // Criar resultado
      const { error: resultError } = await supabase
        .from('results')
        .insert({
          match_id: selectedMatch.id,
          description: resultDescription,
          submitted_by: user!.id
        });

      if (resultError) throw resultError;

      toast({
        title: 'Sucesso',
        description: 'Resultado enviado com sucesso!',
      });

      setUploadDialogOpen(false);
      setSelectedMatch(null);
      setEvidenceFile(null);
      setResultDescription('');
      fetchMatches();
    } catch (error) {
      console.error('Erro ao enviar resultado:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o resultado.',
        variant: 'destructive',
      });
    }
  };

  const handleRankingResultsProcessed = async (results: any[]) => {
    if (!processingMatch) return;

    try {
      // Salvar cada resultado no banco de dados
      for (const result of results) {
        const { error: resultError } = await supabase
          .from('results')
          .insert({
            match_id: processingMatch.id,
            description: `Ranking processado: ${result.team} - ${result.points} pontos (Posição: ${result.position})`,
            submitted_by: user!.id
          });

        if (resultError) throw resultError;
      }

      // Atualizar status da partida para finalizada
      const { error: matchError } = await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', processingMatch.id);

      if (matchError) throw matchError;

      toast({
        title: 'Sucesso',
        description: `${results.length} resultados de ranking processados com sucesso!`,
      });

      setShowRankingProcessor(false);
      setProcessingMatch(null);
      fetchMatches();
    } catch (error) {
      console.error('Erro ao salvar resultados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os resultados processados.',
        variant: 'destructive',
      });
    }
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = 
      match.championship?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team1?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team2?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout 
      title="Gerenciar Partidas" 
      description="Visualize partidas, faça upload de resultados e gerencie evidências"
    >
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por campeonato ou equipes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={(value: MatchStatus | 'all') => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Finalizada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Partidas */}
        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Carregando partidas...</p>
              </CardContent>
            </Card>
          ) : filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhuma partida encontrada com os filtros aplicados.' 
                    : 'Nenhuma partida encontrada.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {match.team1?.name} vs {match.team2?.name}
                      </CardTitle>
                      <CardDescription>
                        Campeonato: {match.championship?.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(match.status as MatchStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Data: {new Date(match.scheduled_for || match.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {match.scheduled_for && (
                        <p className="text-sm text-muted-foreground">
                          Horário: {new Date(match.scheduled_for).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProcessingMatch(match);
                          setShowRankingProcessor(true);
                        }}
                        disabled={match.status === 'completed' || match.status === 'cancelled'}
                      >
                        <FileImage className="h-4 w-4 mr-1" />
                        Processar Rankings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMatch(match);
                          setUploadDialogOpen(true);
                        }}
                        disabled={match.status === 'completed' || match.status === 'cancelled'}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Manual
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de Upload Manual */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Manual de Resultado</DialogTitle>
              <DialogDescription>
                Envie o resultado da partida {selectedMatch?.team1?.name} vs {selectedMatch?.team2?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="evidence">Evidência (Print/Vídeo) *</Label>
                <Input
                  id="evidence"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição do Resultado *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o resultado da partida..."
                  value={resultDescription}
                  onChange={(e) => setResultDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUploadResult}>
                  Enviar Resultado
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Processamento de Rankings */}
        <Dialog open={showRankingProcessor} onOpenChange={setShowRankingProcessor}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Processar Rankings da Partida</DialogTitle>
              <DialogDescription>
                Partida: {processingMatch?.team1?.name} vs {processingMatch?.team2?.name}
                <br />
                Faça upload de múltiplas imagens de ranking para processar automaticamente os resultados.
              </DialogDescription>
            </DialogHeader>
            <RankingBatchProcessor
              onResultsProcessed={handleRankingResultsProcessed}
              onCancel={() => setShowRankingProcessor(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Matches;