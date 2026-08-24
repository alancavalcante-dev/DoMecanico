"""SEO server-side (dynamic rendering) para robôs.

O frontend é uma SPA (React/Vite) que injeta título/description/OG/JSON-LD no
navegador via JS. Robôs que NÃO executam JS — em especial os scrapers de link do
WhatsApp/Facebook/LinkedIn/X e parte do Bing — só enxergam o index.html estático
e, portanto, o card genérico do DoMecânico em vez do da oficina específica.

Estes views entregam o HTML já com as meta tags corretas por rota. O nginx
encaminha para cá apenas as requisições de robôs (por User-Agent); humanos
continuam recebendo a SPA normal. É a técnica de "dynamic rendering" recomendada
pelo Google — não altera a experiência do usuário nem o funcionamento do app.
"""
import json

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.utils.html import escape

BASE = getattr(settings, 'FRONTEND_URL', 'https://domecanico.net').rstrip('/')
OG_IMAGE_PADRAO = f'{BASE}/logotipo.png'

# Descrições das páginas públicas estáticas (espelham ROUTE_DESC do frontend).
DESC_PADRAO = ('Sistema de gestão para oficinas mecânicas: ordens de serviço, '
               'orçamentos, estoque, checklist digital e portal de acompanhamento '
               'para o cliente.')
PAGINAS_ESTATICAS = {
    '': {
        'titulo': 'DoMecânico — Gestão para Oficinas Mecânicas',
        'descricao': DESC_PADRAO,
    },
    'cadastro': {
        'titulo': 'Cadastro — DoMecânico',
        'descricao': ('Crie a conta da sua oficina no DoMecânico e comece a gerenciar '
                      'ordens de serviço, orçamentos e estoque com teste grátis.'),
    },
    'contato': {
        'titulo': 'Contato — DoMecânico',
        'descricao': ('Fale com a equipe do DoMecânico — tire dúvidas sobre o sistema '
                      'de gestão para oficinas mecânicas.'),
    },
    'termos': {
        'titulo': 'Termos de Uso — DoMecânico',
        'descricao': 'Termos de uso do DoMecânico.',
    },
    'privacidade': {
        'titulo': 'Política de Privacidade — DoMecânico',
        'descricao': 'Política de privacidade do DoMecânico.',
    },
}


def _pagina(titulo, descricao, canonical, *, robots='index, follow',
            og_image=OG_IMAGE_PADRAO, jsonld=None, corpo=''):
    """Monta um documento HTML mínimo e válido com todas as meta tags para robôs."""
    t = escape(titulo)
    d = escape(descricao)
    can = escape(canonical)
    img = escape(og_image or OG_IMAGE_PADRAO)
    ld_html = ''
    if jsonld:
        # json.dumps já escapa aspas; ensure_ascii evita problemas de encoding.
        ld_html = ('<script type="application/ld+json">'
                   + json.dumps(jsonld, ensure_ascii=False) + '</script>')
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{t}</title>
<meta name="description" content="{d}" />
<meta name="robots" content="{robots}" />
<link rel="canonical" href="{can}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="DoMecânico" />
<meta property="og:title" content="{t}" />
<meta property="og:description" content="{d}" />
<meta property="og:url" content="{can}" />
<meta property="og:image" content="{img}" />
<meta property="og:locale" content="pt_BR" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{t}" />
<meta name="twitter:description" content="{d}" />
<meta name="twitter:image" content="{img}" />
{ld_html}
</head>
<body>
<main>{corpo}</main>
</body>
</html>"""


def prerender_home(request):
    p = PAGINAS_ESTATICAS['']
    jsonld = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'DoMecânico',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web, Android, iOS',
        'url': f'{BASE}/',
        'inLanguage': 'pt-BR',
        'description': p['descricao'],
    }
    corpo = f"<h1>{escape(p['titulo'])}</h1><p>{escape(p['descricao'])}</p>"
    html = _pagina(p['titulo'], p['descricao'], f'{BASE}/', jsonld=jsonld, corpo=corpo)
    return HttpResponse(html)


def prerender_oficina(request, slug):
    """HTML com meta + JSON-LD AutoRepair da oficina, para robôs/preview de link."""
    from accounts.models import Oficina
    try:
        of = Oficina.objects.get(slug_publico=slug)
    except Oficina.DoesNotExist:
        of = None

    canonical = f'{BASE}/oficina/{escape(str(slug))}'
    if not of or not of.perfil_publico_ativo:
        html = _pagina(
            'Oficina não encontrada — DoMecânico',
            'Este perfil de oficina não está disponível.',
            canonical, robots='noindex, follow',
            corpo='<h1>Oficina não encontrada</h1>',
        )
        return HttpResponse(html, status=(404 if not of else 200))

    local = ' — '.join([x for x in [of.cidade, of.estado] if x])
    titulo = f'{of.nome} — Oficina Mecânica{(" em " + local) if local else ""} | DoMecânico'
    if of.descricao_publica:
        descricao = of.descricao_publica.strip()[:300]
    else:
        descricao = (f'{of.nome}: oficina mecânica{(" em " + local) if local else ""}. '
                     f'Agende serviços e acompanhe sua ordem de serviço online.')

    logo_abs = None
    if of.logo:
        try:
            url = of.logo.url
            logo_abs = url if url.startswith('http') else f'{BASE}{url}'
        except Exception:
            logo_abs = None

    servicos = [s.strip() for s in (of.servicos_oferecidos or '').splitlines() if s.strip()]
    endereco = {'@type': 'PostalAddress', 'addressCountry': 'BR'}
    if of.endereco:
        endereco['streetAddress'] = of.endereco
    if of.cidade:
        endereco['addressLocality'] = of.cidade
    if of.estado:
        endereco['addressRegion'] = of.estado
    if of.cep:
        endereco['postalCode'] = of.cep

    jsonld = {
        '@context': 'https://schema.org',
        '@type': 'AutoRepair',
        'name': of.nome,
        'url': canonical,
        'description': descricao,
        'address': endereco,
    }
    if of.telefone:
        jsonld['telephone'] = of.telefone
    if logo_abs:
        jsonld['image'] = logo_abs
    if of.horario_funcionamento:
        jsonld['openingHours'] = of.horario_funcionamento
    if servicos:
        jsonld['makesOffer'] = [
            {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': s}}
            for s in servicos[:20]
        ]

    partes_corpo = [f'<h1>{escape(of.nome)}</h1>', f'<p>{escape(descricao)}</p>']
    if local:
        partes_corpo.append(f'<p>{escape(local)}</p>')
    if servicos:
        itens = ''.join(f'<li>{escape(s)}</li>' for s in servicos[:20])
        partes_corpo.append(f'<h2>Serviços</h2><ul>{itens}</ul>')

    html = _pagina(titulo, descricao, canonical,
                   og_image=(logo_abs or OG_IMAGE_PADRAO), jsonld=jsonld,
                   corpo=''.join(partes_corpo))
    return HttpResponse(html)


# Prefixos privados / com dados de cliente — nunca indexar (espelha o frontend).
_PREFIXOS_NOINDEX = (
    'dashboard', 'clientes', 'veiculos', 'estoque', 'funcionarios', 'ordens',
    'catalogo', 'notas-fiscais', 'relatorios', 'assinatura', 'checklist',
    'agendamentos', 'orcamentos', 'orcamento', 'garantias', 'comissoes', 'equipe',
    'whatsapp', 'perfil', 'perfil-publico', 'meu-painel', 'suporte', 'ajuda',
    'login', 'acompanhar', 'checklist-cliente', 'aceitar-convite',
    'redefinir-senha', 'esqueci-senha', 'admin-panel',
)


def prerender_catchall(request, path=''):
    """Fallback para robôs em rotas públicas não específicas. Home e páginas
    estáticas recebem meta próprias; rotas privadas recebem noindex."""
    p = (path or '').strip('/')
    if p == '':
        return prerender_home(request)
    if p in PAGINAS_ESTATICAS:
        dados = PAGINAS_ESTATICAS[p]
        html = _pagina(dados['titulo'], dados['descricao'], f'{BASE}/{p}',
                       corpo=f"<h1>{escape(dados['titulo'])}</h1><p>{escape(dados['descricao'])}</p>")
        return HttpResponse(html)

    primeiro = p.split('/', 1)[0]
    privada = primeiro in _PREFIXOS_NOINDEX
    robots = 'noindex, follow' if privada else 'index, follow'
    html = _pagina('DoMecânico — Gestão para Oficinas Mecânicas', DESC_PADRAO,
                   f'{BASE}/{p}', robots=robots,
                   corpo='<h1>DoMecânico</h1>')
    return HttpResponse(html)


def sitemap_xml(request):
    """Sitemap dinâmico: páginas públicas fixas + perfis de oficina ativos."""
    from accounts.models import Oficina

    hoje = timezone.localdate().isoformat()
    urls = [
        (f'{BASE}/', hoje, 'weekly', '1.0'),
        (f'{BASE}/cadastro', hoje, 'monthly', '0.8'),
        (f'{BASE}/contato', hoje, 'monthly', '0.5'),
        (f'{BASE}/termos', hoje, 'yearly', '0.3'),
        (f'{BASE}/privacidade', hoje, 'yearly', '0.3'),
    ]
    oficinas = (Oficina.objects
                .filter(perfil_publico_ativo=True)
                .only('slug_publico', 'criado_em')
                .order_by('slug_publico'))
    for of in oficinas:
        if not of.slug_publico:
            continue
        lastmod = of.criado_em.date().isoformat() if of.criado_em else hoje
        urls.append((f'{BASE}/oficina/{of.slug_publico}', lastmod, 'weekly', '0.7'))

    linhas = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod, freq, prio in urls:
        linhas.append(
            f'  <url><loc>{escape(loc)}</loc><lastmod>{lastmod}</lastmod>'
            f'<changefreq>{freq}</changefreq><priority>{prio}</priority></url>'
        )
    linhas.append('</urlset>')
    return HttpResponse('\n'.join(linhas), content_type='application/xml')
