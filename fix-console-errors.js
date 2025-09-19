// Script para corrigir erros de console relacionados a colunas inexistentes
import { createClient } from '@supabase/supabase-js';

// Usando as credenciais diretamente do .env
const supabaseUrl = 'https://kxhkspmlvxmhzqckygvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGtzcG1sdnhtaHpxY2t5Z3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzM0MTksImV4cCI6MjA1MjQ0OTQxOX0.aaf6374-4198';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConsoleErrors() {
  console.log('🔍 Verificando estrutura das tabelas...');
  
  try {
    // 1. Verificar se a coluna phase_id existe na tabela matches
    console.log('\n1. Testando consulta simples em matches...');
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, championship_id, group_id, ordem_queda, status')
      .limit(1);
    
    if (matchesError) {
      console.error('❌ Erro ao consultar matches:', matchesError.message);
    } else {
      console.log('✅ Consulta básica em matches funcionou');
    }

    // 2. Testar consulta com phase_id
    console.log('\n2. Testando consulta com phase_id...');
    const { data: matchesWithPhase, error: phaseError } = await supabase
      .from('matches')
      .select('id, championship_id, phase_id')
      .limit(1);
    
    if (phaseError) {
      console.error('❌ Erro ao consultar matches com phase_id:', phaseError.message);
      console.log('🔧 A coluna phase_id não existe ou não está acessível');
    } else {
      console.log('✅ Consulta com phase_id funcionou');
    }

    // 3. Verificar se a tabela tournament_phases existe
    console.log('\n3. Testando acesso à tabela tournament_phases...');
    const { data: phases, error: phasesError } = await supabase
      .from('tournament_phases')
      .select('id, championship_id, nome_fase')
      .limit(1);
    
    if (phasesError) {
      console.error('❌ Erro ao consultar tournament_phases:', phasesError.message);
      console.log('🔧 A tabela tournament_phases não existe ou não está acessível');
    } else {
      console.log('✅ Consulta em tournament_phases funcionou');
    }

    // 4. Verificar se a coluna nome existe na tabela groups (deveria ser nome_grupo)
    console.log('\n4. Testando consulta em groups...');
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, championship_id, nome_grupo')
      .limit(1);
    
    if (groupsError) {
      console.error('❌ Erro ao consultar groups:', groupsError.message);
    } else {
      console.log('✅ Consulta em groups funcionou');
    }

    // 5. Verificar campos do championship
    console.log('\n5. Testando consulta em championships...');
    const { data: championships, error: champError } = await supabase
      .from('championships')
      .select('id, nome, data_inicio, horario_inicio')
      .limit(1);
    
    if (champError) {
      console.error('❌ Erro ao consultar championships:', champError.message);
    } else {
      console.log('✅ Consulta em championships funcionou');
      if (championships && championships.length > 0) {
        console.log('📊 Exemplo de championship:', championships[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixConsoleErrors();