import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'captain' | 'player';
  joined_at: string;
  created_at: string;
  user?: {
    id: string;
    nome_usuario: string;
    email: string;
    role: string;
  };
}

export interface User {
  id: string;
  nome_usuario: string;
  email: string;
  role: string;
  tenant_id: string;
}

export const useTeamMembers = (teamId?: string) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar membros do time
  const loadTeamMembers = async (id: string) => {
    if (!id) return;
    
    setLoading(true);
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
        .eq('team_id', id);

      if (error) {
        console.error('Erro ao carregar membros do time:', error);
        toast.error('Erro ao carregar membros do time');
        return;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar membros:', error);
      toast.error('Erro inesperado ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários disponíveis (jogadores que não estão no time)
  const loadAvailableUsers = async (id: string) => {
    if (!id) return;
    
    try {
      // Primeiro, buscar o tenant_id do time
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          championship_id,
          championships(
            tenant_id
          )
        `)
        .eq('id', id)
        .single();

      if (teamError) {
        console.error('Erro ao buscar dados do time:', teamError);
        return;
      }

      const tenantId = teamData?.championships?.tenant_id;
      if (!tenantId) {
        console.error('Tenant ID não encontrado para o time');
        return;
      }

      // Buscar usuários do tenant que são jogadores e não estão no time
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('role', 'player')
        .not('id', 'in', `(
          SELECT user_id FROM team_members WHERE team_id = '${id}'
        )`);

      if (usersError) {
        console.error('Erro ao carregar usuários disponíveis:', usersError);
        return;
      }

      setAvailableUsers(usersData || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar usuários:', error);
    }
  };

  // Adicionar membro ao time
  const addTeamMember = async (userId: string, role: 'captain' | 'player' = 'player') => {
    if (!teamId) {
      toast.error('ID do time não fornecido');
      return false;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
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
        return false;
      }

      // Verificar se o usuário pode gerenciar membros (manager, co_manager ou super_admin)
      if (!['manager', 'co_manager', 'super_admin'].includes(userData.role)) {
        toast.error('Você não tem permissão para gerenciar membros do time');
        return false;
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
          toast.error('Você não pode gerenciar membros deste time');
          return false;
        }
      }

      // Verificar se o usuário a ser adicionado pertence ao mesmo tenant
      if (userData.role !== 'super_admin') {
        const { data: targetUserData, error: targetUserError } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', userId)
          .single();

        if (targetUserError || targetUserData.tenant_id !== userData.tenant_id) {
          toast.error('Você só pode adicionar usuários do seu tenant');
          return false;
        }
      }

      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role
        });

      if (error) {
        console.error('Erro ao adicionar membro:', error);
        toast.error('Erro ao adicionar membro ao time');
        return false;
      }

      toast.success('Membro adicionado com sucesso!');
      await loadTeamMembers(teamId);
      await loadAvailableUsers(teamId);
      return true;
    } catch (error) {
      console.error('Erro inesperado ao adicionar membro:', error);
      toast.error('Erro inesperado ao adicionar membro');
      return false;
    }
  };

  // Remover membro do time
  const removeTeamMember = async (memberId: string) => {
    if (!teamId) {
      toast.error('ID do time não fornecido');
      return false;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
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
        return false;
      }

      // Verificar se o usuário pode gerenciar membros (manager, co_manager ou super_admin)
      if (!['manager', 'co_manager', 'super_admin'].includes(userData.role)) {
        toast.error('Você não tem permissão para gerenciar membros do time');
        return false;
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
          toast.error('Você não pode gerenciar membros deste time');
          return false;
        }
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Erro ao remover membro:', error);
        toast.error('Erro ao remover membro do time');
        return false;
      }

      toast.success('Membro removido com sucesso!');
      await loadTeamMembers(teamId);
      await loadAvailableUsers(teamId);
      return true;
    } catch (error) {
      console.error('Erro inesperado ao remover membro:', error);
      toast.error('Erro inesperado ao remover membro');
      return false;
    }
  };

  // Atualizar role do membro
  const updateMemberRole = async (memberId: string, newRole: 'captain' | 'player') => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
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
        return false;
      }

      // Verificar se o usuário pode gerenciar membros (manager, co_manager ou super_admin)
      if (!['manager', 'co_manager', 'super_admin'].includes(userData.role)) {
        toast.error('Você não tem permissão para gerenciar membros do time');
        return false;
      }

      // Verificar se o time pertence ao tenant do usuário (exceto super_admin)
      if (userData.role !== 'super_admin' && teamId) {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            championship_id,
            championships(tenant_id)
          `)
          .eq('id', teamId)
          .single();

        if (teamError || teamData.championships?.tenant_id !== userData.tenant_id) {
          toast.error('Você não pode gerenciar membros deste time');
          return false;
        }
      }

      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) {
        console.error('Erro ao atualizar role do membro:', error);
        toast.error('Erro ao atualizar função do membro');
        return false;
      }

      toast.success('Função do membro atualizada com sucesso!');
      if (teamId) {
        await loadTeamMembers(teamId);
      }
      return true;
    } catch (error) {
      console.error('Erro inesperado ao atualizar role:', error);
      toast.error('Erro inesperado ao atualizar função');
      return false;
    }
  };

  // Carregar dados quando teamId mudar
  useEffect(() => {
    if (teamId) {
      loadTeamMembers(teamId);
      loadAvailableUsers(teamId);
    }
  }, [teamId]);

  return {
    members,
    availableUsers,
    loading,
    addTeamMember,
    removeTeamMember,
    updateMemberRole,
    refreshData: () => {
      if (teamId) {
        loadTeamMembers(teamId);
        loadAvailableUsers(teamId);
      }
    }
  };
};