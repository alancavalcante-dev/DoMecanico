from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import MembroOficina, Oficina, PermissaoMembro
from mecanica.models import Cliente, Funcionario, OrdemServico, ServicoOS, Veiculo


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
