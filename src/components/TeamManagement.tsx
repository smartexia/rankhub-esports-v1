import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Users, Crown, User, Trash2, Edit, UserPlus, Upload, FileText, ArrowUp, ArrowDown, Settings } from 'lucide-react';

interface Team {
  id: string;
  nome_time: string;
  nome_line: string;
  tag?: string;
  logo_url?: string;
  championship_id: string;
  group_id?: string;
  created_at: string;
}

interface TeamManagementProps {
  championshipId: string;
}

export default function TeamManagement({ championshipId }: TeamManagementProps) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [parsedTeams, setParsedTeams] = useState<Array<{nome_time: string, nome_line: string, tag?: string}>>([]);
  const [newTeam, setNewTeam] = useState({
    nome_time: '',
    nome_line: '',
    tag: ''
  });

  const [teamMembers, setTeamMembers] = useState<{[key: string]: any[]}>({});
  const { members, addTeamMember, removeTeamMember, updateMemberRole } = useTeamMembers();

  // Função para carregar membros de um time específico
  const loadTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:users(
            id,
            nome_usuario,
            email,
            role
          )
        `)
        .eq('team_id', teamId);

      if (error) {
        console.error('Erro ao carregar membros do time:', error);
        return;
      }

      setTeamMembers(prev => ({
        ...prev,
        [teamId]: data || []
      }));
    } catch (error) {
      console.error('Erro inesperado ao carregar membros:', error);
    }
  };

  // Carregar times
  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('championship_id', championshipId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Erro ao carregar times:', error);
      toast.error('Erro ao carregar times');
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários disponíveis
  const loadAvailableUsers = async () => {
    if (!user) return;
    
    try {
      // Verificar dados do usuário atual
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('Erro ao verificar usuário:', userError);
        return;
      }

      // Buscar usuários do mesmo tenant que são jogadores
      let query = supabase
        .from('users')
        .select('id, nome_usuario, email')
        .eq('role', 'player');

      // Se não é super admin, filtrar por tenant
      if (userData.role !== 'super_admin' && userData.tenant_id) {
        query = query.eq('tenant_id', userData.tenant_id);
      }

      const { data, error } = await query.order('nome_usuario');

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  useEffect(() => {
    loadTeams();
    loadAvailableUsers();
  }, [championshipId]);

  // Criar time
  const createTeam = async () => {
    if (!newTeam.nome_time) {
      toast.error('Preencha o nome do time');
      return;
    }

    try {
      // Gerar tag automaticamente se não especificada
      let finalTag = newTeam.tag;
      if (!finalTag) {
        const nextNumber = teams.length + 1;
        finalTag = `EQUIPE${nextNumber}`;
      }

      // Se nome_line estiver vazio, usar o nome_time
      const finalNomeLine = newTeam.nome_line || newTeam.nome_time;

      const { error } = await supabase
        .from('teams')
        .insert({
          nome_time: newTeam.nome_time,
          nome_line: finalNomeLine,
          tag: finalTag,
          championship_id: championshipId
        });

      if (error) throw error;

      toast.success('Time criado com sucesso!');
      setNewTeam({ nome_time: '', nome_line: '', tag: '' });
      setShowCreateDialog(false);
      loadTeams();
    } catch (error) {
      console.error('Erro ao criar time:', error);
      toast.error('Erro ao criar time');
    }
  };

  // Deletar time
  const deleteTeam = async (teamId: string) => {
    if (!confirm('Tem certeza que deseja deletar este time?')) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast.success('Time deletado com sucesso!');
      loadTeams();
    } catch (error) {
      console.error('Erro ao deletar time:', error);
      toast.error('Erro ao deletar time');
    }
  };

  // Função para analisar texto em lote
  const parseBatchText = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const teams: Array<{nome_time: string, nome_line: string, tag?: string}> = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Formato: "Nome do Time | Nome da Line | TAG"
      if (trimmedLine.includes('|')) {
        const parts = trimmedLine.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          teams.push({
            nome_time: parts[0],
            nome_line: parts[1],
            tag: parts[2] || undefined
          });
        }
      }
      // Formato: "Nome do Time - Nome da Line - TAG"
      else if (trimmedLine.includes(' - ')) {
        const parts = trimmedLine.split(' - ').map(p => p.trim());
        if (parts.length >= 2) {
          teams.push({
            nome_time: parts[0],
            nome_line: parts[1],
            tag: parts[2] || undefined
          });
        }
      }
      // Formato simples: apenas nome do time (usa o mesmo nome para line)
      else {
        teams.push({
          nome_time: trimmedLine,
          nome_line: trimmedLine,
          tag: undefined
        });
      }
    });
    
    return teams;
  };

  // Processar texto em lote
  const processBatchText = () => {
    if (!batchText.trim()) {
      toast.error('Digite a lista de times');
      return;
    }
    
    const parsed = parseBatchText(batchText);
    if (parsed.length === 0) {
      toast.error('Nenhum time válido encontrado');
      return;
    }
    
    setParsedTeams(parsed);
    toast.success(`${parsed.length} time(s) processado(s)`);
  };

  // Criar times em lote
  const createBatchTeams = async () => {
    if (parsedTeams.length === 0) {
      toast.error('Nenhum time para criar');
      return;
    }
    
    try {
      const teamsToInsert = parsedTeams.map((team, index) => ({
        nome_time: team.nome_time,
        nome_line: team.nome_line,
        tag: team.tag || `EQUIPE${teams.length + index + 1}`,
        championship_id: championshipId
      }));
      
      const { error } = await supabase
        .from('teams')
        .insert(teamsToInsert);
        
      if (error) throw error;
      
      toast.success(`${parsedTeams.length} time(s) criado(s) com sucesso!`);
      setBatchText('');
      setParsedTeams([]);
      setShowBatchDialog(false);
      loadTeams();
    } catch (error) {
      console.error('Erro ao criar times em lote:', error);
      toast.error('Erro ao criar times em lote');
    }
  };

  // Remover time da lista processada
  const removeParsedTeam = (index: number) => {
    setParsedTeams(prev => prev.filter((_, i) => i !== index));
  };

  // Mover time para cima na ordem
  const moveTeamUp = async (currentIndex: number) => {
    if (currentIndex === 0) return;
    
    const teamToMove = teams[currentIndex];
    const teamAbove = teams[currentIndex - 1];
    
    try {
      // Trocar as posições dos times baseado no created_at
      const tempDate = new Date(teamToMove.created_at);
      const aboveDate = new Date(teamAbove.created_at);
      
      // Ajustar os timestamps para trocar as posições
      const newDateForTeamToMove = new Date(aboveDate.getTime() - 1000); // 1 segundo antes
      const newDateForTeamAbove = new Date(tempDate.getTime() + 1000); // 1 segundo depois
      
      // Atualizar ambos os times
      const { error: error1 } = await supabase
        .from('teams')
        .update({ created_at: newDateForTeamToMove.toISOString() })
        .eq('id', teamToMove.id);
        
      if (error1) throw error1;
      
      const { error: error2 } = await supabase
        .from('teams')
        .update({ created_at: newDateForTeamAbove.toISOString() })
        .eq('id', teamAbove.id);
        
      if (error2) throw error2;
      
      await loadTeams();
      toast.success('Posição alterada com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar posição:', error);
      toast.error('Erro ao alterar posição');
    }
  };
  
  // Mover time para baixo na ordem
  const moveTeamDown = async (currentIndex: number) => {
    if (currentIndex === teams.length - 1) return;
    
    const teamToMove = teams[currentIndex];
    const teamBelow = teams[currentIndex + 1];
    
    try {
      // Trocar as posições dos times baseado no created_at
      const tempDate = new Date(teamToMove.created_at);
      const belowDate = new Date(teamBelow.created_at);
      
      // Ajustar os timestamps para trocar as posições
      const newDateForTeamToMove = new Date(belowDate.getTime() + 1000); // 1 segundo depois
      const newDateForTeamBelow = new Date(tempDate.getTime() - 1000); // 1 segundo antes
      
      // Atualizar ambos os times
      const { error: error1 } = await supabase
        .from('teams')
        .update({ created_at: newDateForTeamToMove.toISOString() })
        .eq('id', teamToMove.id);
        
      if (error1) throw error1;
      
      const { error: error2 } = await supabase
        .from('teams')
        .update({ created_at: newDateForTeamBelow.toISOString() })
        .eq('id', teamBelow.id);
        
      if (error2) throw error2;
      
      await loadTeams();
      toast.success('Posição alterada com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar posição:', error);
      toast.error('Erro ao alterar posição');
    }
  };

  // Abrir diálogo de membros
  const openMembersDialog = async (team: Team) => {
    setSelectedTeam(team);
    setShowMembersDialog(true);
    await loadTeamMembers(team.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-orbitron font-bold">Gestão de Times</h2>
          <p className="text-muted-foreground">Gerencie os times e seus membros</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Criar Time
          </Button>
          <Button 
            onClick={() => setShowBatchDialog(true)} 
            variant="outline" 
            className="border-primary/20 hover:bg-primary/10"
          >
            <Upload className="w-4 h-4 mr-2" />
            Inserir em Lote
          </Button>
          {teams.length > 1 && (
            <Button 
              onClick={() => setShowPositionDialog(true)} 
              variant="outline" 
              className="border-primary/20 hover:bg-primary/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Gerenciar Posições
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Times */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team, index) => (
            <Card key={team.id} className="bg-gradient-dark border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      {team.tag || `EQUIPE${index + 1}`}
                    </Badge>
                    <div>
                      <CardTitle className="text-lg">{team.nome_time}</CardTitle>
                      <p className="text-sm text-muted-foreground">{team.nome_line}</p>
                    </div>
                  </div>
                  {team.tag && (
                    <Badge variant="secondary">{team.tag}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Users className="h-4 w-4" />
                  <span>{(teamMembers && teamMembers[team.id] && teamMembers[team.id].length) || 0} membros</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openMembersDialog(team)}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Membros
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveTeamUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveTeamDown(index)}
                      disabled={index === teams.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTeam(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-dark border-primary/20">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum time encontrado</h3>
            <p className="text-muted-foreground mb-4">Crie o primeiro time para este campeonato</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Time
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criação de Time */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome_time">Nome do Time *</Label>
              <Input
                id="nome_time"
                value={newTeam.nome_time}
                onChange={(e) => setNewTeam({ ...newTeam, nome_time: e.target.value })}
                placeholder="Ex: Team Alpha"
              />
            </div>
            <div>
              <Label htmlFor="nome_line">Nome da Line</Label>
              <Input
                id="nome_line"
                value={newTeam.nome_line}
                onChange={(e) => setNewTeam({ ...newTeam, nome_line: e.target.value })}
                placeholder="Ex: Alpha Squad"
              />
            </div>
            <div>
              <Label htmlFor="tag">Tag (Opcional)</Label>
              <Input
                id="tag"
                value={newTeam.tag}
                onChange={(e) => setNewTeam({ ...newTeam, tag: e.target.value })}
                placeholder="Ex: ALPHA"
                maxLength={10}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={createTeam} className="flex-1">
                Criar Time
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Inserção em Lote */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Inserir Times em Lote</DialogTitle>
            <DialogDescription>
              Cole a lista de times abaixo. Formatos aceitos:
              <br />• Nome do Time | Nome da Line | TAG
              <br />• Nome do Time - Nome da Line - TAG
              <br />• Nome do Time (usará o mesmo nome para a line)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="batch-text">Lista de Times</Label>
              <textarea
                id="batch-text"
                className="w-full h-32 p-3 border rounded-md resize-none bg-background"
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="Cole aqui a lista de times...\nEx:\nShot Team | Shot Squad | SHOT\nAlpha Team | Alpha Line | ALPHA"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={processBatchText} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Processar Lista
              </Button>
            </div>

            {parsedTeams.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Times Processados ({parsedTeams.length})</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {parsedTeams.map((team, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{team.tag || `EQUIPE${index + 1}`}</Badge>
                        <div>
                          <p className="font-medium">{team.nome_time}</p>
                          <p className="text-sm text-muted-foreground">{team.nome_line}</p>
                          {team.tag && (
                            <Badge variant="secondary" className="text-xs">{team.tag}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeParsedTeam(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={createBatchTeams} 
                disabled={parsedTeams.length === 0}
                className="flex-1"
              >
                Criar {parsedTeams.length} Time(s)
              </Button>
              <Button variant="outline" onClick={() => setShowBatchDialog(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Gestão de Posições */}
      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Posições dos Times</DialogTitle>
            <DialogDescription>
              Reordene os times para definir suas posições (EQUIPE1, EQUIPE2, etc.). 
              Esta ordem será usada para o cálculo automático de pontos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {teams.map((team, index) => (
              <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="bg-primary text-primary-foreground min-w-[70px]">
                    Equipe{index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{team.nome_time}</p>
                    <p className="text-sm text-muted-foreground">{team.nome_line}</p>
                  </div>
                  {team.tag && (
                    <Badge variant="secondary">{team.tag}</Badge>
                  )}
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveTeamUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveTeamDown(index)}
                    disabled={index === teams.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowPositionDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gestão de Membros */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Membros do {selectedTeam?.nome_time}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Membros atuais */}
            <div>
              <h4 className="font-semibold mb-3">Membros Atuais</h4>
              {(teamMembers && selectedTeam?.id && teamMembers[selectedTeam.id] && teamMembers[selectedTeam.id].length > 0) ? (
                <div className="space-y-2">
                  {teamMembers[selectedTeam.id].map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex items-center gap-3">
                        {member.role === 'captain' ? (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">{member.user?.nome_usuario || 'Usuário não encontrado'}</div>
                          <div className="text-sm text-muted-foreground">{member.user?.email || 'Email não disponível'}</div>
                          <div className="text-xs text-muted-foreground">
                            {member.role === 'captain' ? 'Capitão' : 'Jogador'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => updateMemberRole(member.id, value as 'player' | 'captain')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="player">Jogador</SelectItem>
                            <SelectItem value="captain">Capitão</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTeamMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum membro no time</p>
              )}
            </div>

            {/* Adicionar membros */}
            <div>
              <h4 className="font-semibold mb-3">Adicionar Membros</h4>
              {availableUsers.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div>
                        <p className="font-medium">{user.nome_usuario}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addTeamMember(user.id, 'player')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum usuário disponível</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};