export interface Cliente {
  id: number
  nome: string
  cpf_cnpj: string
  telefone: string
  celular: string
  email: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  observacoes: string
  total_veiculos?: number
  total_ordens?: number
  veiculos?: Veiculo[]
  criado_em: string
}

export interface FotoVeiculo {
  id: number
  veiculo: number
  foto: string
  descricao: string
  criado_em: string
}

export interface Veiculo {
  id: number
  cliente: number
  cliente_nome?: string
  tipo: 'moto' | 'carro' | 'caminhao' | 'outro'
  marca: string
  modelo: string
  ano: number | null
  placa: string
  cor: string
  quilometragem: number
  chassi: string
  observacoes: string
  fotos?: FotoVeiculo[]
  criado_em: string
}

export interface Funcionario {
  id: number
  nome: string
  cpf: string
  cargo: 'mecanico' | 'auxiliar' | 'eletricista' | 'atendente' | 'gerente' | 'outro'
  telefone: string
  email: string
  salario: string
  data_admissao: string | null
  ativo: boolean
  observacoes: string
  percentual_comissao: string
  criado_em: string
}

export interface Peca {
  id: number
  codigo: string
  nome: string
  descricao: string
  marca: string
  unidade: string
  quantidade: string
  quantidade_minima: string
  preco_custo: string
  preco_venda: string
  localizacao: string
  estoque_baixo: boolean
  criado_em: string
}

export interface MovimentacaoEstoque {
  id: number
  peca: number
  peca_nome?: string
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: string
  preco_unitario: string
  motivo: string
  criado_em: string
}

export interface ServicoOS {
  id: number
  ordem: number
  descricao: string
  quantidade: string
  preco_unitario: string
  total: string
  garantia?: { id: number; prazo_dias: number; data_expiracao: string; vigente: boolean } | null
}

export interface PecaOS {
  id: number
  ordem: number
  peca: number | null
  peca_nome?: string
  descricao: string
  quantidade: string
  preco_unitario: string
  total: string
}

export interface OrdemServico {
  id: number
  numero: string
  cliente: number
  cliente_nome?: string
  veiculo: number
  veiculo_placa?: string
  veiculo_modelo?: string
  mecanico: number | null
  mecanico_nome?: string
  status: 'aberta' | 'em_andamento' | 'aguardando_peca' | 'concluida' | 'cancelada'
  status_display?: string
  quilometragem_entrada: number
  quilometragem_saida?: number | null
  problema_relatado: string
  diagnostico: string
  observacoes: string
  data_entrada: string
  data_previsao: string | null
  data_conclusao: string | null
  desconto: string
  token_publico?: string
  servicos?: ServicoOS[]
  pecas_usadas?: PecaOS[]
  total_servicos?: string
  total_pecas?: string
  total_geral?: string
  criado_em: string
}

export interface NotaFiscal {
  id: number
  ordem: number
  ordem_numero?: string
  cliente_nome?: string
  numero_nota: string
  data_emissao: string
  observacoes: string
}

export interface DashboardStats {
  resumo: {
    total_clientes: number
    total_veiculos: number
    ordens_abertas: number
    ordens_concluidas_mes: number
    faturamento_mes: number
    faturamento_mes_passado: number
    pecas_estoque_baixo: number
    total_funcionarios: number
  }
  ordens_por_status: Record<string, number>
  faturamento_mensal: Array<{ mes: string; faturamento: number; ordens: number }>
  ultimas_ordens: OrdemServico[]
  agendamentos_hoje: Array<{
    id: number
    hora: string
    cliente_nome: string
    veiculo_placa: string
    veiculo_info: string
    servico: string
    status: string
    status_display: string
  }>
}
