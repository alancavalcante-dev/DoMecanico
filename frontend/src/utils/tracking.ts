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
const GOOGLE_ADS_LABEL = import.meta.env.VITE_GOOGLE_ADS_LABEL as string | undefined  // rótulo da conversão (AW-XXXX/RÓTULO)

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

function initMetaPixel(id: string): void {
  // Versão enxuta do snippet oficial do Meta, sem eval/inline. A fila (queue)
  // acumula chamadas até o fbevents.js carregar e assumir o controle.
  const fbq = function (...args: unknown[]) {
    // @ts-expect-error — callMethod é injetado pelo fbevents.js quando carrega
    fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args)
  } as ((...a: unknown[]) => void) & { queue: unknown[]; loaded: boolean; version: string }
  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'
  if (!window.fbq) window.fbq = fbq
  if (!window._fbq) window._fbq = fbq
  carregarScript('https://connect.facebook.net/en_US/fbevents.js')
  window.fbq!('init', id)
  window.fbq!('track', 'PageView')
}

function initGoogle(gaId?: string, adsId?: string): void {
  const primeiro = gaId || adsId
  if (!primeiro) return
  window.dataLayer = window.dataLayer || []
  const gtag = function (...args: unknown[]) { window.dataLayer!.push(args) }
  window.gtag = gtag
  carregarScript(`https://www.googletagmanager.com/gtag/js?id=${primeiro}`)
  gtag('js', new Date())
  if (gaId) gtag('config', gaId)
  if (adsId) gtag('config', adsId)
}

/** Inicializa os trackers uma única vez. Dispara o 1º PageView de cada um. */
export function initTracking(): void {
  if (iniciado) return
  iniciado = true
  try {
    if (META_PIXEL_ID) initMetaPixel(META_PIXEL_ID)
    if (GA_ID || GOOGLE_ADS_ID) initGoogle(GA_ID, GOOGLE_ADS_ID)
  } catch {
    /* rastreamento nunca pode quebrar o app */
  }
}

/** Dispara PageView nas trocas de rota do SPA (a página não recarrega sozinha). */
export function trackPageView(path: string): void {
  try {
    if (META_PIXEL_ID && window.fbq) window.fbq('track', 'PageView')
    if (GA_ID && window.gtag) window.gtag('event', 'page_view', { page_path: path })
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
