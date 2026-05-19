import os
import sys
import django
import random
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from mecanica.models import Cliente, Veiculo, FotoVeiculo, Funcionario, Peca, MovimentacaoEstoque

print("Limpando dados existentes...")
MovimentacaoEstoque.objects.all().delete()
Peca.objects.all().delete()
Funcionario.objects.all().delete()
Veiculo.objects.all().delete()
Cliente.objects.all().delete()

# ─── CLIENTES ────────────────────────────────────────────────────────────────
print("Criando clientes...")

clientes_data = [
    {"nome": "Carlos Eduardo Silva", "cpf_cnpj": "123.456.789-01", "telefone": "(11) 3344-5566", "celular": "(11) 99887-6543", "email": "carlos.silva@gmail.com", "endereco": "Rua das Palmeiras, 145", "cidade": "São Paulo", "estado": "SP", "cep": "01310-100", "observacoes": "Cliente antigo, sempre pontual nos pagamentos."},
    {"nome": "Ana Paula Ferreira", "cpf_cnpj": "234.567.890-12", "telefone": "(11) 2233-4455", "celular": "(11) 98765-4321", "email": "ana.ferreira@hotmail.com", "endereco": "Av. Paulista, 1000, Apto 42", "cidade": "São Paulo", "estado": "SP", "cep": "01310-200", "observacoes": "Prefere contato pelo celular."},
    {"nome": "Roberto Mendes Costa", "cpf_cnpj": "345.678.901-23", "telefone": "(11) 4455-6677", "celular": "(11) 97654-3210", "email": "roberto.costa@yahoo.com.br", "endereco": "Rua Consolação, 300", "cidade": "São Paulo", "estado": "SP", "cep": "01302-000"},
    {"nome": "Juliana Ramos Oliveira", "cpf_cnpj": "456.789.012-34", "celular": "(11) 96543-2109", "email": "ju.ramos@gmail.com", "endereco": "Rua Augusta, 2100", "cidade": "São Paulo", "estado": "SP", "cep": "01413-000"},
    {"nome": "Marcelo Augusto Pinto", "cpf_cnpj": "567.890.123-45", "telefone": "(11) 5566-7788", "celular": "(11) 95432-1098", "email": "marcelo.pinto@empresa.com.br", "endereco": "Av. Rebouças, 500", "cidade": "São Paulo", "estado": "SP", "cep": "05401-000", "observacoes": "Tem frota de 3 veículos da empresa."},
    {"nome": "Fernanda Lima Santos", "cpf_cnpj": "678.901.234-56", "celular": "(11) 94321-0987", "email": "fernanda.lima@gmail.com", "endereco": "Rua Oscar Freire, 800", "cidade": "São Paulo", "estado": "SP", "cep": "01426-001"},
    {"nome": "Diego Carvalho Alves", "cpf_cnpj": "789.012.345-67", "celular": "(11) 93210-9876", "email": "diego.alves@outlook.com", "endereco": "Rua Haddock Lobo, 400", "cidade": "São Paulo", "estado": "SP", "cep": "01414-001"},
    {"nome": "Patrícia Souza Nunes", "cpf_cnpj": "890.123.456-78", "telefone": "(11) 6677-8899", "celular": "(11) 92109-8765", "email": "patricia.nunes@uol.com.br", "endereco": "Av. Faria Lima, 1500", "cidade": "São Paulo", "estado": "SP", "cep": "01452-002", "observacoes": "Moto e carro, vem sempre junto."},
    {"nome": "Thiago Barbosa Rocha", "cpf_cnpj": "901.234.567-89", "celular": "(11) 91098-7654", "email": "thiago.rocha@gmail.com", "endereco": "Rua Teodoro Sampaio, 200", "cidade": "São Paulo", "estado": "SP", "cep": "05405-001"},
    {"nome": "Camila Pereira Dias", "cpf_cnpj": "012.345.678-90", "celular": "(11) 90987-6543", "email": "camila.dias@gmail.com", "endereco": "Rua da Consolação, 1200", "cidade": "São Paulo", "estado": "SP", "cep": "01302-907"},
    {"nome": "Auto Peças Irmãos Silva Ltda", "cpf_cnpj": "12.345.678/0001-90", "telefone": "(11) 3456-7890", "celular": "(11) 98888-7777", "email": "contato@irmaosilva.com.br", "endereco": "Av. do Estado, 3000", "cidade": "São Paulo", "estado": "SP", "cep": "01516-000", "observacoes": "Empresa. Emitir NF sempre."},
    {"nome": "Transportadora Rápido Sul", "cpf_cnpj": "23.456.789/0001-01", "telefone": "(11) 4567-8901", "celular": "(11) 97777-6666", "email": "frota@rapidosul.com.br", "endereco": "Rod. Anchieta, km 25", "cidade": "São Bernardo do Campo", "estado": "SP", "cep": "09720-000", "observacoes": "Frota grande. Negocia preço em volume."},
    {"nome": "Lucas Henrique Martins", "cpf_cnpj": "111.222.333-44", "celular": "(11) 96666-5555", "email": "lucas.martins@gmail.com", "endereco": "Rua Vergueiro, 3400", "cidade": "São Paulo", "estado": "SP", "cep": "04101-300"},
    {"nome": "Beatriz Gonçalves Freitas", "cpf_cnpj": "222.333.444-55", "celular": "(11) 95555-4444", "email": "bia.freitas@hotmail.com", "endereco": "Rua Domingos de Morais, 700", "cidade": "São Paulo", "estado": "SP", "cep": "04009-003"},
    {"nome": "Alexandre Torres Melo", "cpf_cnpj": "333.444.555-66", "telefone": "(11) 7788-9900", "celular": "(11) 94444-3333", "email": "alex.melo@gmail.com", "endereco": "Av. Santo Amaro, 2000", "cidade": "São Paulo", "estado": "SP", "cep": "04506-001"},
    {"nome": "Rafaela Cardoso Lima", "cpf_cnpj": "444.555.666-77", "celular": "(11) 93333-2222", "email": "rafa.cardoso@gmail.com", "endereco": "Rua Pamplona, 500", "cidade": "São Paulo", "estado": "SP", "cep": "01405-100"},
    {"nome": "Gustavo Ribeiro Teixeira", "cpf_cnpj": "555.666.777-88", "celular": "(11) 92222-1111", "email": "gustavo.teixeira@empresa.com", "endereco": "Av. Brigadeiro Faria Lima, 2000", "cidade": "São Paulo", "estado": "SP", "cep": "01489-900"},
    {"nome": "Aline Moreira Cunha", "cpf_cnpj": "666.777.888-99", "celular": "(11) 91111-0000", "email": "aline.cunha@gmail.com", "endereco": "Rua Funchal, 400", "cidade": "São Paulo", "estado": "SP", "cep": "04551-060"},
    {"nome": "Bruno Araújo Nascimento", "cpf_cnpj": "777.888.999-00", "celular": "(11) 99000-1111", "email": "bruno.nascimento@gmail.com", "endereco": "Rua Tutoia, 900", "cidade": "São Paulo", "estado": "SP", "cep": "04007-005"},
    {"nome": "Larissa Vieira Campos", "cpf_cnpj": "888.999.000-11", "celular": "(11) 98111-2222", "email": "larissa.campos@gmail.com", "endereco": "Av. Moaci, 800", "cidade": "São Paulo", "estado": "SP", "cep": "04083-002"},
]

clientes = []
for data in clientes_data:
    c = Cliente.objects.create(**data)
    clientes.append(c)
print(f"  {len(clientes)} clientes criados.")

# ─── VEÍCULOS ─────────────────────────────────────────────────────────────────
print("Criando veículos...")

veiculos_data = [
    # Carlos Eduardo Silva
    {"cliente": clientes[0], "tipo": "carro", "marca": "Toyota", "modelo": "Corolla", "ano": 2021, "placa": "ABC-1234", "cor": "Prata", "quilometragem": 45000, "chassi": "9BWZZZ377VT004251"},
    {"cliente": clientes[0], "tipo": "moto", "marca": "Honda", "modelo": "CB 500F", "ano": 2020, "placa": "XYZ-5678", "cor": "Vermelha", "quilometragem": 18000},
    # Ana Paula Ferreira
    {"cliente": clientes[1], "tipo": "carro", "marca": "Volkswagen", "modelo": "Golf GTI", "ano": 2022, "placa": "DEF-2345", "cor": "Branca", "quilometragem": 22000},
    # Roberto Mendes Costa
    {"cliente": clientes[2], "tipo": "carro", "marca": "Chevrolet", "modelo": "Onix Plus", "ano": 2020, "placa": "GHI-3456", "cor": "Cinza", "quilometragem": 67000},
    {"cliente": clientes[2], "tipo": "carro", "marca": "Fiat", "modelo": "Strada", "ano": 2019, "placa": "JKL-4567", "cor": "Branca", "quilometragem": 89000, "observacoes": "Caminhonete da fazenda, uso pesado."},
    # Juliana Ramos
    {"cliente": clientes[3], "tipo": "moto", "marca": "Yamaha", "modelo": "MT-07", "ano": 2021, "placa": "MNO-5678", "cor": "Azul", "quilometragem": 12000},
    # Marcelo Augusto Pinto
    {"cliente": clientes[4], "tipo": "carro", "marca": "Toyota", "modelo": "Hilux", "ano": 2022, "placa": "PQR-6789", "cor": "Preta", "quilometragem": 38000, "observacoes": "Veículo da empresa."},
    {"cliente": clientes[4], "tipo": "carro", "marca": "Volkswagen", "modelo": "Amarok", "ano": 2021, "placa": "STU-7890", "cor": "Prata", "quilometragem": 52000, "observacoes": "Veículo da empresa."},
    {"cliente": clientes[4], "tipo": "caminhao", "marca": "Mercedes-Benz", "modelo": "Atego 1719", "ano": 2018, "placa": "VWX-8901", "cor": "Branca", "quilometragem": 210000, "observacoes": "Caminhão de entrega da empresa."},
    # Fernanda Lima
    {"cliente": clientes[5], "tipo": "carro", "marca": "Hyundai", "modelo": "HB20S", "ano": 2021, "placa": "YZA-9012", "cor": "Vermelho", "quilometragem": 28000},
    # Diego Carvalho
    {"cliente": clientes[6], "tipo": "moto", "marca": "Kawasaki", "modelo": "Ninja 400", "ano": 2022, "placa": "BCD-0123", "cor": "Verde", "quilometragem": 8500},
    # Patrícia Souza
    {"cliente": clientes[7], "tipo": "carro", "marca": "Renault", "modelo": "Kwid", "ano": 2020, "placa": "EFG-1234", "cor": "Laranja", "quilometragem": 41000},
    {"cliente": clientes[7], "tipo": "moto", "marca": "Honda", "modelo": "Biz 125", "ano": 2019, "placa": "HIJ-2345", "cor": "Vermelha", "quilometragem": 33000},
    # Thiago Barbosa
    {"cliente": clientes[8], "tipo": "carro", "marca": "Ford", "modelo": "Ka Sedan", "ano": 2019, "placa": "KLM-3456", "cor": "Prata", "quilometragem": 73000},
    # Camila Pereira
    {"cliente": clientes[9], "tipo": "carro", "marca": "Fiat", "modelo": "Pulse", "ano": 2022, "placa": "NOP-4567", "cor": "Azul", "quilometragem": 15000},
    # Auto Peças Irmãos Silva
    {"cliente": clientes[10], "tipo": "carro", "marca": "Fiat", "modelo": "Doblò Cargo", "ano": 2020, "placa": "QRS-5678", "cor": "Branca", "quilometragem": 95000, "observacoes": "Van de entrega."},
    # Transportadora Rápido Sul
    {"cliente": clientes[11], "tipo": "caminhao", "marca": "Volvo", "modelo": "FH 460", "ano": 2019, "placa": "TUV-6789", "cor": "Branca", "quilometragem": 450000, "observacoes": "Frota principal."},
    {"cliente": clientes[11], "tipo": "caminhao", "marca": "Scania", "modelo": "R 450", "ano": 2020, "placa": "WXY-7890", "cor": "Azul", "quilometragem": 320000},
    # Lucas Henrique
    {"cliente": clientes[12], "tipo": "moto", "marca": "Honda", "modelo": "CG 160 Titan", "ano": 2021, "placa": "ZAB-8901", "cor": "Preta", "quilometragem": 22000},
    # Beatriz Gonçalves
    {"cliente": clientes[13], "tipo": "carro", "marca": "Jeep", "modelo": "Renegade", "ano": 2021, "placa": "CDE-9012", "cor": "Cinza", "quilometragem": 31000},
    # Alexandre Torres
    {"cliente": clientes[14], "tipo": "carro", "marca": "BMW", "modelo": "320i", "ano": 2020, "placa": "FGH-0123", "cor": "Preta", "quilometragem": 58000, "observacoes": "Veículo importado, peças sob consulta."},
    # Rafaela Cardoso
    {"cliente": clientes[15], "tipo": "carro", "marca": "Nissan", "modelo": "Kicks", "ano": 2022, "placa": "IJK-1235", "cor": "Branca", "quilometragem": 19000},
    # Gustavo Ribeiro
    {"cliente": clientes[16], "tipo": "carro", "marca": "Audi", "modelo": "A3 Sedan", "ano": 2021, "placa": "LMN-2346", "cor": "Branca", "quilometragem": 35000},
    {"cliente": clientes[16], "tipo": "moto", "marca": "Ducati", "modelo": "Monster 937", "ano": 2022, "placa": "OPQ-3457", "cor": "Vermelha", "quilometragem": 6000},
    # Aline Moreira
    {"cliente": clientes[17], "tipo": "carro", "marca": "Peugeot", "modelo": "208", "ano": 2021, "placa": "RST-4568", "cor": "Branca", "quilometragem": 24000},
    # Bruno Araújo
    {"cliente": clientes[18], "tipo": "carro", "marca": "Chevrolet", "modelo": "Tracker", "ano": 2021, "placa": "UVW-5679", "cor": "Azul", "quilometragem": 27000},
    # Larissa Vieira
    {"cliente": clientes[19], "tipo": "carro", "marca": "Honda", "modelo": "HR-V", "ano": 2020, "placa": "XYZ-6780", "cor": "Prata", "quilometragem": 49000},
]

veiculos = []
for data in veiculos_data:
    v = Veiculo.objects.create(**data)
    veiculos.append(v)
print(f"  {len(veiculos)} veículos criados.")

# ─── FUNCIONÁRIOS ─────────────────────────────────────────────────────────────
print("Criando funcionários...")

funcionarios_data = [
    {"nome": "João Paulo Machado", "cpf": "100.200.300-40", "cargo": "mecanico", "telefone": "(11) 98001-1001", "email": "joao.machado@domecanico.com", "salario": Decimal("3800.00"), "data_admissao": date(2018, 3, 15), "ativo": True, "observacoes": "Especialista em motores flex e GNV. 12 anos de experiência."},
    {"nome": "Renato Carvalho Bispo", "cpf": "200.300.400-50", "cargo": "mecanico", "telefone": "(11) 98002-2002", "email": "renato.bispo@domecanico.com", "salario": Decimal("3500.00"), "data_admissao": date(2019, 7, 1), "ativo": True, "observacoes": "Especializado em suspensão e freios."},
    {"nome": "Sandro Luiz Ferreira", "cpf": "300.400.500-60", "cargo": "eletricista", "telefone": "(11) 98003-3003", "email": "sandro.ferreira@domecanico.com", "salario": Decimal("4200.00"), "data_admissao": date(2017, 1, 10), "ativo": True, "observacoes": "Eletricista automotivo sênior. Injeção eletrônica e scanner."},
    {"nome": "Marcos Antônio Silva", "cpf": "400.500.600-70", "cargo": "auxiliar", "telefone": "(11) 98004-4004", "salario": Decimal("1900.00"), "data_admissao": date(2022, 4, 1), "ativo": True, "observacoes": "Auxiliar de mecânico. Em treinamento."},
    {"nome": "Fábio Henrique Gomes", "cpf": "500.600.700-80", "cargo": "auxiliar", "telefone": "(11) 98005-5005", "salario": Decimal("1900.00"), "data_admissao": date(2023, 2, 14), "ativo": True},
    {"nome": "Claudia Regina Souza", "cpf": "600.700.800-90", "cargo": "atendente", "telefone": "(11) 98006-6006", "email": "claudia.souza@domecanico.com", "salario": Decimal("2200.00"), "data_admissao": date(2020, 9, 1), "ativo": True, "observacoes": "Atendimento ao cliente e orçamentos."},
    {"nome": "Rafael Oliveira Prado", "cpf": "700.800.900-01", "cargo": "mecanico", "telefone": "(11) 98007-7007", "email": "rafael.prado@domecanico.com", "salario": Decimal("3600.00"), "data_admissao": date(2021, 6, 15), "ativo": True, "observacoes": "Especializado em motos."},
    {"nome": "Paulo César Mendonça", "cpf": "800.900.000-12", "cargo": "gerente", "telefone": "(11) 98008-8008", "email": "paulo.mendonca@domecanico.com", "salario": Decimal("6500.00"), "data_admissao": date(2015, 1, 5), "ativo": True, "observacoes": "Gerente geral da oficina. Sócio fundador."},
    {"nome": "Adriana Moura Leal", "cpf": "900.000.111-23", "cargo": "atendente", "telefone": "(11) 98009-9009", "email": "adriana.leal@domecanico.com", "salario": Decimal("2100.00"), "data_admissao": date(2021, 3, 8), "ativo": True},
    {"nome": "Gilson Tavares Barros", "cpf": "010.111.222-34", "cargo": "mecanico", "telefone": "(11) 98010-0010", "salario": Decimal("2800.00"), "data_admissao": date(2016, 8, 20), "ativo": False, "observacoes": "Saiu em jan/2024. Desligamento voluntário."},
]

funcionarios = []
for data in funcionarios_data:
    fn = Funcionario.objects.create(**data)
    funcionarios.append(fn)
print(f"  {len(funcionarios)} funcionários criados.")

# ─── PEÇAS ────────────────────────────────────────────────────────────────────
print("Criando peças e estoque...")

pecas_data = [
    # Filtros
    {"codigo": "FIL-001", "nome": "Filtro de Óleo Bosch", "marca": "Bosch", "unidade": "un", "quantidade": Decimal("45"), "quantidade_minima": Decimal("10"), "preco_custo": Decimal("18.50"), "preco_venda": Decimal("35.00"), "localizacao": "A1", "descricao": "Filtro de óleo universal para motores 1.0 a 2.0"},
    {"codigo": "FIL-002", "nome": "Filtro de Ar Mann Filter", "marca": "Mann Filter", "unidade": "un", "quantidade": Decimal("32"), "quantidade_minima": Decimal("8"), "preco_custo": Decimal("22.00"), "preco_venda": Decimal("42.00"), "localizacao": "A2"},
    {"codigo": "FIL-003", "nome": "Filtro de Combustível Tecfil", "marca": "Tecfil", "unidade": "un", "quantidade": Decimal("28"), "quantidade_minima": Decimal("8"), "preco_custo": Decimal("25.00"), "preco_venda": Decimal("48.00"), "localizacao": "A3"},
    {"codigo": "FIL-004", "nome": "Filtro de Ar Condicionado Mahle", "marca": "Mahle", "unidade": "un", "quantidade": Decimal("20"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("30.00"), "preco_venda": Decimal("58.00"), "localizacao": "A4"},
    {"codigo": "FIL-005", "nome": "Filtro de Ar Condicionado Carvão Ativado", "marca": "Mann Filter", "unidade": "un", "quantidade": Decimal("3"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("45.00"), "preco_venda": Decimal("85.00"), "localizacao": "A5", "descricao": "Com carvão ativado, elimina odores"},
    # Óleos
    {"codigo": "OLE-001", "nome": "Óleo Motor 5W30 Sintético Mobil 1L", "marca": "Mobil", "unidade": "L", "quantidade": Decimal("120"), "quantidade_minima": Decimal("30"), "preco_custo": Decimal("28.00"), "preco_venda": Decimal("52.00"), "localizacao": "B1"},
    {"codigo": "OLE-002", "nome": "Óleo Motor 10W40 Semissintético Castrol 1L", "marca": "Castrol", "unidade": "L", "quantidade": Decimal("85"), "quantidade_minima": Decimal("20"), "preco_custo": Decimal("22.00"), "preco_venda": Decimal("42.00"), "localizacao": "B2"},
    {"codigo": "OLE-003", "nome": "Óleo Motor 0W20 Sintético Toyota 1L", "marca": "Toyota", "unidade": "L", "quantidade": Decimal("30"), "quantidade_minima": Decimal("10"), "preco_custo": Decimal("38.00"), "preco_venda": Decimal("72.00"), "localizacao": "B3"},
    {"codigo": "OLE-004", "nome": "Óleo de Câmbio ATF Dexron VI 1L", "marca": "Valvoline", "unidade": "L", "quantidade": Decimal("24"), "quantidade_minima": Decimal("8"), "preco_custo": Decimal("32.00"), "preco_venda": Decimal("62.00"), "localizacao": "B4"},
    {"codigo": "OLE-005", "nome": "Fluido de Freio DOT4 500ml", "marca": "Bosch", "unidade": "un", "quantidade": Decimal("18"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("15.00"), "preco_venda": Decimal("29.00"), "localizacao": "B5"},
    {"codigo": "OLE-006", "nome": "Fluido de Direção Hidráulica 1L", "marca": "Wurth", "unidade": "L", "quantidade": Decimal("2"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("18.00"), "preco_venda": Decimal("35.00"), "localizacao": "B6", "descricao": "Estoque baixo! Repor urgente."},
    # Pastilhas e Freios
    {"codigo": "FRE-001", "nome": "Pastilha de Freio Dianteira Brembo", "marca": "Brembo", "unidade": "jogo", "quantidade": Decimal("22"), "quantidade_minima": Decimal("6"), "preco_custo": Decimal("65.00"), "preco_venda": Decimal("120.00"), "localizacao": "C1"},
    {"codigo": "FRE-002", "nome": "Pastilha de Freio Traseira Brembo", "marca": "Brembo", "unidade": "jogo", "quantidade": Decimal("18"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("55.00"), "preco_venda": Decimal("100.00"), "localizacao": "C2"},
    {"codigo": "FRE-003", "nome": "Disco de Freio Dianteiro Cofap", "marca": "Cofap", "unidade": "par", "quantidade": Decimal("12"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("120.00"), "preco_venda": Decimal("220.00"), "localizacao": "C3"},
    {"codigo": "FRE-004", "nome": "Disco de Freio Traseiro Cofap", "marca": "Cofap", "unidade": "par", "quantidade": Decimal("8"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("100.00"), "preco_venda": Decimal("185.00"), "localizacao": "C4"},
    {"codigo": "FRE-005", "nome": "Lona de Freio Traseiro (tambor) Fras-le", "marca": "Fras-le", "unidade": "jogo", "quantidade": Decimal("15"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("45.00"), "preco_venda": Decimal("88.00"), "localizacao": "C5"},
    {"codigo": "FRE-006", "nome": "Cilindro de Roda Traseiro ATE", "marca": "ATE", "unidade": "un", "quantidade": Decimal("2"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("38.00"), "preco_venda": Decimal("72.00"), "localizacao": "C6"},
    # Velas e Ignição
    {"codigo": "VEL-001", "nome": "Vela de Ignição NGK Iridium", "marca": "NGK", "unidade": "un", "quantidade": Decimal("60"), "quantidade_minima": Decimal("16"), "preco_custo": Decimal("28.00"), "preco_venda": Decimal("55.00"), "localizacao": "D1"},
    {"codigo": "VEL-002", "nome": "Vela de Ignição Bosch Platinum", "marca": "Bosch", "unidade": "un", "quantidade": Decimal("48"), "quantidade_minima": Decimal("16"), "preco_custo": Decimal("22.00"), "preco_venda": Decimal("42.00"), "localizacao": "D2"},
    {"codigo": "VEL-003", "nome": "Cabo de Vela NGK", "marca": "NGK", "unidade": "jogo", "quantidade": Decimal("10"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("75.00"), "preco_venda": Decimal("140.00"), "localizacao": "D3"},
    {"codigo": "VEL-004", "nome": "Bobina de Ignição Delphi", "marca": "Delphi", "unidade": "un", "quantidade": Decimal("3"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("120.00"), "preco_venda": Decimal("220.00"), "localizacao": "D4"},
    # Suspensão
    {"codigo": "SUS-001", "nome": "Amortecedor Dianteiro Monroe (par)", "marca": "Monroe", "unidade": "par", "quantidade": Decimal("8"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("280.00"), "preco_venda": Decimal("520.00"), "localizacao": "E1"},
    {"codigo": "SUS-002", "nome": "Amortecedor Traseiro Monroe (par)", "marca": "Monroe", "unidade": "par", "quantidade": Decimal("6"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("240.00"), "preco_venda": Decimal("450.00"), "localizacao": "E2"},
    {"codigo": "SUS-003", "nome": "Mola de Suspensão Dianteira Cofap (par)", "marca": "Cofap", "unidade": "par", "quantidade": Decimal("5"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("180.00"), "preco_venda": Decimal("340.00"), "localizacao": "E3"},
    {"codigo": "SUS-004", "nome": "Batente de Amortecedor Dianteiro", "marca": "Garra", "unidade": "par", "quantidade": Decimal("14"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("45.00"), "preco_venda": Decimal("85.00"), "localizacao": "E4"},
    {"codigo": "SUS-005", "nome": "Bandeja Dianteira Esquerda Nakata", "marca": "Nakata", "unidade": "un", "quantidade": Decimal("4"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("220.00"), "preco_venda": Decimal("410.00"), "localizacao": "E5"},
    {"codigo": "SUS-006", "nome": "Bandeja Dianteira Direita Nakata", "marca": "Nakata", "unidade": "un", "quantidade": Decimal("4"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("220.00"), "preco_venda": Decimal("410.00"), "localizacao": "E6"},
    {"codigo": "SUS-007", "nome": "Barra Estabilizadora Dianteira", "marca": "Cofap", "unidade": "un", "quantidade": Decimal("1"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("160.00"), "preco_venda": Decimal("300.00"), "localizacao": "E7"},
    # Correias
    {"codigo": "COR-001", "nome": "Correia Dentada Gates", "marca": "Gates", "unidade": "un", "quantidade": Decimal("18"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("85.00"), "preco_venda": Decimal("160.00"), "localizacao": "F1"},
    {"codigo": "COR-002", "nome": "Kit Correia Dentada + Tensor Gates", "marca": "Gates", "unidade": "kit", "quantidade": Decimal("12"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("145.00"), "preco_venda": Decimal("275.00"), "localizacao": "F2"},
    {"codigo": "COR-003", "nome": "Correia Poly-V (alternador) Gates", "marca": "Gates", "unidade": "un", "quantidade": Decimal("20"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("35.00"), "preco_venda": Decimal("68.00"), "localizacao": "F3"},
    # Arrefecimento
    {"codigo": "ARR-001", "nome": "Radiador Alumínio Universal Valeo", "marca": "Valeo", "unidade": "un", "quantidade": Decimal("5"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("380.00"), "preco_venda": Decimal("720.00"), "localizacao": "G1"},
    {"codigo": "ARR-002", "nome": "Mangueira Superior Radiador", "marca": "Lp", "unidade": "un", "quantidade": Decimal("12"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("28.00"), "preco_venda": Decimal("55.00"), "localizacao": "G2"},
    {"codigo": "ARR-003", "nome": "Mangueira Inferior Radiador", "marca": "Lp", "unidade": "un", "quantidade": Decimal("10"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("28.00"), "preco_venda": Decimal("55.00"), "localizacao": "G3"},
    {"codigo": "ARR-004", "nome": "Aditivo Radiador Concentrado 1L", "marca": "Armax", "unidade": "L", "quantidade": Decimal("35"), "quantidade_minima": Decimal("10"), "preco_custo": Decimal("18.00"), "preco_venda": Decimal("35.00"), "localizacao": "G4"},
    {"codigo": "ARR-005", "nome": "Bomba d'água Taranto", "marca": "Taranto", "unidade": "un", "quantidade": Decimal("3"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("145.00"), "preco_venda": Decimal("280.00"), "localizacao": "G5"},
    {"codigo": "ARR-006", "nome": "Termostato Wahler", "marca": "Wahler", "unidade": "un", "quantidade": Decimal("8"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("42.00"), "preco_venda": Decimal("82.00"), "localizacao": "G6"},
    # Embreagem
    {"codigo": "EMB-001", "nome": "Kit de Embreagem LuK (disco+platô+rolamento)", "marca": "LuK", "unidade": "kit", "quantidade": Decimal("6"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("420.00"), "preco_venda": Decimal("790.00"), "localizacao": "H1"},
    {"codigo": "EMB-002", "nome": "Disco de Embreagem Valeo", "marca": "Valeo", "unidade": "un", "quantidade": Decimal("4"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("180.00"), "preco_venda": Decimal("340.00"), "localizacao": "H2"},
    # Rolamentos e Juntas
    {"codigo": "ROL-001", "nome": "Rolamento de Roda Dianteiro SKF", "marca": "SKF", "unidade": "un", "quantidade": Decimal("10"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("95.00"), "preco_venda": Decimal("180.00"), "localizacao": "I1"},
    {"codigo": "ROL-002", "nome": "Rolamento de Roda Traseiro SKF", "marca": "SKF", "unidade": "un", "quantidade": Decimal("8"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("88.00"), "preco_venda": Decimal("168.00"), "localizacao": "I2"},
    {"codigo": "JUN-001", "nome": "Junta do Cabeçote Victor Reinz", "marca": "Victor Reinz", "unidade": "un", "quantidade": Decimal("5"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("180.00"), "preco_venda": Decimal("340.00"), "localizacao": "I3"},
    {"codigo": "JUN-002", "nome": "Junta de Escapamento", "marca": "Vipauto", "unidade": "un", "quantidade": Decimal("20"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("12.00"), "preco_venda": Decimal("25.00"), "localizacao": "I4"},
    # Elétrica
    {"codigo": "ELE-001", "nome": "Bateria 60Ah Moura", "marca": "Moura", "unidade": "un", "quantidade": Decimal("8"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("320.00"), "preco_venda": Decimal("590.00"), "localizacao": "J1"},
    {"codigo": "ELE-002", "nome": "Bateria 45Ah Heliar", "marca": "Heliar", "unidade": "un", "quantidade": Decimal("6"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("280.00"), "preco_venda": Decimal("520.00"), "localizacao": "J2"},
    {"codigo": "ELE-003", "nome": "Alternador Bosch Remanufaturado", "marca": "Bosch", "unidade": "un", "quantidade": Decimal("2"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("380.00"), "preco_venda": Decimal("720.00"), "localizacao": "J3"},
    {"codigo": "ELE-004", "nome": "Motor de Partida Bosch Remanufaturado", "marca": "Bosch", "unidade": "un", "quantidade": Decimal("1"), "quantidade_minima": Decimal("2"), "preco_custo": Decimal("420.00"), "preco_venda": Decimal("790.00"), "localizacao": "J4"},
    {"codigo": "ELE-005", "nome": "Sensor de Oxigênio (Sonda Lambda) Bosch", "marca": "Bosch", "unidade": "un", "quantidade": Decimal("7"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("185.00"), "preco_venda": Decimal("350.00"), "localizacao": "J5"},
    {"codigo": "ELE-006", "nome": "Sensor de Temperatura do Motor", "marca": "Delphi", "unidade": "un", "quantidade": Decimal("9"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("42.00"), "preco_venda": Decimal("82.00"), "localizacao": "J6"},
    {"codigo": "ELE-007", "nome": "Relé de Partida Universal", "marca": "Bosch", "unidade": "un", "quantidade": Decimal("15"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("18.00"), "preco_venda": Decimal("35.00"), "localizacao": "J7"},
    # Pneus
    {"codigo": "PNE-001", "nome": "Pneu 205/55 R16 Michelin", "marca": "Michelin", "unidade": "un", "quantidade": Decimal("12"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("380.00"), "preco_venda": Decimal("680.00"), "localizacao": "K1"},
    {"codigo": "PNE-002", "nome": "Pneu 195/65 R15 Bridgestone", "marca": "Bridgestone", "unidade": "un", "quantidade": Decimal("16"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("280.00"), "preco_venda": Decimal("520.00"), "localizacao": "K2"},
    {"codigo": "PNE-003", "nome": "Pneu 175/70 R13 Pirelli", "marca": "Pirelli", "unidade": "un", "quantidade": Decimal("8"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("180.00"), "preco_venda": Decimal("340.00"), "localizacao": "K3"},
    # Itens para moto
    {"codigo": "MOT-001", "nome": "Corrente de Transmissão Honda CB 428T", "marca": "DID", "unidade": "un", "quantidade": Decimal("10"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("85.00"), "preco_venda": Decimal("160.00"), "localizacao": "L1"},
    {"codigo": "MOT-002", "nome": "Kit Relação Honda CG/Titan (coroa+pinhão+corrente)", "marca": "Vaz", "unidade": "kit", "quantidade": Decimal("8"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("120.00"), "preco_venda": Decimal("225.00"), "localizacao": "L2"},
    {"codigo": "MOT-003", "nome": "Óleo Motor Moto 10W30 Honda 1L", "marca": "Honda", "unidade": "L", "quantidade": Decimal("40"), "quantidade_minima": Decimal("10"), "preco_custo": Decimal("20.00"), "preco_venda": Decimal("40.00"), "localizacao": "L3"},
    {"codigo": "MOT-004", "nome": "Pastilha de Freio Dianteira Moto EBC", "marca": "EBC", "unidade": "jogo", "quantidade": Decimal("14"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("38.00"), "preco_venda": Decimal("72.00"), "localizacao": "L4"},
    # Consumíveis
    {"codigo": "CON-001", "nome": "Graxa Automotiva Wurth 500g", "marca": "Wurth", "unidade": "un", "quantidade": Decimal("25"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("22.00"), "preco_venda": Decimal("42.00"), "localizacao": "M1"},
    {"codigo": "CON-002", "nome": "Spray Desengripante WD-40 300ml", "marca": "WD-40", "unidade": "un", "quantidade": Decimal("18"), "quantidade_minima": Decimal("5"), "preco_custo": Decimal("18.00"), "preco_venda": Decimal("35.00"), "localizacao": "M2"},
    {"codigo": "CON-003", "nome": "Selante de Junta Ultra Copper Loctite", "marca": "Loctite", "unidade": "un", "quantidade": Decimal("12"), "quantidade_minima": Decimal("4"), "preco_custo": Decimal("28.00"), "preco_venda": Decimal("55.00"), "localizacao": "M3"},
    {"codigo": "CON-004", "nome": "Disco de Lixa 7\" Bosch (kit 10un)", "marca": "Bosch", "unidade": "kit", "quantidade": Decimal("6"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("32.00"), "preco_venda": Decimal("62.00"), "localizacao": "M4"},
    {"codigo": "CON-005", "nome": "Arrebite Cego 4.8mm (caixa 100un)", "marca": "Tekbond", "unidade": "cx", "quantidade": Decimal("8"), "quantidade_minima": Decimal("3"), "preco_custo": Decimal("15.00"), "preco_venda": Decimal("29.00"), "localizacao": "M5"},
]

pecas = []
for data in pecas_data:
    p = Peca.objects.create(**data)
    pecas.append(p)
print(f"  {len(pecas)} peças criadas.")

# ─── MOVIMENTAÇÕES DE ESTOQUE ─────────────────────────────────────────────────
print("Criando movimentações de estoque...")

movs_count = 0
hoje = date.today()

entradas_iniciais = [
    (pecas[0], Decimal("80"), Decimal("18.50"), "Estoque inicial"),
    (pecas[1], Decimal("50"), Decimal("22.00"), "Estoque inicial"),
    (pecas[2], Decimal("45"), Decimal("25.00"), "Estoque inicial"),
    (pecas[5], Decimal("200"), Decimal("28.00"), "Estoque inicial"),
    (pecas[6], Decimal("150"), Decimal("22.00"), "Estoque inicial"),
    (pecas[11], Decimal("35"), Decimal("65.00"), "Estoque inicial"),
    (pecas[17], Decimal("100"), Decimal("28.00"), "Estoque inicial"),
    (pecas[21], Decimal("15"), Decimal("280.00"), "Estoque inicial"),
    (pecas[28], Decimal("30"), Decimal("85.00"), "Estoque inicial"),
    (pecas[43], Decimal("12"), Decimal("320.00"), "Estoque inicial"),
]

for peca, qtd, preco, motivo in entradas_iniciais:
    MovimentacaoEstoque.objects.create(
        peca=peca, tipo='entrada', quantidade=qtd,
        preco_unitario=preco, motivo=motivo
    )
    movs_count += 1

saidas_historico = [
    (pecas[0], Decimal("10"), Decimal("35.00"), "OS001 - Troca de óleo Corolla"),
    (pecas[0], Decimal("8"), Decimal("35.00"), "OS002 - Revisão HB20S"),
    (pecas[0], Decimal("6"), Decimal("35.00"), "OS003 - Troca de óleo Onix"),
    (pecas[1], Decimal("5"), Decimal("42.00"), "OS004 - Filtro de ar Kwid"),
    (pecas[1], Decimal("4"), Decimal("42.00"), "OS005 - Revisão Hilux"),
    (pecas[5], Decimal("20"), Decimal("52.00"), "OS001 - Troca de óleo Corolla"),
    (pecas[5], Decimal("16"), Decimal("52.00"), "OS002 - Revisão HB20S"),
    (pecas[5], Decimal("12"), Decimal("52.00"), "OS003 - Troca de óleo Onix"),
    (pecas[6], Decimal("15"), Decimal("42.00"), "OS004 - Troca óleo Ka"),
    (pecas[11], Decimal("4"), Decimal("120.00"), "OS006 - Freios BMW"),
    (pecas[11], Decimal("3"), Decimal("120.00"), "OS007 - Pastilhas Tracker"),
    (pecas[17], Decimal("12"), Decimal("55.00"), "OS008 - Velas Corolla"),
    (pecas[17], Decimal("8"), Decimal("55.00"), "OS009 - Velas Amarok"),
    (pecas[21], Decimal("2"), Decimal("520.00"), "OS010 - Amortecedor HB20S"),
    (pecas[28], Decimal("4"), Decimal("160.00"), "OS011 - Correia Renegade"),
    (pecas[28], Decimal("3"), Decimal("160.00"), "OS012 - Correia Ka"),
    (pecas[43], Decimal("1"), Decimal("590.00"), "OS013 - Bateria Golf"),
    (pecas[43], Decimal("1"), Decimal("590.00"), "OS014 - Bateria Pulse"),
]

for peca, qtd, preco, motivo in saidas_historico:
    MovimentacaoEstoque.objects.create(
        peca=peca, tipo='saida', quantidade=qtd,
        preco_unitario=preco, motivo=motivo
    )
    movs_count += 1

entradas_recentes = [
    (pecas[0], Decimal("30"), Decimal("18.50"), "Compra Fornecedor Auto Sul - NF 4521"),
    (pecas[1], Decimal("20"), Decimal("22.00"), "Compra Fornecedor Auto Sul - NF 4521"),
    (pecas[5], Decimal("60"), Decimal("27.50"), "Compra Distribuidora Castrol - NF 8832"),
    (pecas[6], Decimal("40"), Decimal("21.50"), "Compra Distribuidora Castrol - NF 8832"),
    (pecas[11], Decimal("15"), Decimal("64.00"), "Compra Fornecedor Brembo - NF 2210"),
    (pecas[12], Decimal("12"), Decimal("54.00"), "Compra Fornecedor Brembo - NF 2210"),
    (pecas[17], Decimal("24"), Decimal("27.50"), "Compra NGK Distribuidora - NF 9901"),
    (pecas[21], Decimal("4"), Decimal("278.00"), "Compra Monroe - NF 5543"),
    (pecas[28], Decimal("10"), Decimal("84.00"), "Compra Gates - NF 7712"),
    (pecas[43], Decimal("4"), Decimal("318.00"), "Compra Moura - NF 3341"),
    (pecas[51], Decimal("20"), Decimal("20.00"), "Compra Honda Peças - NF 1122"),
    (pecas[54], Decimal("15"), Decimal("21.80"), "Compra Wurth - NF 6654"),
]

for peca, qtd, preco, motivo in entradas_recentes:
    MovimentacaoEstoque.objects.create(
        peca=peca, tipo='entrada', quantidade=qtd,
        preco_unitario=preco, motivo=motivo
    )
    movs_count += 1

MovimentacaoEstoque.objects.create(
    peca=pecas[4], tipo='ajuste', quantidade=Decimal("3"),
    preco_unitario=Decimal("45.00"), motivo="Ajuste de inventário - contagem física jan/2025"
)
MovimentacaoEstoque.objects.create(
    peca=pecas[46], tipo='ajuste', quantidade=Decimal("2"),
    preco_unitario=Decimal("420.00"), motivo="Ajuste de inventário - peça danificada descartada"
)
movs_count += 2

print(f"  {movs_count} movimentações criadas.")

print()
print("=" * 50)
print("BANCO POPULADO COM SUCESSO!")
print("=" * 50)
print(f"  Clientes:       {Cliente.objects.count()}")
print(f"  Veículos:       {Veiculo.objects.count()}")
print(f"  Funcionários:   {Funcionario.objects.count()}")
print(f"  Peças:          {Peca.objects.count()}")
print(f"  Movimentações:  {MovimentacaoEstoque.objects.count()}")
print(f"  Peças c/ estoque baixo: {sum(1 for p in Peca.objects.all() if p.estoque_baixo)}")
