# DoMecânico — Frontend

Interface web do sistema DoMecânico. SPA (Single Page Application) construída com React 19 + TypeScript + Vite, estilizada com Tailwind CSS 4.

---

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Framework UI |
| TypeScript | 6 | Tipagem estática |
| Vite | 8 | Build e dev server |
| Tailwind CSS | 4 | Estilização utilitária |
| React Router | 7 | Roteamento client-side |
| Axios | 1.16 | Requisições HTTP à API |
| Recharts | 3 | Gráficos e visualizações |
| Lucide React | 1.14 | Ícones |
| react-hot-toast | 2.6 | Notificações |
| vite-plugin-pwa | 1.3 | Suporte PWA (instalável) |
| xlsx | 0.18 | Exportação para Excel |

---

## Estrutura de Pastas

```
frontend/
├── public/
│   ├── favicon.ico           # Favicon multi-resolução (16/32/48px)
│   ├── favicon.png           # Favicon PNG
│   ├── logotipo.png          # Logo principal do sistema
│   ├── apple-touch-icon.png  # Ícone para iOS (180×180)
│   ├── icons/
│   │   ├── icon-192.png      # PWA icon
│   │   └── icon-512.png      # PWA icon
│   └── manifest.webmanifest  # Manifest PWA
├── src/
│   ├── api/                  # Clientes HTTP (axios) por módulo
│   ├── components/
│   │   ├── layout/           # Sidebar, Header, Layout principal
│   │   ├── admin/            # AdminLayout, sidebar do painel admin
│   │   └── ui/               # Componentes reutilizáveis (CurrencyInput, etc.)
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Autenticação da oficina (JWT)
│   │   └── AdminAuthContext.tsx  # Autenticação do painel admin
│   ├── pages/
│   │   ├── admin/            # Páginas do painel super-admin
│   │   ├── Dashboard.tsx
│   │   ├── Clientes.tsx
│   │   ├── Veiculos.tsx
│   │   ├── OrdemServico.tsx
│   │   ├── Orcamentos.tsx
│   │   ├── Agendamentos.tsx
│   │   ├── Estoque.tsx
│   │   ├── Funcionarios.tsx
│   │   ├── Garantias.tsx
│   │   ├── Comissoes.tsx
│   │   ├── Relatorios.tsx
│   │   ├── NotasFiscais.tsx
│   │   ├── Equipe.tsx
│   │   ├── Checklist.tsx
│   │   ├── ConfiguracaoWhatsApp.tsx
│   │   ├── AcompanharOS.tsx      # Página pública — busca de OS
│   │   ├── OrcamentoPublico.tsx  # Página pública — aprovação de orçamento
│   │   ├── PerfilOficina.tsx     # Perfil público da oficina
│   │   ├── Home.tsx              # Landing page
│   │   ├── Login.tsx
│   │   └── Cadastro.tsx
│   ├── App.tsx               # Rotas, guards, título dinâmico de aba
│   └── main.tsx
├── index.html
├── vite.config.ts
└── tsconfig.json
```

---

## Configuração e Execução

### Pré-requisitos
- Node.js 20+
- Backend Django rodando em `http://localhost:8000`

### Desenvolvimento

```bash
npm install
npm run dev
```

Acesse em `http://localhost:5173`.

### Build para produção

```bash
npm run build
```

Os arquivos gerados ficam em `dist/`. Sirva com nginx ou outro servidor estático.

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do `frontend/` se precisar sobrescrever a URL da API:

```env
VITE_API_URL=https://api.domecanico.net
```

Por padrão, todas as requisições são feitas para `/api/` (relativo), o que funciona quando nginx faz proxy do backend no mesmo domínio.

---

## Roteamento

O roteamento é 100% client-side (React Router). O nginx deve redirecionar todas as rotas para `index.html`:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Rotas públicas (sem autenticação)
| Rota | Página |
|---|---|
| `/` | Landing page |
| `/login` | Login da oficina |
| `/cadastro` | Cadastro de nova oficina |
| `/acompanhar` | Busca pública de OS por placa/CPF |
| `/acompanhar/:token` | Detalhe público de OS |
| `/orcamento/:token` | Aprovação pública de orçamento |
| `/oficina/:slug` | Perfil público da oficina |
| `/convite/:token` | Aceitar convite de membro |
| `/checklist/:token` | Checklist de entrada do cliente |

### Rotas autenticadas (oficina)
| Rota | Módulo necessário |
|---|---|
| `/dashboard` | `dashboard` |
| `/clientes` | `clientes` |
| `/veiculos` | `veiculos` |
| `/ordens` | `ordens` |
| `/orcamentos` | `orcamentos` |
| `/agendamentos` | `agendamentos` |
| `/estoque` | `estoque` |
| `/funcionarios` | `funcionarios` |
| `/checklist` | `checklist` |
| `/garantias` | `garantias` |
| `/comissoes` | `comissoes` |
| `/relatorios` | `relatorios` |
| `/notas-fiscais` | `notas_fiscais` |
| `/equipe` | `equipe` (admin only) |
| `/whatsapp` | `whatsapp` (admin only) |

### Admin Panel
| Rota | Descrição |
|---|---|
| `/admin-panel/login` | Login super-admin |
| `/admin-panel/dashboard` | Visão geral |
| `/admin-panel/oficinas` | Gestão de oficinas |
| `/admin-panel/planos` | Planos de assinatura |
| `/admin-panel/financeiro` | Faturas e pagamentos |
| `/admin-panel/email` | Templates e SMTP |
| `/admin-panel/logs` | Logs de atividade |
| `/admin-panel/usuarios` | Usuários admin |
| `/admin-panel/gateway` | Gateways de pagamento |

---

## Autenticação

O `AuthContext` gerencia o ciclo de vida do JWT:
- Armazena `access` e `refresh` tokens no `localStorage`
- Intercepta todas as requisições axios para adicionar `Authorization: Bearer <token>`
- Renova o `access` token automaticamente quando expira (usando o `refresh`)
- Expõe `user`, `oficina`, `plano`, `temAcesso(modulo)` para os componentes

---

## Componentes Notáveis

### `CurrencyInput`
Componente de input para valores monetários brasileiros:
- Formata automaticamente com `.` para milhares e `,` para decimais
- Exemplo: digitar `1234567` → exibe `1.234.567,00`
- `onChange` retorna string no formato `"1234567.00"` (ponto decimal inglês para o backend)
- `formatBRL(value)` e `parseBRL(string)` são exportados para uso fora do componente

### `PageTitle`
Componente invisível em `App.tsx` que atualiza `document.title` dinamicamente com base na rota atual. Exemplo: `/estoque` → `"Estoque — DoMecânico"`.

---

## PWA

O app é instalável como PWA em dispositivos móveis e desktop. Configurado via `vite-plugin-pwa` com:
- `manifest.webmanifest` gerado automaticamente
- Ícones 192×192 e 512×512 em `public/icons/`
- `apple-touch-icon.png` (180×180) para iOS
- Service worker com estratégia de cache `NetworkFirst` para a API e `CacheFirst` para assets estáticos
