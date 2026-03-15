import os
import re

def fix_missing_a_tags(directory):
    # Extensões que serão verificadas
    valid_extensions = ('.jsx', '.js', '.tsx', '.html')
    
    # Explicação da Regex:
    # (?<!<a)    -> Lookbehind negativo: garante que não existe "<a" antes
    # (\s+)      -> Captura o espaço em branco/indentação original (Grupo 1)
    # (href=)    -> Captura o atributo alvo (Grupo 2)
    pattern = re.compile(r'(?<!<a)(\s+)(href=)')
    
    files_fixed = 0

    print(f"A iniciar varredura em: {directory}")

    for root, dirs, files in os.walk(directory):
        # Pular a pasta node_modules para performance e segurança
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
            
        for file in files:
            if file.endswith(valid_extensions):
                filepath = os.path.join(root, file)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Substitui mantendo a indentação (\1) e inserindo o <a antes do href (\2)
                    new_content = pattern.sub(r'\1<a \2', content)

                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"[CORRIGIDO] {filepath}")
                        files_fixed += 1
                except Exception as e:
                    print(f"[ERRO] Falha ao processar {filepath}: {e}")

    print(f"\nConcluído! Total de ficheiros alterados: {files_fixed}")

if __name__ == "__main__":
    # Obtém o diretório atual onde o script está sendo executado
    current_dir = os.getcwd()
    
    # Recomendação: Sempre faça um backup do código antes de rodar scripts de replace em massa
    confirm = input(f"Deseja executar a correção em {current_dir} e seus subdiretórios? (s/n): ")
    if confirm.lower() == 's':
        fix_missing_a_tags(current_dir)
    else:
        print("Operação cancelada.")