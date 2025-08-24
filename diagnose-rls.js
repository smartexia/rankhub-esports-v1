import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxhkspmlyxmhzqckyqvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGtzcG1seXhtaHpxY2t5cXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzM4NTksImV4cCI6MjA3MTU0OTg1OX0.hA8YcmUGXghufH2xXfe6Hmk79QzyRNfh7IgW_h64Q90';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseRLS() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA RLS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar se RLS está habilitado nas tabelas
    console.log('\n📋 1. Verificando se RLS está habilitado...');
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_status');
    if (rlsError) {
      console.log('⚠️  Não foi possível verificar status RLS:', rlsError.message);
    } else {
      console.log('✅ Status RLS verificado');
    }

    // 2. Verificar políticas existentes
    console.log('\n📋 2. Verificando políticas existentes...');
    const { data: policies, error: policiesError } = await supabase.rpc('list_policies');
    if (policiesError) {
      console.log('⚠️  Não foi possível listar políticas:', policiesError.message);
    } else {
      console.log('✅ Políticas listadas');
    }

    // 3. Testar acesso sem autenticação
    console.log('\n📋 3. Testando acesso SEM autenticação...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    console.log('👥 Usuários encontrados:', users?.length || 0);
    if (usersError) {
      console.log('❌ Erro ao acessar users:', usersError.message);
    }
    
    const { data: championships, error: champError } = await supabase
      .from('championships')
      .select('id, nome, status, tenant_id')
      .limit(5);
    
    console.log('🏆 Campeonatos encontrados:', championships?.length || 0);
    if (champError) {
      console.log('❌ Erro ao acessar championships:', champError.message);
    }

    // 4. Verificar se existe função is_super_admin
    console.log('\n📋 4. Verificando função is_super_admin...');
    const { data: functionExists, error: functionError } = await supabase.rpc('is_super_admin');
    if (functionError) {
      console.log('❌ Função is_super_admin não encontrada ou com erro:', functionError.message);
    } else {
      console.log('✅ Função is_super_admin existe e retornou:', functionExists);
    }

    // 5. Tentar fazer login com um usuário de teste
    console.log('\n📋 5. Tentando autenticação de teste...');
    
    // Primeiro, vamos verificar se existe algum usuário
    const { data: allUsers, error: allUsersError } = await supabase.auth.admin.listUsers();
    if (allUsersError) {
      console.log('❌ Erro ao listar usuários do auth:', allUsersError.message);
    } else {
      console.log('👥 Total de usuários no auth:', allUsers.users?.length || 0);
      if (allUsers.users && allUsers.users.length > 0) {
        console.log('📧 Primeiro usuário:', allUsers.users[0].email);
      }
    }

    // 6. Verificar estrutura das tabelas
    console.log('\n📋 6. Verificando estrutura das tabelas...');
    
    // Tentar uma consulta que não depende de RLS
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'championships', 'teams', 'matches', 'tenants']);
    
    if (tableError) {
      console.log('❌ Erro ao verificar tabelas:', tableError.message);
    } else {
      console.log('📊 Tabelas encontradas:', tableInfo?.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('💥 Erro geral no diagnóstico:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 DIAGNÓSTICO CONCLUÍDO');
}

// Executar diagnóstico
diagnoseRLS().catch(console.error);