"""
Seed de dados realistas para o DoMecanico SaaS.
Execute: python seed.py
"""
import os
import django
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from accounts.models import Plano, Oficina, MembroOficina, Assinatura
from mecanica.models import (
    Cliente, Veiculo, Funcionario, Peca, MovimentacaoEstoque
)

print("=== Seed DoMecanico ===\n")

# Planos
plano_starter, _ = Plano.objects.update_or_create(
    slug='starter',
    defaults=dict(nome='Starter', preco='99.00', max_usuarios=1, max_clientes=50,
                  max_os_mes=100, max_pecas=200, tem_nota_fiscal=False,
                  tem_relatorios=False, tem_fotos_veiculo=False, destaque=False)
)
plano_pro, _ = Plano.objects.update_or_create(
    slug='pro',
    defaults=dict(nome='Pro', preco='199.00', max_usuarios=5, max_clientes=-1,
                  max_os_mes=-1, max_pecas=-1, tem_nota_fiscal=True,
                  tem_relatorios=True, tem_fotos_veiculo=True, destaque=True)
)
print("OK: Planos criados")

# Oficina demo
oficina, criada = Oficina.objects.get_or_create(
    cnpj='12.345.678/0001-90',
    defaults=dict(
        nome='Auto Center Modelo',
        telefone='(11) 3456-7890',
        email='contato@autocentromodelo.com.br',
        endereco='Av. Brasil, 1500',
        cidade='Sao Paulo',
        estado='SP',
        cep='01310-100',
    )
)
print("OK: Oficina" + (" criada" if criada else " ja existia"))

# Usuario admin
if not User.objects.filter(username='admin_demo').exists():
    user = User.objects.create_user(
        username='admin_demo',
        email='admin@autocentromodelo.com.br',
        password='demo1234',
        first_name='Carlos',
        last_name='Mendes',
    )
    MembroOficina.objects.create(user=user, oficina=oficina, papel='admin')
    print("OK: Usuario admin criado | email: admin@autocentromodelo.com.br | senha: demo1234")
else:
    print("OK: Usuario admin ja existia")

# Assinatura Pro ativa
Assinatura.objects.update_or_create(
    oficina=oficina,
    defaults=dict(
        plano=plano_pro,
        status='ativa',
        data_inicio=timezone.now() - timedelta(days=10),
        data_fim=timezone.now() + timedelta(days=20),
    )
)
print("OK: Assinatura Pro ativa")

# Clientes
clientes_data = [
    ('Joao Carlos Silva',       '123.456.789-00', '(11) 98765-4321', 'joao.silva@email.com',      'Rua das Flores, 123',   'Sao Paulo',     'SP', '01310-100'),
    ('Maria Aparecida Santos',  '234.567.890-11', '(11) 97654-3210', 'maria.santos@gmail.com',    'Av. Paulista, 456',     'Sao Paulo',     'SP', '01311-200'),
    ('Pedro Henrique Oliveira', '345.678.901-22', '(21) 96543-2109', 'pedro.oliveira@outlook.com','Rua do Comercio, 789',  'Rio de Janeiro','RJ', '20040-020'),
    ('Ana Paula Costa',         '456.789.012-33', '(31) 95432-1098', 'ana.costa@email.com',       'Av. Afonso Pena, 321',  'Belo Horizonte','MG', '30130-009'),
    ('Roberto Ferreira Lima',   '567.890.123-44', '(41) 94321-0987', 'roberto.lima@gmail.com',    'Rua XV de Novembro, 654','Curitiba',     'PR', '80020-310'),
    ('Fernanda Gomes Pereira',  '678.901.234-55', '(51) 93210-9876', 'fernanda.pereira@email.com','Av. Borges de Medeiros, 987','Porto Alegre','RS','90020-023'),
    ('Marcelo Alves Rodrigues', '789.012.345-66', '(61) 92109-8765', 'marcelo.rodrigues@gmail.com','SQN 210, Bloco A',    'Brasilia',      'DF', '70862-010'),
    ('Juliana Martins Sousa',   '890.123.456-77', '(71) 91098-7654', 'juliana.sousa@email.com',   'Av. Sete de Setembro, 147','Salvador',  'BA', '40050-001'),
    ('Lucas Eduardo Nascimento','901.234.567-88', '(81) 90987-6543', 'lucas.nascimento@outlook.com','Av. Boa Viagem, 258','Recife',        'PE', '51011-000'),
    ('Patricia Helena Carvalho','012.345.678-99', '(85) 89876-5432', 'patricia.carvalho@gmail.com','Rua Monsenhor Tabosa, 369','Fortaleza','CE', '60175-040'),
    ('Gustavo Henrique Moreira','111.222.333-44', '(11) 88765-4321', 'gustavo.moreira@email.com', 'Rua Augusta, 741',     'Sao Paulo',     'SP', '01305-100'),
    ('Camila Dias Barbosa',     '222.333.444-55', '(11) 87654-3210', 'camila.barbosa@gmail.com',  'Av. Reboucas, 852',    'Sao Paulo',     'SP', '05402-100'),
    ('Thiago Santos Araujo',    '333.444.555-66', '(21) 86543-2109', 'thiago.araujo@email.com',   'Rua da Gloria, 963',   'Rio de Janeiro','RJ', '20241-180'),
    ('Gabriela Rocha Ferreira', '444.555.666-77', '(11) 85432-1098', 'gabriela.ferreira@gmail.com','Rua Oscar Freire, 174','Sao Paulo',   'SP', '01426-001'),
    ('Rafael Mendes Torres',    '555.666.777-88', '(31) 84321-0987', 'rafael.torres@outlook.com', 'Av. do Contorno, 285', 'Belo Horizonte','MG', '30110-017'),
    ('Daniela Lima Pinto',      '666.777.888-99', '(41) 83210-9876', 'daniela.pinto@email.com',   'Rua das Flores, 396',  'Curitiba',      'PR', '80050-370'),
    ('Bruno Costa Machado',     '777.888.999-00', '(11) 82109-8765', 'bruno.machado@gmail.com',   'Av. Ipiranga, 407',    'Sao Paulo',     'SP', '01046-010'),
    ('Larissa Oliveira Vieira', '888.999.000-11', '(51) 81098-7654', 'larissa.vieira@email.com',  'Rua dos Andradas, 518','Porto Alegre',  'RS', '90020-002'),
    ('Anderson Silva Campos',   '999.000.111-22', '(61) 80987-6543', 'anderson.campos@gmail.com', 'CLN 304 Bloco B',      'Brasilia',      'DF', '70736-520'),
    ('Vanessa Almeida Ribeiro', '000.111.222-33', '(11) 79876-5432', 'vanessa.ribeiro@outlook.com','Av. Faria Lima, 629', 'Sao Paulo',     'SP', '01452-001'),
]

clientes = []
for nome, cpf, tel, email, end, cidade, estado, cep in clientes_data:
    c, _ = Cliente.objects.get_or_create(
        oficina=oficina, cpf_cnpj=cpf,
        defaults=dict(nome=nome, telefone=tel, email=email,
                      endereco=end, cidade=cidade, estado=estado, cep=cep)
    )
    clientes.append(c)
print(f"OK: {len(clientes)} clientes criados")

# Veiculos
veiculos_data = [
    (0,  'ABC-1234', 'Honda',      'Civic',     2020, 'Preto',    'carro',   42000),
    (0,  'DEF-5678', 'Toyota',     'Corolla',   2021, 'Prata',    'carro',   35000),
    (1,  'GHI-9012', 'Volkswagen', 'Golf',      2019, 'Branco',   'carro',   58000),
    (1,  'JKL-3456', 'Ford',       'EcoSport',  2022, 'Vermelho', 'carro',   28000),
    (2,  'MNO-7890', 'Chevrolet',  'Onix',      2021, 'Cinza',    'carro',   45000),
    (3,  'PQR-1234', 'Hyundai',    'HB20',      2020, 'Azul',     'carro',   62000),
    (4,  'STU-5678', 'Jeep',       'Compass',   2022, 'Preto',    'carro',   32000),
    (5,  'VWX-9012', 'Renault',    'Kwid',      2021, 'Laranja',  'carro',   48000),
    (6,  'YZA-3456', 'Fiat',       'Cronos',    2020, 'Branco',   'carro',   71000),
    (7,  'BCD-7890', 'Nissan',     'Kicks',     2019, 'Prata',    'carro',   89000),
    (8,  'EFG-1234', 'Honda',      'HR-V',      2021, 'Cinza',    'carro',   27000),
    (9,  'HIJ-5678', 'Toyota',     'Hilux',     2018, 'Branco',   'caminhao',120000),
    (10, 'KLM-9012', 'Volkswagen', 'T-Cross',   2022, 'Vermelho', 'carro',   15000),
    (11, 'NOP-3456', 'Ford',       'Ranger',    2020, 'Preto',    'caminhao',95000),
    (12, 'QRS-7890', 'Chevrolet',  'S10',       2019, 'Prata',    'caminhao',110000),
    (13, 'TUV-1234', 'Fiat',       'Strada',    2021, 'Branco',   'carro',   63000),
    (14, 'WXY-5678', 'Hyundai',    'Creta',     2022, 'Azul',     'carro',   22000),
    (15, 'ZAB-9012', 'Jeep',       'Renegade',  2020, 'Verde',    'carro',   78000),
    (16, 'CDE-3456', 'Renault',    'Duster',    2021, 'Cinza',    'carro',   54000),
    (17, 'FGH-7890', 'Volkswagen', 'Gol',       2018, 'Branco',   'carro',   135000),
    (18, 'IJK-1234', 'Honda',      'Fit',       2019, 'Preto',    'carro',   82000),
    (19, 'LMN-5678', 'Toyota',     'RAV4',      2022, 'Prata',    'carro',   18000),
    (0,  'OPQ-9012', 'Fiat',       'Argo',      2021, 'Vermelho', 'carro',   37000),
    (2,  'RST-3456', 'Chevrolet',  'Tracker',   2022, 'Azul',     'carro',   24000),
    (5,  'UVW-7890', 'Ford',       'Territory', 2021, 'Branco',   'carro',   41000),
    (8,  'XYZ-1234', 'Volkswagen', 'Polo',      2020, 'Cinza',    'carro',   56000),
    (10, 'AAA-5678', 'Honda',      'WR-V',      2022, 'Preto',    'carro',   19000),
]

veiculos = []
for ci, placa, marca, modelo, ano, cor, tipo, km in veiculos_data:
    v, _ = Veiculo.objects.get_or_create(
        oficina=oficina, placa=placa,
        defaults=dict(cliente=clientes[ci], marca=marca, modelo=modelo,
                      ano=ano, cor=cor, tipo=tipo, quilometragem=km)
    )
    veiculos.append(v)
print(f"OK: {len(veiculos)} veiculos criados")

# Funcionarios
funcionarios_data = [
    ('Carlos Eduardo Mendes',     'mecanico',    '3500.00', '11987654321', 'carlos.mendes@oficina.com',    '001.234.567-89', '2022-01-10'),
    ('Rodrigo Alves Costa',       'mecanico',    '3200.00', '11976543210', 'rodrigo.costa@oficina.com',    '002.345.678-90', '2021-06-15'),
    ('Felipe Santos Moura',       'mecanico',    '3800.00', '11965432109', 'felipe.moura@oficina.com',     '003.456.789-01', '2020-03-20'),
    ('Marcos Paulo Ferreira',     'eletricista', '4200.00', '11954321098', 'marcos.ferreira@oficina.com',  '004.567.890-12', '2019-11-05'),
    ('Anderson Luis Pereira',     'mecanico',    '3100.00', '11943210987', 'anderson.pereira@oficina.com', '005.678.901-23', '2023-02-01'),
    ('Claudia Regina Santos',     'atendente',   '2800.00', '11932109876', 'claudia.santos@oficina.com',   '006.789.012-34', '2021-08-12'),
    ('Patricia Lima Oliveira',    'atendente',   '2600.00', '11921098765', 'patricia.oliveira@oficina.com','007.890.123-45', '2022-04-18'),
    ('Wagner Roberto Silva',      'outro',       '3600.00', '11910987654', 'wagner.silva@oficina.com',     '008.901.234-56', '2020-07-22'),
    ('Leandro Gustavo Nascimento','outro',       '3400.00', '11909876543', 'leandro.nascimento@oficina.com','009.012.345-67','2021-01-30'),
    ('Tatiana Souza Carvalho',    'gerente',     '5500.00', '11898765432', 'tatiana.carvalho@oficina.com', '010.123.456-78', '2018-05-14'),
]

funcs = []
for nome, cargo, salario, tel, email, cpf, admissao in funcionarios_data:
    f, _ = Funcionario.objects.get_or_create(
        oficina=oficina, cpf=cpf,
        defaults=dict(nome=nome, cargo=cargo, salario=salario,
                      telefone=tel, email=email,
                      data_admissao=admissao, ativo=True)
    )
    funcs.append(f)
print(f"OK: {len(funcs)} funcionarios criados")

# Pecas
pecas_data = [
    ('FILTRO-AR-001',  'Filtro de Ar',                 15,  5, 'Mann-Filter',  '35.00',  '65.00'),
    ('FILTRO-OL-001',  'Filtro de Oleo',               20,  5, 'Mann-Filter',  '25.00',  '45.00'),
    ('FILTRO-CB-001',  'Filtro de Combustivel',         12,  5, 'Tecfil',       '40.00',  '75.00'),
    ('FILTRO-PL-001',  'Filtro de Polen',               10,  3, 'Mann-Filter',  '30.00',  '55.00'),
    ('OLEO-5W30-001',  'Oleo Motor 5W30 Sint. (1L)',    50, 10, 'Castrol',      '45.00',  '80.00'),
    ('OLEO-10W40-001', 'Oleo Motor 10W40 Semi (1L)',    40, 10, 'Mobil',        '35.00',  '60.00'),
    ('OLEO-CAMB-001',  'Oleo Cambio ATF (1L)',          20,  5, 'Shell',        '55.00',  '95.00'),
    ('VELA-001',       'Vela de Ignicao Iridium',       30, 10, 'NGK',          '28.00',  '55.00'),
    ('VELA-002',       'Vela de Ignicao Platinum',      25,  8, 'Bosch',        '32.00',  '60.00'),
    ('CABOS-VELA-001', 'Jogo de Cabos de Vela',         15,  3, 'NGK',          '120.00', '220.00'),
    ('PASTILHA-001',   'Pastilha de Freio Diant.',      20,  5, 'Fras-Le',      '85.00',  '160.00'),
    ('PASTILHA-002',   'Pastilha de Freio Tras.',       18,  5, 'Fras-Le',      '75.00',  '140.00'),
    ('DISCO-001',      'Disco de Freio Dianteiro',      12,  3, 'Bosch',        '180.00', '320.00'),
    ('DISCO-002',      'Disco de Freio Traseiro',       10,  3, 'Bosch',        '160.00', '290.00'),
    ('LONA-001',       'Lona de Freio (jogo)',          15,  5, 'Fras-Le',      '95.00',  '175.00'),
    ('AMORTEC-001',    'Amortecedor Diant. Esq.',        8,  2, 'Monroe',       '320.00', '580.00'),
    ('AMORTEC-002',    'Amortecedor Diant. Dir.',        8,  2, 'Monroe',       '320.00', '580.00'),
    ('AMORTEC-003',    'Amortecedor Tras. Esq.',         8,  2, 'Monroe',       '280.00', '520.00'),
    ('AMORTEC-004',    'Amortecedor Tras. Dir.',         8,  2, 'Monroe',       '280.00', '520.00'),
    ('MOLA-001',       'Mola Dianteira (un)',            10,  3, 'Nakata',      '150.00', '280.00'),
    ('BATERIA-001',    'Bateria 60Ah',                   8,  2, 'Moura',        '380.00', '650.00'),
    ('BATERIA-002',    'Bateria 70Ah',                   6,  2, 'Heliar',       '430.00', '720.00'),
    ('ALTERNADOR-001', 'Alternador Recondicionado',      5,  2, 'Bosch',        '480.00', '850.00'),
    ('MOTOR-ARR-001',  'Motor de Arranque Recondi.',     4,  2, 'Bosch',        '520.00', '920.00'),
    ('CORREIA-001',    'Correia Dentada',                15,  5, 'Gates',       '95.00',  '175.00'),
    ('CORREIA-002',    'Correia Poly-V',                 12,  4, 'Gates',       '75.00',  '135.00'),
    ('KIT-CORR-001',   'Kit Correia + Tensor + Bomba',   8,  2, 'Gates',       '380.00', '680.00'),
    ('BOMBA-AG-001',   'Bomba de Agua',                  8,  2, 'GMB',         '220.00', '395.00'),
    ('JUNTA-001',      'Junta do Cabecote',               6,  2, 'Fel-Pro',    '280.00', '500.00'),
    ('RADIADOR-001',   'Radiador de Agua',                4,  2, 'Plamax',     '520.00', '920.00'),
    ('PNEU-195-001',   'Pneu 195/65 R15',               20,  4, 'Pirelli',     '280.00', '480.00'),
    ('PNEU-205-001',   'Pneu 205/60 R16',               16,  4, 'Continental', '320.00', '560.00'),
    ('PNEU-225-001',   'Pneu 225/65 R17',               12,  4, 'Bridgestone', '380.00', '660.00'),
    ('FLUIDO-FR-001',  'Fluido de Freio DOT4 (500ml)',   25,  8, 'Bosch',      '35.00',  '65.00'),
    ('FLUIDO-DH-001',  'Fluido Direcao Hidraulica',      15,  5, 'Texaco',     '28.00',  '52.00'),
    ('ADIT-RAD-001',   'Aditivo para Radiador (1L)',     20,  6, 'Prestone',   '25.00',  '48.00'),
    ('VELA-GLPL-001',  'Vela de Aquecimento Diesel',     18,  5, 'Bosch',      '65.00',  '120.00'),
    ('SENSOR-O2-001',  'Sensor de Oxigenio Lambda',       8,  2, 'Bosch',      '280.00', '480.00'),
    ('SENSOR-VR-001',  'Sensor de Rotacao',               6,  2, 'Delphi',     '195.00', '350.00'),
    ('SENSOR-TPS-001', 'Sensor TPS Borboleta',            5,  2, 'Bosch',      '245.00', '430.00'),
    ('BICO-INJ-001',   'Bico Injetor Recondicionado',     6,  2, 'Siemens',    '180.00', '320.00'),
    ('EMBREAG-001',    'Kit Embreagem Completo',          5,  2, 'LUK',        '680.00','1200.00'),
    ('ROLAM-ROD-001',  'Rolamento de Roda Diant.',       10,  3, 'SKF',        '220.00', '390.00'),
    ('TIRANTE-001',    'Terminal de Direcao',            12,  4, 'Nakata',      '95.00',  '175.00'),
    ('BRACO-001',      'Braco Axial Bandeja',             8,  2, 'Nakata',     '145.00', '265.00'),
    ('ESCAPAM-001',    'Escapamento Traseiro',            6,  2, 'Flexalum',   '320.00', '570.00'),
    ('CATALISA-001',   'Catalisador',                    3,  1, 'Dinex',       '680.00','1200.00'),
    ('COXIM-001',      'Coxim do Motor (jogo)',           6,  2, 'Nakata',     '180.00', '320.00'),
    ('EIXO-001',       'Semi-eixo Homocinetico Esq.',     4,  2, 'GKN',        '480.00', '850.00'),
    ('EIXO-002',       'Semi-eixo Homocinetico Dir.',     4,  2, 'GKN',        '480.00', '850.00'),
]

pecas = []
for codigo, nome, qtd, qtd_min, marca, custo, venda in pecas_data:
    p, criada_peca = Peca.objects.get_or_create(
        oficina=oficina, codigo=codigo,
        defaults=dict(nome=nome, quantidade=qtd, quantidade_minima=qtd_min,
                      marca=marca, preco_custo=custo, preco_venda=venda)
    )
    if criada_peca:
        MovimentacaoEstoque.objects.create(
            peca=p, tipo='entrada',
            quantidade=qtd, motivo='Estoque inicial do seed'
        )
    pecas.append(p)
print(f"OK: {len(pecas)} pecas criadas com movimentacoes de entrada")

print("\n=== Seed concluido com sucesso! ===")
print("Login: admin@autocentromodelo.com.br / demo1234")
print("Frontend: http://localhost:5173")
print("Admin:    http://localhost:8000/admin")
