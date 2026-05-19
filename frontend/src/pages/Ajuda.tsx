import { useState } from 'react'
import {
  BookOpen, LayoutDashboard, Users, Car, Package, UserCog,
  ClipboardList, Calendar, FileCheck, ShieldCheck, DollarSign,
  FileText, ClipboardCheck, BarChart3, CreditCard, Globe,
  ChevronRight, Search, Lightbulb, AlertCircle, CheckCircle2,
  ArrowRight
} from 'lucide-react'

interface Section {
  id: string
  icon: React.ElementType
  label: string
  color: string
  content: React.ReactNode
}

function Tag({ children, color = 'blue' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3.5 my-4">
      <Lightbulb size={16} className="text-blue-500 shrink-0 mt-0.5" />
      <p className="text-sm text-blue-700">{children}</p>
    </div>
  )
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3.5 my-4">
      <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-700">{children}</p>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 my-2">
      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <p className="text-sm text-slate-700">{children}</p>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-slate-800 mt-6 mb-2 flex items-center gap-2">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-slate-700 mt-4 mb-1.5">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
}

function FieldTable({ rows }: { rows: [string, string, string?][] }) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden my-3">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase">Campo</th>
            <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase">Descrição</th>
            <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-semibold uppercase">Obrigatório</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map(([campo, desc, obrig = 'Não']) => (
            <tr key={campo} className="hover:bg-slate-50/50">
              <td className="px-4 py-2.5 font-mono text-xs text-blue-700 font-medium">{campo}</td>
              <td className="px-4 py-2.5 text-slate-600">{desc}</td>
              <td className="px-4 py-2.5">
                <Tag color={obrig === 'Sim' ? 'green' : 'slate'}>{obrig}</Tag>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Conteúdo de cada seção ────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id: 'visao-geral',
    icon: BookOpen,
    label: 'Visão Geral',
    color: 'blue',
    content: (
      <div>
        <P>
          O <strong>DoMecânico</strong> é um sistema de gestão completo para oficinas mecânicas.
          Ele centraliza clientes, veículos, ordens de serviço, estoque, finanças e comunicação
          com o cliente em um único lugar.
        </P>

        <H2>Fluxo principal de uma OS</H2>
        <div className="flex flex-col gap-2 my-3">
          {[
            ['Cliente cadastrado', 'Veículo vinculado'],
            ['Veículo vinculado', 'Agendamento ou entrada direta'],
            ['Entrada do veículo', 'Checklist de danos assinado pelo cliente'],
            ['OS aberta', 'Mecânico designado, serviços e peças lançados'],
            ['OS concluída', 'Nota fiscal gerada, comissão calculada automaticamente'],
            ['Cliente acompanha', 'Portal público com link ou placa + CPF'],
          ].map(([de, para], i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 size={15} className="text-green-500 shrink-0" />
              <span className="font-medium text-slate-700">{de}</span>
              <ArrowRight size={13} className="text-slate-400" />
              <span>{para}</span>
            </div>
          ))}
        </div>

        <H2>Módulos disponíveis</H2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
          {[
            ['Dashboard', 'Resumo geral e alertas de estoque'],
            ['Clientes', 'Cadastro de pessoas físicas e jurídicas'],
            ['Veículos', 'Frota vinculada a clientes com fotos'],
            ['Ordens de Serviço', 'Gestão completa de OS (serviços, peças, PDF)'],
            ['Agendamentos', 'Calendário mensal de visitas'],
            ['Orçamentos', 'Orçamentos digitais com aprovação do cliente'],
            ['Estoque', 'Controle de peças com alertas de quantidade mínima'],
            ['Funcionários', 'Equipe com cargo e comissão configurável'],
            ['Checklist', 'Vistoria de entrada assinada digitalmente'],
            ['Garantias', 'Registro de garantias por serviço'],
            ['Comissões', 'Cálculo automático ao concluir OS'],
            ['Notas Fiscais', 'Emissão de NF simplificada em PDF'],
            ['Relatórios', 'Faturamento, OS por período e estoque'],
          ].map(([mod, desc]) => (
            <div key={mod} className="flex gap-2 bg-slate-50 rounded-lg p-3">
              <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">{mod}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Tip>
          Comece sempre cadastrando o cliente e o veículo. Depois abra a OS vinculando os dois.
          Tudo no sistema parte desse cadastro inicial.
        </Tip>
      </div>
    ),
  },

  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    color: 'blue',
    content: (
      <div>
        <P>
          O Dashboard é a tela inicial após o login. Ele mostra um resumo em tempo real
          da sua oficina sem precisar acessar cada módulo.
        </P>

        <H2>Cards de resumo</H2>
        <FieldTable rows={[
          ['Clientes', 'Total de clientes cadastrados na oficina'],
          ['Veículos', 'Total de veículos registrados'],
          ['OS Abertas', 'Ordens de serviço ainda em andamento'],
          ['Faturamento do mês', 'Total das OS concluídas no mês atual'],
          ['Peças com estoque baixo', 'Peças abaixo da quantidade mínima definida'],
          ['OS concluídas', 'Total de OS finalizadas neste mês'],
        ]} />

        <H2>Alertas de estoque</H2>
        <P>
          Se alguma peça estiver abaixo da quantidade mínima, um painel de alertas
          aparece no topo do Dashboard. Você pode dispensar cada alerta individualmente
          ou todos de uma vez clicando em "Dispensar todos".
        </P>

        <H2>Gráfico de faturamento</H2>
        <P>
          Exibe o faturamento e a quantidade de OS dos últimos meses para visualizar
          tendências de crescimento ou queda no movimento.
        </P>

        <H2>Últimas OS</H2>
        <P>
          Lista as ordens de serviço mais recentes com status, cliente e mecânico.
          Clique em qualquer linha para ir direto à tela de OS.
        </P>

        <Tip>
          O Dashboard se atualiza a cada vez que você navega para ele.
          Recarregue a página se quiser forçar uma atualização imediata.
        </Tip>
      </div>
    ),
  },

  {
    id: 'clientes',
    icon: Users,
    label: 'Clientes',
    color: 'blue',
    content: (
      <div>
        <P>
          Cadastre e gerencie todos os clientes da sua oficina, sejam pessoas físicas
          (CPF) ou empresas (CNPJ).
        </P>

        <H2>Cadastrando um cliente</H2>
        <Step n={1}>Clique em <strong>"Novo Cliente"</strong> no canto superior direito.</Step>
        <Step n={2}>Preencha nome, CPF/CNPJ e pelo menos um contato (telefone ou celular).</Step>
        <Step n={3}>Endereço e observações são opcionais mas ajudam no histórico.</Step>
        <Step n={4}>Clique em <strong>"Salvar"</strong>.</Step>

        <H2>Campos disponíveis</H2>
        <FieldTable rows={[
          ['Nome', 'Nome completo ou razão social', 'Sim'],
          ['CPF / CNPJ', 'Documento de identificação (usado na busca pública de OS)', 'Sim'],
          ['Telefone / Celular', 'Contato principal', 'Não'],
          ['Email', 'Para envio futuro de orçamentos e OS', 'Não'],
          ['Endereço', 'Rua, número, complemento, CEP', 'Não'],
          ['Cidade / Estado', 'Localização do cliente', 'Não'],
          ['Observações', 'Anotações livres sobre o cliente', 'Não'],
        ]} />

        <H2>Histórico do cliente</H2>
        <P>
          Ao abrir um cliente, você vê todos os veículos vinculados e o total de ordens
          de serviço já realizadas. Use isso para consultar o histórico completo de atendimento.
        </P>

        <Alert>
          O CPF/CNPJ é usado pelos clientes no portal público para acompanhar a OS pela placa
          do veículo. Cadastre corretamente para evitar problemas na busca.
        </Alert>
      </div>
    ),
  },

  {
    id: 'veiculos',
    icon: Car,
    label: 'Veículos',
    color: 'blue',
    content: (
      <div>
        <P>
          Cada veículo fica vinculado a um cliente e carrega seu histórico completo de
          ordens de serviço, quilometragem e fotos.
        </P>

        <H2>Cadastrando um veículo</H2>
        <Step n={1}>Clique em <strong>"Novo Veículo"</strong>.</Step>
        <Step n={2}>Selecione o cliente dono do veículo.</Step>
        <Step n={3}>Preencha tipo, marca, modelo, ano, placa e cor.</Step>
        <Step n={4}>Informe a quilometragem atual — ela ficará no histórico.</Step>
        <Step n={5}>Salve e depois adicione fotos usando o botão <strong>"+"</strong> na linha do veículo.</Step>

        <H2>Campos disponíveis</H2>
        <FieldTable rows={[
          ['Tipo', 'Moto, carro, caminhão ou outro', 'Sim'],
          ['Marca', 'Ex: Volkswagen, Honda, Toyota', 'Sim'],
          ['Modelo', 'Ex: Gol, Civic, Hilux', 'Sim'],
          ['Ano', 'Ano de fabricação', 'Não'],
          ['Placa', 'Placa no formato antigo ou Mercosul', 'Sim'],
          ['Cor', 'Cor do veículo', 'Não'],
          ['Quilometragem', 'KM atual no momento do cadastro', 'Não'],
          ['Chassi', 'Número do chassi para controle interno', 'Não'],
          ['Observações', 'Anotações sobre o veículo', 'Não'],
        ]} />

        <H2>Histórico por placa (portal público)</H2>
        <P>
          Qualquer pessoa pode consultar o histórico de um veículo acessando o portal
          público em <strong>/acompanhar</strong> e informando a placa e o CPF do proprietário.
          O histórico exibe OS concluídas com data e serviços realizados.
        </P>

        <Tip>
          Adicione fotos do veículo na entrada para documentar o estado inicial. As fotos
          ficam disponíveis no portal público de acompanhamento da OS.
        </Tip>
      </div>
    ),
  },

  {
    id: 'ordens',
    icon: ClipboardList,
    label: 'Ordens de Serviço',
    color: 'blue',
    content: (
      <div>
        <P>
          A Ordem de Serviço (OS) é o coração do sistema. Ela registra tudo que acontece
          com o veículo desde a entrada até a conclusão e o pagamento.
        </P>

        <H2>Abrindo uma OS</H2>
        <Step n={1}>Clique em <strong>"Nova OS"</strong>.</Step>
        <Step n={2}>Selecione o cliente e o veículo (o veículo deve estar cadastrado antes).</Step>
        <Step n={3}>Selecione o mecânico responsável.</Step>
        <Step n={4}>Informe o problema relatado pelo cliente.</Step>
        <Step n={5}>Defina a quilometragem de entrada e a data prevista de entrega.</Step>
        <Step n={6}>Clique em <strong>"Salvar"</strong> — a OS recebe um número único automaticamente.</Step>

        <H2>Status da OS</H2>
        <div className="flex flex-col gap-1.5 my-3">
          {[
            ['Aberta', 'OS recém criada, aguardando início', 'slate'],
            ['Em andamento', 'Mecânico trabalhando no veículo', 'blue'],
            ['Aguardando peça', 'Serviço pausado por falta de peça', 'amber'],
            ['Concluída', 'Serviço finalizado e entregue ao cliente', 'green'],
            ['Cancelada', 'OS encerrada sem conclusão', 'red'],
          ].map(([status, desc, color]) => (
            <div key={status} className="flex items-center gap-2.5">
              <Tag color={color as any}>{status}</Tag>
              <span className="text-sm text-slate-500">{desc}</span>
            </div>
          ))}
        </div>

        <H2>Adicionando serviços e peças</H2>
        <P>
          Dentro de uma OS aberta, use as abas <strong>Serviços</strong> e <strong>Peças</strong>
          para lançar tudo que foi feito e utilizado. O total geral é calculado automaticamente.
        </P>

        <H3>Serviços</H3>
        <FieldTable rows={[
          ['Descrição', 'Descrição do serviço realizado', 'Sim'],
          ['Quantidade', 'Horas ou unidades do serviço', 'Sim'],
          ['Preço unitário', 'Valor cobrado por unidade/hora', 'Sim'],
        ]} />

        <H3>Peças</H3>
        <FieldTable rows={[
          ['Peça do estoque', 'Selecione a peça do estoque (deduz automaticamente)', 'Não'],
          ['Descrição manual', 'Peça avulsa sem controle de estoque', 'Não'],
          ['Quantidade', 'Quantidade utilizada', 'Sim'],
          ['Preço unitário', 'Valor cobrado ao cliente', 'Sim'],
        ]} />

        <Alert>
          Ao selecionar uma peça do estoque, a quantidade é automaticamente deduzida
          do inventário. Se o estoque ficar abaixo do mínimo, um alerta é gerado.
        </Alert>

        <H2>PDF da OS</H2>
        <P>
          Clique em <strong>"Gerar PDF"</strong> dentro da OS para baixar um documento
          formatado com todos os serviços, peças e o total. Ideal para entregar ao cliente.
        </P>

        <H2>Link de acompanhamento</H2>
        <P>
          Cada OS tem um link público único. Clique no botão de copiar link para enviar
          ao cliente por WhatsApp ou e-mail. O cliente acessa sem precisar de login.
        </P>

        <Tip>
          Ao concluir uma OS, a comissão do mecânico é calculada automaticamente
          com base no percentual configurado no cadastro do funcionário.
        </Tip>
      </div>
    ),
  },

  {
    id: 'agendamentos',
    icon: Calendar,
    label: 'Agendamentos',
    color: 'blue',
    content: (
      <div>
        <P>
          O calendário de agendamentos exibe todos os compromissos do mês em uma visão
          mensal completa, com navegação por mês e ano.
        </P>

        <H2>Navegando no calendário</H2>
        <P>
          Use as setas <strong>&lt;</strong> e <strong>&gt;</strong> no cabeçalho para
          avançar ou voltar meses. Clique em <strong>"Hoje"</strong> para voltar ao mês atual.
          O mês e ano atual são exibidos no centro.
        </P>

        <H2>Criando um agendamento</H2>
        <Step n={1}>Clique em qualquer dia no calendário para abrir o painel lateral.</Step>
        <Step n={2}>Clique em <strong>"Novo agendamento"</strong> no painel lateral.</Step>
        <Step n={3}>Preencha o nome do cliente, o veículo (opcional), horário e descrição do serviço.</Step>
        <Step n={4}>Salve — o agendamento aparece como um pílula colorida no dia.</Step>

        <H2>Campos do agendamento</H2>
        <FieldTable rows={[
          ['Cliente', 'Nome do cliente (selecione do cadastro)', 'Sim'],
          ['Veículo', 'Veículo do cliente (opcional)', 'Não'],
          ['Data/Hora', 'Data e horário do agendamento', 'Sim'],
          ['Serviço', 'Descrição do serviço solicitado', 'Não'],
          ['Telefone', 'Contato para confirmação', 'Não'],
          ['Observações', 'Anotações adicionais', 'Não'],
        ]} />

        <H2>Status dos agendamentos</H2>
        <div className="flex flex-col gap-1.5 my-3">
          {[
            ['Agendado', 'Confirmado, aguardando o dia', 'blue'],
            ['Confirmado', 'Cliente confirmou presença', 'green'],
            ['Cancelado', 'Cancelado pelo cliente ou pela oficina', 'red'],
          ].map(([s, d, c]) => (
            <div key={s} className="flex items-center gap-2.5">
              <Tag color={c as any}>{s}</Tag>
              <span className="text-sm text-slate-500">{d}</span>
            </div>
          ))}
        </div>

        <Tip>
          Dias com agendamentos mostram pílulas coloridas. Se houver mais de 2 no mesmo dia,
          aparece um contador "+N" — clique no dia para ver todos.
        </Tip>
      </div>
    ),
  },

  {
    id: 'orcamentos',
    icon: FileCheck,
    label: 'Orçamentos',
    color: 'blue',
    content: (
      <div>
        <P>
          O módulo de orçamentos permite criar propostas digitais para o cliente aprovar
          ou reprovar sem precisar ir até a oficina.
        </P>

        <H2>Criando um orçamento</H2>
        <Step n={1}>Clique em <strong>"Novo Orçamento"</strong>.</Step>
        <Step n={2}>Selecione o cliente e o veículo.</Step>
        <Step n={3}>Descreva o problema relatado e a data de validade do orçamento.</Step>
        <Step n={4}>Salve e depois adicione itens (serviços ou peças) com valores.</Step>
        <Step n={5}>Copie o link público e envie para o cliente por WhatsApp ou e-mail.</Step>

        <H2>Status do orçamento</H2>
        <div className="flex flex-col gap-1.5 my-3">
          {[
            ['Pendente', 'Aguardando resposta do cliente', 'amber'],
            ['Aprovado', 'Cliente aprovou — pode converter em OS', 'green'],
            ['Reprovado', 'Cliente recusou o orçamento', 'red'],
          ].map(([s, d, c]) => (
            <div key={s} className="flex items-center gap-2.5">
              <Tag color={c as any}>{s}</Tag>
              <span className="text-sm text-slate-500">{d}</span>
            </div>
          ))}
        </div>

        <H2>O que o cliente vê</H2>
        <P>
          Ao acessar o link, o cliente vê todos os itens do orçamento, os totais, a validade
          e dois botões: <strong>"Aprovar"</strong> e <strong>"Reprovar"</strong>.
          A resposta atualiza o status automaticamente no sistema.
        </P>

        <H2>Convertendo em OS</H2>
        <P>
          Quando o orçamento for aprovado, clique em <strong>"Converter em OS"</strong>
          dentro do detalhe do orçamento. Uma OS será criada automaticamente com os
          dados do cliente, veículo e problema já preenchidos.
        </P>

        <Alert>
          Um orçamento expirado (data de validade ultrapassada) ainda pode ser convertido,
          mas informe o cliente sobre possíveis variações de preço.
        </Alert>
      </div>
    ),
  },

  {
    id: 'estoque',
    icon: Package,
    label: 'Estoque',
    color: 'blue',
    content: (
      <div>
        <P>
          O módulo de estoque controla todas as peças disponíveis na oficina, com histórico
          de movimentações e alertas automáticos de reposição.
        </P>

        <H2>Cadastrando uma peça</H2>
        <Step n={1}>Clique em <strong>"Nova Peça"</strong>.</Step>
        <Step n={2}>Preencha o código interno, nome e unidade de medida.</Step>
        <Step n={3}>Informe o preço de custo e o preço de venda.</Step>
        <Step n={4}>Defina a <strong>quantidade mínima</strong> — abaixo disso um alerta é gerado.</Step>
        <Step n={5}>Informe a quantidade atual em estoque.</Step>

        <H2>Campos da peça</H2>
        <FieldTable rows={[
          ['Código', 'Código interno ou do fabricante', 'Sim'],
          ['Nome', 'Nome da peça', 'Sim'],
          ['Marca', 'Fabricante da peça', 'Não'],
          ['Unidade', 'UN, KG, L, M, etc.', 'Sim'],
          ['Quantidade', 'Estoque atual', 'Sim'],
          ['Qtd mínima', 'Dispara alerta quando atingida', 'Não'],
          ['Preço de custo', 'Quanto você paga pela peça', 'Não'],
          ['Preço de venda', 'Quanto você cobra do cliente', 'Não'],
          ['Localização', 'Prateleira ou gaveta para encontrar a peça', 'Não'],
        ]} />

        <H2>Movimentações de estoque</H2>
        <P>
          Use o botão <strong>"Movimentar"</strong> para registrar entradas, saídas ou
          ajustes manuais. Cada movimentação fica no histórico com data e motivo.
        </P>
        <div className="flex flex-col gap-1.5 my-3">
          {[
            ['Entrada', 'Compra de peças ou devolução de cliente', 'green'],
            ['Saída', 'Uso avulso fora de uma OS', 'red'],
            ['Ajuste', 'Correção de inventário (diferença no balanço)', 'amber'],
          ].map(([s, d, c]) => (
            <div key={s} className="flex items-center gap-2.5">
              <Tag color={c as any}>{s}</Tag>
              <span className="text-sm text-slate-500">{d}</span>
            </div>
          ))}
        </div>

        <H2>Alertas de estoque baixo</H2>
        <P>
          Quando a quantidade de uma peça cai abaixo do mínimo definido (por movimentação
          manual ou uso em OS), um alerta aparece no Dashboard. Isso serve como aviso
          para solicitar reposição ao fornecedor.
        </P>

        <Tip>
          Defina sempre uma quantidade mínima nas peças mais utilizadas. Assim você
          nunca vai ser pego de surpresa sem estoque para atender uma OS.
        </Tip>
      </div>
    ),
  },

  {
    id: 'funcionarios',
    icon: UserCog,
    label: 'Funcionários',
    color: 'blue',
    content: (
      <div>
        <P>
          Cadastre sua equipe com cargo, salário e percentual de comissão. O percentual
          de comissão é usado para calcular automaticamente as comissões ao concluir OS.
        </P>

        <H2>Cadastrando um funcionário</H2>
        <Step n={1}>Clique em <strong>"Novo Funcionário"</strong>.</Step>
        <Step n={2}>Preencha nome, CPF, cargo e telefone.</Step>
        <Step n={3}>Informe o salário base e a data de admissão.</Step>
        <Step n={4}>Se for mecânico, defina o <strong>percentual de comissão</strong> (ex: 10 para 10%).</Step>

        <H2>Campos disponíveis</H2>
        <FieldTable rows={[
          ['Nome', 'Nome completo do funcionário', 'Sim'],
          ['CPF', 'Documento de identificação', 'Não'],
          ['Cargo', 'Mecânico, auxiliar, eletricista, atendente, gerente ou outro', 'Sim'],
          ['Telefone', 'Contato', 'Não'],
          ['Email', 'E-mail do funcionário', 'Não'],
          ['Salário', 'Salário base mensal', 'Não'],
          ['Data de admissão', 'Data de início na oficina', 'Não'],
          ['% Comissão', 'Percentual aplicado sobre o total da OS concluída', 'Não'],
          ['Ativo', 'Funcionários inativos não aparecem nas OS', 'Sim'],
        ]} />

        <Alert>
          Somente funcionários com cargo <strong>Mecânico</strong> aparecem como opção
          nas Ordens de Serviço. Outros cargos são para controle interno.
        </Alert>
      </div>
    ),
  },

  {
    id: 'checklist',
    icon: ClipboardCheck,
    label: 'Checklist de Entrada',
    color: 'blue',
    content: (
      <div>
        <P>
          O checklist de entrada é uma vistoria digital do veículo ao recebê-lo.
          O cliente assina digitalmente no próprio celular, protegendo sua oficina
          contra reclamações de danos pré-existentes.
        </P>

        <H2>Criando um checklist</H2>
        <Step n={1}>Clique em <strong>"Novo Checklist"</strong>.</Step>
        <Step n={2}>Selecione o cliente e o veículo.</Step>
        <Step n={3}>Informe a quilometragem e o nível de combustível.</Step>
        <Step n={4}>Adicione os danos encontrados (amassados, arranhões, etc.) com foto e localização.</Step>
        <Step n={5}>Copie o link e envie ao cliente para assinar pelo celular.</Step>

        <H2>Registrando danos</H2>
        <FieldTable rows={[
          ['Tipo', 'Amassado, arranhão, quebrado, faltando, manchado', 'Sim'],
          ['Região', 'Frente, traseira, lateral esquerda/direita, teto, interior', 'Sim'],
          ['Descrição', 'Detalhes adicionais sobre o dano', 'Não'],
          ['Foto', 'Imagem do dano para comprovar', 'Não'],
        ]} />

        <H2>Assinatura digital do cliente</H2>
        <P>
          O link gerado leva o cliente a uma página pública onde ele vê todos os danos
          registrados e pode assinar digitalmente. Após a assinatura, o checklist fica
          travado e não pode mais ser editado.
        </P>

        <Tip>
          Vincule o checklist a uma OS para manter todo o histórico do veículo
          organizado em um só lugar.
        </Tip>
      </div>
    ),
  },

  {
    id: 'garantias',
    icon: ShieldCheck,
    label: 'Garantias',
    color: 'blue',
    content: (
      <div>
        <P>
          Registre garantias para serviços realizados em OS concluídas. O sistema
          calcula automaticamente a data de expiração e avisa quais garantias ainda estão vigentes.
        </P>

        <H2>Registrando uma garantia</H2>
        <Step n={1}>Clique em <strong>"Nova Garantia"</strong>.</Step>
        <Step n={2}>Selecione a OS concluída (somente OS finalizadas aparecem).</Step>
        <Step n={3}>Escolha o serviço específico dentro da OS.</Step>
        <Step n={4}>Defina a duração em dias (ex: 90 para 3 meses).</Step>
        <Step n={5}>Adicione observações sobre o que a garantia cobre.</Step>

        <H2>Campos da garantia</H2>
        <FieldTable rows={[
          ['OS / Serviço', 'Ordem de serviço e serviço específico coberto', 'Sim'],
          ['Duração (dias)', 'Por quantos dias a garantia é válida a partir da conclusão da OS', 'Sim'],
          ['Observações', 'O que está coberto e condições da garantia', 'Não'],
        ]} />

        <H2>Monitoramento</H2>
        <P>
          A tela de garantias mostra um painel de <strong>Ativas</strong> e <strong>Expiradas</strong>.
          Cada garantia ativa exibe uma barra de progresso mostrando quantos dias restam.
        </P>

        <Alert>
          Garantias expiradas ficam visíveis para consulta histórica mas não aparecem
          como ativas para o cliente.
        </Alert>
      </div>
    ),
  },

  {
    id: 'comissoes',
    icon: DollarSign,
    label: 'Comissões',
    color: 'blue',
    content: (
      <div>
        <P>
          As comissões são calculadas e registradas <strong>automaticamente</strong> sempre
          que uma OS é marcada como concluída. Não é necessário nenhum lançamento manual.
        </P>

        <H2>Como funciona o cálculo automático</H2>
        <Step n={1}>Cada mecânico tem um percentual de comissão definido no cadastro de funcionários.</Step>
        <Step n={2}>Ao concluir uma OS, o sistema multiplica o total geral pelo percentual do mecânico.</Step>
        <Step n={3}>A comissão é registrada automaticamente na tela de Comissões.</Step>
        <Step n={4}>Se a OS for recalculada (serviços adicionados), a comissão é atualizada no próximo fechamento.</Step>

        <H2>Configurando o percentual por mecânico</H2>
        <P>
          No topo da tela de Comissões, há um card para cada mecânico ativo mostrando o
          percentual atual. Clique no ícone de <strong>lápis</strong> para editar inline — confirme
          com o botão verde ou cancele com o X.
        </P>

        <H2>Marcando como pago</H2>
        <P>
          Cada linha na tabela de comissões tem um botão <strong>"Pagar"</strong> quando
          o status for Pendente. Ao clicar, a comissão é marcada como paga e a data de
          pagamento é registrada automaticamente.
        </P>

        <Tip>
          Filtre por mecânico e por status (Pendente / Pago) para gerar um relatório
          rápido do que precisa ser pago no mês.
        </Tip>
      </div>
    ),
  },

  {
    id: 'notas-fiscais',
    icon: FileText,
    label: 'Notas Fiscais',
    color: 'blue',
    content: (
      <div>
        <P>
          Emita notas fiscais simplificadas em PDF vinculadas a OS concluídas.
          Cada OS pode ter apenas uma nota fiscal.
        </P>

        <H2>Gerando uma nota fiscal</H2>
        <Step n={1}>Clique em <strong>"Gerar Nota Fiscal"</strong>.</Step>
        <Step n={2}>Selecione a OS concluída (somente OS finalizadas sem nota aparecem).</Step>
        <Step n={3}>Adicione observações opcionais.</Step>
        <Step n={4}>Clique em <strong>"Gerar Nota"</strong> — um número sequencial é atribuído automaticamente.</Step>

        <H2>Imprimindo em PDF</H2>
        <P>
          Na tabela de notas fiscais, clique em <strong>"Imprimir PDF"</strong> na linha
          desejada. O PDF abrirá em uma nova aba com os dados da OS, cliente, veículo,
          serviços e total.
        </P>

        <Alert>
          Esta é uma nota fiscal simplificada para controle interno. Para fins fiscais
          legais (NF-e), você precisará de um sistema contábil homologado pela Receita Federal.
        </Alert>

        <H2>Buscando notas</H2>
        <P>
          Use o campo de busca no topo para filtrar por número da nota, nome do cliente
          ou número da OS vinculada.
        </P>
      </div>
    ),
  },

  {
    id: 'relatorios',
    icon: BarChart3,
    label: 'Relatórios',
    color: 'blue',
    content: (
      <div>
        <P>
          O módulo de relatórios consolida os dados da sua oficina para análise de
          desempenho financeiro e operacional.
        </P>

        <H2>Tipos de relatório disponíveis</H2>
        <div className="flex flex-col gap-2 my-3">
          {[
            ['Faturamento por período', 'Total de receitas das OS concluídas em um intervalo de datas'],
            ['OS por mecânico', 'Quantidade e valor das OS por funcionário'],
            ['OS por status', 'Distribuição das ordens por estado atual'],
            ['Estoque atual', 'Lista completa de peças com quantidades e valores'],
            ['Peças mais usadas', 'Ranking de peças utilizadas nas OS'],
          ].map(([tipo, desc]) => (
            <div key={tipo} className="flex gap-2 bg-slate-50 rounded-lg p-3">
              <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">{tipo}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <H2>Filtrando por período</H2>
        <P>
          Selecione as datas de início e fim para filtrar os dados. Use os atalhos
          rápidos: Hoje, Esta semana, Este mês, Este ano.
        </P>

        <Tip>
          Exporte os relatórios para PDF ou planilha para compartilhar com seu contador
          ou usar em análises externas.
        </Tip>
      </div>
    ),
  },

  {
    id: 'portal-publico',
    icon: Globe,
    label: 'Portal do Cliente',
    color: 'blue',
    content: (
      <div>
        <P>
          O DoMecânico oferece um portal público onde seus clientes podem acompanhar
          o status da OS, visualizar orçamentos e assinar checklists — sem precisar
          de login ou conta.
        </P>

        <H2>Acompanhamento de OS</H2>
        <P>
          Disponível em <strong>/acompanhar</strong>. O cliente pode buscar sua OS de duas formas:
        </P>
        <div className="flex flex-col gap-2 my-3">
          <div className="flex gap-2 bg-slate-50 rounded-lg p-3">
            <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-700">Por link único</p>
              <p className="text-xs text-slate-500">Cada OS tem um link exclusivo que você envia por WhatsApp. Acesso direto sem digitar nada.</p>
            </div>
          </div>
          <div className="flex gap-2 bg-slate-50 rounded-lg p-3">
            <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-700">Por placa + CPF/CNPJ</p>
              <p className="text-xs text-slate-500">O cliente digita a placa do veículo e seu documento para ver o histórico completo.</p>
            </div>
          </div>
        </div>

        <H2>O que o cliente vê na OS</H2>
        <div className="flex flex-col gap-1.5 my-2">
          {[
            'Status atual da OS com descrição',
            'Dados do veículo e mecânico responsável',
            'Previsão de entrega',
            'Fotos do veículo',
            'Serviços realizados (visível apenas quando concluída)',
            'Telefone da oficina para contato',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 size={13} className="text-green-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <H2>Aprovação de orçamento</H2>
        <P>
          O cliente acessa o link do orçamento e pode aprovar ou reprovar com um clique.
          A resposta é registrada instantaneamente no sistema da oficina.
        </P>

        <H2>Assinatura do checklist</H2>
        <P>
          O cliente recebe o link do checklist, visualiza os danos registrados e assina
          digitalmente com o dedo no celular ou com o mouse no computador.
        </P>

        <Tip>
          Envie sempre o link da OS por WhatsApp logo após abri-la. O cliente fica
          muito mais tranquilo acompanhando o andamento em tempo real.
        </Tip>
      </div>
    ),
  },

  {
    id: 'assinatura',
    icon: CreditCard,
    label: 'Plano e Assinatura',
    color: 'blue',
    content: (
      <div>
        <P>
          Gerencie seu plano de assinatura do DoMecânico, acompanhe o período de trial
          e veja as funcionalidades disponíveis no seu plano atual.
        </P>

        <H2>Período de trial</H2>
        <P>
          Todas as novas oficinas começam com um período de trial gratuito. Durante o trial,
          você tem acesso completo a todos os módulos. Um aviso no menu lateral informa
          quantos dias restam.
        </P>

        <H2>Informações da assinatura</H2>
        <FieldTable rows={[
          ['Plano', 'Nome do plano contratado'],
          ['Status', 'Trial, Ativo ou Expirado'],
          ['Validade', 'Data de expiração do plano atual'],
          ['Oficina', 'Nome e dados da sua oficina vinculados ao plano'],
        ]} />

        <Alert>
          Após o encerramento do trial sem renovação, o acesso ao sistema é suspenso.
          Entre em contato com o suporte para renovar ou mudar de plano.
        </Alert>
      </div>
    ),
  },
]

// ── Componente principal ──────────────────────────────────────────────────────

export default function Ajuda() {
  const [ativo, setAtivo] = useState('visao-geral')
  const [busca, setBusca] = useState('')

  const secaoAtiva = sections.find(s => s.id === ativo)

  const secoesFiltradas = busca.trim()
    ? sections.filter(s => s.label.toLowerCase().includes(busca.toLowerCase()))
    : sections

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-6rem)]">
      {/* Mobile: select dropdown */}
      <div className="lg:hidden">
        <select
          value={ativo}
          onChange={e => setAtivo(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sections.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop: sidebar de navegação */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-1">
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar módulo..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-y-auto flex flex-col gap-0.5">
          {secoesFiltradas.map(s => {
            const Icon = s.icon
            const isActive = s.id === ativo
            return (
              <button
                key={s.id}
                onClick={() => { setAtivo(s.id); setBusca('') }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors w-full ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{s.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto shrink-0" />}
              </button>
            )
          })}
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-100 shadow-sm">
        {secaoAtiva ? (
          <div className="px-4 sm:px-8 py-6 max-w-3xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <secaoAtiva.icon size={20} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{secaoAtiva.label}</h1>
                <p className="text-xs text-slate-400">Documentação DoMecânico</p>
              </div>
            </div>
            {secaoAtiva.content}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <BookOpen size={40} className="mb-3" />
            <p className="text-sm">Selecione um módulo.</p>
          </div>
        )}
      </main>
    </div>
  )
}
