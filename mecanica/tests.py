from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import MembroOficina, Oficina, PermissaoMembro
from mecanica.models import (
    ChecklistEntrada, Cliente, Funcionario, ItemOrcamento, Orcamento, OrdemServico, ServicoOS, Veiculo,
)


def _oficina(nome, **kw):
    return Oficina.objects.create(nome=nome, email=f'{nome.lower()}@teste.com', **kw)


def _membro(oficina, username, papel, modulos=('dashboard', 'ordens', 'clientes', 'veiculos', 'checklist')):
    user = User.objects.create_user(username=username, email=f'{username}@teste.com', password='x')
    membro = MembroOficina.objects.create(user=user, oficina=oficina, papel=papel)
    PermissaoMembro.objects.create(membro=membro, modulos=list(modulos))
    return user


def _os(oficina, sufixo='1'):
    cliente = Cliente.objects.create(oficina=oficina, nome=f'Cliente {sufixo}')
    veiculo = Veiculo.objects.create(oficina=oficina, cliente=cliente, marca='Fiat', modelo='Uno', placa=f'ABC1D2{sufixo}')
    ordem = OrdemServico.objects.create(
        oficina=oficina, numero=f'OS00000{sufixo}', cliente=cliente, veiculo=veiculo,
        problema_relatado='Barulho no freio',
    )
    ServicoOS.objects.create(ordem=ordem, descricao='Troca de pastilha', quantidade=1, preco_unitario=150)
    return ordem


class OcultaValoresTests(TestCase):
    def setUp(self):
        self.oficina = _oficina('Oficina A', mecanico_ve_valores=False)
        self.ordem = _os(self.oficina)
        self.client = APIClient()

    def test_mecanico_sem_permissao_nao_recebe_valores(self):
        self.client.force_authenticate(_membro(self.oficina, 'mec', 'mecanico'))
        r = self.client.get(f'/api/ordens/{self.ordem.id}/')
        self.assertEqual(r.status_code, 200)
        for campo in ('total_geral', 'total_servicos', 'total_pecas', 'desconto'):
            self.assertNotIn(campo, r.data)
        self.assertNotIn('preco_unitario', r.data['servicos'][0])
        self.assertNotIn('total', r.data['servicos'][0])
        # Na listagem também
        r = self.client.get('/api/ordens/')
        itens = r.data.get('results', r.data)
        self.assertNotIn('total_geral', itens[0])
        # PDF (que mostra valores) fica bloqueado
        self.assertEqual(self.client.get(f'/api/ordens/{self.ordem.id}/gerar-pdf/').status_code, 403)

    def test_admin_continua_vendo_valores(self):
        self.client.force_authenticate(_membro(self.oficina, 'adm', 'admin'))
        r = self.client.get(f'/api/ordens/{self.ordem.id}/')
        self.assertIn('total_geral', r.data)
        self.assertIn('preco_unitario', r.data['servicos'][0])

    def test_mecanico_ve_valores_quando_oficina_permite(self):
        self.oficina.mecanico_ve_valores = True
        self.oficina.save()
        self.client.force_authenticate(_membro(self.oficina, 'mec2', 'mecanico'))
        r = self.client.get(f'/api/ordens/{self.ordem.id}/')
        self.assertIn('total_geral', r.data)


class PatioTests(TestCase):
    def setUp(self):
        self.a = _oficina('Oficina A')
        self.b = _oficina('Oficina B')
        self.os_a = _os(self.a, '1')
        self.os_b = _os(self.b, '2')
        self.client = APIClient()
        self.client.force_authenticate(_membro(self.a, 'atend', 'atendente'))

    def test_patio_so_mostra_a_propria_oficina(self):
        r = self.client.get('/api/ordens/patio/')
        self.assertEqual(r.status_code, 200)
        ids = {o['id'] for o in r.data}
        self.assertIn(self.os_a.id, ids)
        self.assertNotIn(self.os_b.id, ids)

    def test_mecanicos_e_pecas_nao_exigem_modulos_extras(self):
        Funcionario.objects.create(oficina=self.a, nome='Zé')
        Funcionario.objects.create(oficina=self.b, nome='Outro')
        r = self.client.get('/api/ordens/mecanicos/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual([f['nome'] for f in r.data], ['Zé'])
        self.assertEqual(self.client.get('/api/ordens/pecas-disponiveis/').status_code, 200)

    def test_atualizar_status_grava_status_alterado_em(self):
        self.assertEqual(self.client.patch(
            f'/api/ordens/{self.os_a.id}/atualizar-status/', {'status': 'em_andamento'}, format='json',
        ).status_code, 200)
        self.os_a.refresh_from_db()
        self.assertIsNotNone(self.os_a.status_alterado_em)

    def test_nao_atribui_mecanico_de_outra_oficina(self):
        de_fora = Funcionario.objects.create(oficina=self.b, nome='Intruso')
        r = self.client.patch(f'/api/ordens/{self.os_a.id}/', {'mecanico': de_fora.id}, format='json')
        self.assertEqual(r.status_code, 400)
        meu = Funcionario.objects.create(oficina=self.a, nome='Zé')
        r = self.client.patch(f'/api/ordens/{self.os_a.id}/', {'mecanico': meu.id}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['mecanico_nome'], 'Zé')


class OSPublicaOficinaTests(TestCase):
    """A página pública da OS mostra os dados da oficina; o perfil só se ele estiver ativo."""

    def setUp(self):
        self.oficina = _oficina(
            'Oficina P', telefone='(81) 99999-0000', cep='50000-000', horario_funcionamento='Seg a Sex, 8h às 18h',
            slug_publico='oficina-p', descricao_publica='Mecânica geral', servicos_oferecidos='Freios\nSuspensão\n',
        )
        self.ordem = _os(self.oficina)
        self.client = APIClient()

    def _get(self):
        r = self.client.get(f'/api/os-publica/{self.ordem.token_publico}/')
        self.assertEqual(r.status_code, 200)
        return r.data

    def test_dados_basicos_da_oficina(self):
        d = self._get()
        self.assertEqual(d['oficina_horario'], 'Seg a Sex, 8h às 18h')
        self.assertEqual(d['oficina_cep'], '50000-000')
        self.assertIn('status_alterado_em', d)

    def test_perfil_oculto_quando_desligado(self):
        self.assertIsNone(self._get()['oficina_perfil'])

    def test_perfil_aparece_quando_ligado(self):
        self.oficina.perfil_publico_ativo = True
        self.oficina.save()
        perfil = self._get()['oficina_perfil']
        self.assertEqual(perfil['slug'], 'oficina-p')
        self.assertEqual(perfil['servicos'], ['Freios', 'Suspensão'])


class OrcamentoEChecklistPublicosTests(TestCase):
    """Orçamento e checklist públicos trazem a oficina, o carro e o link da OS ligada."""

    def setUp(self):
        self.oficina = _oficina('Oficina Q', telefone='(81) 99999-0000', horario_funcionamento='Seg a Sex')
        self.ordem = _os(self.oficina)
        self.client = APIClient()

    def _orcamento(self, **kw):
        orc = Orcamento.objects.create(
            oficina=self.oficina, cliente=self.ordem.cliente, veiculo=self.ordem.veiculo, numero='ORC-1', **kw,
        )
        ItemOrcamento.objects.create(orcamento=orc, tipo='servico', descricao='Revisão', quantidade=1, preco_unitario=200)
        return orc

    def test_orcamento_traz_oficina_e_carro(self):
        d = self.client.get(f'/api/orcamento-publico/{self._orcamento().token_publico}/').data
        self.assertEqual(d['oficina_horario'], 'Seg a Sex')
        self.assertEqual(d['veiculo_placa'], self.ordem.veiculo.placa)
        self.assertIsNone(d['oficina_perfil'])
        self.assertIsNone(d['os'])

    def test_aprovar_devolve_a_os_criada(self):
        orc = self._orcamento()
        r = self.client.post(f'/api/orcamento-publico/{orc.token_publico}/responder/', {'resposta': 'aprovado'}, format='json')
        self.assertEqual(r.status_code, 200)
        orc.refresh_from_db()
        self.assertEqual(r.data['os']['token_publico'], orc.ordem.token_publico)
        # Depois de aprovado, a página do orçamento já aponta para a OS.
        d = self.client.get(f'/api/orcamento-publico/{orc.token_publico}/').data
        self.assertEqual(d['os']['numero'], orc.ordem.numero)

    def test_checklist_traz_oficina_e_os(self):
        ck = ChecklistEntrada.objects.create(
            oficina=self.oficina, ordem=self.ordem, cliente=self.ordem.cliente, veiculo=self.ordem.veiculo, quilometragem=1000,
        )
        d = self.client.get(f'/api/checklist-publico/{ck.token_publico}/').data
        self.assertEqual(d['oficina_nome'], 'Oficina Q')
        self.assertEqual(d['veiculo_modelo'], 'Uno')
        self.assertEqual(d['os']['token_publico'], self.ordem.token_publico)
