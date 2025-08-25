import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Trophy, Target, Upload, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import TeamMembersManager from '@/components/TeamMembersManager';
import { useAuth } from '@/hooks/useAuth';

interface Team {
  id: string;
  nome_time: string;
  nome_line: string;
  tag: string | null;
  logo_url: string | null;
  championship_id: string;
  group_id: string | null;
  created_at: string | null;
  championship?: {
    nome: string;
    status: string;
  };
  group?: {
    nome_grupo: string;
  };
}

interface Championship {
  id: string;
  nome: string;
  status: string;
}

interface Group {
  id: string;
  nome_grupo: string;
  championship_id: string;
}

const Teams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChampionship, setSelectedChampionship] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    nome_time: '',
    nome_line: '',
    tag: '',
    logo_url: '',
    championship_id: '',
    group_id: ''
  });

  useEffect(() => {
    fetchTeams();
    fetchChampionships();
  }, []);

  useEffect(() => {
    if (formData.championship_id) {
      fetchGroups(formData.championship_id);
    }
  }, [formData.championship_id]);

  const fetchTeams = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Buscar dados do usuário para verificar tenant e role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        toast.error('Erro ao verificar permissões');
        return;
      }

      // Se não é super admin e não tem tenant_id, não pode ver times
      if (userData.role !== 'super_admin' && !userData.tenant_id) {
        toast.error('Usuário não possui organização associada');
        setTeams([]);
        return;
      }

      let query = supabase
        .from('teams')
        .select(`
          *,
          championship:championships(nome, status, tenant_id),
          group:groups(nome_grupo)
        `);

      // Se não é super admin, filtrar por tenant_id através do championship
      if (userData.role !== 'super_admin') {
        query = query.eq('championship.tenant_id', userData.tenant_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      toast.error('Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  const fetchChampionships = async () => {
    if (!user) return;

    try {
      // Buscar dados do usuário para verificar tenant e role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        return;
      }

      let query = supabase
        .from('championships')
        .select('id, nome, status, tenant_id');

      // Se não é super admin, filtrar por tenant_id
      if (userData.role !== 'super_admin') {
        query = query.eq('tenant_id', userData.tenant_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setChampionships(data || []);
    } catch (error) {
      console.error('Erro ao buscar campeonatos:', error);
    }
  };

  const fetchGroups = async (championshipId: string) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, nome_grupo, championship_id')
        .eq('championship_id', championshipId)
        .order('nome_grupo');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!formData.nome_time || !formData.nome_line) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Verificar permissões do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        toast.error('Erro ao verificar permissões');
        return;
      }

      // Verificar se o usuário pode criar times (manager, co_manager ou super_admin)
      if (!['manager', 'co_manager', 'super_admin'].includes(userData.role)) {
        toast.error('Você não tem permissão para criar times');
        return;
      }

      // Verificar se o campeonato pertence ao tenant do usuário (exceto super_admin) - apenas se um campeonato foi selecionado
      if (formData.championship_id && formData.championship_id !== 'none' && userData.role !== 'super_admin') {
        const { data: championshipData, error: championshipError } = await supabase
          .from('championships')
          .select('tenant_id')
          .eq('id', formData.championship_id)
          .single();

        if (championshipError || championshipData.tenant_id !== userData.tenant_id) {
          toast.error('Você não pode criar times neste campeonato');
          return;
        }
      }

      const { error } = await supabase
        .from('teams')
        .insert({
          nome_time: formData.nome_time,
          nome_line: formData.nome_line,
          tag: formData.tag || null,
          logo_url: formData.logo_url || null,
          championship_id: formData.championship_id === 'none' ? null : formData.championship_id || null,
          group_id: formData.group_id || null
        });

      if (error) throw error;

      toast.success('Equipe criada com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchTeams();
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      toast.error('Erro ao criar equipe');
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam || !formData.nome_time || !formData.nome_line) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Verificar permissões do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        toast.error('Erro ao verificar permissões');
        return;
      }

      // Verificar se o usuário pode editar times (manager, co_manager ou super_admin)
      if (!['manager', 'co_manager', 'super_admin'].includes(userData.role)) {
        toast.error('Você não tem permissão para editar times');
        return;
      }

      // Verificar se o time pertence ao tenant do usuário (exceto super_admin)
      if (userData.role !== 'super_admin') {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            championship_id,
            championships(tenant_id)
          `)
          .eq('id', editingTeam.id)
          .single();

        if (teamError || teamData.championships?.tenant_id !== userData.tenant_id) {
          toast.error('Você não pode editar este time');
          return;
        }
      }

      const { error } = await supabase
        .from('teams')
        .update({
          nome_time: formData.nome_time,
          nome_line: formData.nome_line,
          tag: formData.tag || null,
          logo_url: formData.logo_url || null,
          championship_id: formData.championship_id === 'none' ? null : formData.championship_id || null,
          group_id: formData.group_id || null
        })
        .eq('id', editingTeam.id);

      if (error) throw error;

      toast.success('Equipe atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setEditingTeam(null);
      resetForm();
      fetchTeams();
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      toast.error('Erro ao atualizar equipe');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta equipe?')) {
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Verificar permissões do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        toast.error('Erro ao verificar permissões');
        return;
      }

      // Verificar se o usuário pode deletar times (manager, co_manager ou super_admin)
      if (!['manager', 'co_manager', 'super_admin'].includes(userData.role)) {
        toast.error('Você não tem permissão para excluir times');
        return;
      }

      // Verificar se o time pertence ao tenant do usuário (exceto super_admin)
      if (userData.role !== 'super_admin') {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            championship_id,
            championships(tenant_id)
          `)
          .eq('id', teamId)
          .single();

        if (teamError || teamData.championships?.tenant_id !== userData.tenant_id) {
          toast.error('Você não pode excluir este time');
          return;
        }
      }

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast.success('Equipe excluída com sucesso!');
      fetchTeams();
    } catch (error) {
      console.error('Erro ao excluir equipe:', error);
      toast.error('Erro ao excluir equipe');
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      nome_time: team.nome_time,
      nome_line: team.nome_line,
      tag: team.tag || '',
      logo_url: team.logo_url || '',
      championship_id: team.championship_id || 'none',
      group_id: team.group_id || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome_time: '',
      nome_line: '',
      tag: '',
      logo_url: '',
      championship_id: '',
      group_id: ''
    });
    setGroups([]);
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.nome_time.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.nome_line.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (team.tag && team.tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesChampionship = selectedChampionship === 'all' || team.championship_id === selectedChampionship;
    
    return matchesSearch && matchesChampionship;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500';
      case 'finalizado': return 'bg-gray-500';
      case 'rascunho': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-secondary rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-secondary rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title="Gerenciamento de Equipes" 
      description="Gerencie todas as equipes dos seus campeonatos"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Create Team Dialog */}
        <div className="flex justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-rajdhani">
                <Plus className="h-4 w-4 mr-2" />
                Nova Equipe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-orbitron">Criar Nova Equipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome_time">Nome da Equipe *</Label>
                  <Input
                    id="nome_time"
                    value={formData.nome_time}
                    onChange={(e) => setFormData({ ...formData, nome_time: e.target.value })}
                    placeholder="Ex: Team Alpha"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nome_line">Nome da Line *</Label>
                  <Input
                    id="nome_line"
                    value={formData.nome_line}
                    onChange={(e) => setFormData({ ...formData, nome_line: e.target.value })}
                    placeholder="Ex: Alpha Squad"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tag">Tag</Label>
                  <Input
                    id="tag"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="Ex: ALPHA"
                    maxLength={10}
                  />
                </div>
                
                <div>
                  <Label htmlFor="logo_url">URL do Logo</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                
                <div>
                  <Label htmlFor="championship">Campeonato</Label>
                  <Select value={formData.championship_id} onValueChange={(value) => setFormData({ ...formData, championship_id: value, group_id: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um campeonato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum campeonato</SelectItem>
                      {championships.map((championship) => (
                        <SelectItem key={championship.id} value={championship.id}>
                          {championship.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {groups.length > 0 && (
                  <div>
                    <Label htmlFor="group">Grupo</Label>
                    <Select value={formData.group_id} onValueChange={(value) => setFormData({ ...formData, group_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um grupo (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum grupo</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.nome_grupo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateTeam} className="flex-1">
                    Criar Equipe
                  </Button>
                  <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar equipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrar por campeonato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os campeonatos</SelectItem>
              {championships.map((championship) => (
                <SelectItem key={championship.id} value={championship.id}>
                  {championship.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Equipes</p>
                  <p className="text-2xl font-bold text-foreground">{teams.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Campeonatos Ativos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {championships.filter(c => c.status === 'ativo').length}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Equipes Filtradas</p>
                  <p className="text-2xl font-bold text-foreground">{filteredTeams.length}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma equipe encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedChampionship !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira equipe'
                }
              </p>
              {!searchTerm && selectedChampionship === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Equipe
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <Card key={team.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={`Logo ${team.nome_time}`}
                          className="w-10 h-10 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg font-orbitron">{team.nome_time}</CardTitle>
                        {team.tag && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {team.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTeamForMembers(team);
                          setIsMembersDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                        title="Gerenciar Jogadores"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(team)}
                        className="h-8 w-8 p-0"
                        title="Editar Time"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTeam(team.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Deletar Time"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Line</p>
                      <p className="font-medium">{team.nome_line}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Campeonato</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{team.championship?.nome}</p>
                        {team.championship?.status && (
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(team.championship.status)}`}></div>
                        )}
                      </div>
                    </div>
                    
                    {team.group && (
                      <div>
                        <p className="text-sm text-muted-foreground">Grupo</p>
                        <p className="font-medium">{team.group.nome_grupo}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Criado em</p>
                      <p className="text-sm">
                        {team.created_at ? new Date(team.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Team Members Dialog */}
        <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-orbitron">
                Gerenciar Jogadores - {selectedTeamForMembers?.nome_time}
              </DialogTitle>
            </DialogHeader>
            {selectedTeamForMembers && (
              <TeamMembersManager 
                teamId={selectedTeamForMembers.id} 
                teamName={selectedTeamForMembers.nome_time}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-orbitron">Editar Equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_nome_time">Nome da Equipe *</Label>
                <Input
                  id="edit_nome_time"
                  value={formData.nome_time}
                  onChange={(e) => setFormData({ ...formData, nome_time: e.target.value })}
                  placeholder="Ex: Team Alpha"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_nome_line">Nome da Line *</Label>
                <Input
                  id="edit_nome_line"
                  value={formData.nome_line}
                  onChange={(e) => setFormData({ ...formData, nome_line: e.target.value })}
                  placeholder="Ex: Alpha Squad"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_tag">Tag</Label>
                <Input
                  id="edit_tag"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="Ex: ALPHA"
                  maxLength={10}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_logo_url">URL do Logo</Label>
                <Input
                  id="edit_logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_championship">Campeonato</Label>
                <Select value={formData.championship_id} onValueChange={(value) => setFormData({ ...formData, championship_id: value, group_id: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um campeonato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum campeonato</SelectItem>
                    {championships.map((championship) => (
                      <SelectItem key={championship.id} value={championship.id}>
                        {championship.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {groups.length > 0 && (
                <div>
                  <Label htmlFor="edit_group">Grupo</Label>
                  <Select value={formData.group_id} onValueChange={(value) => setFormData({ ...formData, group_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um grupo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum grupo</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.nome_grupo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditTeam} className="flex-1">
                  Salvar Alterações
                </Button>
                <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingTeam(null); resetForm(); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Teams;