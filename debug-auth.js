import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxhkspmlyxmhzqckyqvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGtzcG1seXhtaHpxY2t5cXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzM4NTksImV4cCI6MjA3MTU0OTg1OX0.hA8YcmUGXghufH2xXfe6Hmk79QzyRNfh7IgW_h64Q90';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
  console.log('🔍 Verificando configuração do banco de dados...');
  
  try {
    // Verificar se conseguimos acessar a tabela users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    console.log('👥 Usuários encontrados:', users?.length || 0);
    if (usersError) {
      console.error('❌ Erro ao acessar tabela users:', usersError);
    }
    
    // Verificar se existe super_admin
    const { data: superAdmins, error: superAdminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'super_admin');
    
    console.log('👑 Super admins encontrados:', superAdmins?.length || 0);
    if (superAdminError) {
      console.error('❌ Erro ao buscar super admins:', superAdminError);
    }
    
    // Verificar se conseguimos acessar outras tabelas
    const { data: championships, error: champError } = await supabase
      .from('championships')
      .select('*')
      .limit(1);
    
    console.log('🏆 Campeonatos encontrados:', championships?.length || 0);
    if (champError) {
      console.error('❌ Erro ao acessar tabela championships:', champError);
    }
    
    // Verificar se conseguimos acessar tabela teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);
    
    console.log('👥 Times encontrados:', teams?.length || 0);
    if (teamsError) {
      console.error('❌ Erro ao acessar tabela teams:', teamsError);
    }
    
    // Verificar se conseguimos acessar tabela matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .limit(1);
    
    console.log('⚔️ Partidas encontradas:', matches?.length || 0);
    if (matchesError) {
      console.error('❌ Erro ao acessar tabela matches:', matchesError);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

debugAuth();