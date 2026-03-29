import json
import re
import os

def clean_js_object_string(js_string):
    """
    Tenta limpar uma string de objeto literal JavaScript para JSON válido.
    Lida com crases, aspas simples para strings e garante que as chaves sejam citadas.
    """
    print("Iniciando a limpeza da string JS...")
    try:
        # 1. Extrair o objeto principal.
        match = re.search(r"export const getDefaultRules = \(\) => \((.*)\);", js_string, re.DOTALL | re.MULTILINE)
        if not match:
            raise ValueError("Não foi possível encontrar a estrutura 'export const getDefaultRules = () => (...);' no arquivo JS.")
        
        obj_string = match.group(1).strip()

        if obj_string.startswith('(') and obj_string.endswith(')'):
            obj_string = obj_string[1:-1].strip()
        print("Objeto JS extraído.")

        # --- NOVO PASSO: Remover comentários JS ---
        # Remover comentários de linha (// ...)
        obj_string = re.sub(r'//.*', '', obj_string)
        # Remover comentários de bloco (/* ... */)
        obj_string = re.sub(r'/\*[\s\S]*?\*/', '', obj_string, flags=re.MULTILINE)
        print("Comentários JS (// e /* */) removidos.")
        # --- FIM DO NOVO PASSO ---

        # 2. --- Citar todas as chaves não citadas (EXECUTAR PRIMEIRO) ---
        # Ex: id: 101 -> "id": 101
        # Ex: response: `...` -> "response": `...`
        # Isso evita que regexes de limpeza afetem o conteúdo das 'responses'.
        obj_string = re.sub(r'([A-Za-z0-9_]+)\s*:', r'"\1":', obj_string)
        print("Chaves não citadas (ex: 'id:') convertidas para chaves JSON (ex: '\"id\":').")

        # 3. --- Lidar com aspas simples para VALORES de string (Mais seguro) ---
        # Converte : 'string' -> : "string"
        # Converte [ 'string' -> [ "string"
        # Converte , 'string' -> , "string"
        # Isso evita a correspondência de apóstrofos (ex: "don't", "cells'")
        # É preciso iterar caso haja múltiplas strings em um array
        print("Convertendo valores em aspas simples (ex: ': ''AND''') para aspas duplas...")
        for _ in range(10): # Limite de segurança para evitar loop infinito
            count_before = obj_string.count("'")
            # Regex: Procura por ' precedido por :, [ ou , (com espaço opcional)
            obj_string = re.sub(r"([:\[,]\s*)'([^']*)'", r'\1"\2"', obj_string)
            count_after = obj_string.count("'")
            if count_before == count_after:
                break # Sem mais alterações
        print("Conversão de valores em aspas simples concluída.")


        # 4. --- Lidar com Crases (Backticks) para "response" ---
        def replace_backticks(match_obj):
            key = match_obj.group(1) # Já deve ser "response" da Etapa 2
            content = match_obj.group(2)
            # 1. Escapar barras invertidas e aspas duplas
            content = content.replace('\\', '\\\\').replace('"', '\\"')
            # 2. Substituir novas linhas literais por \n escapado
            content = content.replace('\n', '\\n').replace('\r', '') # Remove retornos de carro
            # 3. Retornar a chave e o valor formatados
            return f'{key}: "{content}"'

        # Usa regex para encontrar "response": (da Etapa 2) seguido por crases
        # A chave (grupo 1) já deve estar citada
        obj_string = re.sub(r'("response"\s*:\s*)`([\s\S]*?)`', replace_backticks, obj_string)
        print("Crases (backticks) convertidas para strings JSON.")

        # 5. --- Remover vírgulas finais (trailing commas) ---
        obj_string = re.sub(r',\s*([}\]])', r'\1', obj_string, flags=re.MULTILINE)
        print("Vírgulas finais (trailing commas) removidas.")

        # 6. --- Tentar analisar como JSON ---
        print("Tentando analisar a string limpa como JSON...")
        rules_dict = json.loads(obj_string)
        print("Análise JSON bem-sucedida.")
        return rules_dict

    except json.JSONDecodeError as json_e:
        print(f"FATAL: Não foi possível analisar a string JS limpa como JSON.")
        print(f"Erro: {json_e}")
        
        debug_filename = "debug_problematic_json.txt"
        with open(debug_filename, "w", encoding="utf-8") as f_debug:
            f_debug.write(obj_string)
        print(f"String problemática salva em '{debug_filename}'")
        raise 
    
    except Exception as e:
        print(f"Um erro inesperado ocorreu durante a limpeza: {e}")
        raise

def escape_sql_string(value):
    """Escapa uma string para uso em uma consulta SQL."""
    if value is None:
        return "NULL"
    # Substitui barra invertida por duas barras invertidas
    # Substitui aspa simples por duas aspas simples
    escaped_value = str(value).replace('\\', '\\\\').replace("'", "''")
    return f"'{escaped_value}'"

def format_sql_value(value):
    """Formata um valor Python em um literal SQL."""
    if value is None:
        return "NULL"
    elif isinstance(value, bool):
        return str(int(value)) # Converte True/False para 1/0
    elif isinstance(value, (int, float)):
        return str(value)
    elif isinstance(value, (dict, list)):
        # Converte dict/list para string JSON, depois escapa essa string para SQL
        json_string = json.dumps(value, ensure_ascii=False, separators=(',', ':')) # JSON compacto
        return escape_sql_string(json_string)
    else: # Assume string
        return escape_sql_string(str(value))


# --- Script Principal ---
input_js_file = 'defaultRules.js'
output_sql_file = 'seedsrules.sql'

try:
    print(f"Lendo regras JavaScript de: {input_js_file}")
    if not os.path.exists(input_js_file):
         raise FileNotFoundError(f"Arquivo de entrada '{input_js_file}' não encontrado.")
         
    with open(input_js_file, 'r', encoding='utf-8') as f:
        js_content = f.read()

    rules_data = clean_js_object_string(js_content)

    sql_statements = []
    sql_header = """-- SQL script para semear a tabela 'rules' com dados iniciais de defaultRules.js
-- Gerado por script Python.

INSERT INTO `rules` (`category`, `conditions_json`, `logic`, `response`, `key_nutrient_json`, `is_active`) VALUES
"""
    sql_statements.append(sql_header)

    value_tuples = []

    print("Gerando declarações SQL INSERT...")
    for category, rules in rules_data.items():
        if not isinstance(rules, list):
            print(f"Aviso: Esperava uma lista de regras para a categoria '{category}', mas obteve {type(rules)}. Pulando.")
            continue
            
        for rule in rules:
            try:
                # Garante que todas as chaves esperadas estejam presentes, fornecendo padrões se necessário
                conditions = rule.get('conditions', [])
                logic = rule.get('logic', 'AND') # Lógica padrão se ausente
                response = rule.get('response', '') # Resposta vazia padrão
                key_nutrient = rule.get('keyNutrient') # Pode ser None/null
                is_active = 1 # Assume que todas as regras padrão estão ativas

                # Formata valores para SQL
                category_sql = format_sql_value(category)
                conditions_json_sql = format_sql_value(conditions)
                logic_sql = format_sql_value(logic)
                response_sql = format_sql_value(response.strip()) # Remove espaços em branco
                key_nutrient_json_sql = format_sql_value(key_nutrient)
                is_active_sql = format_sql_value(is_active)

                value_tuples.append(
                    f"({category_sql}, {conditions_json_sql}, {logic_sql}, {response_sql}, {key_nutrient_json_sql}, {is_active_sql})"
                )
            except Exception as e:
                print(f"Erro ao processar regra: {rule.get('id', 'ID DESCONHECIDO')} na categoria '{category}'")
                print(f"Erro: {e}")
                # Opcionalmente, pule esta regra ou levante o erro
                # raise e # Descomente para parar no primeiro erro

    # Junta todas as tuplas de valor com vírgulas e adiciona o ponto e vírgula final
    sql_statements.append(",\n".join(value_tuples) + ";\n")

    print(f"Escrevendo declarações SQL para: {output_sql_file}")
    with open(output_sql_file, 'w', encoding='utf-8') as f:
        f.writelines(sql_statements)

    print("Conversão completa.")
    print(f"Geradas {len(value_tuples)} tuplas de valores INSERT.")

except FileNotFoundError as e:
    print(f"Erro: {e}")
except ValueError as e:
    print(f"Erro durante a análise: {e}")
except Exception as e:
    print(f"Um erro inesperado ocorreu: {e}")

