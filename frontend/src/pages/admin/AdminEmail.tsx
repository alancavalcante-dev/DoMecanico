import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { Mail, Send, Save, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'

interface Config {
  id: number
  host: string
  port: number
  use_tls: boolean
  use_ssl: boolean
  username: string
  password: string
  from_email: string
  from_name: string
  ativo: boolean
  atualizado_em: string
}

interface Template {
  id: number
  tipo: string
  assunto: string
  corpo_html: string
  ativo: boolean
  atualizado_em: string
}

const TIPO_LABELS: Record<string, string> = {
  boas_vindas: 'Boas-vindas',
  trial_expirando: 'Trial expirando',
  assinatura_ativa: 'Assinatura ativada',
  assinatura_cancelada: 'Assinatura cancelada',
  pagamento_recusado: 'Pagamento recusado',
  checklist_cliente: 'Checklist para cliente',
}

export default function AdminEmail() {
  const [config, setConfig] = useState<Config | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [testando, setTestando] = useState(false)
  const [emailTeste, setEmailTeste] = useState('')
  const [editandoTmpl, setEditandoTmpl] = useState<Template | null>(null)
  const [salvandoTmpl, setSalvandoTmpl] = useState(false)
  const [previewAberto, setPreviewAberto] = useState(false)

  useEffect(() => {
    adminAPI.emailConfig().then(r => { setConfig(r.data); setEmailTeste(r.data.username) }).finally(() => setLoadingConfig(false))
    adminAPI.emailTemplates().then(r => setTemplates(r.data))
  }, [])

  const salvarConfig = async () => {
    if (!config) return
    setSalvandoConfig(true)
    try {
      await adminAPI.emailConfigSalvar({
        host: config.host, port: config.port, use_tls: config.use_tls, use_ssl: config.use_ssl,
        username: config.username, password: config.password, from_email: config.from_email,
        from_name: config.from_name, ativo: config.ativo,
      })
      toast.success('Configuração salva!')
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSalvandoConfig(false)
    }
  }

  const testarEmail = async () => {
    setTestando(true)
    try {
      await adminAPI.emailTestar({ destinatario: emailTeste })
      toast.success('E-mail de teste enviado!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      toast.error(msg || 'Erro ao enviar e-mail de teste.')
    } finally {
      setTestando(false)
    }
  }

  const salvarTemplate = async () => {
    if (!editandoTmpl) return
    setSalvandoTmpl(true)
    try {
      await adminAPI.emailTemplateEditar(editandoTmpl.id, {
        assunto: editandoTmpl.assunto,
        corpo_html: editandoTmpl.corpo_html,
        ativo: editandoTmpl.ativo,
      })
      toast.success('Template salvo!')
      setTemplates(ts => ts.map(t => t.id === editandoTmpl.id ? editandoTmpl : t))
      setEditandoTmpl(null)
    } catch {
      toast.error('Erro ao salvar template.')
    } finally {
      setSalvandoTmpl(false)
    }
  }

  if (loadingConfig) return <div className="text-gray-400 text-sm">Carregando...</div>
  if (!config) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuração de E-mail</h1>
        <p className="text-gray-500 text-sm mt-1">SMTP e templates de mensagens automáticas</p>
      </div>

      {/* Config SMTP */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-white font-semibold flex items-center gap-2"><Mail size={16} /> Servidor SMTP</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.ativo} onChange={e => setConfig({ ...config, ativo: e.target.checked })}
              className="w-4 h-4 accent-violet-500" />
            <span className="text-sm text-gray-400">Ativo</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Host SMTP', field: 'host', placeholder: 'smtp.gmail.com' },
            { label: 'Porta', field: 'port', placeholder: '587', type: 'number' },
            { label: 'Usuário (e-mail)', field: 'username', placeholder: 'usuario@gmail.com' },
            { label: 'Senha / App Password', field: 'password', placeholder: '••••••••', type: 'password' },
            { label: 'E-mail remetente', field: 'from_email', placeholder: 'noreply@domecanico.net' },
            { label: 'Nome remetente', field: 'from_name', placeholder: 'DoMecânico' },
          ].map(({ label, field, placeholder, type = 'text' }) => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
              <input type={type}
                value={config[field as keyof Config] as string}
                onChange={e => setConfig({ ...config, [field]: type === 'number' ? +e.target.value : e.target.value })}
                placeholder={placeholder}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 placeholder:text-gray-600" />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.use_tls} onChange={e => setConfig({ ...config, use_tls: e.target.checked, use_ssl: false })}
              className="w-4 h-4 accent-violet-500" />
            <span className="text-sm text-gray-400">TLS (porta 587)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.use_ssl} onChange={e => setConfig({ ...config, use_ssl: e.target.checked, use_tls: false })}
              className="w-4 h-4 accent-violet-500" />
            <span className="text-sm text-gray-400">SSL (porta 465)</span>
          </label>
        </div>

        <div className="flex gap-3 border-t border-gray-800 pt-4">
          <button onClick={salvarConfig} disabled={salvandoConfig}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            <Save size={15} /> {salvandoConfig ? 'Salvando...' : 'Salvar Config'}
          </button>
          <div className="flex-1 flex gap-2">
            <input value={emailTeste} onChange={e => setEmailTeste(e.target.value)}
              placeholder="e-mail para teste"
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 placeholder:text-gray-600" />
            <button onClick={testarEmail} disabled={testando || !config.ativo}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm">
              <Send size={14} /> {testando ? 'Enviando...' : 'Testar'}
            </button>
          </div>
        </div>

        {!config.ativo && (
          <p className="text-yellow-500 text-xs">⚠ O envio de e-mail está desativado. Ative para que os templates funcionem.</p>
        )}
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-white font-semibold mb-3">Templates de E-mail</h2>
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-2 h-2 rounded-full ${t.ativo ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <p className="text-white font-medium text-sm">{TIPO_LABELS[t.tipo] || t.tipo}</p>
                </div>
                <p className="text-gray-500 text-xs">{t.assunto}</p>
              </div>
              <button onClick={() => setEditandoTmpl({ ...t })}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">
                Editar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal template */}
      <Modal open={!!editandoTmpl} onClose={() => setEditandoTmpl(null)}
        title={`Template: ${editandoTmpl ? TIPO_LABELS[editandoTmpl.tipo] : ''}`} dark>
        {editandoTmpl && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editandoTmpl.ativo}
                  onChange={e => setEditandoTmpl({ ...editandoTmpl, ativo: e.target.checked })}
                  className="w-4 h-4 accent-violet-500" />
                <span className="text-sm text-gray-400">Ativo</span>
              </label>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Assunto</label>
              <input value={editandoTmpl.assunto}
                onChange={e => setEditandoTmpl({ ...editandoTmpl, assunto: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-500">Corpo HTML</label>
                <button onClick={() => setPreviewAberto(true)}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                  <Eye size={12} /> Preview
                </button>
              </div>
              <textarea
                value={editandoTmpl.corpo_html}
                onChange={e => setEditandoTmpl({ ...editandoTmpl, corpo_html: e.target.value })}
                rows={12}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-violet-500 font-mono text-xs"
                placeholder="<html>...</html> — use {{nome}}, {{plano}}, {{dias}} como variáveis"
              />
              <p className="text-gray-600 text-xs mt-1">Variáveis: {'{{'}<span>nome</span>{'}}'}, {'{{'}<span>plano</span>{'}}'}, {'{{'}<span>dias</span>{'}}'}, {'{{'}<span>link</span>{'}}'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditandoTmpl(null)} className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm">
                Cancelar
              </button>
              <button onClick={salvarTemplate} disabled={salvandoTmpl}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium">
                {salvandoTmpl ? 'Salvando...' : 'Salvar Template'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Preview HTML */}
      {previewAberto && editandoTmpl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
            <span className="text-white font-medium text-sm">Preview: {editandoTmpl.assunto}</span>
            <button onClick={() => setPreviewAberto(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <iframe
            srcDoc={editandoTmpl.corpo_html}
            className="flex-1 bg-white"
            title="preview"
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  )
}
