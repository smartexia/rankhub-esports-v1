import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Shield, Users, Search, UserCog, Building2, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  nome_usuario: string;
  role: string;
  tenant_id: string | null;
  data_cadastro: string;
  auth_user_id: string;
}

interface Tenant {
  id: string;
  nome: string;
  manager_id: string | null;
  data_criacao: string;
  status: string;
}

const SuperAdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [newTenantName, setNewTenantName] = useState('');
  const [selectedUserForInvite, setSelectedUserForInvite] = useState('');
  const [selectedTenantForInvite, setSelectedTenantForInvite] = useState('');
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);

  useEffect(() => {
    checkSuperAdminAccess();
  }, [user]);

  const checkSuperAdminAccess = async () => {
    if (!user) return;

    try {
      console.log('🔍 Verificando acesso para email:', user.email);
      
      // Lista de emails autorizados como super admin
      const superAdminEmails = ['smartexautomacoes@gmail.com', 'admin@rankhub.com'];
      
      if (!superAdminEmails.includes(user.email || '')) {
        console.log('🚫 Acesso negado - Email não autorizado:', user.email);
        toast.error('Acesso negado. Apenas super administradores podem acessar este painel.');
        return;
      }

      console.log('✅ Acesso liberado para super admin');
      await loadData();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      toast.error('Erro ao verificar permissões de acesso.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar todos os usuários
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('data_cadastro', { ascending: false });

      if (usersError) throw usersError;

      // Carregar todos os tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (tenantsError) throw tenantsError;

      setUsers(usersData || []);
      setTenants(tenantsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do sistema.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Role do usuário atualizada com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role do usuário.');
    }
  };

  const createTenant = async () => {
    if (!newTenantName.trim()) {
      toast.error('Nome da organização é obrigatório.');
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .insert({
          nome: newTenantName.trim(),
          status: 'ativo'
        });

      if (error) throw error;

      toast.success('Organização criada com sucesso!');
      setNewTenantName('');
      setIsCreateTenantOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      toast.error('Erro ao criar organização.');
    }
  };

  const inviteUserToTenant = async () => {
    if (!selectedUserForInvite || !selectedTenantForInvite) {
      toast.error('Selecione um usuário e uma organização.');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ tenant_id: selectedTenantForInvite })
        .eq('id', selectedUserForInvite);

      if (error) throw error;

      toast.success('Usuário convidado para a organização com sucesso!');
      setSelectedUserForInvite('');
      setSelectedTenantForInvite('');
      setIsInviteUserOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao convidar usuário:', error);
      toast.error('Erro ao convidar usuário para a organização.');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      'super_admin': 'bg-purple-500',
      'manager': 'bg-red-500',
      'co-manager': 'bg-orange-500',
      'team-captain': 'bg-blue-500',
      'player': 'bg-green-500',
      'viewer': 'bg-gray-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return 'Sem organização';
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.nome || 'Organização não encontrada';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.nome_usuario?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const usersWithoutTenant = users.filter(user => !user.tenant_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Painel Super Admin
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Gerenciamento global do sistema RankHub
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Total de Usuários</p>
                  <p className="text-3xl font-bold text-white">{users.length}</p>
                  <p className="text-xs text-blue-200 mt-1">Usuários registrados</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100">Organizações</p>
                  <p className="text-3xl font-bold text-white">{tenants.length}</p>
                  <p className="text-xs text-green-200 mt-1">Organizações ativas</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-100">Super Admins</p>
                  <p className="text-3xl font-bold text-white">
                    {users.filter(u => u.role === 'super_admin').length}
                  </p>
                  <p className="text-xs text-purple-200 mt-1">Super administradores</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <UserCog className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-red-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-100">Sem Organização</p>
                  <p className="text-3xl font-bold text-white">{usersWithoutTenant.length}</p>
                  <p className="text-xs text-orange-200 mt-1">Usuários disponíveis</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/90 backdrop-blur-sm border border-gray-700 shadow-lg rounded-2xl p-2">
            <TabsTrigger 
              value="users" 
              className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Usuários
            </TabsTrigger>
            <TabsTrigger 
              value="tenants" 
              className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Gerenciar Organizações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-gray-700">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                    <CardDescription>
                      Visualize e gerencie todos os usuários do sistema
                    </CardDescription>
                  </div>
                  <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar para Organização
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-gray-900/95 backdrop-blur-sm border border-gray-700 shadow-2xl rounded-2xl">
                      <DialogHeader className="text-center pb-4">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Convidar Usuário para Organização
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 mt-2">
                          Selecione um usuário sem organização e uma organização de destino.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="user-select" className="text-sm font-semibold text-gray-300">Usuário</Label>
                          <Select value={selectedUserForInvite} onValueChange={setSelectedUserForInvite}>
                            <SelectTrigger className="w-full rounded-xl border-gray-600 bg-gray-800/50 text-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300">
                              <SelectValue placeholder="Selecione um usuário" />
                            </SelectTrigger>
                            <SelectContent>
                              {usersWithoutTenant.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.email} ({user.nome_usuario})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tenant-select" className="text-sm font-semibold text-gray-300">Organização</Label>
                          <Select value={selectedTenantForInvite} onValueChange={setSelectedTenantForInvite}>
                            <SelectTrigger className="w-full rounded-xl border-gray-600 bg-gray-800/50 text-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-300">
                              <SelectValue placeholder="Selecione uma organização" />
                            </SelectTrigger>
                            <SelectContent>
                              {tenants.map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                  {tenant.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="pt-6 flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsInviteUserOpen(false)}
                          className="flex-1 border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-300"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={inviteUserToTenant}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Convidar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Filtros */}
                <div className="flex gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por email ou nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl border-gray-600 bg-gray-800/50 text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as roles</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="co-manager">Co-Manager</SelectItem>
                      <SelectItem value="team-captain">Team Captain</SelectItem>
                      <SelectItem value="player">Player</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-2xl border-0 overflow-hidden">
                  <Table className="bg-gray-800/50">
                  <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b-2 border-blue-700">
                        <TableHead className="font-semibold text-gray-200">Email</TableHead>
                         <TableHead className="font-semibold text-gray-200">Nome</TableHead>
                         <TableHead className="font-semibold text-gray-200">Role</TableHead>
                         <TableHead className="font-semibold text-gray-200">Organização</TableHead>
                         <TableHead className="font-semibold text-gray-200">Criado em</TableHead>
                         <TableHead className="font-semibold text-gray-200">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-blue-900/30 transition-colors duration-200 border-b border-gray-700">
                        <TableCell className="font-medium text-gray-200">{user.email}</TableCell>
                          <TableCell className="text-gray-300">{user.nome_usuario || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.tenant_id ? (
                            <span className="text-green-400 font-medium">
                              {tenants.find(t => t.id === user.tenant_id)?.nome || 'Organização não encontrada'}
                            </span>
                          ) : (
                            <span className="text-gray-400">Sem organização</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(user.data_cadastro).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="co-manager">Co-Manager</SelectItem>
                              <SelectItem value="team-captain">Team Captain</SelectItem>
                              <SelectItem value="player">Player</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <Card className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-b border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Gerenciamento de Organizações</CardTitle>
                    <CardDescription>
                      Visualize e gerencie todas as organizações do sistema
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateTenantOpen} onOpenChange={setIsCreateTenantOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Organização
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-gray-900/95 backdrop-blur-sm border border-gray-700 shadow-2xl rounded-2xl">
                      <DialogHeader className="text-center pb-4">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                          Criar Nova Organização
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 mt-2">
                          Digite o nome da nova organização.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="tenant-name" className="text-sm font-semibold text-gray-300">Nome da Organização</Label>
                          <Input
                            id="tenant-name"
                            value={newTenantName}
                            onChange={(e) => setNewTenantName(e.target.value)}
                            placeholder="Ex: Empresa ABC"
                            className="w-full rounded-xl border-gray-600 bg-gray-800/50 text-gray-200 placeholder-gray-400 focus:border-green-500 focus:ring-green-500 transition-all duration-300 px-4 py-3"
                          />
                        </div>
                      </div>
                      <DialogFooter className="pt-6 flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreateTenantOpen(false)}
                          className="flex-1 border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-300"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={createTenant}
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-2xl border-0 overflow-hidden">
                  <Table className="bg-gray-800/50">
                    <TableHeader>
                       <TableRow className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border-b-2 border-green-700">
                         <TableHead className="font-semibold text-gray-200">Nome</TableHead>
                         <TableHead className="font-semibold text-gray-200">Status</TableHead>
                         <TableHead className="font-semibold text-gray-200">Usuários</TableHead>
                         <TableHead className="font-semibold text-gray-200">Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                        <TableRow key={tenant.id} className="hover:bg-green-900/30 transition-colors duration-200 border-b border-gray-700">
                        <TableCell className="font-medium text-gray-200">{tenant.nome}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.status === 'ativo' ? "default" : "secondary"}>
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {users.filter(u => u.tenant_id === tenant.id).length} usuários
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(tenant.data_criacao).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    );
};

export default SuperAdminPanel;