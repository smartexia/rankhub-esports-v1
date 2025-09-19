import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://kxhkspmlyxmhzqckyqvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGtzcG1seXhtaHpxY2t5cXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzM4NTksImV4cCI6MjA3MTU0OTg1OX0.hA8YcmUGXghufH2xXfe6Hmk79QzyRNfh7IgW_h64Q90';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Executando migração para adicionar colunas na tabela championships...');
    
    // Ler o script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'fix_championships_columns.sql'), 'utf8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));
    
    // Executar cada comando
    for (const command of commands) {
      if (command.trim()) {
        console.log('Executando:', command.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error('Erro ao executar comando:', error);
          // Continuar mesmo com erro, pois pode ser que a coluna já exista
        } else {
          console.log('✓ Comando executado com sucesso');
        }
      }
    }
    
    console.log('\nMigração concluída! Verificando se as colunas foram criadas...');
    
    // Verificar se as colunas existem
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'championships')
      .eq('table_schema', 'public')
      .in('column_name', ['formato_torneio', 'numero_fases', 'configuracao_fases', 'numero_grupos', 'times_por_grupo', 'configuracao_avancada']);
    
    if (error) {
      console.error('Erro ao verificar colunas:', error);
    } else {
      console.log('\nColunas encontradas:');
      data.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
  }
}

runMigration();