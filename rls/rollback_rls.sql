-- ============================================================================
-- RLS — ROLLBACK (desliga o RLS no banco)
--   psql "$DATABASE_URL_SUPERUSER" -f rls/rollback_rls.sql
-- Preferência: para desligar RÁPIDO, use RLS_ENABLED=False no app + reiniciar
-- (não precisa mexer no banco). Este script remove as policies de vez.
-- As roles NÃO são removidas (podem estar em uso pela app); remova à mão se quiser.
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'mecanica_cliente','mecanica_veiculo','mecanica_funcionario','mecanica_peca',
    'mecanica_ordemservico','mecanica_checklistentrada','mecanica_agendamento',
    'mecanica_orcamento','mecanica_servicocatalogo','mecanica_logauditoria',
    'mecanica_garantiadefault',
    'mecanica_fotoveiculo','mecanica_movimentacaoestoque','mecanica_servicoos',
    'mecanica_pecaos','mecanica_notafiscal','mecanica_danochecklist',
    'mecanica_itemorcamento','mecanica_comissaomecanico','mecanica_alertaestoque',
    'mecanica_garantiaservico'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I DISABLE  ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
