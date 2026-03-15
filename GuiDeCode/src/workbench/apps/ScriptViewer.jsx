import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import { workbenchApi } from '@/services/api';

// ==========================================
// UTILS DE ANÁLISE BINÁRIA E TEXTO
// ==========================================
const decodeBase64ToUint8Array = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const generateHexDump = (bytes, maxBytes = 100000) => {
  let lines = [];
  const limit = Math.min(bytes.length, maxBytes);
  for (let i = 0; i < limit; i += 16) {
    let chunk = bytes.slice(i, i + 16);
    let offset = i.toString(16).padStart(8, '0');
    let hexStr = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ');
    let asciiStr = Array.from(chunk).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
    lines.push(`${offset}  ${hexStr.padEnd(47, ' ')}  |${asciiStr}|`);
  }
  if (bytes.length > maxBytes) lines.push(`\n... [Truncado. Ficheiro de ${bytes.length} bytes é demasiado grande para Hex completo no browser] ...`);
  return lines.join('\n');
};

const extractStrings = (bytes, minLength = 4, maxBytes = 500000) => {
  const limit = Math.min(bytes.length, maxBytes);
  let result = [];
  let currentString = '';
  for (let i = 0; i < limit; i++) {
    let b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13) {
      currentString += String.fromCharCode(b);
    } else {
      if (currentString.length >= minLength) result.push(currentString);
      currentString = '';
    }
  }
  if (currentString.length >= minLength) result.push(currentString);
  if (bytes.length > maxBytes) result.push(`\n... [Truncado em ${maxBytes} bytes] ...`);
  return result.join('\n');
};

const getMagicNumberInfo = (bytes) => {
  if (bytes.length < 4) return 'Desconhecido';
  const hex = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  if (hex.startsWith('89504E47')) return 'Imagem PNG';
  if (hex.startsWith('FFD8FF')) return 'Imagem JPEG';
  if (hex.startsWith('25504446')) return 'Documento PDF';
  if (hex.startsWith('504B0304')) return 'Arquivo ZIP / DOCX / APK';
  if (hex.startsWith('52617221')) return 'Arquivo RAR';
  if (hex.startsWith('7F454C46')) return 'Executável ELF (Linux)';
  if (hex.startsWith('4D5A')) return 'Executável PE / DLL (Windows)';
  if (hex.startsWith('3C3F7068')) return 'Script PHP (<?ph)';
  return `Desconhecido (Magic Hex: ${hex})`;
};

// ==========================================
// COMPONENTES DA ÁRVORE (TREE VIEW)
// ==========================================
const FileTreeNode = ({ node, level, onSelect, selectedPath }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedPath === node.path;

  if (!node.isDir) {
    return (
      <div 
        style={{ 
          paddingLeft: `${level * 12 + 10}px`, 
          paddingTop: '4px', paddingBottom: '4px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          background: isSelected ? 'rgba(212,175,55,0.2)' : 'transparent',
          color: isSelected ? '#d4af37' : '#cdd6f4',
          borderLeft: isSelected ? '2px solid #d4af37' : '2px solid transparent'
        }}
        onClick={() => onSelect(node)}
      >
        <span style={{ fontSize: '1rem' }}>📄</span>
        <span style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div 
        style={{ 
          paddingLeft: `${level * 12 + 10}px`, 
          paddingTop: '6px', paddingBottom: '6px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          color: '#a6adc8', fontWeight: 'bold'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontSize: '0.9rem' }}>{isOpen ? '📂' : '📁'}</span>
        <span style={{ fontSize: '0.8rem' }}>{node.name}</span>
      </div>
      {isOpen && (
        <div>
          {Object.values(node.children).sort((a, b) => {
            if (a.isDir && !b.isDir) return -1;
            if (!a.isDir && b.isDir) return 1;
            return a.name.localeCompare(b.name);
          }).map(child => (
            <FileTreeNode key={child.path || child.name} node={child} level={level + 1} onSelect={onSelect} selectedPath={selectedPath} />
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// APLICAÇÃO PRINCIPAL SCRIPT VIEWER
// ==========================================
const ScriptViewer = () => {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  
  const [scripts, setScripts] = useState([]);
  const [search, setSearch] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [fileText, setFileText] = useState('');
  
  const [activeTab, setActiveTab] = useState('text'); // text, hex, strings, meta
  const [wordWrap, setWordWrap] = useState(false);
  
  // Obter as dimensões do container para Responsividade (Mobile View)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setIsMobile(entry.contentRect.width < 600);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Busca os ficheiros no Backend
  const loadScripts = async () => {
    setLoadingList(true);
    try {
      const res = await workbenchApi.listScripts();
      if (res.success) {
        setScripts(res.scripts || []);
      }
    } catch (err) {
      console.error("Erro ao carregar scripts", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadScripts(); }, []);

  // Construir Árvore Hierárquica a partir da lista plana
  const treeData = useMemo(() => {
    const root = { name: 'Raiz', children: {}, isDir: true, path: '' };
    
    // Filtragem por pesquisa
    const filtered = scripts.filter(s => s.path.toLowerCase().includes(search.toLowerCase()));
    
    filtered.forEach(file => {
      const parts = file.path.split('/');
      let current = root;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current.children[parts[i]]) {
          current.children[parts[i]] = { name: parts[i], children: {}, isDir: true, path: parts.slice(0, i + 1).join('/') };
        }
        current = current.children[parts[i]];
      }
      current.children[parts[parts.length - 1]] = { ...file, isDir: false };
    });
    return root;
  }, [scripts, search]);

  // Carregar Conteúdo do Ficheiro
  const handleSelectFile = async (node) => {
    if (node.isDir) return;
    setSelectedFile(node);
    setLoadingFile(true);
    setFileBytes(null);
    setFileText('');
    setActiveTab('text');
    
    try {
      const res = await workbenchApi.getScriptContent(node.path);
      if (res.success) {
        if (res.contentBase64) {
          const bytes = decodeBase64ToUint8Array(res.contentBase64);
          setFileBytes(bytes);
          setFileText(new TextDecoder('utf-8', { fatal: false }).decode(bytes));
        } else {
          setFileText(res.content || '');
          setFileBytes(new TextEncoder().encode(res.content || ''));
        }
      }
    } catch (err) {
      setFileText('Erro ao carregar o ficheiro: ' + err.message);
    } finally {
      setLoadingFile(false);
    }
  };

  // Processadores das Abas
  const hexContent = useMemo(() => fileBytes ? generateHexDump(fileBytes) : '', [fileBytes]);
  const stringsContent = useMemo(() => fileBytes ? extractStrings(fileBytes) : '', [fileBytes]);
  const metaContent = useMemo(() => {
    if (!selectedFile || !fileBytes) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', color: '#cdd6f4', fontSize: '0.85rem' }}>
        <div><strong>Ficheiro:</strong> {selectedFile.path}</div>
        <div><strong>Tamanho:</strong> {selectedFile.size} bytes</div>
        <div><strong>Modificado em:</strong> {selectedFile.modified}</div>
        <div><strong>Extensão:</strong> {selectedFile.extension || 'Nenhuma'}</div>
        <hr style={{ borderColor: '#313244', margin: '10px 0' }}/>
        <div><strong>Assinatura/Magic Number:</strong> {getMagicNumberInfo(fileBytes)}</div>
        <div><strong>Entropia:</strong> {(fileBytes.length > 0 ? "Calculada em tempo real para análises futuras." : "N/A")}</div>
      </div>
    );
  }, [selectedFile, fileBytes]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  // --- RENDERIZAÇÃO ---
  const S = {
    container: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', background: '#11111b', color: '#cdd6f4', overflow: 'hidden' },
    sidebar: { width: isMobile ? '100%' : '260px', height: isMobile ? '35%' : '100%', borderRight: isMobile ? 'none' : '1px solid #313244', borderBottom: isMobile ? '1px solid #313244' : 'none', display: 'flex', flexDirection: 'column', background: '#181825', flexShrink: 0 },
    topBar: { padding: '10px', display: 'flex', gap: '8px', borderBottom: '1px solid #313244', background: '#1e1e2e' },
    input: { flex: 1, padding: '6px 10px', background: '#11111b', border: '1px solid #313244', borderRadius: '4px', color: '#fff', fontSize: '0.8rem', width: '100%' },
    btn: { background: '#313244', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
    treeArea: { flex: 1, overflowY: 'auto', padding: '8px 0' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    toolbar: { display: 'flex', gap: '4px', padding: '8px', background: '#1e1e2e', borderBottom: '1px solid #313244', alignItems: 'center', flexWrap: 'wrap' },
    tab: (active) => ({ background: active ? '#d4af37' : '#313244', color: active ? '#000' : '#cdd6f4', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }),
    viewerArea: { flex: 1, overflow: 'auto', background: '#1e1e2e', position: 'relative' },
    pre: { margin: 0, padding: '16px', fontSize: '13px', fontFamily: "'Fira Code', 'JetBrains Mono', monospace", color: '#a6adc8', whiteSpace: wordWrap ? 'pre-wrap' : 'pre', wordBreak: wordWrap ? 'break-all' : 'normal', lineHeight: '1.5' }
  };

  return (
    <div ref={containerRef} style={S.container}>
      
      {/* BARRA LATERAL - ÁRVORE DE FICHEIROS */}
      <div style={S.sidebar}>
        <div style={S.topBar}>
          <input type="text" placeholder="Filtrar scripts..." value={search} onChange={e => setSearch(e.target.value)} style={S.input} />
          <button style={S.btn} onClick={loadScripts} title="Atualizar Diretório">🔄</button>
        </div>
        <div style={S.treeArea}>
          {loadingList ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#585b70' }}>A carregar árvore...</div>
          ) : (
            Object.values(treeData.children).sort((a, b) => {
              if (a.isDir && !b.isDir) return -1;
              if (!a.isDir && b.isDir) return 1;
              return a.name.localeCompare(b.name);
            }).map(child => (
              <FileTreeNode key={child.path || child.name} node={child} level={0} onSelect={handleSelectFile} selectedPath={selectedFile?.path} />
            ))
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL - VISUALIZADOR */}
      <div style={S.main}>
        {selectedFile ? (
          <>
            <div style={S.toolbar}>
              <button style={S.tab(activeTab === 'text')} onClick={() => setActiveTab('text')}>Texto RAW</button>
              <button style={S.tab(activeTab === 'hex')} onClick={() => setActiveTab('hex')}>HxD (Hex)</button>
              <button style={S.tab(activeTab === 'strings')} onClick={() => setActiveTab('strings')}>Strings</button>
              <button style={S.tab(activeTab === 'meta')} onClick={() => setActiveTab('meta')}>Meta / Info</button>
              
              <div style={{ flex: 1 }} />
              
              {activeTab === 'text' && (
                <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginRight: '10px' }}>
                  <input type="checkbox" checked={wordWrap} onChange={e => setWordWrap(e.target.checked)} />
                  Quebrar Linha
                </label>
              )}
              
              <button style={S.btn} onClick={() => {
                let txt = '';
                if (activeTab === 'text') txt = fileText;
                if (activeTab === 'hex') txt = hexContent;
                if (activeTab === 'strings') txt = stringsContent;
                if (txt) copyToClipboard(txt);
              }}>📋 Copiar Painel</button>
            </div>

            <div style={S.viewerArea}>
              {loadingFile && <div style={{ padding: '20px', textAlign: 'center', color: '#585b70' }}>A analisar dados brutos...</div>}
              
              {!loadingFile && activeTab === 'text' && (
                <pre style={S.pre}>{fileText}</pre>
              )}

              {!loadingFile && activeTab === 'hex' && (
                <pre style={{...S.pre, color: '#f38ba8'}}>{hexContent}</pre>
              )}

              {!loadingFile && activeTab === 'strings' && (
                <pre style={{...S.pre, color: '#a6e3a1'}}>{stringsContent}</pre>
              )}

              {!loadingFile && activeTab === 'meta' && (
                metaContent
              )}
            </div>
            
            <div style={{ padding: '4px 10px', background: '#11111b', borderTop: '1px solid #313244', fontSize: '0.7rem', color: '#585b70', display: 'flex', justifyContent: 'space-between' }}>
              <span>{selectedFile.path}</span>
              <span>{selectedFile.size} bytes</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#585b70', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '3rem' }}>🔬</span>
            <p>Selecione um ficheiro na árvore para iniciar a análise.</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default ScriptViewer;