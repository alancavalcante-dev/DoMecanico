// Dados das páginas públicas do cliente: OS (GET /api/os-publica/<token>/ e busca), orçamento e checklist.

export interface Servico { descricao: string; quantidade: string }
export interface Foto { id: number; foto_url: string; descricao: string; criado_em: string }
export interface Dano { regiao: string; tipo: string; foto_url: string | null }

export interface ChecklistPublico {
  token_publico: string
  status: 'pendente' | 'assinado'
  quilometragem: number
  nivel_combustivel: string
  observacoes_gerais: string
  assinatura: string
  data_assinatura: string | null
  criado_em: string
  danos: Dano[]
}

export interface Garantia {
  servico: string
  prazo_dias: number
  data_inicio: string
  data_expiracao: string
  vigente: boolean
  observacoes: string
}

export interface ItemOrcamento {
  descricao: string
  tipo: 'servico' | 'peca'
  quantidade: string
  preco_unitario: string
  total: string
}

export interface OrcamentoPublico {
  numero: string
  token_publico: string
  status: string
  status_display: string
  validade: string | null
  problema_relatado: string
  observacoes: string
  desconto: string
  total_servicos: string
  total_pecas: string
  total_geral: string
  itens: ItemOrcamento[]
  criado_em: string
}

/** Só vem quando a oficina ligou o perfil público. */
export interface PerfilOficina { slug: string; descricao: string; servicos: string[] }

/** Campos da oficina que as páginas públicas (OS, orçamento, checklist) recebem. */
export interface OficinaPublica {
  oficina_nome: string
  oficina_telefone: string
  oficina_endereco: string
  oficina_cidade: string
  oficina_estado: string
  oficina_cep: string
  oficina_horario: string
  oficina_cor_primaria: string
  oficina_logo_url: string | null
  oficina_perfil: PerfilOficina | null
}

export interface VeiculoPublico {
  veiculo_placa: string
  veiculo_marca: string
  veiculo_modelo: string
  veiculo_ano: string | null
  veiculo_cor: string | null
}

/** OS ligada ao orçamento ou ao checklist (para ir ao acompanhamento). */
export interface LinkOS { token_publico: string; numero: string }

export interface OSPublica extends OficinaPublica, VeiculoPublico {
  id: number
  numero: string
  token_publico: string
  status: string
  status_display: string
  cliente_nome: string
  veiculo_info: string
  problema_relatado: string
  diagnostico: string
  observacoes: string
  quilometragem_entrada: number
  data_entrada: string
  data_previsao: string | null
  data_conclusao: string | null
  status_alterado_em: string | null
  mecanico_nome: string | null
  fotos_veiculo: Foto[]
  servicos: Servico[]
  checklist: ChecklistPublico | null
  garantias: Garantia[]
  orcamento: OrcamentoPublico | null
}

/** GET /api/orcamento-publico/<token>/ */
export interface OrcamentoAvulso extends Omit<OrcamentoPublico, 'itens'>, OficinaPublica, VeiculoPublico {
  id: number
  cliente_nome: string
  itens: (ItemOrcamento & { id: number })[]
  os: LinkOS | null
}

/** GET /api/checklist-publico/<token>/ */
export interface ChecklistAvulso extends OficinaPublica, VeiculoPublico {
  id: number
  token_publico: string
  status: 'pendente' | 'assinado'
  cliente_nome: string
  quilometragem: number
  nivel_combustivel: string
  nivel_combustivel_display: string
  observacoes_gerais: string
  assinatura: string
  data_assinatura: string | null
  criado_em: string
  danos: { id: number; regiao_display: string; tipo_display: string; descricao: string; foto_url: string | null }[]
  os: LinkOS | null
}
