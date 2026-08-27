// Configuração de contato/pagamento — fase de VALIDAÇÃO (PIX manual no CPF).
//
// Quando você abrir a ME e ligar o PagSeguro (cobrança automática), é só mudar
// PAGAMENTO_MANUAL para false — a tela de assinatura volta a gerar o PIX pelo
// gateway sozinha, sem precisar mexer em mais nada.

export const CONTATO = {
  pixKey: '1093b716-f2d9-4e81-8450-1d098356b234', // chave aleatória
  pixNome: 'Alan Pereira Cavalcante',
  whatsapp: '5511986815754',        // só dígitos, para o link wa.me
  whatsappDisplay: '+55 11 98681-5754',
}

// true = cobrança manual (mostra a chave PIX + envia comprovante no WhatsApp).
// false = usa o gateway configurado (PagSeguro) e gera o PIX automático.
export const PAGAMENTO_MANUAL = true
