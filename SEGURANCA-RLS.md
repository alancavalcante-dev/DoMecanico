# RLS (Row Level Security) — plano de aplicação segura

> **Status: NÃO aplicado em produção.** Este documento contém o plano e os scripts
> prontos para habilitar RLS **em staging primeiro**, com teste, antes de ir a prod.
> A proteção atual é no nível da aplicação (`.filter(oficina=...)` em toda ViewSet +
> `ModuloRequerido`). O RLS é *defesa em profundidade* — a trava no banco caso algum
> código futuro esqueça o filtro.

## Por que exige cuidado neste sistema

1. **Endpoints públicos consultam várias oficinas** (`os_publica_buscar`, portal por CPF).
   Sob RLS, uma requisição sem "oficina atual" retorna 0 linhas → portal quebra.
2. **O painel admin vê todas as oficinas.** Precisa de um caminho com `BYPASSRLS`.
3. **Tabelas-filhas não têm `oficina_id`** (ServicoOS, PecaOS, ItemOrcamento,
   FotoVeiculo, DanoChecklist, MovimentacaoEstoque, ComissaoMecanico, GarantiaServico).
   As policies delas usam subconsulta pela tabela-pai.

## Arquitetura recomendada: conexão dupla

- **Role `domecanico_app`** (sem `BYPASSRLS`) → conexão padrão do Django (`default`).
  Toda query de oficina passa por aqui e é filtrada pelo RLS.
- **Role `domecanico_admin`** (com `BYPASSRLS`) → conexão secundária (`bypass`).
  Usada por: painel admin, endpoints públicos (`os_publica_*`, `checklist_publico`,
  `orcamento_publico`), migrations e management commands.

```python
# settings.py — DATABASES
DATABASES = {
  'default': {  # role sem BYPASSRLS
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': env('DB_NAME'), 'USER': 'domecanico_app', 'PASSWORD': env('DB_APP_PASSWORD'),
    'HOST': env('DB_HOST'), 'PORT': env('DB_PORT', '5432'),
  },
  'bypass': {   # role com BYPASSRLS (admin/público/migrations)
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': env('DB_NAME'), 'USER': 'domecanico_admin', 'PASSWORD': env('DB_ADMIN_PASSWORD'),
    'HOST': env('DB_HOST'), 'PORT': env('DB_PORT', '5432'),
  },
}
```

> `migrate` deve rodar na conexão `bypass`: `python manage.py migrate --database=bypass`.
> Views públicas e admin usam `.using('bypass')` nos querysets, OU um router que
> direciona os apps/rotas certos para `bypass`.

## Middleware que define a oficina atual (conexão `default`)

```python
# core/middleware_rls.py
from django.db import connection

class RLSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        oficina_id = None
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            try:
                oficina_id = user.membro.oficina_id
            except Exception:
                oficina_id = None
        if oficina_id is not None:
            with connection.cursor() as c:
                # SET LOCAL exige transação; SET normal persiste na conexão (CONN_MAX_AGE)
                c.execute("SELECT set_config('app.current_oficina', %s, false)", [str(oficina_id)])
        else:
            with connection.cursor() as c:
                c.execute("SELECT set_config('app.current_oficina', '', false)")
        return self.get_response(request)
```

> ⚠️ Com `CONN_MAX_AGE > 0` a conexão é reutilizada entre requests. Sempre **redefina**
> a variável no início de cada request (o `else` acima limpa quando não há oficina),
> senão um request herda a oficina do anterior.

## SQL — roles

```sql
-- rodar como superusuário do Postgres
CREATE ROLE domecanico_app   LOGIN PASSWORD 'trocar';
CREATE ROLE domecanico_admin LOGIN PASSWORD 'trocar' BYPASSRLS;
GRANT ALL ON ALL TABLES IN SCHEMA public TO domecanico_app, domecanico_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO domecanico_app, domecanico_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO domecanico_app, domecanico_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO domecanico_app, domecanico_admin;
```

## SQL — tabelas COM `oficina_id` (policy direta)

Tabelas: `mecanica_cliente`, `mecanica_veiculo`, `mecanica_funcionario`, `mecanica_peca`,
`mecanica_ordemservico`, `mecanica_checklistentrada`, `mecanica_agendamento`,
`mecanica_orcamento`, `mecanica_notafiscal`(*), `mecanica_logauditoria`,
`mecanica_servicocatalogo`.

```sql
-- repita para cada tabela COM oficina_id:
ALTER TABLE mecanica_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE mecanica_cliente FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON mecanica_cliente
  USING (oficina_id = NULLIF(current_setting('app.current_oficina', true), '')::int)
  WITH CHECK (oficina_id = NULLIF(current_setting('app.current_oficina', true), '')::int);
```

## SQL — tabelas-filhas SEM `oficina_id` (policy por subconsulta)

```sql
-- exemplo: ServicoOS pertence à OrdemServico
ALTER TABLE mecanica_servicoos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mecanica_servicoos FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON mecanica_servicoos
  USING (EXISTS (
    SELECT 1 FROM mecanica_ordemservico o
    WHERE o.id = mecanica_servicoos.ordem_id
      AND o.oficina_id = NULLIF(current_setting('app.current_oficina', true), '')::int
  ));
```

Aplicar o mesmo padrão para: `mecanica_pecaos`→ordem, `mecanica_itemorcamento`→orcamento,
`mecanica_fotoveiculo`→veiculo, `mecanica_danochecklist`→checklist,
`mecanica_movimentacaoestoque`→peca, `mecanica_comissaomecanico`→ordem,
`mecanica_garantiaservico`→servico_os→ordem, `mecanica_alertaestoque`→peca.

> (*) `notafiscal` é 1‑para‑1 com a ordem; pode usar subconsulta pela ordem se preferir
> não depender de `oficina_id`.

## Rollout (ordem obrigatória)

1. **Staging** com dump de produção.
2. Criar roles + rodar todos os `ALTER TABLE ... ENABLE/FORCE` e `CREATE POLICY`.
3. Configurar `DATABASES` (default/bypass) + `RLSMiddleware` + `.using('bypass')` nos
   endpoints públicos/admin (ou um DB router).
4. **Testar**: login em 2 oficinas distintas e confirmar que uma não vê dados da outra;
   portal público `/acompanhar` funcionando; painel admin enxergando tudo.
5. Só então repetir em produção, em janela de manutenção, com backup na mão.

## Rollback

```sql
ALTER TABLE mecanica_cliente DISABLE ROW LEVEL SECURITY;  -- (repetir p/ cada tabela)
DROP POLICY IF EXISTS tenant_isolation ON mecanica_cliente;
```
E reverter `DATABASES`/middleware. Como a isolação de aplicação continua ativa,
desligar o RLS não expõe dados entre oficinas.
