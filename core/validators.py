"""Validação de CPF/CNPJ (dígitos verificadores) — fonte única do sistema.

Usado no cadastro de oficina (CNPJ), no cadastro de cliente (CPF ou CNPJ) e
no gateway de pagamento (que rejeita documento inválido no PagBank)."""
import re


def so_digitos(valor: str) -> str:
    return re.sub(r'\D', '', valor or '')


def valida_cpf(cpf: str) -> bool:
    cpf = so_digitos(cpf)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    for tam in (9, 10):
        soma = sum(int(cpf[i]) * ((tam + 1) - i) for i in range(tam))
        dig = (soma * 10) % 11
        dig = 0 if dig == 10 else dig
        if dig != int(cpf[tam]):
            return False
    return True


def valida_cnpj(cnpj: str) -> bool:
    cnpj = so_digitos(cnpj)
    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        return False
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for pesos, pos in ((pesos1, 12), (pesos2, 13)):
        soma = sum(int(cnpj[i]) * pesos[i] for i in range(pos))
        resto = soma % 11
        dig = 0 if resto < 2 else 11 - resto
        if dig != int(cnpj[pos]):
            return False
    return True


def valida_cpf_cnpj(numero: str) -> bool:
    """True se for CPF (11) ou CNPJ (14) com dígitos verificadores válidos."""
    num = so_digitos(numero)
    if len(num) == 11:
        return valida_cpf(num)
    if len(num) == 14:
        return valida_cnpj(num)
    return False
