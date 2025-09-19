// Script para diagnosticar erros específicos encontrados no console
import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase (corretas do .env)
const supabaseUrl = 'https://kxhkspmlyxmhzqckyqvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGtzcG1seXhtaHpxY2t5cXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzM4NTksImV4cCI6MjA3MTU0OTg1OX0.hA8YcmUGXghufH2xXfe6Hmk79QzyRNfh7IgW_h64Q90';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSpecificErrors() {
  console.log('🔍 Diagnosticando erros específicos do console...');
  
  try {
    // 1. Testar consulta que estava falhando no RankingSystem.tsx
    console.log('\n1. Testando consulta de grupos (RankingSystem)...');
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, nome_grupo, championship_id')
      .limit(5);
    
    if (groupsError) {
      console.error('❌ Erro na consulta de grupos:', groupsError.message);
      console.log('🔧 Possível problema: coluna "nome" não existe, deveria ser "nome_grupo"');
    } else {
      console.log('✅ Consulta de grupos funcionou');
      console.log('📊 Grupos encontrados:', groups?.length || 0);
    }

    // 2. Testar consulta de matches com status
    console.log('\n2. Testando consulta de matches...');
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, championship_id, group_id, ordem_queda, status, data_hora_queda')
      .limit(5);
    
    if (matchesError) {
      console.error('❌ Erro na consulta de matches:', matchesError.message);
    } else {
      console.log('✅ Consulta de matches funcionou');
      console.log('📊 Matches encontrados:', matches?.length || 0);
      if (matches && matches.length > 0) {
        console.log('📋 Status disponíveis:', [...new Set(matches.map(m => m.status))]);
      }
    }

    // 3. Testar consulta de championships com novos campos
    console.log('\n3. Testando consulta de championships...');
    const { data: championships, error: champError } = await supabase
      .from('championships')
      .select('id, nome, data_inicio, horario_inicio, status')
      .limit(5);
    
    if (champError) {
      console.error('❌ Erro na consulta de championships:', champError.message);
    } else {
      console.log('✅ Consulta de championships funcionou');
      console.log('📊 Championships encontrados:', championships?.length || 0);
      if (championships && championships.length > 0) {
        console.log('📋 Exemplo de championship:', {
          id: championships[0].id,
          nome: championships[0].nome,
          data_inicio: championships[0].data_inicio,
          horario_inicio: championships[0].horario_inicio,
          status: championships[0].status
        });
      }
    }

    // 4. Testar consulta de teams
    console.log('\n4. Testando consulta de teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, nome_time, nome_line, championship_id, group_id')
      .limit(5);
    
    if (teamsError) {
      console.error('❌ Erro na consulta de teams:', teamsError.message);
    } else {
      console.log('✅ Consulta de teams funcionou');
      console.log('📊 Teams encontrados:', teams?.length || 0);
    }

    // 5. Testar consulta JOIN que estava falhando
    console.log('\n5. Testando consulta JOIN matches + groups...');
    const { data: matchesWithGroups, error: joinError } = await supabase
      .from('matches')
      .select(`
        id,
        ordem_queda,
        status,
        data_hora_queda,
        groups!inner(
          id,
          nome_grupo
        )
      `)
      .limit(5);
    
    if (joinError) {
      console.error('❌ Erro na consulta JOIN:', joinError.message);
    } else {
      console.log('✅ Consulta JOIN funcionou');
      console.log('📊 Matches com grupos encontrados:', matchesWithGroups?.length || 0);
    }

    // 6. Verificar se existem dados no banco
    console.log('\n6. Resumo geral dos dados...');
    const counts = {
      championships: championships?.length || 0,
      groups: groups?.length || 0,
      teams: teams?.length || 0,
      matches: matches?.length || 0
    };
    
    console.log('📊 Contagem de registros:', counts);
    
    if (Object.values(counts).every(count => count === 0)) {
      console.log('⚠️  ATENÇÃO: Não há dados no banco! Isso pode explicar os erros.');
      console.log('💡 Sugestão: Criar alguns dados de teste ou verificar políticas RLS.');
    }

  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error.message);
  }
}

diagnoseSpecificErrors();