import type { CSSProperties } from 'react'
import type { OSPublica } from './tipos'

// ── Datas e dinheiro ──────────────────────────────────────────────────────────

/** "2026-11-20" (só data) é lido no fuso local; com hora, como veio. Evita mostrar o dia anterior no Brasil. */
function lerData(d: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d)
}

export function fmtData(d: string | null) {
  if (!d) return '—'
  return lerData(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fmtDiaMes(d: string | null) {
  if (!d) return ''
  return lerData(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function fmtDiaHora(d: string | null) {
  if (!d) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return fmtDiaMes(d)
  const dt = new Date(d)
  const dia = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dia} às ${hora}`
}

export function fmtMoeda(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** "agora", "há 12 min", "há 3 h", "ontem", "há 4 dias" ou a data. */
export function haQuanto(d: string | null) {
  if (!d) return ''
  const seg = (Date.now() - new Date(d).getTime()) / 1000
  if (seg < 60) return 'agora'
  const min = Math.floor(seg / 60)
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const dias = Math.floor(h / 24)
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  return `em ${fmtData(d)}`
}

/** Dias inteiros entre hoje e a data (negativo = já passou). */
export function diasAte(d: string) {
  const alvo = lerData(d); alvo.setHours(0, 0, 0, 0)
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000)
}

/** "OS000123" ou "OS-0001" → "OS 000123" / "OS 0001" (sem repetir o "OS"). */
export const rotuloOS = (numero: string) => `OS ${numero.replace(/^OS[\s#-]*/i, '')}`

// ── Cor da oficina ────────────────────────────────────────────────────────────
// A página da OS veste a cor que a oficina escolheu. O padrão antigo (#2563eb)
// e valores inválidos viram o azul do DoMecânico. A cor do texto em cima dela
// (e dela sobre o branco) é calculada para continuar legível com qualquer cor.

const AZUL = '#1F4BC4'

function luminancia(hex: string) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

export function corDaOficina(cor?: string | null) {
  const v = (cor || '').trim()
  if (!/^#[0-9a-f]{6}$/i.test(v) || v.toLowerCase() === '#2563eb') return AZUL
  return v
}

/** Variáveis CSS da marca da oficina: --of (cor), --of-ink (texto sobre ela), --of-txt (ela como texto no branco). */
export function varsDaOficina(cor?: string | null): CSSProperties {
  const of = corDaOficina(cor)
  const L = luminancia(of)
  return {
    ['--of' as string]: of,
    ['--of-ink' as string]: L > 0.3 ? '#17181C' : '#FFFFFF',
    ['--of-txt' as string]: L > 0.2 ? '#17181C' : of,
  }
}

// ── Contato ───────────────────────────────────────────────────────────────────

const digitos = (s: string) => (s || '').replace(/\D/g, '')

export function linkTelefone(tel: string) {
  const d = digitos(tel)
  return d.length >= 8 ? `tel:${d.length === 10 || d.length === 11 ? `+55${d}` : d}` : null
}

/** Só celular (DDD + 9 dígitos) vira WhatsApp. A mensagem leva só a OS e a placa. */
export function linkWhatsApp(tel: string, os: Pick<OSPublica, 'numero' | 'veiculo_placa'>) {
  let d = digitos(tel)
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2)
  if (d.length !== 11 || d[2] !== '9') return null
  const msg = `Olá! Quero falar sobre a OS ${os.numero} (placa ${os.veiculo_placa}).`
  return `https://wa.me/55${d}?text=${encodeURIComponent(msg)}`
}

export function linkMapa(os: Pick<OSPublica, 'oficina_endereco' | 'oficina_cidade' | 'oficina_estado' | 'oficina_cep' | 'oficina_nome'>) {
  if (!os.oficina_endereco && !os.oficina_cidade) return null
  const q = [os.oficina_nome, os.oficina_endereco, os.oficina_cidade && `${os.oficina_cidade}${os.oficina_estado ? ` - ${os.oficina_estado}` : ''}`, os.oficina_cep]
    .filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function cidadeUF(os: Pick<OSPublica, 'oficina_cidade' | 'oficina_estado'>) {
  return [os.oficina_cidade, os.oficina_estado].filter(Boolean).join(' / ')
}

// ── Status, na língua do cliente ──────────────────────────────────────────────

export interface InfoStatus { titulo: string; frase: string; etapa: number }

export const STATUS: Record<string, InfoStatus> = {
  aberta:          { titulo: 'Recebemos seu carro',        frase: 'Ele está na fila e o serviço começa em breve.',           etapa: 1 },
  em_andamento:    { titulo: 'Seu carro está em serviço',  frase: 'O mecânico está trabalhando nele agora.',                  etapa: 2 },
  aguardando_peca: { titulo: 'Esperando uma peça chegar',  frase: 'O serviço continua assim que a peça chegar na oficina.',   etapa: 2 },
  concluida:       { titulo: 'Pronto para buscar!',        frase: 'O serviço terminou. Pode passar na oficina para retirar.', etapa: 3 },
  cancelada:       { titulo: 'Serviço cancelado',          frase: 'Se tiver alguma dúvida, fale com a oficina.',             etapa: 0 },
}

export const infoStatus = (s: string) => STATUS[s] ?? STATUS.aberta

/** Rótulo curto para as listas (pílula). */
export const ROTULO_STATUS: Record<string, string> = {
  aberta: 'Na fila', em_andamento: 'Em serviço', aguardando_peca: 'Aguardando peça',
  concluida: 'Pronto', cancelada: 'Cancelada',
}

const NIVEIS_COMBUSTIVEL = ['Vazio', '1/4', '1/2', '3/4', 'Cheio']
/** 0 a 4 tracinhos do marcador de combustível (-1 se o valor for desconhecido). */
export const nivelCombustivel = (v: string) => NIVEIS_COMBUSTIVEL.indexOf(v)
