// Abre um PDF (blob vindo do backend) de forma confiável em qualquer dispositivo.
//
// Problema: no mobile, `window.open(blobUrl)` chamado DEPOIS de um `await` é
// bloqueado pelo popup blocker (só permite abrir aba nova em resposta direta a
// um toque). Solução: no celular baixamos o arquivo (sempre funciona); no
// desktop abrimos em nova aba (melhor UX).

const ehMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

export function abrirPdf(data: BlobPart, filename = 'documento.pdf') {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  if (ehMobile()) {
    a.download = filename            // celular: baixa (o navegador abre no visualizador)
  } else {
    a.target = '_blank'              // desktop: abre em nova aba
    a.rel = 'noopener'
  }
  document.body.appendChild(a)
  a.click()
  a.remove()
  // libera a memória do blob depois que o navegador consumiu o link
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
