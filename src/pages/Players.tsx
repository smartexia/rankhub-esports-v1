import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import Layout from '../components/Layout';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, User, Calendar } from 'lucide-react';

interface Player {
  id: string;
  email: string;
  nome_usuario: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  tenant_id: string | null;
  data_cadastro: string;
  auth_user_id: string;
}

interface Tenant {
  id: string;
  nome: string;
}

const Players: React.FC = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    nome_usuario: '',
    role: 'viewer' as Player['role'],
    tenant_id: ''
  });

  const loadPlayers = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          tenants(nome)
        `)
        .order('data_cadastro', { ascending: false });

      if (error) {
        console.error('Erro ao carregar jogadores:', error);
        toast.error('Erro ao carregar jogadores');
        return;
      }

      setPlayers(data || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      toast.error('Erro ao carregar jogadores');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTenants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, nome')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar tenants:', error);
        return;
      }

      setTenants(data || []);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
    loadTenants();
  }, [loadPlayers, loadTenants]);

  const handleCreatePlayer = async () => {
    if (!formData.email || !formData.nome_usuario) {
      toast.error('Email e nome de usuário são obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .insert({
          email: formData.email,
          nome_usuario: formData.nome_usuario,
          role: formData.role,
          tenant_id: formData.tenant_id || null
        });

      if (error) {
        console.error('Erro ao criar jogador:', error);
        toast.error('Erro ao criar jogador');
        return;
      }

      toast.success('Jogador criado com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData({ email: '', nome_usuario: '', role: 'viewer', tenant_id: '' });
      loadPlayers();
    } catch (error) {
      console.error('Erro ao criar jogador:', error);
      toast.error('Erro ao criar jogador');
    }
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      email: player.email,
      nome_usuario: player.nome_usuario,
      role: player.role,
      tenant_id: player.tenant_id || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer || !formData.email || !formData.nome_usuario) {
      toast.error('Email e nome de usuário são obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          email: formData.email,
          nome_usuario: formData.nome_usuario,
          role: formData.role,
          tenant_id: formData.tenant_id || null
        })
        .eq('id', editingPlayer.id);

      if (error) {
        console.error('Erro ao atualizar jogador:', error);
        toast.error('Erro ao atualizar jogador');
        return;
      }

      toast.success('Jogador atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setEditingPlayer(null);
      setFormData({ email: '', nome_usuario: '', role: 'viewer', tenant_id: '' });
      loadPlayers();
    } catch (error) {
      console.error('Erro ao atualizar jogador:', error);
      toast.error('Erro ao atualizar jogador');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este jogador?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', playerId);

      if (error) {
        console.error('Erro ao excluir jogador:', error);
        toast.error('Erro ao excluir jogador');
        return;
      }

      toast.success('Jogador excluído com sucesso!');
      loadPlayers();
    } catch (error) {
      console.error('Erro ao excluir jogador:', error);
      toast.error('Erro ao excluir jogador');
    }
  };

  const getRoleBadgeVariant = (role: Player['role']) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: Player['role']) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      default:
        return 'Viewer';
    }
  };

  if (loading) {
    return (
      <Layout 
        title="Gerenciamento de Jogadores" 
        description="Gerencie todos os jogadores da plataforma"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando jogadores...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Gerenciamento de Jogadores" 
      description="Gerencie todos os jogadores da plataforma"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-rajdhani">Jogadores</h1>
            <p className="text-muted-foreground">
              Gerencie os jogadores da plataforma
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary glow-red font-rajdhani font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Jogador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-rajdhani">Adicionar Novo Jogador</DialogTitle>
                <DialogDescription>
                  Preencha as informações do novo jogador.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nome_usuario">Nome de Usuário *</Label>
                  <Input
                    id="nome_usuario"
                    value={formData.nome_usuario}
                    onChange={(e) => setFormData({ ...formData, nome_usuario: e.target.value })}
                    placeholder="Nome do jogador"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={formData.role} onValueChange={(value: Player['role']) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenant">Organização</Label>
                  <Select value={formData.tenant_id} onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma organização" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma organização</SelectItem>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePlayer} className="gradient-primary">
                  Criar Jogador
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-rajdhani flex items-center gap-2">
              <User className="h-5 w-5" />
              Lista de Jogadores
            </CardTitle>
            <CardDescription>
              {players.length} jogador(es) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.nome_usuario}</TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(player.role)}>
                        {getRoleLabel(player.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {player.tenant_id ? (
                        <span className="text-sm">
                          {tenants.find(t => t.id === player.tenant_id)?.nome || 'N/A'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhuma</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(player.data_cadastro).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPlayer(player)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlayer(player.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {players.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum jogador encontrado</p>
                <p className="text-sm">Clique em "Adicionar Jogador" para começar</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-rajdhani">Editar Jogador</DialogTitle>
              <DialogDescription>
                Atualize as informações do jogador.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nome_usuario">Nome de Usuário *</Label>
                <Input
                  id="edit-nome_usuario"
                  value={formData.nome_usuario}
                  onChange={(e) => setFormData({ ...formData, nome_usuario: e.target.value })}
                  placeholder="Nome do jogador"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Função</Label>
                <Select value={formData.role} onValueChange={(value: Player['role']) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant">Organização</Label>
                <Select value={formData.tenant_id} onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma organização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma organização</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdatePlayer} className="gradient-primary">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Players;