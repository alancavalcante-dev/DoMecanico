import { useState, useEffect } from 'react'

interface Props {
  value: number | string
  onChange: (raw: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Converte número para string BR: 1234.5 → "1.234,50"
export function formatBRL(value: number | string): string {
  const n = parseFloat(String(value).replace(',', '.'))
  if (isNaN(n)) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Converte string formatada BR para número: "1.234,56" → 1234.56
export function parseBRL(s: string): number {
  const clean = s.replace(/\./g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

export default function CurrencyInput({ value, onChange, placeholder = '0,00', className = '', disabled }: Props) {
  const [display, setDisplay] = useState('')
  const [focused, setFocused] = useState(false)

  // Sincroniza display quando value muda externamente (ex: reset de form)
  useEffect(() => {
    if (!focused) {
      const n = parseFloat(String(value).replace(',', '.'))
      setDisplay(isNaN(n) || n === 0 ? '' : formatBRL(n))
    }
  }, [value, focused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value

    // Permite apenas dígitos, vírgula e ponto
    v = v.replace(/[^\d.,]/g, '')

    // Não permite mais de uma vírgula
    const parts = v.split(',')
    if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')

    // Máximo 2 casas decimais após a vírgula
    if (parts[1]?.length > 2) v = parts[0] + ',' + parts[1].slice(0, 2)

    setDisplay(v)
    // Retorna string numérica com ponto decimal: "1234.56"
    onChange(String(parseBRL(v)))
  }

  const handleFocus = () => {
    setFocused(true)
    const n = parseFloat(String(value).replace(',', '.'))
    if (!isNaN(n) && n > 0) {
      // Exibe sem pontos de milhar ao editar: "1234,56"
      setDisplay(n.toFixed(2).replace('.', ','))
    }
  }

  const handleBlur = () => {
    setFocused(false)
    const n = parseBRL(display)
    if (n > 0) {
      setDisplay(formatBRL(n))
    } else {
      setDisplay('')
    }
    onChange(n > 0 ? String(n) : '0')
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  )
}
