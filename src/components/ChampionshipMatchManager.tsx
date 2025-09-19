import React, { useState, useEffect, useCallback } from 'react';
import {
  createMatch,
  getMatchesByChampionship,
  updateMatch,
  deleteMatch,
} from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MoreHorizontal, Upload } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import MatchResultsManager from './MatchResultsManager';

interface Match {
  id: string;
  championship_id: string;
  match_number: number;
  scheduled_time: string;
  status: string;
}

interface Team {
  id: string;
  nome: string;
  championship_id: string;
}

interface ChampionshipMatchManagerProps {
  championshipId: string;
}

export default function ChampionshipMatchManager({
  championshipId,
}: ChampionshipMatchManagerProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPrintsDialog, setShowPrintsDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [newMatchData, setNewMatchData] = useState({
    match_number: 1,
    scheduled_time: '',
    status: 'agendada',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [matchesResponse, teamsResponse] = await Promise.allSettled([
        getMatchesByChampionship(championshipId),
        supabase.from('teams').select('*').eq('championship_id', championshipId)
      ]);

      if (matchesResponse.status === 'fulfilled' && !matchesResponse.value.error) {
        setMatches(matchesResponse.value.data || []);
      } else {
        console.error('Erro ao carregar partidas:', matchesResponse.status === 'fulfilled' ? matchesResponse.value.error : matchesResponse.reason);
        toast.error('Erro ao carregar as partidas.');
      }

      if (teamsResponse.status === 'fulfilled' && !teamsResponse.value.error) {
        setTeams(teamsResponse.value.data || []);
      } else {
        console.error('Erro ao carregar times:', teamsResponse.status === 'fulfilled' ? teamsResponse.value.error : teamsResponse.reason);
        toast.error('Erro ao carregar os times.');
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateMatch = async () => {
    try {
      const { data, error } = await createMatch({
        championship_id: championshipId,
        ...newMatchData,
      });
      if (error) throw error;
      toast.success('Partida criada com sucesso!');
      setShowCreateDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar a partida.');
    }
  };

  const handleUpdateMatch = async () => {
    if (!selectedMatch) return;
    try {
      const { data, error } = await updateMatch(selectedMatch.id, {
        scheduled_time: selectedMatch.scheduled_time,
        status: selectedMatch.status,
      });
      if (error) throw error;
      toast.success('Partida atualizada com sucesso!');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar a partida.');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      const { error } = await deleteMatch(matchId);
      if (error) throw error;
      toast.success('Partida excluída com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir a partida.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Partidas</CardTitle>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Criar Partida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Partida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="match_number">Número da Partida</Label>
                <Input
                  id="match_number"
                  type="number"
                  value={newMatchData.match_number}
                  onChange={(e) =>
                    setNewMatchData({
                      ...newMatchData,
                      match_number: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="scheduled_time">Data e Hora</Label>
                <Input
                  id="scheduled_time"
                  type="datetime-local"
                  value={newMatchData.scheduled_time}
                  onChange={(e) =>
                    setNewMatchData({
                      ...newMatchData,
                      scheduled_time: e.target.value,
                    })
                  }
                />
              </div>
              <Button onClick={handleCreateMatch}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>Carregando...</TableCell>
              </TableRow>
            ) : (
              matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>{match.match_number}</TableCell>
                  <TableCell>
                    {new Date(match.scheduled_time).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{match.status}</TableCell>
                  <TableCell>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMatch(match);
                            setShowPrintsDialog(true);
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Prints
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMatch(match);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteMatch(match.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Partida</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_scheduled_time">Data e Hora</Label>
                <Input
                  id="edit_scheduled_time"
                  type="datetime-local"
                  value={selectedMatch.scheduled_time}
                  onChange={(e) =>
                    setSelectedMatch({
                      ...selectedMatch,
                      scheduled_time: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Input
                  id="edit_status"
                  value={selectedMatch.status}
                  onChange={(e) =>
                    setSelectedMatch({
                      ...selectedMatch,
                      status: e.target.value,
                    })
                  }
                />
              </div>
              <Button onClick={handleUpdateMatch}>Salvar Alterações</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showPrintsDialog} onOpenChange={setShowPrintsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Prints da Partida #{selectedMatch?.match_number}</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
          <MatchResultsManager 
            matchId={selectedMatch.id} 
            teams={teams}
            onResultsChange={() => {
              // Refresh match data if needed
              console.log('Match results updated');
            }}
          />
        )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}