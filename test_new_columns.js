import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://kxhkspmlyxmhzqckyqvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGtzcG1seXhtaHpxY2t5cXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzM4NTksImV4cCI6MjA3MTU0OTg1OX0.hA8YcmUGXghufH2xXfe6Hmk79QzyRNfh7IgW_h64Q90';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewColumns() {
  try {
    console.log('Testando se as novas colunas existem...');
    
    // Testar apenas as novas colunas
    const { data, error } = await supabase
      .from('championships')
      .select('configuracao_avancada')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro - a coluna configuracao_avancada não existe:', error.message);
      console.log('\n📋 AÇÃO NECESSÁRIA:');
      console.log('Execute o script SQL manualmente no painel do Supabase.');
      console.log('Arquivo: fix_championships_columns.sql');
      return false;
    } else {
      console.log('✅ A coluna configuracao_avancada existe!');
      return true;
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
    return false;
  }
}

testNewColumns().then(success => {
  if (success) {
    console.log('\n🎉 Banco de dados está pronto! Você pode continuar usando a aplicação.');
  } else {
    console.log('\n⚠️  Migração necessária. Siga as instruções acima.');
  }
});