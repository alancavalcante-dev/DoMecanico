-- ============================================================================
-- RLS (Row Level Security) — APLICAR
-- Rode como SUPERUSER do Postgres (ou dono das tabelas), no banco da aplicação.
--   psql "$DATABASE_URL_SUPERUSER" -f rls/apply_rls.sql
-- Antes: troque as senhas CHANGE_ME_APP / CHANGE_ME_ADMIN.
-- Idempotente: pode rodar de novo sem problema.
-- Reverter: rls/rollback_rls.sql  (ou, no app, RLS_ENABLED=False + reiniciar).
-- ============================================================================

-- 1) Roles ------------------------------------------------------------------
--    domecanico_app -> conexão DEFAULT do Django (SEM bypass): RLS é aplicado.
--    domecanico     -> role EXISTENTE e dona das tabelas. Ganha BYPASSRLS e vira
--                      a conexão BYPASS (painel admin / públicos / MIGRATIONS).
--    >>> Se a role principal do seu banco NÃO se chama "domecanico", troque o
--        nome nas 2 linhas abaixo (é o POSTGRES_USER do docker-compose). <<<
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'domecanico_app') THEN
    CREATE ROLE domecanico_app LOGIN PASSWORD 'CHANGE_ME_APP' NOBYPASSRLS;
  END IF;
END $$;

ALTER ROLE domecanico BYPASSRLS;   -- a role dona é o caminho bypass + roda migrations

-- 2) Privilégios (a _app precisa de DML; a role dona já tem tudo) ------------
GRANT USAGE ON SCHEMA public TO domecanico_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO domecanico_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO domecanico_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO domecanico_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO domecanico_app;

-- 3) Tabelas-PAI (têm oficina_id) — policy direta ---------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'mecanica_cliente','mecanica_veiculo','mecanica_funcionario','mecanica_peca',
    'mecanica_ordemservico','mecanica_checklistentrada','mecanica_agendamento',
    'mecanica_orcamento','mecanica_servicocatalogo','mecanica_logauditoria',
    'mecanica_garantiadefault','mecanica_diagnostico'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE  ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I '
      'USING (oficina_id = NULLIF(current_setting(''app.current_oficina'', true), '''')::int) '
      'WITH CHECK (oficina_id = NULLIF(current_setting(''app.current_oficina'', true), '''')::int)', t);
  END LOOP;
END $$;

-- 4) Tabelas-FILHAS (sem oficina_id) — policy por subconsulta na tabela-pai --
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('mecanica_fotoveiculo',        'mecanica_veiculo',         'veiculo_id'),
    ('mecanica_movimentacaoestoque','mecanica_peca',            'peca_id'),
    ('mecanica_servicoos',          'mecanica_ordemservico',    'ordem_id'),
    ('mecanica_pecaos',             'mecanica_ordemservico',    'ordem_id'),
    ('mecanica_notafiscal',         'mecanica_ordemservico',    'ordem_id'),
    ('mecanica_danochecklist',      'mecanica_checklistentrada','checklist_id'),
    ('mecanica_itemorcamento',      'mecanica_orcamento',       'orcamento_id'),
    ('mecanica_comissaomecanico',   'mecanica_ordemservico',    'ordem_id'),
    ('mecanica_alertaestoque',      'mecanica_peca',            'peca_id'),
    ('mecanica_itemdiagnostico',    'mecanica_diagnostico',     'diagnostico_id')
  ) AS x(tbl, parent, fk)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format('ALTER TABLE %I FORCE  ROW LEVEL SECURITY', r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', r.tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I '
      'USING (EXISTS (SELECT 1 FROM %I p WHERE p.id = %I.%I '
      '  AND p.oficina_id = NULLIF(current_setting(''app.current_oficina'', true), '''')::int)) '
      'WITH CHECK (EXISTS (SELECT 1 FROM %I p WHERE p.id = %I.%I '
      '  AND p.oficina_id = NULLIF(current_setting(''app.current_oficina'', true), '''')::int))',
      r.tbl, r.parent, r.tbl, r.fk, r.parent, r.tbl, r.fk);
  END LOOP;
END $$;

-- 5) GarantiaServico (dois níveis: servico_os -> ordem) ---------------------
ALTER TABLE mecanica_garantiaservico ENABLE ROW LEVEL SECURITY;
ALTER TABLE mecanica_garantiaservico FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON mecanica_garantiaservico;
CREATE POLICY tenant_isolation ON mecanica_garantiaservico
  USING (EXISTS (
    SELECT 1 FROM mecanica_servicoos s
    JOIN mecanica_ordemservico o ON o.id = s.ordem_id
    WHERE s.id = mecanica_garantiaservico.servico_os_id
      AND o.oficina_id = NULLIF(current_setting('app.current_oficina', true), '')::int))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mecanica_servicoos s
    JOIN mecanica_ordemservico o ON o.id = s.ordem_id
    WHERE s.id = mecanica_garantiaservico.servico_os_id
      AND o.oficina_id = NULLIF(current_setting('app.current_oficina', true), '')::int));

-- Pronto. Confirme com:
--   SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class
--   WHERE relname LIKE 'mecanica_%' ORDER BY relname;
