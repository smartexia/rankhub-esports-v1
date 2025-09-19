/**
 * Script de diagnóstico para verificar tenant_id do usuário
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler variáveis do .env manualmente
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};

envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function debugTenantId() {
  try {
    console.log('🔍 Verificando usuários na tabela users...');
    
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log('👥 Total de usuários encontrados:', users?.length || 0);
    
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n📋 Usuário ${index + 1}:`);
        console.log('   ID:', user.id);
        console.log('   Email:', user.email);
        console.log('   Nome:', user.nome_usuario);
        console.log('   Auth User ID:', user.auth_user_id);
        console.log('   Tenant ID:', user.tenant_id || '❌ NULL/VAZIO');
        console.log('   Role:', user.role);
        console.log('   Data Cadastro:', user.data_cadastro);
      });
      
      // Verificar quantos usuários têm tenant_id
      const usersWithTenant = users.filter(u => u.tenant_id);
      const usersWithoutTenant = users.filter(u => !u.tenant_id);
      
      console.log('\n📊 RESUMO:');
      console.log('✅ Usuários COM tenant_id:', usersWithTenant.length);
      console.log('❌ Usuários SEM tenant_id:', usersWithoutTenant.length);
      
      if (usersWithoutTenant.length > 0) {
        console.log('\n🚨 USUÁRIOS SEM TENANT_ID:');
        usersWithoutTenant.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id})`);
        });
      }
    } else {
      console.log('❌ Nenhum usuário encontrado na tabela users');
    }
    
    // Verificar tenants disponíveis
    console.log('\n🏢 Verificando tenants disponíveis...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*');
    
    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError);
    } else {
      console.log('🏢 Total de tenants:', tenants?.length || 0);
      if (tenants && tenants.length > 0) {
        tenants.forEach((tenant, index) => {
          console.log(`   ${index + 1}. ${tenant.nome} (ID: ${tenant.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugTenantId();