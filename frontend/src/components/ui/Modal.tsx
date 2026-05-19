import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  dark?: boolean
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ open, onClose, title, children, size = 'md', dark = false }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const bg = dark ? 'bg-gray-900 border border-gray-700' : 'bg-white'
  const titleCls = dark ? 'text-white' : 'text-slate-800'
  const borderCls = dark ? 'border-gray-700' : 'border-slate-200'
  const closeCls = dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-100 text-slate-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${bg} rounded-xl shadow-xl w-full ${sizeMap[size]} max-h-[90vh] flex flex-col`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${borderCls}`}>
          <h2 className={`text-lg font-semibold ${titleCls}`}>{title}</h2>
          <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${closeCls}`}>
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
