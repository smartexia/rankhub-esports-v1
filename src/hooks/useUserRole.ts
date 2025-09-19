import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserRoleData {
  role: string;
  tenant_id: string | null;
}

export function useUserRole() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('users')
          .select('role, tenant_id')
          .eq('auth_user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Erro ao buscar role do usuário:', fetchError);
          setError('Erro ao verificar permissões do usuário');
          setUserRole(null);
        } else {
          setUserRole(data);
        }
      } catch (err) {
        console.error('Erro inesperado ao buscar role:', err);
        setError('Erro inesperado ao verificar permissões');
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Funções de conveniência para verificar roles específicos
  const isSuperAdmin = userRole?.role === 'super_admin';
  const isAdmin = userRole?.role === 'admin' || isSuperAdmin;
  const isOrganizer = userRole?.role === 'organizer' || isAdmin;
  const isPlayer = userRole?.role === 'player';

  return {
    userRole,
    loading,
    error,
    isSuperAdmin,
    isAdmin,
    isOrganizer,
    isPlayer,
    role: userRole?.role || null,
    tenantId: userRole?.tenant_id || null
  };
}