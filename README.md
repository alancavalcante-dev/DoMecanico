# DoMecânico

Sistema de gestão completo para oficinas mecânicas. Plataforma SaaS multi-tenant com planos de assinatura, desenvolvida com Django REST Framework no backend e React + TypeScript no frontend.

---

## Visão Geral

O DoMecânico permite que oficinas mecânicas gerenciem todos os aspectos do negócio em um único lugar: ordens de serviço, clientes, veículos, estoque, agendamentos, orçamentos, comissões, garantias e muito mais. O sistema é multi-tenant — cada oficina tem seus próprios dados isolados, gerenciados por um painel administrativo central.

---

## Tecnologias

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.12+ | Linguagem principal |
| Django | 6.0 | Framework web |
| Django REST Framework | 3.17 | API REST |
| SimpleJWT | 5.5 | Autenticação JWT |
| PostgreSQL | 15+ | Banco de dados em produção |
| Redis | 7 | Cache e sessões |
| Gunicorn | 23 | Servidor WSGI |
| WhiteNoise | 6.12 | Arquivos estáticos |
| django-storages + boto3 | 1.14 / 1.38 | Mídia no Cloudflare R2 |
| Pillow | 12 | Processamento de imagens |
| ReportLab | 4.5 | Geração de PDFs |
| OpenPyXL | — | Exportação para Excel |

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Framework UI |
| TypeScript | 6 | Tipagem estática |
| Vite | 8 | Build e dev server |
| Tailwind CSS | 4 | Estilização |
| React Router | 7 | Roteamento SPA |
| Axios | 1.16 | Requisições HTTP |
| Recharts | 3 | Gráficos no dashboard |
| Lucide React | 1.14 | Ícones |
| react-hot-toast | 2.6 | Notificações |
| vite-plugin-pwa | 1.3 | PWA / instalação no celular |

---

## Estrutura do Projeto

```
DoMecanico/
├── accounts/          # Cadastro, autenticação, planos, assinaturas, permissões
├── adminpanel/        # Painel super-admin: faturas, gateways, logs, e-mails
├── mecanica/          # Núcleo: OS, clientes, veículos, estoque, etc.
├── core/              # Settings, URLs raiz, WSGI
├── frontend/          # React + TypeScript (SPA)
├── media/             # Upload de arquivos (local em dev, R2 em produção)
├── staticfiles/       # Gerado pelo collectstatic
├── .env               # Variáveis de ambiente (não versionar)
├── .env.example       # Template das variáveis
├── requirements.txt   # Dependências Python
├── Procfile           # Entry point para deploy
└── manage.py
```

---

## Módulos do Sistema

### Área da Oficina
- **Dashboard** — KPIs, faturamento, ordens por status, alertas de estoque
- **Clientes** — Cadastro, histórico de veículos e ordens
- **Veículos** — Ficha completa com histórico de serviços
- **Ordens de Serviço** — Abertura, andamento, conclusão, PDF, checklist de entrada
- **Orçamentos** — Geração e envio ao cliente com link público de aprovação
- **Agendamentos** — Agenda visual por mecânico/data
- **Estoque** — Controle de peças, alertas de estoque mínimo
- **Funcionários** — Cadastro, comissões por OS
- **Garantias** — Registro de garantias por OS
- **Relatórios** — Exportação Excel/PDF de OS, faturamento, estoque
- **Notas Fiscais** — Emissão de NF-e (integração futura)
- **Equipe** — Convite de membros por e-mail, controle de acesso por módulo
- **WhatsApp** — Mensagens automáticas via Evolution API
- **Perfil Público** — Página pública da oficina com serviços e agendamento

### Painel Super-Admin
- **Dashboard** — Visão geral de todas as oficinas, receita, planos
- **Oficinas** — Listagem, detalhes, edição de assinatura
- **Planos** — Criação e edição de planos (Starter / Pro)
- **Financeiro** — Faturas, pagamentos, gateways de pagamento
- **E-mail** — Configuração SMTP e templates de e-mail
- **Logs** — Log de atividades do sistema
- **Usuários / Equipe** — Gestão de usuários admin
- **Notificações** — Alertas internos do sistema

---

## Configuração Local (Desenvolvimento)

### Pré-requisitos
- Python 3.12+
- Node.js 20+
- Git

### Backend

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/domecanico.git
cd domecanico

# Crie e ative o ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com seus valores

# Crie as tabelas
python manage.py migrate

# Crie um superusuário admin
python manage.py createsuperuser

# (Opcional) Popule com dados de exemplo
python populate.py

# Inicie o servidor
python manage.py runserver
```

O backend estará disponível em `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição | Exemplo |
|---|---|---|
| `SECRET_KEY` | Chave secreta Django (gere uma nova em produção) | `django-insecure-...` |
| `DEBUG` | Modo debug (`True` em dev, `False` em produção) | `False` |
| `ALLOWED_HOSTS` | Hosts permitidos, separados por vírgula | `domecanico.com.br` |
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgres://user:pass@host/db` |
| `REDIS_URL` | URL de conexão Redis | `redis://localhost:6379/0` |
| `CORS_ALLOWED_ORIGINS` | Origens permitidas pelo CORS | `https://domecanico.com.br` |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 — Access Key ID | — |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 — Secret Key | — |
| `R2_BUCKET_NAME` | Nome do bucket R2 | `domecanico-media` |
| `R2_ENDPOINT_URL` | Endpoint S3 do R2 | `https://ACCOUNT_ID.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | Domínio público do bucket (opcional) | `media.domecanico.com.br` |
| `EVOLUTION_API_URL` | URL base da Evolution API (WhatsApp) | `http://localhost:8080` |
| `EVOLUTION_API_KEY` | Chave da Evolution API | — |

> Gere uma SECRET_KEY segura com:
> ```bash
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
> ```

---

## API — Principais Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/login/` | Login — retorna access + refresh token |
| POST | `/api/auth/refresh/` | Renova o access token |
| POST | `/api/auth/cadastro/` | Cadastro de nova oficina |
| POST | `/api/auth/logout/` | Logout (invalida refresh token) |

### Oficina
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/api/clientes/` | Listagem e criação de clientes |
| GET/POST | `/api/veiculos/` | Listagem e criação de veículos |
| GET/POST | `/api/ordens/` | Ordens de serviço |
| GET/POST | `/api/orcamentos/` | Orçamentos |
| GET/POST | `/api/agendamentos/` | Agendamentos |
| GET/POST | `/api/estoque/` | Itens de estoque |
| GET/POST | `/api/funcionarios/` | Funcionários |
| GET | `/api/dashboard/stats/` | Estatísticas do dashboard |

### Público (sem autenticação)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/acompanhar/` | Busca OS por placa ou CPF |
| GET | `/api/acompanhar/<token>/` | Detalhe de OS por token público |
| GET | `/api/orcamento-publico/<token>/` | Orçamento público |
| GET | `/api/oficina/<slug>/` | Perfil público da oficina |

### Admin Panel
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/admin-panel/dashboard/` | Visão geral do sistema |
| GET/PATCH | `/api/admin-panel/oficinas/` | Gestão de oficinas |
| GET/POST | `/api/admin-panel/planos/` | Planos de assinatura |
| GET | `/api/admin-panel/logs/` | Logs de atividade |

---

## Modelos de Dados

### accounts
- `Plano` — Planos de assinatura (Starter, Pro) com limites e módulos
- `Oficina` — Tenant principal com dados da empresa e perfil público
- `MembroOficina` — Usuário vinculado a uma oficina com papel (admin/mecânico/atendente)
- `Assinatura` — Status da assinatura da oficina (trial/ativa/cancelada/suspensa)
- `PermissaoMembro` — Módulos que cada membro pode acessar
- `ConviteOficina` — Convites por e-mail com token único
- `ConfiguracaoWhatsApp` — Configuração da Evolution API por oficina

### mecanica
- `Cliente` — Clientes da oficina
- `Veiculo` — Veículos com histórico
- `OrdemServico` — OS com serviços, peças, status e token público
- `ServicoOS` — Linha de serviço dentro de uma OS
- `PecaUsada` — Peça utilizada em uma OS
- `ChecklistEntrada` — Checklist de recebimento do veículo
- `Orcamento` — Orçamento com itens e status de aprovação
- `Agendamento` — Agendamento de serviço
- `ItemEstoque` — Peça no estoque com quantidade e preço
- `Funcionario` — Funcionário com comissão
- `Garantia` — Garantia vinculada a uma OS

### adminpanel
- `ConfiguracaoEmail` — Configuração SMTP global
- `TemplateEmail` — Templates de e-mail por tipo
- `LogAtividade` — Log de todas as ações relevantes
- `NotificacaoAdmin` — Notificações internas do admin
- `GatewayConfig` — Configuração de gateways de pagamento
- `Fatura` — Faturas das assinaturas
- `Pagamento` — Pagamentos vinculados a faturas

---

## Autenticação e Permissões

O sistema usa **JWT** com dois tokens:
- `access` — validade de 8 horas
- `refresh` — validade de 30 dias com rotação automática

Cada usuário tem um **papel** na oficina (`admin`, `mecanico`, `atendente`) e uma lista de **módulos permitidos** (`PermissaoMembro`). O frontend bloqueia rotas e menus com base nos módulos liberados.

O **Admin Panel** usa um contexto de autenticação separado (`AdminAuthContext`) e requer que o usuário seja `is_staff=True` no Django.

---

## Deploy

Veja [DEPLOY.md](DEPLOY.md) para instruções completas de deploy com Docker no VPS.

---

## Licença

Proprietário — todos os direitos reservados.
