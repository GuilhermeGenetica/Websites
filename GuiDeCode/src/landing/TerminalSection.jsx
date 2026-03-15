import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal as TerminalIcon, RefreshCw, Minimize2, Maximize2 } from 'lucide-react'

const TerminalSection = ({ t, language }) => {
  const terminalRef = useRef(null)
  const xtermInstance = useRef(null)
  const fitAddon = useRef(null)
  const inputBuffer = useRef('')
  const commandHistory = useRef([])
  const historyIndex = useRef(-1)
  const isRunning = useRef(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const writePrompt = useCallback(() => {
    if (xtermInstance.current && !isRunning.current) {
      xtermInstance.current.write('\r\n\x1b[32mgenomics@workbench\x1b[0m:\x1b[34m~\x1b[0m$ ')
    }
  }, [])

  const processCommand = useCallback(async (cmd) => {
    const term = xtermInstance.current
    if (!cmd) { writePrompt(); return }
    isRunning.current = true
    commandHistory.current.push(cmd)
    const args = cmd.toLowerCase().split(' ')
    const cleanCmd = args[0]

    switch (cleanCmd) {
      case 'clear':
        term.clear()
        break
      case 'help':
        term.write('\r\n\x1b[33m══════════════════════════════════════\x1b[0m\r\n')
        term.write('\x1b[36m  Available Commands:\x1b[0m\r\n')
        term.write('\x1b[33m══════════════════════════════════════\x1b[0m\r\n')
        term.write('  \x1b[32mhelp\x1b[0m       - Show this help menu\r\n')
        term.write('  \x1b[32mclear\x1b[0m      - Clear terminal\r\n')
        term.write('  \x1b[32mdate\x1b[0m       - Show current date/time\r\n')
        term.write('  \x1b[32mip\x1b[0m         - Show your IP address\r\n')
        term.write('  \x1b[32mabout\x1b[0m      - About this system\r\n')
        term.write('  \x1b[32mskills\x1b[0m     - Professional skills\r\n')
        term.write('  \x1b[32mcontact\x1b[0m    - Contact information\r\n')
        term.write('  \x1b[32mpublications\x1b[0m - Research publications\r\n')
        term.write('  \x1b[32mquote\x1b[0m      - Random medical quote\r\n')
        term.write('  \x1b[32mreboot\x1b[0m     - Reboot terminal\r\n')
        term.write('\x1b[33m══════════════════════════════════════\x1b[0m\r\n')
        break
      case 'date':
        term.write(`\r\nSystem Time: ${new Date().toLocaleString()}\r\n`)
        break
      case 'ip':
      case 'ipconfig':
        term.write('\r\n\x1b[34m[NETWORK] Querying external node...\x1b[0m\r\n')
        try {
          const res = await fetch('https://ipapi.co/json/')
          const data = await res.json()
          term.write(`> IPv4: \x1b[32m${data.ip}\x1b[0m\r\n`)
          term.write(`> Org: ${data.org}\r\n`)
          term.write(`> Location: ${data.city}, ${data.country_name}\r\n`)
        } catch {
          term.write('\x1b[31m[ERROR] Network request failed.\x1b[0m\r\n')
        }
        break
      case 'about':
        term.write('\r\n\x1b[36m╔══════════════════════════════════════════╗\x1b[0m\r\n')
        term.write('\x1b[36m║\x1b[0m  \x1b[1mDr. Guilherme de Macedo Oliveira\x1b[0m       \x1b[36m║\x1b[0m\r\n')
        term.write('\x1b[36m║\x1b[0m  Clinical Geneticist | Researcher        \x1b[36m║\x1b[0m\r\n')
        term.write('\x1b[36m║\x1b[0m  MD (FMP) | MSc (Fiocruz) | MG (IFF)     \x1b[36m║\x1b[0m\r\n')
        term.write('\x1b[36m╚══════════════════════════════════════════╝\x1b[0m\r\n')
        break
      case 'skills':
        term.write('\r\n\x1b[33m[SKILLS]\x1b[0m\r\n')
        term.write('  ● Medical Genetics & Dysmorphology\r\n')
        term.write('  ● NGS Analysis (WES/WGS)\r\n')
        term.write('  ● Pharmacogenomics\r\n')
        term.write('  ● Quantum Computing in Medicine\r\n')
        term.write('  ● Machine Learning for Genomics\r\n')
        term.write('  ● Precision Oncology\r\n')
        term.write('  ● Catholic Medical Ethics\r\n')
        break
      case 'contact':
        term.write('\r\n\x1b[33m[CONTACT]\x1b[0m\r\n')
        term.write('  Email: guilherme.genetica@gmail.com\r\n')
        term.write('  Web:   https://guilherme.onnetweb.com\r\n')
        term.write('  Lattes: http://lattes.cnpq.br/5775056717193759\r\n')
        break
      case 'publications':
        term.write('\r\n\x1b[33m[PUBLICATIONS]\x1b[0m\r\n')
        term.write('  📖 Quantum Precision Medicine in Clinical Practice\r\n')
        term.write('     Volume I: Theoretical Foundations\r\n')
        term.write('     Volume II: Clinical Protocols & Applications\r\n')
        term.write('     Available on Amazon\r\n')
        break
      case 'quote':
        const quotes = [
          '"The good physician treats the disease; the great physician treats the patient." — William Osler',
          '"Genetics is about how information is stored and transmitted between generations." — John Maynard Smith',
          '"The art of medicine consists of amusing the patient while nature cures the disease." — Voltaire',
          '"In the middle of difficulty lies opportunity." — Albert Einstein',
          '"Science is the father of knowledge, but opinion breeds ignorance." — Hippocrates',
        ]
        term.write(`\r\n\x1b[35m${quotes[Math.floor(Math.random() * quotes.length)]}\x1b[0m\r\n`)
        break
      case 'reboot':
      case 'reset':
        isRunning.current = false
        runBoot()
        return
      default:
        term.write(`\r\n\x1b[31mCommand not found: ${cleanCmd}\x1b[0m\r\n`)
        term.write("Type \x1b[36m'help'\x1b[0m for available commands.\r\n")
        break
    }
    isRunning.current = false
    writePrompt()
  }, [writePrompt])

  const runBoot = useCallback(() => {
    const term = xtermInstance.current
    if (!term) return
    isRunning.current = true
    term.clear()
    term.write('\x1b[2J\x1b[H')
    const bootLines = [
      '\x1b[32m[OK]\x1b[0m Initializing Precision-Genomics-Shell v4.2...',
      '\x1b[32m[OK]\x1b[0m Loading genomic reference databases...',
      '\x1b[32m[OK]\x1b[0m ClinVar, gnomAD, OMIM modules loaded.',
      '\x1b[32m[OK]\x1b[0m Quantum causality engine initialized.',
      '\x1b[32m[OK]\x1b[0m Pharmacogenomic CYP450 profiles ready.',
      '\x1b[32m[OK]\x1b[0m Secure session established.',
      '',
      "\x1b[1mWelcome to Precision-Genomics-Shell v4.2\x1b[0m",
      "Type \x1b[36m'help'\x1b[0m for available commands.",
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < bootLines.length) {
        term.write(bootLines[i] + '\r\n')
        i++
      } else {
        clearInterval(interval)
        isRunning.current = false
        writePrompt()
      }
    }, 120)
  }, [writePrompt])

  useEffect(() => {
    let disposed = false
    const initTerminal = async () => {
      try {
        const { Terminal } = await import('xterm')
        const { FitAddon } = await import('xterm-addon-fit')
        await import('xterm/css/xterm.css')

        if (disposed || !terminalRef.current) return

        const term = new Terminal({
          theme: {
            background: '#000000',
            foreground: '#e0e0e0',
            cursor: '#d4af37',
            cursorAccent: '#000',
            selectionBackground: 'rgba(212,175,55,0.3)',
            green: '#00ff41',
            yellow: '#d4af37',
            blue: '#5c9eff',
            red: '#ff4444',
            cyan: '#00d4ff',
            magenta: '#c678dd',
          },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'SF Mono', monospace",
          cursorBlink: true,
          cursorStyle: 'underline',
          scrollback: 1000,
          convertEol: true,
        })

        const fit = new FitAddon()
        term.loadAddon(fit)
        term.open(terminalRef.current)
        fit.fit()

        xtermInstance.current = term
        fitAddon.current = fit

        term.onKey(({ key, domEvent }) => {
          if (isRunning.current) return

          const code = domEvent.keyCode

          if (code === 13) {
            const cmd = inputBuffer.current.trim()
            inputBuffer.current = ''
            historyIndex.current = -1
            term.write('\r\n')
            processCommand(cmd)
          } else if (code === 8) {
            if (inputBuffer.current.length > 0) {
              inputBuffer.current = inputBuffer.current.slice(0, -1)
              term.write('\b \b')
            }
          } else if (code === 38) {
            if (commandHistory.current.length > 0) {
              if (historyIndex.current < commandHistory.current.length - 1) {
                historyIndex.current++
              }
              const cmd = commandHistory.current[commandHistory.current.length - 1 - historyIndex.current]
              const clearLen = inputBuffer.current.length
              for (let ci = 0; ci < clearLen; ci++) term.write('\b \b')
              inputBuffer.current = cmd
              term.write(cmd)
            }
          } else if (code === 40) {
            if (historyIndex.current > 0) {
              historyIndex.current--
              const cmd = commandHistory.current[commandHistory.current.length - 1 - historyIndex.current]
              const clearLen = inputBuffer.current.length
              for (let ci = 0; ci < clearLen; ci++) term.write('\b \b')
              inputBuffer.current = cmd
              term.write(cmd)
            }
          } else if (key.length === 1 && !domEvent.ctrlKey && !domEvent.altKey) {
            inputBuffer.current += key
            term.write(key)
          }
        })

        const handleResize = () => {
          try { fit.fit() } catch {}
        }
        window.addEventListener('resize', handleResize)

        setLoaded(true)
        runBoot()

        return () => {
          window.removeEventListener('resize', handleResize)
        }
      } catch (err) {
        console.warn('Terminal failed to load:', err)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loaded) {
          initTerminal()
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (terminalRef.current) {
      observer.observe(terminalRef.current)
    }

    return () => {
      disposed = true
      observer.disconnect()
      if (xtermInstance.current) {
        xtermInstance.current.dispose()
      }
    }
  }, [])

  return (
    <section className="py-24 bg-[#050505] reveal-on-scroll">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className={`bg-[#0a0a0a] border border-[hsl(var(--luxury-gold))]/20 rounded-lg overflow-hidden shadow-[0_0_60px_-15px_rgba(212,175,55,0.15)] flex flex-col transition-all duration-500 ease-in-out ${isMinimized ? 'h-12' : 'h-[600px]'}`}>
            <div className="bg-[#111] px-4 py-3 flex items-center justify-between border-b border-white/5 select-none">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
                <TerminalIcon size={14} className="text-[hsl(var(--luxury-gold))] ml-2" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  Precision-Genomics-Shell v4.2 // Secure Session
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => runBoot()} className="text-white/20 hover:text-white/60 transition-colors" title="Reboot">
                  <RefreshCw size={14} />
                </button>
                <button onClick={() => setIsMinimized(!isMinimized)} className="text-white/40 hover:text-white transition-colors">
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-black" style={{ display: isMinimized ? 'none' : 'block' }}>
              <div ref={terminalRef} className="absolute inset-0 w-full h-full" />
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-50">
            Fully Interactive Terminal • Type 'help' to start • Live Data Enabled
          </p>
        </div>
      </div>
    </section>
  )
}

export default TerminalSection