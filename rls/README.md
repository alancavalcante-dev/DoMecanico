# RLS — como ligar (passo a passo)

RLS é **defesa em profundidade**: a isolação por oficina já existe na aplicação;
o RLS é a segunda tranca, no Postgres. Nasce **desligado** (`RLS_ENABLED=false`) —
o deploy não muda nada até você seguir os passos abaixo.

> Como a role `domecanico` do Docker é superusuário, ela **ignora o RLS** (vira a
> conexão *bypass*, usada pelo painel admin, endpoints públicos e migrations). A
> conexão normal do app passa a usar uma role nova, `domecanico_app`, **sem** bypass —
> é nela que o RLS filtra por oficina.

## 1. Backup (sempre)
```bash
docker compose exec -T db pg_dump -U domecanico domecanico > backup_pre_rls.sql
```

## 2. Escolha a senha da role do app e edite o SQL
No `rls/apply_rls.sql`, troque `CHANGE_ME_APP` por uma senha forte (guarde-a).
Se a role principal do seu banco **não** for `domecanico`, ajuste o nome nas
2 linhas indicadas no arquivo.

## 3. Aplique as roles + policies
```bash
docker compose exec -T db psql -U domecanico -d domecanico < rls/apply_rls.sql
```
Confira (todas devem ter `t` em rowsecurity):
```bash
docker compose exec -T db psql -U domecanico -d domecanico -c \
 "SELECT relname, relrowsecurity FROM pg_class WHERE relname LIKE 'mecanica_%' AND relkind='r' ORDER BY 1;"
```

## 4. Aponte as conexões no `.env`
```
RLS_ENABLED=true
# conexão normal do app -> role NOVA, sem bypass (RLS aplica aqui):
DATABASE_URL=postgres://domecanico_app:SENHA_APP@db:5432/domecanico
# conexão bypass -> a role atual (o que estava em DATABASE_URL antes):
DATABASE_BYPASS_URL=postgres://domecanico:SENHA_ATUAL@db:5432/domecanico
```

## 5. Reinicie (migrations rodam na conexão bypass automaticamente)
```bash
./deploy.sh          # ou: docker compose up -d backend
```

## 6. Teste (checklist)
- [ ] Login em **2 oficinas** distintas → uma **não** vê clientes/OS da outra.
- [ ] Portal público `/acompanhar` (buscar por placa+CPF) funciona.
- [ ] Painel admin (`/admin-panel`) enxerga **todas** as oficinas.
- [ ] Upload de foto de veículo, gerar PDF de OS e comprovante funcionam.
- [ ] Login do seu usuário `ala.pereiradocavalcante@gmail.com` no painel admin OK.

## Rollback (se algo quebrar)
Rápido e sem perder dados — desliga as policies:
```bash
docker compose exec -T db psql -U domecanico -d domecanico < rls/rollback_rls.sql
```
O app volta a funcionar na hora (a isolação de aplicação continua ativa). Se
quiser reverter 100%: no `.env`, `RLS_ENABLED=false` e `DATABASE_URL` de volta
para a role `domecanico`, depois `docker compose up -d backend`.

## Ao adicionar migrations no futuro
Com RLS ligado, rode-as na conexão bypass (o `deploy.sh` já faz isso quando
`RLS_ENABLED=true`). Manualmente seria:
```bash
docker compose exec -T backend python manage.py migrate --database=bypass
```
