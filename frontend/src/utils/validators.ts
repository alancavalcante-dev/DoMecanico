// Validação de CPF/CNPJ (dígitos verificadores) — espelha core/validators.py.

const digits = (v: string) => (v || '').replace(/\D/g, '')

export function validaCPF(cpf: string): boolean {
  const c = digits(cpf)
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  for (const tam of [9, 10]) {
    let soma = 0
    for (let i = 0; i < tam; i++) soma += parseInt(c[i], 10) * (tam + 1 - i)
    let dig = (soma * 10) % 11
    if (dig === 10) dig = 0
    if (dig !== parseInt(c[tam], 10)) return false
  }
  return true
}

export function validaCNPJ(cnpj: string): boolean {
  const c = digits(cnpj)
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false
  const tabelas: [number[], number][] = [
    [[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], 12],
    [[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], 13],
  ]
  for (const [pesos, pos] of tabelas) {
    let soma = 0
    for (let i = 0; i < pos; i++) soma += parseInt(c[i], 10) * pesos[i]
    const resto = soma % 11
    const dig = resto < 2 ? 0 : 11 - resto
    if (dig !== parseInt(c[pos], 10)) return false
  }
  return true
}

/** Aceita CPF (11 díg.) ou CNPJ (14 díg.); valida os dígitos verificadores. */
export function validaCpfCnpj(numero: string): boolean {
  const n = digits(numero)
  if (n.length === 11) return validaCPF(n)
  if (n.length === 14) return validaCNPJ(n)
  return false
}
