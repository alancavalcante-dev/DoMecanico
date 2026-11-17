// Dados públicos de uma OS (GET /api/os-publica/<token>/ e POST /api/os-publica/buscar/).

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

export interface OSPublica {
  id: number
  numero: string
  token_publico: string
  status: string
  status_display: string
  cliente_nome: string
  veiculo_info: string
  veiculo_placa: string
  veiculo_marca: string
  veiculo_modelo: string
  veiculo_ano: string | null
  veiculo_cor: string | null
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
  checklist: ChecklistPublico | null
  garantias: Garantia[]
  orcamento: OrcamentoPublico | null
}
