import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://kxhkspmlyxmhzqckyqvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGtzcG1seXhtaHpxY2t5cXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzM4NTksImV4cCI6MjA3MTU0OTg1OX0.hA8YcmUGXghufH2xXfe6Hmk79QzyRNfh7IgW_h64Q90';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  try {
    console.log('Verificando estrutura da tabela championships...');
    
    // Tentar fazer uma consulta simples para ver se as colunas existem
    const { data, error } = await supabase
      .from('championships')
      .select('id, name, formato_torneio, numero_fases, configuracao_fases, numero_grupos, times_por_grupo, configuracao_avancada')
      .limit(1);
    
    if (error) {
      console.error('Erro ao consultar championships:', error);
      
      // Se o erro for sobre colunas não existentes, isso confirma que precisamos da migração
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\n❌ As colunas necessárias não existem na tabela championships.');
        console.log('\n📋 INSTRUÇÕES PARA CORRIGIR:');
        console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/kxhkspmlyxmhzqckyqvd');
        console.log('2. Vá para "SQL Editor"');
        console.log('3. Cole e execute o conteúdo do arquivo "fix_championships_columns.sql"');
        console.log('4. Após executar, rode novamente este script para verificar');
      }
    } else {
      console.log('✅ Todas as colunas necessárias existem na tabela championships!');
      console.log('Dados encontrados:', data?.length || 0, 'registros');
    }
    
  } catch (error) {
    console.error('Erro durante a verificação:', error);
  }
}

checkColumns();