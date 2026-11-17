// Rastreamento de anúncios: Meta Pixel + Google (GA4 / Google Ads).
//
// Carregado A PARTIR DO NOSSO PRÓPRIO BUNDLE (não é <script> inline colado no
// index.html). Assim a CSP continua ESTRITA: basta liberar os domínios do Meta
// e do Google no `script-src` — sem precisar de 'unsafe-inline'. img-src/connect-src
// já são cobertos pelo `https:` amplo da CSP atual.
//
// Os IDs vêm de variáveis de ambiente (públicas por natureza — ficam visíveis no
// navegador de qualquer forma). Sem ID configurado, o tracker fica inerte.

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined
const GA_ID = import.meta.env.VITE_GA_ID as string | undefined              // GA4:  G-XXXXXXX
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined  // Ads: AW-XXXXXXX
const GOOGLE_ADS_LABEL = import.meta.env.VITE_GOOGLE_ADS_LABEL as string | undefined  // rótulo da conversão de CADASTRO (AW-XXXX/RÓTULO)
const GOOGLE_ADS_LABEL_ASSINATURA = import.meta.env.VITE_GOOGLE_ADS_LABEL_ASSINATURA as string | undefined  // rótulo da conversão de ASSINATURA PAGA

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let iniciado = false

function carregarScript(src: string): void {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

function initMetaPixel(id: string, pageView: boolean): void {
  // Versão enxuta do snippet oficial do Meta, sem eval/inline. A fila (queue)
  // acumula chamadas até o fbevents.js carregar e assumir o controle.
  const fbq = function (...args: unknown[]) {
    // @ts-expect-error — callMethod é injetado pelo fbevents.js quando carrega
    fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args)
  } as ((...a: unknown[]) => void) & { queue: unknown[]; loaded: boolean; version: string; disablePushState: boolean; allowDuplicatePageViews: boolean }
  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'
  // Sem isso o pixel manda PageView sozinho a cada troca de rota do SPA,
  // inclusive na área logada (/clientes/123...). Os PageViews são nossos (trackPageView).
  fbq.disablePushState = true
  // ...e sem isso o pixel descarta todo PageView manual depois do primeiro.
  fbq.allowDuplicatePageViews = true
  if (!window.fbq) window.fbq = fbq
  if (!window._fbq) window._fbq = fbq
  carregarScript('https://connect.facebook.net/en_US/fbevents.js')
  // Fora das páginas públicas, desliga a coleta automática do pixel (cliques em
  // botões, metadados da página): só sai o evento que chamarmos explicitamente.
  if (!pageView) window.fbq!('set', 'autoConfig', false, id)
  window.fbq!('init', id)
  if (pageView) window.fbq!('track', 'PageView')
}

function initGoogle(gaId: string | undefined, adsId: string | undefined, pageView: boolean): void {
  const primeiro = gaId || adsId
  if (!primeiro) return
  window.dataLayer = window.dataLayer || []
  // ATENÇÃO: tem que empilhar o objeto `arguments`, NÃO um array (`...args`).
  // O gtag.js só reconhece comandos que são Arguments; arrays são ignorados em
  // silêncio — o script carrega, mas nenhum config/evento chega ao Google.
  const gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  } as (...args: unknown[]) => void
  window.gtag = gtag
  carregarScript(`https://www.googletagmanager.com/gtag/js?id=${primeiro}`)
  gtag('js', new Date())
  const cfg = pageView ? {} : { send_page_view: false }
  if (gaId) gtag('config', gaId, cfg)
  if (adsId) gtag('config', adsId, cfg)
}

/**
 * Inicializa os trackers uma única vez.
 * - `pageView = true` (padrão, páginas públicas): dispara o 1º PageView de cada um.
 * - `pageView = false` (área logada, só para registrar uma conversão): carrega os
 *   trackers sem PageView e sem coleta automática do pixel.
 * Retorna `true` se já disparou o PageView agora (quem chama não precisa repetir).
 */
export function initTracking(pageView = true): boolean {
  if (iniciado) return false
  iniciado = true
  try {
    if (META_PIXEL_ID) initMetaPixel(META_PIXEL_ID, pageView)
    if (GA_ID || GOOGLE_ADS_ID) initGoogle(GA_ID, GOOGLE_ADS_ID, pageView)
  } catch {
    /* rastreamento nunca pode quebrar o app */
  }
  return pageView
}

/** Dispara PageView nas trocas de rota do SPA (a página não recarrega sozinha). */
export function trackPageView(path: string): void {
  try {
    if (META_PIXEL_ID && window.fbq) window.fbq('track', 'PageView')
    if (GA_ID && window.gtag) {
      window.gtag('event', 'page_view', {
        page_location: window.location.origin + path,
        page_path: path,
        page_title: document.title,
      })
    }
  } catch {
    /* ignore */
  }
}

/**
 * Conversão de CADASTRO concluído — é o evento que faz o anúncio otimizar.
 * Meta: CompleteRegistration. Google: evento GA4 `sign_up` (importável como
 * conversão no Ads) e, se houver rótulo, a conversão direta do Google Ads.
 * Chamar no sucesso do cadastro (ainda na página pública, com os pixels já carregados).
 */
export function trackCadastroConcluido(): void {
  try {
    if (META_PIXEL_ID && window.fbq) window.fbq('track', 'CompleteRegistration')
    if (GA_ID && window.gtag) window.gtag('event', 'sign_up')
    if (GOOGLE_ADS_ID && GOOGLE_ADS_LABEL && window.gtag) {
      window.gtag('event', 'conversion', { send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABEL}` })
    }
  } catch {
    /* ignore */
  }
}

/**
 * Conversão de ASSINATURA PAGA — o evento que REALMENTE importa pra otimizar
 * o tráfego pago. O cadastro grátis atrai curioso; o pagamento identifica o
 * cliente de verdade, e é com base nele que os algoritmos devem aprender a quem
 * mostrar o anúncio. Chamar quando o pagamento do PIX é confirmado.
 *
 * Meta: Purchase (com valor/moeda). Google: GA4 `purchase` (importável como
 * conversão no Ads) e, se houver rótulo próprio de assinatura, a conversão
 * direta do Google Ads. `valor` é o preço mensal do plano (BRL).
 *
 * O pagamento acontece na área logada (/assinatura), onde os trackers NÃO são
 * carregados por padrão. Quem volta outro dia, faz login e paga chegaria aqui
 * sem fbq/gtag e a venda se perderia. Por isso carregamos os trackers neste
 * momento, sem PageView, só para enviar a conversão. Os cookies _fbp/_ga da
 * visita anterior às páginas públicas ligam a venda ao clique no anúncio.
 */
export function trackAssinaturaPaga(valor?: number, transacaoId?: string): void {
  try {
    initTracking(false)  // no-op se já foi carregado pelas páginas públicas
    const value = typeof valor === 'number' && isFinite(valor) && valor > 0 ? valor : undefined

    if (META_PIXEL_ID && window.fbq) {
      window.fbq('track', 'Purchase', value != null ? { value, currency: 'BRL' } : { currency: 'BRL' })
    }
    if (GA_ID && window.gtag) {
      window.gtag('event', 'purchase', {
        currency: 'BRL',
        ...(value != null ? { value } : {}),
        ...(transacaoId ? { transaction_id: transacaoId } : {}),
      })
    }
    if (GOOGLE_ADS_ID && GOOGLE_ADS_LABEL_ASSINATURA && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABEL_ASSINATURA}`,
        currency: 'BRL',
        ...(value != null ? { value } : {}),
        ...(transacaoId ? { transaction_id: transacaoId } : {}),
      })
    }
  } catch {
    /* ignore */
  }
}
