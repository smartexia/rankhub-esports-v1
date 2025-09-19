// Script para criar dados de teste e resolver erros de console
import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase
const supabaseUrl = 'https://kxhkspmlyxmhzqckyqvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aGtzcG1seXhtaHpxY2t5cXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzM4NTksImV4cCI6MjA3MTU0OTg1OX0.hA8YcmUGXghufH2xXfe6Hmk79QzyRNfh7IgW_h64Q90';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🚀 Criando dados de teste para resolver erros de console...');
  
  try {
    // 1. Primeiro, verificar se já existem dados
    console.log('\n1. Verificando dados existentes...');
    const { data: existingChamps } = await supabase
      .from('championships')
      .select('id')
      .limit(1);
    
    if (existingChamps && existingChamps.length > 0) {
      console.log('✅ Já existem dados no banco. Pulando criação.');
      return;
    }

    console.log('\n⚠️  ATENÇÃO: Para criar dados de teste, você precisa:');
    console.log('1. Executar o script FIX_TOURNAMENT_PHASES_RELATIONSHIPS.sql no Supabase SQL Editor');
    console.log('2. Executar o script URGENTE_CORRIGIR_RLS.sql no Supabase SQL Editor');
    console.log('3. Criar um usuário super admin no Supabase Auth');
    console.log('\n📋 Instruções detalhadas:');
    console.log('- Acesse: https://supabase.com/dashboard/project/kxhkspmlyxmhzqckyqvd/sql');
    console.log('- Execute os scripts SQL mencionados acima');
    console.log('- Depois execute este script novamente');
    
    console.log('\n🔍 Tentando criar dados mesmo assim...');

    // 2. Criar um tenant de teste
    console.log('\n2. Criando tenant de teste...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        nome: 'Tenant de Teste',
        status: 'ativo'
      })
      .select()
      .single();
    
    if (tenantError) {
      console.error('❌ Erro ao criar tenant:', tenantError.message);
      console.log('\n💡 SOLUÇÃO: Execute primeiro os scripts SQL no Supabase:');
      console.log('1. FIX_TOURNAMENT_PHASES_RELATIONSHIPS.sql');
      console.log('2. URGENTE_CORRIGIR_RLS.sql');
      return;
    }
    console.log('✅ Tenant criado:', tenant.id);

    // 3. Criar um usuário de teste
    console.log('\n3. Criando usuário de teste...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        nome_usuario: 'Admin Teste',
        email: 'admin@teste.com',
        role: 'super_admin',
        tenant_id: tenant.id
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError.message);
      return;
    }
    console.log('✅ Usuário criado:', user.id);

    // 4. Criar campeonato de teste
    console.log('\n4. Criando campeonato de teste...');
    const { data: championship, error: champError } = await supabase
      .from('championships')
      .insert({
        nome: 'Campeonato de Teste',
        tenant_id: tenant.id,
        status: 'ativo',
        data_inicio: '2025-02-01',
        horario_inicio: '19:00:00',
        regras_pontuacao: {
          "posicao": {"1": 20, "2": 15, "3": 12, "4": 10, "5": 8, "6": 6, "7": 5, "8": 4, "9": 3, "10": 2},
          "kill": 1
        }
      })
      .select()
      .single();
    
    if (champError) {
      console.error('❌ Erro ao criar campeonato:', champError.message);
      return;
    }
    console.log('✅ Campeonato criado:', championship.id);

    // 5. Criar grupos de teste
    console.log('\n5. Criando grupos de teste...');
    const groups = [];
    for (let i = 1; i <= 3; i++) {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          nome_grupo: `Grupo ${String.fromCharCode(64 + i)}`, // A, B, C
          championship_id: championship.id,
          capacidade_times: 25
        })
        .select()
        .single();
      
      if (groupError) {
        console.error(`❌ Erro ao criar grupo ${i}:`, groupError.message);
        continue;
      }
      groups.push(group);
      console.log(`✅ Grupo ${group.nome_grupo} criado:`, group.id);
    }

    // 6. Criar times de teste
    console.log('\n6. Criando times de teste...');
    const teams = [];
    const teamNames = [
      'Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Epsilon',
      'Team Zeta', 'Team Eta', 'Team Theta', 'Team Iota', 'Team Kappa'
    ];
    
    for (let i = 0; i < teamNames.length; i++) {
      const groupIndex = i % groups.length;
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          nome_time: teamNames[i],
          nome_line: `Line ${teamNames[i]}`,
          tag: teamNames[i].replace('Team ', '').toUpperCase(),
          championship_id: championship.id,
          group_id: groups[groupIndex].id
        })
        .select()
        .single();
      
      if (teamError) {
        console.error(`❌ Erro ao criar time ${teamNames[i]}:`, teamError.message);
        continue;
      }
      teams.push(team);
      console.log(`✅ Time ${team.nome_time} criado no ${groups[groupIndex].nome_grupo}`);
    }

    // 7. Criar partidas de teste
    console.log('\n7. Criando partidas de teste...');
    const matches = [];
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      for (let matchNum = 1; matchNum <= 3; matchNum++) {
        const matchDate = new Date('2025-02-01T19:00:00');
        matchDate.setHours(matchDate.getHours() + matchNum - 1);
        
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .insert({
            championship_id: championship.id,
            group_id: groups[groupIndex].id,
            ordem_queda: matchNum,
            data_hora_queda: matchDate.toISOString(),
            status: 'pendente'
          })
          .select()
          .single();
        
        if (matchError) {
          console.error(`❌ Erro ao criar partida ${matchNum} do ${groups[groupIndex].nome_grupo}:`, matchError.message);
          continue;
        }
        matches.push(match);
        console.log(`✅ Partida ${matchNum} criada para ${groups[groupIndex].nome_grupo}`);
      }
    }

    // 8. Resumo final
    console.log('\n🎉 Dados de teste criados com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   • 1 Tenant: ${tenant.nome}`);
    console.log(`   • 1 Usuário: ${user.nome_usuario}`);
    console.log(`   • 1 Campeonato: ${championship.nome}`);
    console.log(`   • ${groups.length} Grupos: ${groups.map(g => g.nome_grupo).join(', ')}`);
    console.log(`   • ${teams.length} Times distribuídos nos grupos`);
    console.log(`   • ${matches.length} Partidas programadas`);
    console.log('\n✅ Os erros de console devem estar resolvidos agora!');

  } catch (error) {
    console.error('❌ Erro geral na criação de dados:', error.message);
  }
}

createTestData();