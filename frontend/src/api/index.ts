import axios from 'axios'

// ── Rastreamento de inatividade (30 min) ─────────────────────────────────────
const INATIVIDADE_MS = 30 * 60 * 1000
let ultimaAtividade = Date.now()

const registrarAtividade = () => { ultimaAtividade = Date.now() }
const estaInativo = () => Date.now() - ultimaAtividade > INATIVIDADE_MS

if (typeof window !== 'undefined') {
  ;['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, registrarAtividade, { passive: true })
  )
}

// ── API para oficinas (usuários comuns) ───────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => { registrarAtividade(); return res },
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (estaInativo()) { window.location.href = '/login'; return Promise.reject(error) }
      try {
        await axios.post('/api/auth/token/refresh/', {}, { withCredentials: true })
        return api(original)
      } catch {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── API exclusiva para o painel admin (cookie isolado) ────────────────────────
const adminApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

adminApi.interceptors.response.use(
  (res) => { registrarAtividade(); return res },
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (estaInativo()) { window.location.href = '/admin-panel/login'; return Promise.reject(error) }
      try {
        await axios.post('/api/auth/token/refresh/', { admin: true }, { withCredentials: true })
        return adminApi(original)
      } catch {
        window.location.href = '/admin-panel/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  configuracaoSistema: () => axios.get('/api/admin-panel/configuracao-sistema/publica/'),
  planos: () => api.get('/auth/planos/'),
  registrar: (data: object) => api.post('/auth/registrar/', data),
  login: (data: object) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
  assinatura: () => api.get('/auth/assinatura/'),
  pagar: (data: object) => api.post('/auth/assinatura/pagar/', data),
  gerarLinkPagamento: (data: object) => api.post('/auth/assinatura/gerar-link-pagamento/', data),
  trocarPlano: (data: object) => api.post('/auth/assinatura/trocar-plano/', data),
  minhasFaturas: () => api.get('/auth/assinatura/faturas/'),
  cancelarFatura: (id: number) => api.post(`/auth/assinatura/faturas/${id}/cancelar/`),
  atualizarOficina: (data: object) => api.patch('/auth/oficina/', data),
  alterarSenha: (data: object) => api.post('/auth/alterar-senha/', data),
  uploadLogo: (formData: FormData) => api.post('/auth/oficina/logo/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const equipeAPI = {
  listarMembros: () => api.get('/auth/membros/'),
  criarMembro: (data: object) => api.post('/auth/membros/criar/', data),
  removerMembro: (id: number) => api.delete(`/auth/membros/${id}/remover/`),
  alterarPapel: (id: number, papel: string) => api.patch(`/auth/membros/${id}/papel/`, { papel }),
  resetarSenha: (id: number) => api.post(`/auth/membros/${id}/senha/`),
  listarModulos: () => api.get('/auth/modulos/'),
  getPermissoes: (membroId: number) => api.get(`/auth/membros/${membroId}/permissoes/`),
  salvarPermissoes: (membroId: number, modulos: string[]) => api.put(`/auth/membros/${membroId}/permissoes/`, { modulos }),
  aplicarPerfil: (membroId: number, perfil: string) => api.post(`/auth/membros/${membroId}/aplicar-perfil/`, { perfil }),
  infoConvite: (token: string) => api.get(`/auth/convite/${token}/`),
  aceitarConvite: (token: string, data: object) => api.post(`/auth/convite/${token}/aceitar/`, data),
}

export const whatsappAPI = {
  config: () => api.get('/auth/whatsapp/'),
  salvar: (data: object) => api.patch('/auth/whatsapp/', data),
  testar: (telefone: string) => api.post('/auth/whatsapp/teste/', { telefone }),
  status: () => api.get('/auth/whatsapp/status/'),
  conectar: () => api.post('/auth/whatsapp/conectar/'),
  desconectar: () => api.post('/auth/whatsapp/desconectar/'),
}

export const clientesAPI = {
  listar: (params?: object) => api.get('/clientes/', { params }),
  buscar: (id: number) => api.get(`/clientes/${id}/`),
  criar: (data: object) => api.post('/clientes/', data),
  atualizar: (id: number, data: object) => api.put(`/clientes/${id}/`, data),
  deletar: (id: number) => api.delete(`/clientes/${id}/`),
}

export const veiculosAPI = {
  listar: (params?: object) => api.get('/veiculos/', { params }),
  buscar: (id: number) => api.get(`/veiculos/${id}/`),
  criar: (data: object) => api.post('/veiculos/', data),
  atualizar: (id: number, data: object) => api.put(`/veiculos/${id}/`, data),
  deletar: (id: number) => api.delete(`/veiculos/${id}/`),
  uploadFotos: (id: number, formData: FormData) =>
    api.post(`/veiculos/${id}/upload-foto/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deletarFoto: (veiculoId: number, fotoId: number) =>
    api.delete(`/veiculos/${veiculoId}/foto/${fotoId}/`),
  saudePDF: (id: number) =>
    api.get(`/veiculos/${id}/saude/`, { responseType: 'blob' }),
}

export const funcionariosAPI = {
  listar: (params?: object) => api.get('/funcionarios/', { params }),
  buscar: (id: number) => api.get(`/funcionarios/${id}/`),
  criar: (data: object) => api.post('/funcionarios/', data),
  atualizar: (id: number, data: object) => api.put(`/funcionarios/${id}/`, data),
  patch: (id: number, data: object) => api.patch(`/funcionarios/${id}/`, data),
  deletar: (id: number) => api.delete(`/funcionarios/${id}/`),
}

export const pecasAPI = {
  listar: (params?: object) => api.get('/pecas/', { params }),
  buscar: (id: number) => api.get(`/pecas/${id}/`),
  criar: (data: object) => api.post('/pecas/', data),
  atualizar: (id: number, data: object) => api.put(`/pecas/${id}/`, data),
  deletar: (id: number) => api.delete(`/pecas/${id}/`),
  movimentar: (id: number, data: object) => api.post(`/pecas/${id}/movimentar/`, data),
  movimentacoes: (params?: object) => api.get('/movimentacoes/', { params }),
}

export const ordensAPI = {
  listar: (params?: object) => api.get('/ordens/', { params }),
  buscar: (id: number) => api.get(`/ordens/${id}/`),
  criar: (data: object) => api.post('/ordens/', data),
  atualizar: (id: number, data: object) => api.put(`/ordens/${id}/`, data),
  deletar: (id: number) => api.delete(`/ordens/${id}/`),
  atualizarStatus: (id: number, status: string) =>
    api.patch(`/ordens/${id}/atualizar-status/`, { status }),
  adicionarServico: (id: number, data: object) =>
    api.post(`/ordens/${id}/adicionar-servico/`, data),
  adicionarPeca: (id: number, data: object) =>
    api.post(`/ordens/${id}/adicionar-peca/`, data),
  gerarPDF: (id: number) =>
    api.get(`/ordens/${id}/gerar-pdf/`, { responseType: 'blob' }),
}

export const servicosOSAPI = {
  deletar: (id: number) => api.delete(`/servicos-os/${id}/`),
  atualizar: (id: number, data: object) => api.put(`/servicos-os/${id}/`, data),
}

export const pecasOSAPI = {
  deletar: (id: number) => api.delete(`/pecas-os/${id}/`),
  atualizar: (id: number, data: object) => api.put(`/pecas-os/${id}/`, data),
}

export const notasAPI = {
  listar: (params?: object) => api.get('/notas-fiscais/', { params }),
  buscar: (id: number) => api.get(`/notas-fiscais/${id}/`),
  criar: (data: object) => api.post('/notas-fiscais/', data),
  imprimir: (id: number) =>
    api.get(`/notas-fiscais/${id}/imprimir/`, { responseType: 'blob' }),
}

export const dashboardAPI = {
  stats: () => api.get('/dashboard/'),
  exportar: () => api.get('/exportar/', { responseType: 'blob' }),
  buscaGlobal: (q: string) => api.get('/buscar/', { params: { q } }),
  relatorioPDF: (params: object) => api.get('/relatorios/pdf/', { params, responseType: 'blob' }),
}

export const adminAPI = {
  me: () => adminApi.get('/admin-panel/me/'),
  dashboard: () => adminApi.get('/admin-panel/dashboard/'),

  // Oficinas
  oficinas: (params?: object) => adminApi.get('/admin-panel/oficinas/', { params }),
  oficina: (id: number) => adminApi.get(`/admin-panel/oficinas/${id}/`),
  oficinaAcao: (id: number, data: object) => adminApi.post(`/admin-panel/oficinas/${id}/acao/`, data),

  // Planos
  planos: () => adminApi.get('/admin-panel/planos/'),
  planoCriar: (data: object) => adminApi.post('/admin-panel/planos/', data),
  planoEditar: (id: number, data: object) => adminApi.put(`/admin-panel/planos/${id}/`, data),
  planoExcluir: (id: number) => adminApi.delete(`/admin-panel/planos/${id}/`),

  // Usuários
  usuarios: () => adminApi.get('/admin-panel/usuarios/'),
  usuarioAcao: (id: number, data: object) => adminApi.post(`/admin-panel/usuarios/${id}/acao/`, data),

  // Equipe
  equipe: () => adminApi.get('/admin-panel/equipe/'),
  equipeCriar: (data: object) => adminApi.post('/admin-panel/equipe/criar/', data),
  equipeResetarSenha: (id: number) => adminApi.post(`/admin-panel/equipe/${id}/senha/`),
  equipeRemover: (id: number) => adminApi.delete(`/admin-panel/equipe/${id}/remover/`),

  // E-mail
  emailConfig: () => adminApi.get('/admin-panel/email/config/'),
  emailConfigSalvar: (data: object) => adminApi.put('/admin-panel/email/config/', data),
  emailTestar: (data: object) => adminApi.post('/admin-panel/email/testar/', data),
  emailTemplates: () => adminApi.get('/admin-panel/email/templates/'),
  emailTemplateEditar: (id: number, data: object) => adminApi.put(`/admin-panel/email/templates/${id}/`, data),

  // Configuração do sistema
  configuracaoSistema: () => adminApi.get('/admin-panel/configuracao-sistema/'),
  configuracaoSistemaSalvar: (data: object) => adminApi.put('/admin-panel/configuracao-sistema/', data),

  // Logs
  logs: (params?: object) => adminApi.get('/admin-panel/logs/', { params }),

  // Notificações
  notificacoes: () => adminApi.get('/admin-panel/notificacoes/'),
  notificacaoLida: (id: number) => adminApi.post(`/admin-panel/notificacoes/${id}/lida/`),
  notificacoesLimpar: () => adminApi.post('/admin-panel/notificacoes/limpar/'),
}

export const agendamentosAPI = {
  listar: (params?: object) => api.get('/agendamentos/', { params }),
  criar: (data: object) => api.post('/agendamentos/', data),
  atualizar: (id: number, data: object) => api.put(`/agendamentos/${id}/`, data),
  deletar: (id: number) => api.delete(`/agendamentos/${id}/`),
  confirmar: (id: number) => api.patch(`/agendamentos/${id}/confirmar/`),
  cancelar: (id: number) => api.patch(`/agendamentos/${id}/cancelar/`),
}

export const orcamentosAPI = {
  listar: (params?: object) => api.get('/orcamentos/', { params }),
  buscar: (id: number) => api.get(`/orcamentos/${id}/`),
  criar: (data: object) => api.post('/orcamentos/', data),
  atualizar: (id: number, data: object) => api.put(`/orcamentos/${id}/`, data),
  deletar: (id: number) => api.delete(`/orcamentos/${id}/`),
  adicionarItem: (id: number, data: object) => api.post(`/orcamentos/${id}/adicionar_item/`, data),
  removerItem: (id: number, itemId: number) => api.delete(`/orcamentos/${id}/remover-item/${itemId}/`),
  converterOS: (id: number) => api.post(`/orcamentos/${id}/converter_os/`),
  aprovar: (id: number) => api.post(`/orcamentos/${id}/aprovar/`),
  rejeitar: (id: number) => api.post(`/orcamentos/${id}/rejeitar/`),
  atualizarDesconto: (id: number, desconto: number) => api.patch(`/orcamentos/${id}/atualizar_desconto/`, { desconto }),
}

export const garantiasAPI = {
  listar: (params?: object) => api.get('/garantias/', { params }),
  criar: (data: object) => api.post('/garantias/', data),
  deletar: (id: number) => api.delete(`/garantias/${id}/`),
  getDefault: () => api.get('/garantia-default/'),
  salvarDefault: (data: object) => api.put('/garantia-default/', data),
  aplicarServico: (servicoId: number, data?: object) =>
    api.post(`/servicos-os/${servicoId}/aplicar-garantia/`, data ?? {}),
}

export const comissoesAPI = {
  listar: (params?: object) => api.get('/comissoes/', { params }),
  calcularOS: (data: object) => api.post('/comissoes/calcular_os/', data),
  marcarPago: (id: number) => api.post(`/comissoes/${id}/marcar_pago/`),
  remover: (id: number) => api.delete(`/comissoes/${id}/remover/`),
}

export const alertasEstoqueAPI = {
  listar: (params?: object) => api.get('/alertas-estoque/', { params }),
  marcarLido: (id: number) => api.post(`/alertas-estoque/${id}/marcar_lido/`),
  marcarTodosLidos: () => api.post('/alertas-estoque/marcar_todos_lidos/'),
}

// ── API pública (sem autenticação) ────────────────────────────────────────────
const publicApi = axios.create({ baseURL: '/api' })

export const perfilAPI = {
  getConfig: () => api.get('/auth/perfil-configurar/'),
  salvarConfig: (data: object) => api.patch('/auth/perfil-configurar/', data),
  getPublico: (slug: string) => publicApi.get(`/auth/perfil/${slug}/`),
  agendar: (slug: string, data: object) => publicApi.post(`/auth/perfil/${slug}/agendar/`, data),
}

export const checklistAPI = {
  listar: (params?: object) => api.get('/checklists/', { params }),
  buscar: (id: number) => api.get(`/checklists/${id}/`),
  criar: (data: object) => api.post('/checklists/', data),
  atualizar: (id: number, data: object) => api.patch(`/checklists/${id}/`, data),
  deletar: (id: number) => api.delete(`/checklists/${id}/`),
  adicionarDano: (id: number, data: object) => api.post(`/checklists/${id}/adicionar-dano/`, data),
  removerDano: (id: number, danoId: number) => api.delete(`/checklists/${id}/remover-dano/${danoId}/`),
  uploadFotoDano: (id: number, danoId: number, formData: FormData) =>
    api.post(`/checklists/${id}/upload-foto-dano/${danoId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  assinar: (id: number, assinatura: string) => api.post(`/checklists/${id}/assinar/`, { assinatura }),
  pdf: (id: number) => api.get(`/checklists/${id}/pdf/`, { responseType: 'blob' }),
  publico: (token: string) => api.get(`/checklist-publico/${token}/`),
  assinarPublico: (token: string, assinatura: string) =>
    api.post(`/checklist-publico/${token}/assinar/`, { assinatura }),
}
