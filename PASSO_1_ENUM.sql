-- =====================================================
-- PASSO 1: ADICIONAR SUPER_ADMIN AO ENUM
-- =====================================================
-- 
-- EXECUTE APENAS ESTA LINHA PRIMEIRO:
-- Copie e cole no SQL Editor do Supabase
--
-- =====================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- =====================================================
-- APÓS EXECUTAR, AGUARDE 10 SEGUNDOS
-- DEPOIS EXECUTE O ARQUIVO: PASSO_2_POLITICAS.sql
-- =====================================================