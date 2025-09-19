import { useEffect, useState } from 'react';
import { getRanking, calculateRanking } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Ranking {
  id: string;
  team_id: string;
  position: number;
  points: number;
  kills: number;
  matches_played: number;
  teams: {
    nome_time: string;
    logo_url: string;
  };
}

interface RankingTableProps {
  championshipId: string;
}

export const RankingTable = ({ championshipId }: RankingTableProps) => {
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      const data = await getRanking(championshipId);
      setRanking(data);
    } catch (error) {
      toast.error('Erro ao buscar o ranking.');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRanking = async () => {
    try {
      await calculateRanking(championshipId);
      toast.success('Ranking calculado com sucesso!');
      fetchRanking();
    } catch (error) {
      toast.error('Erro ao calcular o ranking.');
    }
  };

  useEffect(() => {
    if (championshipId) {
      fetchRanking();
    }
  }, [championshipId]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCalculateRanking}>Calcular Ranking</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Posição</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Pontos</TableHead>
            <TableHead>Abates</TableHead>
            <TableHead>Partidas Jogadas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
            </TableRow>
          ) : (
            ranking.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.position}</TableCell>
                <TableCell className="flex items-center">
                  <img src={row.teams.logo_url} alt={row.teams.nome_time} className="w-8 h-8 mr-4 rounded-full" />
                  {row.teams.nome_time}
                </TableCell>
                <TableCell>{row.points}</TableCell>
                <TableCell>{row.kills}</TableCell>
                <TableCell>{row.matches_played}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};