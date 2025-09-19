import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxhkspmlyxmhzqckyqvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGtzcG1seXhtaHpxY2t5cXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzM4NTksImV4cCI6MjA3MTU0OTg1OX0.hA8YcmUGXghufH2xXfe6Hmk79QzyRNfh7IgW_h64Q90';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseConsoleErrors() {
  console.log('🔍 Diagnosticando erros específicos das páginas de torneio...');
  
  try {
    // Teste 1: Verificar acesso à tabela championships
    console.log('\n📋 Teste 1: Acessando tabela championships...');
    const { data: championships, error: champError } = await supabase
      .from('championships')
      .select('*')
      .limit(1);
    
    if (champError) {
      console.error('❌ Erro ao acessar championships:', champError.message);
      console.error('Detalhes:', champError);
    } else {
      console.log('✅ Acesso à tabela championships OK');
      console.log('Dados encontrados:', championships?.length || 0);
    }
    
    // Teste 2: Verificar acesso à tabela teams
    console.log('\n👥 Teste 2: Acessando tabela teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);
    
    if (teamsError) {
      console.error('❌ Erro ao acessar teams:', teamsError.message);
      console.error('Detalhes:', teamsError);
    } else {
      console.log('✅ Acesso à tabela teams OK');
      console.log('Dados encontrados:', teams?.length || 0);
    }
    
    // Teste 3: Verificar acesso à tabela matches
    console.log('\n⚔️ Teste 3: Acessando tabela matches...');
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .limit(1);
    
    if (matchesError) {
      console.error('❌ Erro ao acessar matches:', matchesError.message);
      console.error('Detalhes:', matchesError);
    } else {
      console.log('✅ Acesso à tabela matches OK');
      console.log('Dados encontrados:', matches?.length || 0);
    }
    
    // Teste 4: Verificar acesso à tabela users
    console.log('\n👤 Teste 4: Acessando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erro ao acessar users:', usersError.message);
      console.error('Detalhes:', usersError);
    } else {
      console.log('✅ Acesso à tabela users OK');
      console.log('Dados encontrados:', users?.length || 0);
    }
    
    // Teste 5: Verificar acesso à tabela groups
    console.log('\n🏷️ Teste 5: Acessando tabela groups...');
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .limit(1);
    
    if (groupsError) {
      console.error('❌ Erro ao acessar groups:', groupsError.message);
      console.error('Detalhes:', groupsError);
    } else {
      console.log('✅ Acesso à tabela groups OK');
      console.log('Dados encontrados:', groups?.length || 0);
    }
    
    // Teste 6: Verificar acesso à tabela tournament_phases
    console.log('\n🏆 Teste 6: Acessando tabela tournament_phases...');
    const { data: phases, error: phasesError } = await supabase
      .from('tournament_phases')
      .select('*')
      .limit(1);
    
    if (phasesError) {
      console.error('❌ Erro ao acessar tournament_phases:', phasesError.message);
      console.error('Detalhes:', phasesError);
    } else {
      console.log('✅ Acesso à tabela tournament_phases OK');
      console.log('Dados encontrados:', phases?.length || 0);
    }
    
    // Teste 7: Verificar consulta com JOIN (como usado no MatchManagement)
    console.log('\n🔗 Teste 7: Testando consulta com JOIN...');
    const { data: matchesWithJoin, error: joinError } = await supabase
      .from('matches')
      .select(`
        *,
        phase:tournament_phases(*),
        group:groups(*)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('❌ Erro na consulta com JOIN:', joinError.message);
      console.error('Detalhes:', joinError);
    } else {
      console.log('✅ Consulta com JOIN OK');
      console.log('Dados encontrados:', matchesWithJoin?.length || 0);
    }
    
    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log('- Se todos os testes falharam com erro de política RLS, execute o script URGENTE_CORRIGIR_RLS.sql');
    console.log('- Se alguns testes passaram mas outros falharam, pode ser problema de colunas inexistentes');
    console.log('- Se todos passaram, o problema pode estar na autenticação ou no frontend');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  }
}

diagnoseConsoleErrors();