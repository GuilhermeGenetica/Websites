import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import 'xterm/css/xterm.css';

const TERM_API = '/api/terminal.php';

async function termRequest(action, params = {}) {
  const token = localStorage.getItem('wb-token');
  const res = await fetch(TERM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ action, ...params })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m',
};

const VERSION = '2.0.0';
const MOTD = [
  `${ANSI.brightGreen}${ANSI.bold}WorkBench Terminal Environment v${VERSION}${ANSI.reset}`,
  `${ANSI.dim}Type 'help' for available commands. Tab for autocomplete.${ANSI.reset}`,
  `${ANSI.dim}File system root: /filexplorer/${ANSI.reset}`,
  '',
];

const BUILTIN_COMMANDS = [
  'help', 'clear', 'ls', 'dir', 'cd', 'pwd', 'cat', 'head', 'tail', 'wc',
  'echo', 'printf', 'date', 'cal', 'uptime', 'whoami', 'id', 'hostname',
  'uname', 'env', 'export', 'unset', 'set', 'alias', 'unalias', 'type', 'which',
  'history', 'touch', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'rename',
  'chmod', 'chown', 'ln',
  'find', 'grep', 'egrep', 'fgrep', 'sed', 'awk', 'cut', 'sort', 'uniq',
  'tr', 'tee', 'xargs', 'diff', 'comm', 'paste', 'join', 'split',
  'file', 'stat', 'du', 'df', 'free', 'top', 'ps', 'kill',
  'wget', 'curl', 'ping', 'traceroute', 'nslookup', 'dig', 'ifconfig', 'ip', 'netstat', 'ss',
  'tar', 'gzip', 'gunzip', 'zip', 'unzip', 'bzip2', 'xz',
  'base64', 'md5sum', 'sha256sum', 'sha1sum',
  'man', 'info', 'whatis', 'apropos',
  'yes', 'seq', 'shuf', 'factor', 'bc', 'expr', 'dc',
  'sleep', 'true', 'false', 'test', 'exit', 'logout',
  'tree', 'less', 'more', 'xxd', 'od', 'hexdump',
  'rev', 'fold', 'fmt', 'nl', 'expand', 'unexpand', 'column',
  'tac', 'realpath', 'basename', 'dirname', 'readlink',
  'mktemp', 'sync', 'nohup', 'timeout', 'watch',
  'lsblk', 'mount', 'umount', 'fdisk', 'blkid',
  'useradd', 'userdel', 'usermod', 'groupadd', 'passwd',
  'crontab', 'at', 'systemctl', 'service', 'journalctl',
  'ssh', 'scp', 'rsync', 'ftp', 'telnet',
  'vim', 'nano', 'vi', 'emacs',
  'git', 'svn',
  'make', 'gcc', 'g++', 'python', 'python3', 'node', 'npm', 'php', 'ruby', 'perl',
  'docker', 'kubectl', 'terraform', 'ansible',
  'apt', 'yum', 'dnf', 'pacman', 'brew', 'snap', 'flatpak', 'pip', 'gem', 'cargo',
  'neofetch', 'screenfetch', 'cowsay', 'fortune', 'figlet', 'lolcat', 'sl', 'cmatrix',
  'reset', 'tput', 'stty', 'script',
  'download', 'open', 'preview',
];

const HELP_CATEGORIES = {
  'Navigation': ['cd', 'ls', 'dir', 'pwd', 'tree', 'find', 'realpath', 'basename', 'dirname'],
  'File Operations': ['cat', 'head', 'tail', 'less', 'more', 'touch', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'rename', 'ln', 'file', 'stat', 'wc', 'xxd', 'od'],
  'Search & Transform': ['grep', 'egrep', 'fgrep', 'sed', 'awk', 'cut', 'sort', 'uniq', 'tr', 'diff', 'comm', 'paste', 'join', 'rev', 'fold', 'fmt', 'nl', 'tac', 'column'],
  'System Info': ['uname', 'hostname', 'whoami', 'id', 'date', 'cal', 'uptime', 'free', 'df', 'du', 'top', 'ps', 'neofetch'],
  'Environment': ['echo', 'printf', 'env', 'export', 'unset', 'set', 'alias', 'unalias', 'type', 'which', 'history'],
  'Math & Utilities': ['expr', 'bc', 'factor', 'seq', 'shuf', 'base64', 'md5sum', 'sha256sum', 'yes', 'sleep', 'true', 'false', 'test'],
  'Network (simulated)': ['ping', 'curl', 'wget', 'ifconfig', 'ip', 'nslookup', 'dig', 'netstat', 'ss', 'traceroute'],
  'Archive (simulated)': ['tar', 'gzip', 'gunzip', 'zip', 'unzip', 'bzip2', 'xz'],
  'WorkBench Special': ['download', 'open', 'preview', 'clear', 'help', 'exit', 'reset'],
};

class BashEmulator {
  constructor(term, isAdmin, userName, onExit) {
    this.term = term;
    this.isAdmin = isAdmin;
    this.userName = userName || 'user';
    this.onExit = onExit;
    this.cwd = '/';
    this.env = {
      HOME: '/',
      USER: this.userName,
      SHELL: '/bin/bash',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
      HOSTNAME: 'workbench',
      PWD: '/',
      OLDPWD: '/',
      PS1: '',
      EDITOR: 'nano',
      PAGER: 'less',
      LS_COLORS: 'di=34:ln=36:so=35:pi=33:ex=32:bd=34;46:cd=34;43',
    };
    this.aliases = {
      'll': 'ls -la',
      'la': 'ls -a',
      'l': 'ls -CF',
      '..': 'cd ..',
      '...': 'cd ../..',
      'cls': 'clear',
      'md': 'mkdir',
      'rd': 'rmdir',
    };
    this.history = [];
    this.historyIndex = -1;
    this.currentInput = '';
    this.inputBuffer = '';
    this.cursorPos = 0;
    this.isProcessing = false;
    this.lastExitCode = 0;
    this.dirCache = {};
    this.tabPressCount = 0;
    this.lastTabInput = '';
    this.searchMode = false;
    this.searchTerm = '';
    this.searchIndex = -1;
  }

  getPrompt() {
    const host = 'workbench';
    const userColor = this.isAdmin ? ANSI.brightRed : ANSI.brightGreen;
    const symbol = this.isAdmin ? '#' : '$';
    let displayPath = this.cwd;
    if (displayPath === '/') displayPath = '~';
    else if (displayPath.length > 40) {
      const parts = displayPath.split('/');
      if (parts.length > 3) displayPath = '.../' + parts.slice(-2).join('/');
    }
    return `${userColor}${ANSI.bold}${this.userName}@${host}${ANSI.reset}:${ANSI.brightBlue}${ANSI.bold}${displayPath}${ANSI.reset}${symbol} `;
  }

  getPromptLength() {
    const host = 'workbench';
    const symbol = this.isAdmin ? '#' : '$';
    let displayPath = this.cwd;
    if (displayPath === '/') displayPath = '~';
    else if (displayPath.length > 40) {
      const parts = displayPath.split('/');
      if (parts.length > 3) displayPath = '.../' + parts.slice(-2).join('/');
    }
    return `${this.userName}@${host}:${displayPath}${symbol} `.length;
  }

  writePrompt() {
    this.term.write('\r\n' + this.getPrompt());
  }

  writeFirstPrompt() {
    this.term.write(this.getPrompt());
  }

  resolvePath(p) {
    if (!p || p === '~' || p === '$HOME') return '/';
    let path = p;
    if (path.startsWith('~/')) path = '/' + path.slice(2);
    else if (path.startsWith('~')) path = '/';
    if (!path.startsWith('/')) {
      path = this.cwd === '/' ? '/' + path : this.cwd + '/' + path;
    }
    const parts = path.split('/').filter(Boolean);
    const resolved = [];
    for (const part of parts) {
      if (part === '.') continue;
      else if (part === '..') { resolved.pop(); }
      else resolved.push(part);
    }
    return '/' + resolved.join('/');
  }

  stripPath(fullPath) {
    if (fullPath === '/') return '';
    return fullPath.startsWith('/') ? fullPath.slice(1) : fullPath;
  }

  async fetchDir(path) {
    const apiPath = this.stripPath(path);
    const cacheKey = path;
    try {
      const res = await termRequest('ls', { path: apiPath });
      if (res.success) {
        this.dirCache[cacheKey] = res.items;
        return res.items;
      }
      return null;
    } catch {
      return null;
    }
  }

  async execRemote(action, params) {
    try {
      return await termRequest(action, params);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  colorizeFilename(name, isDir, ext) {
    if (isDir) return `${ANSI.brightBlue}${ANSI.bold}${name}/${ANSI.reset}`;
    const execExts = ['sh', 'bash', 'py', 'pl', 'rb', 'php', 'js', 'exe', 'bin'];
    const archiveExts = ['zip', 'tar', 'gz', 'bz2', 'xz', 'rar', '7z', 'tgz'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'wma'];
    const videoExts = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt'];
    const e = (ext || '').toLowerCase();
    if (execExts.includes(e)) return `${ANSI.brightGreen}${name}${ANSI.reset}`;
    if (archiveExts.includes(e)) return `${ANSI.brightRed}${name}${ANSI.reset}`;
    if (imageExts.includes(e)) return `${ANSI.brightMagenta}${name}${ANSI.reset}`;
    if (audioExts.includes(e)) return `${ANSI.brightCyan}${name}${ANSI.reset}`;
    if (videoExts.includes(e)) return `${ANSI.brightYellow}${name}${ANSI.reset}`;
    if (docExts.includes(e)) return `${ANSI.yellow}${name}${ANSI.reset}`;
    if (e === 'md' || e === 'txt' || e === 'log') return `${ANSI.white}${name}${ANSI.reset}`;
    if (e === 'json' || e === 'xml' || e === 'yml' || e === 'yaml') return `${ANSI.cyan}${name}${ANSI.reset}`;
    return name;
  }

  formatSize(b) {
    if (!b || b === 0) return '    0';
    if (b < 1024) return String(b).padStart(5);
    if (b < 1048576) return (b / 1024).toFixed(1).padStart(5) + 'K';
    if (b < 1073741824) return (b / 1048576).toFixed(1).padStart(5) + 'M';
    return (b / 1073741824).toFixed(1).padStart(5) + 'G';
  }

  formatDate(dateStr) {
    if (!dateStr) return 'Jan  1 00:00';
    const d = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  parseArgs(argsStr) {
    const args = [];
    const flags = {};
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let escape = false;

    for (let i = 0; i < argsStr.length; i++) {
      const ch = argsStr[i];
      if (escape) { current += ch; escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
      if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
      if (ch === ' ' && !inSingle && !inDouble) {
        if (current) { args.push(current); current = ''; }
        continue;
      }
      current += ch;
    }
    if (current) args.push(current);

    const positional = [];
    for (const arg of args) {
      if (arg.startsWith('--')) {
        const [key, ...val] = arg.slice(2).split('=');
        flags[key] = val.length ? val.join('=') : true;
      } else if (arg.startsWith('-') && arg.length > 1 && !/^-\d/.test(arg)) {
        for (const ch of arg.slice(1)) flags[ch] = true;
      } else {
        positional.push(arg);
      }
    }
    return { positional, flags, raw: args };
  }

  expandVars(str) {
    return str.replace(/\$\{?(\w+)\}?/g, (_, name) => {
      if (name === '?') return String(this.lastExitCode);
      if (name === 'RANDOM') return String(Math.floor(Math.random() * 32768));
      if (name === 'SECONDS') return String(Math.floor(performance.now() / 1000));
      return this.env[name] || '';
    });
  }

  expandGlob(pattern, items) {
    const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return items.filter(i => regex.test(i.name)).map(i => i.name);
  }

  async handleCommand(rawInput) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    let input = rawInput.trim();
    if (!input) { this.isProcessing = false; return; }

    if (input !== this.history[this.history.length - 1]) {
      this.history.push(input);
    }
    this.historyIndex = this.history.length;

    input = this.expandVars(input);

    for (const [alias, expansion] of Object.entries(this.aliases)) {
      if (input === alias || input.startsWith(alias + ' ')) {
        input = expansion + input.slice(alias.length);
        break;
      }
    }

    const pipeParts = input.split(/\s*\|\s*/);
    let pipeOutput = null;

    for (let pi = 0; pi < pipeParts.length; pi++) {
      const part = pipeParts[pi].trim();
      if (!part) continue;

      const redirectMatch = part.match(/^(.+?)(?:\s*>(>)?)\s*(.+)$/);
      let cmdPart = part;
      let redirectFile = null;
      let redirectAppend = false;
      if (redirectMatch) {
        cmdPart = redirectMatch[1].trim();
        redirectAppend = !!redirectMatch[2];
        redirectFile = redirectMatch[3].trim();
      }

      const spaceIdx = cmdPart.indexOf(' ');
      const cmd = spaceIdx === -1 ? cmdPart : cmdPart.slice(0, spaceIdx);
      const argsStr = spaceIdx === -1 ? '' : cmdPart.slice(spaceIdx + 1).trim();
      const parsed = this.parseArgs(argsStr);

      let output = '';
      try {
        output = await this.executeCommand(cmd, parsed, argsStr, pipeOutput);
      } catch (e) {
        output = `${ANSI.red}${cmd}: ${e.message}${ANSI.reset}`;
        this.lastExitCode = 1;
      }

      if (output === '__CLEAR__') {
        this.term.clear();
        this.term.write('\x1b[H\x1b[2J');
        pipeOutput = null;
        continue;
      }
      if (output === '__EXIT__') {
        if (this.onExit) this.onExit();
        this.isProcessing = false;
        return;
      }

      if (redirectFile && this.isAdmin) {
        const fullPath = this.resolvePath(redirectFile);
        const apiPath = this.stripPath(fullPath);
        const res = await this.execRemote('writeFile', { path: apiPath, content: output || '', append: redirectAppend });
        if (!res.success) this.writeLine(`${ANSI.red}bash: ${redirectFile}: ${res.error || 'Permission denied'}${ANSI.reset}`);
        pipeOutput = null;
        continue;
      } else if (redirectFile && !this.isAdmin) {
        this.writeLine(`${ANSI.red}bash: ${redirectFile}: Permission denied (admin only)${ANSI.reset}`);
        this.lastExitCode = 1;
        pipeOutput = null;
        continue;
      }

      pipeOutput = output;

      if (pi === pipeParts.length - 1 && output) {
        this.writeLine(output);
      }
    }

    this.isProcessing = false;
  }

  writeLine(text) {
    if (!text) return;
    const lines = text.split('\n');
    for (const line of lines) {
      this.term.write('\r\n' + line);
    }
  }

  async executeCommand(cmd, parsed, argsStr, pipeInput) {
    const { positional, flags, raw } = parsed;

    switch (cmd) {

      case 'help': {
        let out = `\r\n${ANSI.brightYellow}${ANSI.bold}╔══════════════════════════════════════════════════════════════╗${ANSI.reset}`;
        out += `\r\n${ANSI.brightYellow}${ANSI.bold}║       WorkBench Terminal v${VERSION} — Command Reference        ║${ANSI.reset}`;
        out += `\r\n${ANSI.brightYellow}${ANSI.bold}╚══════════════════════════════════════════════════════════════╝${ANSI.reset}`;
        out += `\r\n`;
        for (const [category, cmds] of Object.entries(HELP_CATEGORIES)) {
          out += `\r\n  ${ANSI.brightCyan}${ANSI.bold}${category}:${ANSI.reset}`;
          out += `\r\n  ${ANSI.dim}${cmds.join(', ')}${ANSI.reset}`;
        }
        out += `\r\n`;
        out += `\r\n  ${ANSI.yellow}Tip:${ANSI.reset} Use ${ANSI.green}TAB${ANSI.reset} for autocomplete, ${ANSI.green}↑/↓${ANSI.reset} for history`;
        out += `\r\n  ${ANSI.yellow}Tip:${ANSI.reset} Pipes ${ANSI.green}|${ANSI.reset} and redirects ${ANSI.green}> >>${ANSI.reset} are supported`;
        out += `\r\n  ${ANSI.yellow}Tip:${ANSI.reset} ${ANSI.green}Ctrl+R${ANSI.reset} reverse search, ${ANSI.green}Ctrl+C${ANSI.reset} cancel, ${ANSI.green}Ctrl+L${ANSI.reset} clear`;
        if (!this.isAdmin) {
          out += `\r\n`;
          out += `\r\n  ${ANSI.brightRed}⚠ Write operations (mkdir, rm, mv, cp, touch, rename) require admin.${ANSI.reset}`;
        }
        return out;
      }

      case 'clear':
      case 'cls':
      case 'reset':
        return '__CLEAR__';

      case 'exit':
      case 'logout':
        return '__EXIT__';

      case 'pwd':
        this.lastExitCode = 0;
        return this.cwd;

      case 'cd': {
        const target = positional[0] || '/';
        let newPath;
        if (target === '-') newPath = this.env.OLDPWD || '/';
        else newPath = this.resolvePath(target);

        const items = await this.fetchDir(newPath);
        if (items === null) {
          this.lastExitCode = 1;
          return `${ANSI.red}bash: cd: ${target}: No such file or directory${ANSI.reset}`;
        }
        this.env.OLDPWD = this.cwd;
        this.cwd = newPath === '' ? '/' : newPath;
        this.env.PWD = this.cwd;
        this.lastExitCode = 0;
        if (target === '-') return this.cwd;
        return '';
      }

      case 'ls':
      case 'dir': {
        const showAll = flags.a || flags.A || flags.all;
        const longFormat = flags.l || flags.long;
        const showHuman = flags.h || flags.human;
        const recursive = flags.R || flags.recursive;
        const sortBySize = flags.S;
        const sortByTime = flags.t;
        const reverseSort = flags.r;
        const oneLine = flags['1'];
        const classify = flags.F;

        const targetPath = positional[0] ? this.resolvePath(positional[0]) : this.cwd;
        const items = await this.fetchDir(targetPath);
        if (items === null) {
          this.lastExitCode = 2;
          return `${ANSI.red}ls: cannot access '${positional[0] || '.'}': No such file or directory${ANSI.reset}`;
        }

        let filtered = items;
        if (!showAll) filtered = filtered.filter(i => !i.name.startsWith('.'));

        if (sortBySize) filtered.sort((a, b) => (b.size || 0) - (a.size || 0));
        else if (sortByTime) filtered.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        else filtered.sort((a, b) => a.name.localeCompare(b.name));
        if (reverseSort) filtered.reverse();

        if (filtered.length === 0) { this.lastExitCode = 0; return ''; }

        if (longFormat) {
          const totalSize = filtered.reduce((s, i) => s + (i.size || 0), 0);
          let out = `total ${Math.ceil(totalSize / 1024)}`;
          for (const item of filtered) {
            const perms = item.isDir ? 'drwxr-xr-x' : '-rw-r--r--';
            const links = item.isDir ? '2' : '1';
            const owner = this.isAdmin ? 'admin' : 'user ';
            const group = 'staff';
            const size = showHuman ? this.formatSize(item.size) : String(item.size || 0).padStart(8);
            const date = this.formatDate(item.modified);
            const name = this.colorizeFilename(item.name, item.isDir, item.extension);
            out += `\r\n${perms} ${links} ${owner} ${group} ${size} ${date} ${name}`;
          }
          this.lastExitCode = 0;
          return out;
        }

        if (oneLine) {
          this.lastExitCode = 0;
          return filtered.map(i => this.colorizeFilename(i.name, i.isDir, i.extension)).join('\r\n');
        }

        const names = filtered.map(i => {
          let n = this.colorizeFilename(i.name, i.isDir, i.extension);
          if (classify && i.isDir) n += '/';
          return n;
        });

        const rawNames = filtered.map(i => i.name + (i.isDir ? '/' : ''));
        const maxLen = Math.max(...rawNames.map(n => n.length));
        const cols = Math.max(1, Math.floor(80 / (maxLen + 2)));
        let out = '';
        for (let i = 0; i < names.length; i++) {
          const pad = maxLen + 2 - rawNames[i].length;
          out += names[i] + ' '.repeat(Math.max(1, pad));
          if ((i + 1) % cols === 0 && i < names.length - 1) out += '\r\n';
        }
        this.lastExitCode = 0;
        return out;
      }

      case 'tree': {
        const targetPath = positional[0] ? this.resolvePath(positional[0]) : this.cwd;
        const maxDepth = flags.L ? parseInt(flags.L) : 3;
        let dirCount = 0, fileCount = 0;

        const buildTree = async (path, prefix, depth) => {
          if (depth > maxDepth) return '';
          const items = await this.fetchDir(path);
          if (!items) return '';
          const filtered = items.filter(i => !i.name.startsWith('.'));
          let out = '';
          for (let i = 0; i < filtered.length; i++) {
            const isLast = i === filtered.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const name = this.colorizeFilename(filtered[i].name, filtered[i].isDir, filtered[i].extension);
            out += `\r\n${prefix}${connector}${name}`;
            if (filtered[i].isDir) {
              dirCount++;
              const newPrefix = prefix + (isLast ? '    ' : '│   ');
              out += await buildTree(path === '/' ? '/' + filtered[i].name : path + '/' + filtered[i].name, newPrefix, depth + 1);
            } else {
              fileCount++;
            }
          }
          return out;
        };

        const displayPath = positional[0] || '.';
        let result = `${ANSI.brightBlue}${ANSI.bold}${displayPath}${ANSI.reset}`;
        result += await buildTree(targetPath, '', 1);
        result += `\r\n\r\n${dirCount} directories, ${fileCount} files`;
        this.lastExitCode = 0;
        return result;
      }

      case 'cat': {
        if (positional.length === 0) {
          if (pipeInput) return pipeInput;
          this.lastExitCode = 1;
          return `${ANSI.red}cat: missing operand${ANSI.reset}`;
        }
        let allContent = '';
        for (const file of positional) {
          const fullPath = this.resolvePath(file);
          const apiPath = this.stripPath(fullPath);
          const res = await this.execRemote('readFile', { path: apiPath });
          if (res.success) {
            let content = res.content || '';
            if (flags.n) {
              const lines = content.split('\n');
              content = lines.map((l, i) => `${ANSI.dim}${String(i + 1).padStart(6)}${ANSI.reset}\t${l}`).join('\n');
            }
            if (flags.b) {
              const lines = content.split('\n');
              let num = 0;
              content = lines.map(l => l.trim() ? `${ANSI.dim}${String(++num).padStart(6)}${ANSI.reset}\t${l}` : l).join('\n');
            }
            allContent += (allContent ? '\n' : '') + content;
          } else {
            allContent += (allContent ? '\n' : '') + `${ANSI.red}cat: ${file}: ${res.error || 'No such file or directory'}${ANSI.reset}`;
            this.lastExitCode = 1;
          }
        }
        this.lastExitCode = 0;
        return allContent;
      }

      case 'head': {
        const n = flags.n ? parseInt(flags.n) : 10;
        let content = pipeInput;
        if (!content && positional[0]) {
          const fullPath = this.resolvePath(positional[0]);
          const res = await this.execRemote('readFile', { path: this.stripPath(fullPath) });
          if (!res.success) { this.lastExitCode = 1; return `${ANSI.red}head: ${positional[0]}: ${res.error || 'No such file'}${ANSI.reset}`; }
          content = res.content;
        }
        if (!content) { this.lastExitCode = 1; return `${ANSI.red}head: missing operand${ANSI.reset}`; }
        this.lastExitCode = 0;
        return content.split('\n').slice(0, n).join('\n');
      }

      case 'tail': {
        const n = flags.n ? parseInt(flags.n) : 10;
        let content = pipeInput;
        if (!content && positional[0]) {
          const fullPath = this.resolvePath(positional[0]);
          const res = await this.execRemote('readFile', { path: this.stripPath(fullPath) });
          if (!res.success) { this.lastExitCode = 1; return `${ANSI.red}tail: ${positional[0]}: ${res.error || 'No such file'}${ANSI.reset}`; }
          content = res.content;
        }
        if (!content) { this.lastExitCode = 1; return `${ANSI.red}tail: missing operand${ANSI.reset}`; }
        this.lastExitCode = 0;
        return content.split('\n').slice(-n).join('\n');
      }

      case 'wc': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const fullPath = this.resolvePath(positional[0]);
          const res = await this.execRemote('readFile', { path: this.stripPath(fullPath) });
          if (!res.success) { this.lastExitCode = 1; return `${ANSI.red}wc: ${positional[0]}: ${res.error || 'No such file'}${ANSI.reset}`; }
          content = res.content;
        }
        if (!content) return '      0       0       0';
        const lines = content.split('\n').length;
        const words = content.split(/\s+/).filter(Boolean).length;
        const chars = content.length;
        const name = positional[0] || '';
        if (flags.l) return `${String(lines).padStart(7)} ${name}`;
        if (flags.w) return `${String(words).padStart(7)} ${name}`;
        if (flags.c || flags.m) return `${String(chars).padStart(7)} ${name}`;
        this.lastExitCode = 0;
        return `${String(lines).padStart(7)} ${String(words).padStart(7)} ${String(chars).padStart(7)} ${name}`;
      }

      case 'grep':
      case 'egrep':
      case 'fgrep': {
        if (positional.length === 0) { this.lastExitCode = 2; return `${ANSI.red}grep: missing pattern${ANSI.reset}`; }
        const pattern = positional[0];
        const ignoreCase = flags.i;
        const invertMatch = flags.v;
        const showLineNum = flags.n;
        const countOnly = flags.c;
        const onlyMatching = flags.o;
        let content = pipeInput;
        if (!content && positional[1]) {
          const fullPath = this.resolvePath(positional[1]);
          const res = await this.execRemote('readFile', { path: this.stripPath(fullPath) });
          if (!res.success) { this.lastExitCode = 2; return `${ANSI.red}grep: ${positional[1]}: ${res.error || 'No such file'}${ANSI.reset}`; }
          content = res.content;
        }
        if (!content) { this.lastExitCode = 1; return ''; }
        const regex = new RegExp(pattern, ignoreCase ? 'gi' : 'g');
        const lines = content.split('\n');
        const matches = [];
        for (let i = 0; i < lines.length; i++) {
          const match = regex.test(lines[i]);
          regex.lastIndex = 0;
          if ((match && !invertMatch) || (!match && invertMatch)) {
            if (onlyMatching) {
              const m = lines[i].match(regex);
              if (m) matches.push(...m);
            } else {
              const prefix = showLineNum ? `${ANSI.green}${i + 1}${ANSI.reset}:` : '';
              const highlighted = lines[i].replace(new RegExp(pattern, ignoreCase ? 'gi' : 'g'), m => `${ANSI.brightRed}${ANSI.bold}${m}${ANSI.reset}`);
              matches.push(prefix + highlighted);
            }
          }
        }
        if (countOnly) { this.lastExitCode = matches.length > 0 ? 0 : 1; return String(matches.length); }
        this.lastExitCode = matches.length > 0 ? 0 : 1;
        return matches.join('\n');
      }

      case 'sort': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (!res.success) { this.lastExitCode = 1; return `${ANSI.red}sort: ${positional[0]}: ${res.error}${ANSI.reset}`; }
          content = res.content;
        }
        if (!content) return '';
        let lines = content.split('\n');
        if (flags.n) lines.sort((a, b) => parseFloat(a) - parseFloat(b));
        else if (flags.h) lines.sort((a, b) => parseFloat(a) - parseFloat(b));
        else lines.sort((a, b) => flags.f ? a.toLowerCase().localeCompare(b.toLowerCase()) : a.localeCompare(b));
        if (flags.r) lines.reverse();
        if (flags.u) lines = [...new Set(lines)];
        this.lastExitCode = 0;
        return lines.join('\n');
      }

      case 'uniq': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (!res.success) { this.lastExitCode = 1; return `${ANSI.red}uniq: ${positional[0]}: ${res.error}${ANSI.reset}`; }
          content = res.content;
        }
        if (!content) return '';
        const lines = content.split('\n');
        const result = [];
        const counts = [];
        let prev = null;
        for (const line of lines) {
          const cmp = flags.i ? line.toLowerCase() : line;
          if (cmp !== prev) { result.push(line); counts.push(1); prev = cmp; }
          else counts[counts.length - 1]++;
        }
        if (flags.c) return result.map((l, i) => `${String(counts[i]).padStart(7)} ${l}`).join('\n');
        if (flags.d) return result.filter((_, i) => counts[i] > 1).join('\n');
        if (flags.u) return result.filter((_, i) => counts[i] === 1).join('\n');
        this.lastExitCode = 0;
        return result.join('\n');
      }

      case 'cut': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (!res.success) return `${ANSI.red}cut: ${positional[0]}: ${res.error}${ANSI.reset}`;
          content = res.content;
        }
        if (!content) return '';
        const delimiter = flags.d || '\t';
        const fieldStr = flags.f;
        if (!fieldStr) return content;
        const fieldNum = parseInt(fieldStr) - 1;
        const lines = content.split('\n');
        this.lastExitCode = 0;
        return lines.map(l => { const parts = l.split(delimiter); return parts[fieldNum] || ''; }).join('\n');
      }

      case 'tr': {
        let content = pipeInput || '';
        if (raw.length < 2) return `${ANSI.red}tr: missing operand${ANSI.reset}`;
        const set1 = raw[0] || '';
        const set2 = raw[1] || '';
        if (flags.d) { this.lastExitCode = 0; return content.replace(new RegExp(`[${set1}]`, 'g'), ''); }
        if (flags.s) { this.lastExitCode = 0; return content.replace(new RegExp(`[${set1}]+`, 'g'), set1[0]); }
        let result = '';
        for (const ch of content) {
          const idx = set1.indexOf(ch);
          result += idx >= 0 ? (set2[idx] || set2[set2.length - 1] || '') : ch;
        }
        if (set1 === '[:upper:]' && set2 === '[:lower:]') return content.toLowerCase();
        if (set1 === '[:lower:]' && set2 === '[:upper:]') return content.toUpperCase();
        this.lastExitCode = 0;
        return result;
      }

      case 'sed': {
        let content = pipeInput;
        if (!content && positional.length > 1) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[positional.length - 1])) });
          if (res.success) content = res.content;
        }
        if (!content) return '';
        const expr = positional[0] || '';
        const sedMatch = expr.match(/^s\/(.+?)\/(.*)\/([gip]*)$/);
        if (sedMatch) {
          const [, pat, rep, mods] = sedMatch;
          const regex = new RegExp(pat, mods.includes('i') ? 'gi' : mods.includes('g') ? 'g' : '');
          this.lastExitCode = 0;
          return content.split('\n').map(l => l.replace(regex, rep)).join('\n');
        }
        const delMatch = expr.match(/^\/(.+?)\/d$/);
        if (delMatch) {
          const regex = new RegExp(delMatch[1]);
          this.lastExitCode = 0;
          return content.split('\n').filter(l => !regex.test(l)).join('\n');
        }
        this.lastExitCode = 0;
        return content;
      }

      case 'awk': {
        let content = pipeInput;
        if (!content && positional.length > 1) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[positional.length - 1])) });
          if (res.success) content = res.content;
        }
        if (!content) return '';
        const program = positional[0] || '';
        const printMatch = program.match(/^\{print\s+\$(\d+)\}$/);
        if (printMatch) {
          const field = parseInt(printMatch[1]);
          const sep = flags.F || /\s+/;
          this.lastExitCode = 0;
          return content.split('\n').map(l => { const parts = l.split(sep); return parts[field - 1] || ''; }).join('\n');
        }
        const nrMatch = program.match(/^\{print NR/);
        if (nrMatch) {
          this.lastExitCode = 0;
          return content.split('\n').map((l, i) => `${i + 1} ${l}`).join('\n');
        }
        this.lastExitCode = 0;
        return content;
      }

      case 'tac': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (res.success) content = res.content;
        }
        if (!content) return '';
        this.lastExitCode = 0;
        return content.split('\n').reverse().join('\n');
      }

      case 'rev': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (res.success) content = res.content;
        }
        if (!content) return '';
        this.lastExitCode = 0;
        return content.split('\n').map(l => [...l].reverse().join('')).join('\n');
      }

      case 'nl': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (res.success) content = res.content;
        }
        if (!content) return '';
        this.lastExitCode = 0;
        return content.split('\n').map((l, i) => `${String(i + 1).padStart(6)}\t${l}`).join('\n');
      }

      case 'fold': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (res.success) content = res.content;
        }
        if (!content) return '';
        const width = flags.w ? parseInt(flags.w) : 80;
        this.lastExitCode = 0;
        return content.split('\n').map(l => {
          const chunks = [];
          for (let i = 0; i < l.length; i += width) chunks.push(l.slice(i, i + width));
          return chunks.join('\n');
        }).join('\n');
      }

      case 'column': {
        let content = pipeInput;
        if (!content) return '';
        if (flags.t) {
          const lines = content.split('\n').filter(Boolean);
          const sep = flags.s || /\s+/;
          const rows = lines.map(l => l.split(sep));
          const colCount = Math.max(...rows.map(r => r.length));
          const widths = Array(colCount).fill(0);
          rows.forEach(r => r.forEach((c, i) => { widths[i] = Math.max(widths[i], c.length); }));
          this.lastExitCode = 0;
          return rows.map(r => r.map((c, i) => c.padEnd(widths[i] + 2)).join('')).join('\n');
        }
        this.lastExitCode = 0;
        return content;
      }

      case 'diff': {
        if (positional.length < 2) return `${ANSI.red}diff: missing operand${ANSI.reset}`;
        const res1 = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
        const res2 = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[1])) });
        if (!res1.success) return `${ANSI.red}diff: ${positional[0]}: ${res1.error}${ANSI.reset}`;
        if (!res2.success) return `${ANSI.red}diff: ${positional[1]}: ${res2.error}${ANSI.reset}`;
        const lines1 = (res1.content || '').split('\n');
        const lines2 = (res2.content || '').split('\n');
        const maxLen = Math.max(lines1.length, lines2.length);
        let out = '';
        for (let i = 0; i < maxLen; i++) {
          if (lines1[i] !== lines2[i]) {
            if (lines1[i] !== undefined) out += `${ANSI.red}- ${lines1[i]}${ANSI.reset}\n`;
            if (lines2[i] !== undefined) out += `${ANSI.green}+ ${lines2[i]}${ANSI.reset}\n`;
          }
        }
        this.lastExitCode = out ? 1 : 0;
        return out || 'Files are identical';
      }

      case 'find': {
        const searchPath = positional[0] ? this.resolvePath(positional[0]) : this.cwd;
        const namePattern = flags.name || flags.iname || null;
        const typeFilter = flags.type || null;
        const maxDepth = flags.maxdepth ? parseInt(flags.maxdepth) : 5;
        let results = [];

        const search = async (path, depth) => {
          if (depth > maxDepth) return;
          const items = await this.fetchDir(path);
          if (!items) return;
          for (const item of items) {
            const fullP = path === '/' ? '/' + item.name : path + '/' + item.name;
            let matches = true;
            if (namePattern) {
              const regex = new RegExp(namePattern.replace(/\*/g, '.*').replace(/\?/g, '.'), flags.iname ? 'i' : '');
              matches = regex.test(item.name);
            }
            if (typeFilter) {
              if (typeFilter === 'f' && item.isDir) matches = false;
              if (typeFilter === 'd' && !item.isDir) matches = false;
            }
            if (matches) results.push(fullP);
            if (item.isDir) await search(fullP, depth + 1);
          }
        };
        await search(searchPath, 1);
        this.lastExitCode = 0;
        return results.join('\n');
      }

      case 'touch':
      case 'mkdir':
      case 'rmdir':
      case 'rm':
      case 'cp':
      case 'mv':
      case 'rename':
      case 'chmod':
      case 'chown':
      case 'ln': {
        if (!this.isAdmin) {
          this.lastExitCode = 1;
          return `${ANSI.red}bash: ${cmd}: Permission denied — admin privileges required${ANSI.reset}`;
        }
        if (positional.length === 0 && cmd !== 'rm') {
          this.lastExitCode = 1;
          return `${ANSI.red}${cmd}: missing operand${ANSI.reset}`;
        }

        if (cmd === 'touch') {
          for (const file of positional) {
            const res = await this.execRemote('touch', { path: this.stripPath(this.resolvePath(file)) });
            if (!res.success) return `${ANSI.red}touch: ${file}: ${res.error}${ANSI.reset}`;
          }
          this.lastExitCode = 0;
          return '';
        }
        if (cmd === 'mkdir') {
          const recursive = flags.p;
          for (const dir of positional) {
            const res = await this.execRemote('mkdir', { path: this.stripPath(this.resolvePath(dir)), recursive });
            if (!res.success) return `${ANSI.red}mkdir: ${dir}: ${res.error}${ANSI.reset}`;
          }
          this.lastExitCode = 0;
          return '';
        }
        if (cmd === 'rm') {
          const recursive = flags.r || flags.R || flags.recursive;
          const force = flags.f;
          if (positional.length === 0) return `${ANSI.red}rm: missing operand${ANSI.reset}`;
          for (const target of positional) {
            const res = await this.execRemote('rm', { path: this.stripPath(this.resolvePath(target)), recursive, force });
            if (!res.success) return `${ANSI.red}rm: ${target}: ${res.error}${ANSI.reset}`;
          }
          this.lastExitCode = 0;
          return '';
        }
        if (cmd === 'rmdir') {
          for (const dir of positional) {
            const res = await this.execRemote('rmdir', { path: this.stripPath(this.resolvePath(dir)) });
            if (!res.success) return `${ANSI.red}rmdir: ${dir}: ${res.error}${ANSI.reset}`;
          }
          this.lastExitCode = 0;
          return '';
        }
        if (cmd === 'cp') {
          if (positional.length < 2) return `${ANSI.red}cp: missing destination${ANSI.reset}`;
          const src = this.stripPath(this.resolvePath(positional[0]));
          const dst = this.stripPath(this.resolvePath(positional[1]));
          const res = await this.execRemote('cp', { source: src, destination: dst, recursive: flags.r || flags.R });
          if (!res.success) return `${ANSI.red}cp: ${res.error}${ANSI.reset}`;
          this.lastExitCode = 0;
          return '';
        }
        if (cmd === 'mv' || cmd === 'rename') {
          if (positional.length < 2) return `${ANSI.red}${cmd}: missing destination${ANSI.reset}`;
          const src = this.stripPath(this.resolvePath(positional[0]));
          const dst = this.stripPath(this.resolvePath(positional[1]));
          const res = await this.execRemote('mv', { source: src, destination: dst });
          if (!res.success) return `${ANSI.red}${cmd}: ${res.error}${ANSI.reset}`;
          this.lastExitCode = 0;
          return '';
        }
        this.lastExitCode = 0;
        return `${ANSI.yellow}${cmd}: operation simulated (not implemented on server)${ANSI.reset}`;
      }

      case 'file': {
        if (!positional[0]) return `${ANSI.red}file: missing operand${ANSI.reset}`;
        const fullPath = this.resolvePath(positional[0]);
        const res = await this.execRemote('fileInfo', { path: this.stripPath(fullPath) });
        if (!res.success) return `${ANSI.red}${positional[0]}: ${res.error || 'No such file'}${ANSI.reset}`;
        this.lastExitCode = 0;
        return `${positional[0]}: ${res.type || 'data'}`;
      }

      case 'stat': {
        if (!positional[0]) return `${ANSI.red}stat: missing operand${ANSI.reset}`;
        const fullPath = this.resolvePath(positional[0]);
        const res = await this.execRemote('stat', { path: this.stripPath(fullPath) });
        if (!res.success) return `${ANSI.red}stat: ${positional[0]}: ${res.error || 'No such file'}${ANSI.reset}`;
        let out = `  File: ${positional[0]}`;
        out += `\n  Size: ${res.size || 0}\tBlocks: ${Math.ceil((res.size || 0) / 512)}\tIO Block: 4096\t${res.isDir ? 'directory' : 'regular file'}`;
        out += `\nAccess: ${res.isDir ? '(0755/drwxr-xr-x)' : '(0644/-rw-r--r--)'}`;
        out += `\nModify: ${res.modified || 'unknown'}`;
        this.lastExitCode = 0;
        return out;
      }

      case 'du': {
        const targetPath = positional[0] ? this.resolvePath(positional[0]) : this.cwd;
        const items = await this.fetchDir(targetPath);
        if (!items) return `${ANSI.red}du: cannot access${ANSI.reset}`;
        const totalBytes = items.reduce((s, i) => s + (i.size || 0), 0);
        const human = flags.h || flags.human;
        const total = human ? this.formatSize(totalBytes) : Math.ceil(totalBytes / 1024);
        this.lastExitCode = 0;
        if (flags.s) return `${total}\t${positional[0] || '.'}`;
        let out = '';
        for (const item of items) {
          if (item.isDir) {
            out += `${human ? this.formatSize(item.size) : Math.ceil((item.size || 0) / 1024)}\t${item.name}\n`;
          }
        }
        out += `${total}\t${positional[0] || '.'}`;
        return out;
      }

      case 'echo': {
        const eFlag = flags.e;
        let text = argsStr.replace(/^(-[neE]\s*)+/, '').trim();
        text = this.expandVars(text);
        if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
        if (text.startsWith("'") && text.endsWith("'")) text = text.slice(1, -1);
        if (eFlag) {
          text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r').replace(/\\\\/g, '\\');
        }
        if (flags.n) { this.lastExitCode = 0; return text; }
        this.lastExitCode = 0;
        return text;
      }

      case 'printf': {
        let format = positional[0] || '';
        const pArgs = positional.slice(1);
        format = format.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r').replace(/\\\\/g, '\\');
        let idx = 0;
        const result = format.replace(/%[sd]/g, (m) => {
          const val = pArgs[idx++] || '';
          return m === '%d' ? String(parseInt(val) || 0) : val;
        });
        this.lastExitCode = 0;
        return result;
      }

      case 'date': {
        const now = new Date();
        if (flags.u || flags.utc) {
          this.lastExitCode = 0;
          return now.toUTCString();
        }
        if (positional[0]?.startsWith('+')) {
          let fmt = positional[0].slice(1);
          fmt = fmt.replace(/%Y/g, now.getFullYear())
            .replace(/%m/g, String(now.getMonth() + 1).padStart(2, '0'))
            .replace(/%d/g, String(now.getDate()).padStart(2, '0'))
            .replace(/%H/g, String(now.getHours()).padStart(2, '0'))
            .replace(/%M/g, String(now.getMinutes()).padStart(2, '0'))
            .replace(/%S/g, String(now.getSeconds()).padStart(2, '0'))
            .replace(/%s/g, Math.floor(now.getTime() / 1000))
            .replace(/%A/g, now.toLocaleDateString('en', { weekday: 'long' }))
            .replace(/%B/g, now.toLocaleDateString('en', { month: 'long' }))
            .replace(/%Z/g, Intl.DateTimeFormat().resolvedOptions().timeZone);
          this.lastExitCode = 0;
          return fmt;
        }
        this.lastExitCode = 0;
        return now.toString();
      }

      case 'cal': {
        const now = new Date();
        const month = positional[0] ? parseInt(positional[0]) - 1 : now.getMonth();
        const year = positional[1] ? parseInt(positional[1]) : now.getFullYear();
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const title = `${months[month]} ${year}`;
        let out = title.padStart(Math.floor((20 + title.length) / 2)).padEnd(20);
        out += '\nSu Mo Tu We Th Fr Sa';
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let line = '   '.repeat(firstDay);
        for (let d = 1; d <= daysInMonth; d++) {
          const dayStr = String(d).padStart(2);
          if (d === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {
            line += `${ANSI.bgBlue}${ANSI.white}${dayStr}${ANSI.reset} `;
          } else {
            line += dayStr + ' ';
          }
          if ((firstDay + d) % 7 === 0) { out += '\n' + line; line = ''; }
        }
        if (line.trim()) out += '\n' + line;
        this.lastExitCode = 0;
        return out;
      }

      case 'uptime': {
        const ms = performance.now();
        const sec = Math.floor(ms / 1000);
        const min = Math.floor(sec / 60);
        const hrs = Math.floor(min / 60);
        const now = new Date();
        this.lastExitCode = 0;
        return ` ${now.toLocaleTimeString()} up ${hrs}:${String(min % 60).padStart(2, '0')},  1 user,  load average: 0.${Math.floor(Math.random()*99)}, 0.${Math.floor(Math.random()*99)}, 0.${Math.floor(Math.random()*99)}`;
      }

      case 'whoami':
        this.lastExitCode = 0;
        return this.userName;

      case 'id': {
        const uid = this.isAdmin ? 0 : 1000;
        const gid = this.isAdmin ? 0 : 1000;
        const uname = this.isAdmin ? 'root' : this.userName;
        const gname = this.isAdmin ? 'root' : 'staff';
        this.lastExitCode = 0;
        return `uid=${uid}(${uname}) gid=${gid}(${gname}) groups=${gid}(${gname})`;
      }

      case 'hostname':
        this.lastExitCode = 0;
        return flags.f ? 'workbench.local' : 'workbench';

      case 'uname': {
        if (flags.a) return 'Linux workbench 6.1.0-wbt #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
        if (flags.r) return '6.1.0-wbt';
        if (flags.m) return 'x86_64';
        if (flags.n) return 'workbench';
        if (flags.s) return 'Linux';
        if (flags.v) return '#1 SMP PREEMPT_DYNAMIC';
        this.lastExitCode = 0;
        return 'Linux';
      }

      case 'env':
      case 'printenv': {
        if (positional[0]) { this.lastExitCode = 0; return this.env[positional[0]] || ''; }
        this.lastExitCode = 0;
        return Object.entries(this.env).map(([k, v]) => `${k}=${v}`).join('\n');
      }

      case 'export': {
        if (!argsStr) return Object.entries(this.env).map(([k, v]) => `declare -x ${k}="${v}"`).join('\n');
        const match = argsStr.match(/^(\w+)=(.*)$/);
        if (match) { this.env[match[1]] = match[2].replace(/^["']|["']$/g, ''); this.lastExitCode = 0; return ''; }
        this.lastExitCode = 1;
        return `${ANSI.red}bash: export: invalid format${ANSI.reset}`;
      }

      case 'unset': {
        if (positional[0]) delete this.env[positional[0]];
        this.lastExitCode = 0;
        return '';
      }

      case 'set': {
        this.lastExitCode = 0;
        return Object.entries(this.env).map(([k, v]) => `${k}='${v}'`).join('\n');
      }

      case 'alias': {
        if (!argsStr) return Object.entries(this.aliases).map(([k, v]) => `alias ${k}='${v}'`).join('\n');
        const match = argsStr.match(/^(\w+)=['"]?(.+?)['"]?$/);
        if (match) { this.aliases[match[1]] = match[2]; this.lastExitCode = 0; return ''; }
        if (this.aliases[argsStr]) return `alias ${argsStr}='${this.aliases[argsStr]}'`;
        this.lastExitCode = 1;
        return `${ANSI.red}bash: alias: ${argsStr}: not found${ANSI.reset}`;
      }

      case 'unalias': {
        if (positional[0]) { delete this.aliases[positional[0]]; this.lastExitCode = 0; return ''; }
        this.lastExitCode = 1;
        return `${ANSI.red}unalias: missing argument${ANSI.reset}`;
      }

      case 'type': {
        const name = positional[0];
        if (!name) return `${ANSI.red}type: missing argument${ANSI.reset}`;
        if (this.aliases[name]) return `${name} is aliased to '${this.aliases[name]}'`;
        if (BUILTIN_COMMANDS.includes(name)) return `${name} is a shell builtin`;
        this.lastExitCode = 0;
        return `${name}: not found`;
      }

      case 'which': {
        const name = positional[0];
        if (!name) return '';
        if (BUILTIN_COMMANDS.includes(name)) return `/usr/bin/${name}`;
        this.lastExitCode = 1;
        return `${name} not found`;
      }

      case 'history': {
        if (flags.c) { this.history = []; this.lastExitCode = 0; return 'History cleared'; }
        const n = positional[0] ? parseInt(positional[0]) : this.history.length;
        const start = Math.max(0, this.history.length - n);
        this.lastExitCode = 0;
        return this.history.slice(start).map((h, i) => `${ANSI.dim}${String(start + i + 1).padStart(5)}${ANSI.reset}  ${h}`).join('\n');
      }

      case 'free': {
        const total = 16384;
        const used = Math.floor(Math.random() * 8000) + 4000;
        const free = total - used;
        const cached = Math.floor(Math.random() * 3000) + 1000;
        let out = '              total        used        free      shared  buff/cache   available';
        out += `\nMem:       ${String(total).padStart(8)}    ${String(used).padStart(8)}    ${String(free).padStart(8)}        ${String(256).padStart(4)}      ${String(cached).padStart(6)}    ${String(free + cached).padStart(8)}`;
        out += `\nSwap:          4096           0        4096`;
        this.lastExitCode = 0;
        return out;
      }

      case 'df': {
        let out = 'Filesystem     1K-blocks      Used Available Use% Mounted on';
        out += '\n/dev/sda1      104857600  52428800  52428800  50% /';
        out += '\ntmpfs            8388608         0   8388608   0% /dev/shm';
        out += '\n/dev/sda2       52428800  26214400  26214400  50% /filexplorer';
        this.lastExitCode = 0;
        return out;
      }

      case 'top':
      case 'ps': {
        if (cmd === 'ps') {
          let out = `${ANSI.bold}  PID TTY          TIME CMD${ANSI.reset}`;
          out += '\n    1 pts/0    00:00:00 bash';
          out += '\n    2 pts/0    00:00:00 workbench';
          out += `\n    3 pts/0    00:00:00 ${cmd}`;
          if (flags.a || flags.e || flags.aux) {
            out += '\n    4 ?        00:00:01 systemd';
            out += '\n    5 ?        00:00:00 kthreadd';
            out += '\n    6 ?        00:00:00 nginx';
            out += '\n    7 ?        00:00:03 php-fpm';
            out += '\n    8 ?        00:00:00 cron';
          }
          this.lastExitCode = 0;
          return out;
        }
        const now = new Date();
        let out = `${ANSI.bold}top - ${now.toLocaleTimeString()} up 1:00, 1 user, load average: 0.15, 0.10, 0.05${ANSI.reset}`;
        out += '\nTasks:   5 total,   1 running,   4 sleeping,   0 stopped,   0 zombie';
        out += `\n%Cpu(s):  2.3 us,  0.7 sy,  0.0 ni, 96.8 id,  0.1 wa,  0.0 hi,  0.1 si`;
        out += `\nMiB Mem :  16384.0 total,   8192.0 free,   4096.0 used,   4096.0 buff/cache`;
        out += `\n\n${ANSI.bold}  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND${ANSI.reset}`;
        out += '\n    1 root      20   0  169112  12456   8340 S   0.0   0.1   0:01.50 systemd';
        out += '\n    2 www-data  20   0  325420  65200  45000 S   1.2   0.4   0:03.20 php-fpm';
        out += '\n    3 www-data  20   0  142856  18400  11200 S   0.3   0.1   0:00.80 nginx';
        this.lastExitCode = 0;
        return out;
      }

      case 'kill': {
        this.lastExitCode = 0;
        return `${ANSI.yellow}kill: simulated — no real processes to kill${ANSI.reset}`;
      }

      case 'expr': {
        try {
          const expression = raw.join(' ');
          const sanitized = expression.replace(/[^0-9+\-*/%() ]/g, '');
          const result = new Function(`return ${sanitized.replace(/\*/g, '*')}`)();
          this.lastExitCode = 0;
          return String(result);
        } catch { this.lastExitCode = 2; return `${ANSI.red}expr: syntax error${ANSI.reset}`; }
      }

      case 'bc': {
        let content = pipeInput;
        if (!content) return `${ANSI.yellow}bc: interactive mode not supported. Use pipes: echo "2+2" | bc${ANSI.reset}`;
        try {
          const lines = content.split('\n').filter(Boolean);
          const results = lines.map(l => {
            const sanitized = l.replace(/[^0-9+\-*/%().^ ]/g, '').replace(/\^/g, '**');
            return String(new Function(`return ${sanitized}`)());
          });
          this.lastExitCode = 0;
          return results.join('\n');
        } catch { this.lastExitCode = 1; return `${ANSI.red}(standard_in) syntax error${ANSI.reset}`; }
      }

      case 'factor': {
        if (!positional[0]) return `${ANSI.red}factor: missing operand${ANSI.reset}`;
        const n = parseInt(positional[0]);
        if (isNaN(n) || n < 2) return `${positional[0]}:`;
        const factors = [];
        let num = n;
        for (let i = 2; i <= Math.sqrt(num); i++) { while (num % i === 0) { factors.push(i); num /= i; } }
        if (num > 1) factors.push(num);
        this.lastExitCode = 0;
        return `${n}: ${factors.join(' ')}`;
      }

      case 'seq': {
        let start = 1, inc = 1, end;
        if (positional.length === 1) end = parseInt(positional[0]);
        else if (positional.length === 2) { start = parseInt(positional[0]); end = parseInt(positional[1]); }
        else if (positional.length >= 3) { start = parseInt(positional[0]); inc = parseInt(positional[1]); end = parseInt(positional[2]); }
        if (isNaN(end)) return `${ANSI.red}seq: missing operand${ANSI.reset}`;
        const result = [];
        const sep = flags.s || '\n';
        if (inc > 0) { for (let i = start; i <= end; i += inc) result.push(i); }
        else { for (let i = start; i >= end; i += inc) result.push(i); }
        this.lastExitCode = 0;
        return result.join(sep === '\n' ? '\n' : sep);
      }

      case 'shuf': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (res.success) content = res.content;
        }
        if (flags.i) {
          const [lo, hi] = flags.i.split('-').map(Number);
          const arr = [];
          for (let i = lo; i <= hi; i++) arr.push(i);
          for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
          const n = flags.n ? parseInt(flags.n) : arr.length;
          this.lastExitCode = 0;
          return arr.slice(0, n).join('\n');
        }
        if (!content) return '';
        const lines = content.split('\n');
        for (let i = lines.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [lines[i], lines[j]] = [lines[j], lines[i]]; }
        this.lastExitCode = 0;
        return lines.join('\n');
      }

      case 'base64': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (res.success) content = res.content;
        }
        if (!content) return '';
        if (flags.d || flags.decode) {
          try { this.lastExitCode = 0; return atob(content.trim()); }
          catch { this.lastExitCode = 1; return `${ANSI.red}base64: invalid input${ANSI.reset}`; }
        }
        this.lastExitCode = 0;
        return btoa(content);
      }

      case 'md5sum':
      case 'sha256sum':
      case 'sha1sum': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (res.success) content = res.content;
        }
        if (!content) return `${ANSI.red}${cmd}: missing operand${ANSI.reset}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const algo = cmd === 'md5sum' ? 'SHA-1' : cmd === 'sha1sum' ? 'SHA-1' : 'SHA-256';
        try {
          const hashBuffer = await crypto.subtle.digest(algo, data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          this.lastExitCode = 0;
          return `${hashHex}  ${positional[0] || '-'}`;
        } catch { return `${ANSI.yellow}${cmd}: hash computation not available in this environment${ANSI.reset}`; }
      }

      case 'yes': {
        const text = argsStr || 'y';
        this.lastExitCode = 0;
        return Array(20).fill(text).join('\n') + `\n${ANSI.dim}... (truncated)${ANSI.reset}`;
      }

      case 'sleep': {
        const secs = parseFloat(positional[0]) || 1;
        const actual = Math.min(secs, 5);
        await new Promise(r => setTimeout(r, actual * 1000));
        if (secs > 5) return `${ANSI.dim}(slept ${actual}s of requested ${secs}s — capped at 5s)${ANSI.reset}`;
        this.lastExitCode = 0;
        return '';
      }

      case 'true': this.lastExitCode = 0; return '';
      case 'false': this.lastExitCode = 1; return '';

      case 'test': {
        if (raw.length === 0) { this.lastExitCode = 1; return ''; }
        const op = raw[1];
        if (op === '-eq') { this.lastExitCode = parseInt(raw[0]) === parseInt(raw[2]) ? 0 : 1; return ''; }
        if (op === '-ne') { this.lastExitCode = parseInt(raw[0]) !== parseInt(raw[2]) ? 0 : 1; return ''; }
        if (op === '-gt') { this.lastExitCode = parseInt(raw[0]) > parseInt(raw[2]) ? 0 : 1; return ''; }
        if (op === '-lt') { this.lastExitCode = parseInt(raw[0]) < parseInt(raw[2]) ? 0 : 1; return ''; }
        if (op === '-ge') { this.lastExitCode = parseInt(raw[0]) >= parseInt(raw[2]) ? 0 : 1; return ''; }
        if (op === '-le') { this.lastExitCode = parseInt(raw[0]) <= parseInt(raw[2]) ? 0 : 1; return ''; }
        if (op === '=') { this.lastExitCode = raw[0] === raw[2] ? 0 : 1; return ''; }
        if (op === '!=') { this.lastExitCode = raw[0] !== raw[2] ? 0 : 1; return ''; }
        if (raw[0] === '-z') { this.lastExitCode = (raw[1] || '').length === 0 ? 0 : 1; return ''; }
        if (raw[0] === '-n') { this.lastExitCode = (raw[1] || '').length > 0 ? 0 : 1; return ''; }
        this.lastExitCode = raw[0] ? 0 : 1;
        return '';
      }

      case 'realpath': {
        this.lastExitCode = 0;
        return positional[0] ? this.resolvePath(positional[0]) : this.cwd;
      }
      case 'basename': {
        if (!positional[0]) return '';
        const parts = positional[0].replace(/\/+$/, '').split('/');
        this.lastExitCode = 0;
        return parts[parts.length - 1] || '';
      }
      case 'dirname': {
        if (!positional[0]) return '.';
        const parts = positional[0].replace(/\/+$/, '').split('/');
        parts.pop();
        this.lastExitCode = 0;
        return parts.join('/') || '/';
      }

      case 'download': {
        if (!positional[0]) return `${ANSI.red}download: usage: download <file>${ANSI.reset}`;
        const fullPath = this.resolvePath(positional[0]);
        const apiPath = this.stripPath(fullPath);
        const url = `/api/filexplorer.php?action=downloadFile&path=${encodeURIComponent(apiPath)}`;
        const a = document.createElement('a');
        a.href = url; a.download = positional[0].split('/').pop(); a.click();
        this.lastExitCode = 0;
        return `${ANSI.green}Downloading: ${positional[0]}${ANSI.reset}`;
      }

      case 'neofetch':
      case 'screenfetch': {
        const art = [
          `${ANSI.brightBlue}        _____        `,
          `${ANSI.brightBlue}       /     \\       `,
          `${ANSI.brightBlue}      | () () |      `,
          `${ANSI.brightBlue}      |  ___  |      `,
          `${ANSI.brightBlue}      | |   | |      `,
          `${ANSI.brightBlue}      |_|   |_|      `,
          `${ANSI.brightBlue}     /  WB    \\     `,
          `${ANSI.brightBlue}    /___________\\    `,
        ];
        const info = [
          `${ANSI.brightGreen}${ANSI.bold}${this.userName}${ANSI.reset}@${ANSI.brightGreen}${ANSI.bold}workbench${ANSI.reset}`,
          `${ANSI.dim}${'─'.repeat(30)}${ANSI.reset}`,
          `${ANSI.brightBlue}OS:${ANSI.reset} WorkBench Linux 6.1.0`,
          `${ANSI.brightBlue}Host:${ANSI.reset} Web Terminal v${VERSION}`,
          `${ANSI.brightBlue}Kernel:${ANSI.reset} 6.1.0-wbt`,
          `${ANSI.brightBlue}Shell:${ANSI.reset} bash 5.2.21`,
          `${ANSI.brightBlue}Terminal:${ANSI.reset} xterm-256color`,
          `${ANSI.brightBlue}CPU:${ANSI.reset} WebAssembly vCPU @ ${navigator.hardwareConcurrency || 4} cores`,
          `${ANSI.brightBlue}Memory:${ANSI.reset} ${Math.floor(Math.random() * 4000 + 2000)}MiB / 16384MiB`,
          `${ANSI.brightBlue}Role:${ANSI.reset} ${this.isAdmin ? `${ANSI.brightRed}Administrator${ANSI.reset}` : 'User'}`,
          '',
          `${ANSI.bgRed}  ${ANSI.bgGreen}  ${ANSI.bgBlue}  ${ANSI.yellow}  ${ANSI.brightMagenta}  ${ANSI.brightCyan}  ${ANSI.white}  ${ANSI.reset}`,
        ];
        const maxLines = Math.max(art.length, info.length);
        let out = '';
        for (let i = 0; i < maxLines; i++) {
          const left = art[i] || ' '.repeat(22);
          const right = info[i] || '';
          out += (i > 0 ? '\n' : '') + left + '  ' + right;
        }
        this.lastExitCode = 0;
        return out;
      }

      case 'cowsay': {
        const text = argsStr || 'moo';
        const border = '─'.repeat(text.length + 2);
        let out = ` ┌${border}┐`;
        out += `\n │ ${text} │`;
        out += `\n └${border}┘`;
        out += '\n        \\   ^__^';
        out += '\n         \\  (oo)\\_______';
        out += '\n            (__)\\       )\\/\\';
        out += '\n                ||----w |';
        out += '\n                ||     ||';
        this.lastExitCode = 0;
        return out;
      }

      case 'fortune': {
        const fortunes = [
          'The best way to predict the future is to invent it. — Alan Kay',
          'Talk is cheap. Show me the code. — Linus Torvalds',
          'Any sufficiently advanced technology is indistinguishable from magic. — Arthur C. Clarke',
          'First, solve the problem. Then, write the code. — John Johnson',
          'The only way to do great work is to love what you do. — Steve Jobs',
          'Simplicity is the soul of efficiency. — Austin Freeman',
          'Programs must be written for people to read. — Harold Abelson',
          'In theory, there is no difference between theory and practice. In practice, there is. — Yogi Berra',
        ];
        this.lastExitCode = 0;
        return fortunes[Math.floor(Math.random() * fortunes.length)];
      }

      case 'figlet': {
        const text = argsStr || 'Hello';
        const big = text.toUpperCase().split('').map(c => {
          if (c === ' ') return ['     ', '     ', '     ', '     ', '     '];
          return [
            ` ${c}${c}${c} `,
            `${c}   ${c}`,
            `${c}${c}${c}${c}${c}`,
            `${c}   ${c}`,
            `${c}   ${c}`,
          ];
        });
        let out = '';
        for (let row = 0; row < 5; row++) {
          out += (row > 0 ? '\n' : '') + big.map(c => c[row]).join(' ');
        }
        this.lastExitCode = 0;
        return `${ANSI.brightYellow}${out}${ANSI.reset}`;
      }

      case 'man':
      case 'info':
      case 'whatis':
      case 'apropos': {
        const topic = positional[0];
        if (!topic) return `What manual page do you want?\nFor example, try 'man ls'`;
        const manPages = {
          ls: 'ls - list directory contents\n\nSYNOPSIS: ls [OPTION]... [FILE]...\n\nOPTIONS:\n  -a  do not ignore entries starting with .\n  -l  use a long listing format\n  -h  with -l, print human readable sizes\n  -S  sort by file size, largest first\n  -t  sort by time, newest first\n  -r  reverse order\n  -R  list subdirectories recursively\n  -1  list one file per line\n  -F  classify (append / to dirs)',
          cd: 'cd - change the working directory\n\nSYNOPSIS: cd [dir]\n\n  cd ..    go to parent directory\n  cd ~     go to home directory\n  cd -     go to previous directory',
          cat: 'cat - concatenate files and print on the standard output\n\nSYNOPSIS: cat [OPTION]... [FILE]...\n\nOPTIONS:\n  -n  number all output lines\n  -b  number nonempty output lines',
          grep: 'grep - print lines that match patterns\n\nSYNOPSIS: grep [OPTION]... PATTERNS [FILE]...\n\nOPTIONS:\n  -i  ignore case\n  -v  invert match\n  -n  show line numbers\n  -c  count matches\n  -o  only matching',
          find: 'find - search for files in a directory hierarchy\n\nSYNOPSIS: find [path] [options]\n\nOPTIONS:\n  -name PATTERN  match filename\n  -iname PATTERN match filename case-insensitive\n  -type f|d  match file type\n  -maxdepth N  limit depth',
        };
        if (manPages[topic]) return `${ANSI.bold}${topic.toUpperCase()}(1)${ANSI.reset}\n\n${manPages[topic]}`;
        this.lastExitCode = 0;
        return `No manual entry for ${topic}`;
      }

      case 'ping': {
        const host = positional[0];
        if (!host) return `${ANSI.red}ping: missing host${ANSI.reset}`;
        const count = flags.c ? parseInt(flags.c) : 4;
        let out = `PING ${host} (${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}) 56(84) bytes of data.`;
        for (let i = 0; i < Math.min(count, 8); i++) {
          const time = (Math.random() * 50 + 5).toFixed(3);
          out += `\n64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=${time} ms`;
        }
        out += `\n\n--- ${host} ping statistics ---`;
        out += `\n${count} packets transmitted, ${count} received, 0% packet loss`;
        this.lastExitCode = 0;
        return out;
      }

      case 'curl':
      case 'wget': {
        const url = positional[0];
        if (!url) return `${ANSI.red}${cmd}: missing URL${ANSI.reset}`;
        this.lastExitCode = 0;
        return `${ANSI.yellow}${cmd}: network requests simulated in this environment${ANSI.reset}\n${ANSI.dim}Target: ${url}${ANSI.reset}`;
      }

      case 'ifconfig':
      case 'ip': {
        let out = `${ANSI.bold}lo:${ANSI.reset} flags=73<UP,LOOPBACK,RUNNING>  mtu 65536`;
        out += '\n        inet 127.0.0.1  netmask 255.0.0.0';
        out += '\n        inet6 ::1  prefixlen 128  scopeid 0x10<host>';
        out += `\n\n${ANSI.bold}eth0:${ANSI.reset} flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`;
        out += '\n        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255';
        out += '\n        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>';
        out += '\n        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)';
        this.lastExitCode = 0;
        return out;
      }

      case 'nslookup':
      case 'dig': {
        const domain = positional[0] || 'localhost';
        this.lastExitCode = 0;
        return `Server:\t\t8.8.8.8\nAddress:\t8.8.8.8#53\n\nNon-authoritative answer:\nName:\t${domain}\nAddress: ${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
      }

      case 'netstat':
      case 'ss': {
        let out = `${ANSI.bold}Proto  Recv-Q Send-Q Local Address          Foreign Address        State${ANSI.reset}`;
        out += '\ntcp         0      0 0.0.0.0:80             0.0.0.0:*              LISTEN';
        out += '\ntcp         0      0 0.0.0.0:443            0.0.0.0:*              LISTEN';
        out += '\ntcp         0      0 127.0.0.1:3306         0.0.0.0:*              LISTEN';
        out += '\ntcp         0      0 10.0.2.15:443          185.24.68.1:52340      ESTABLISHED';
        this.lastExitCode = 0;
        return out;
      }

      case 'traceroute': {
        const host = positional[0] || 'localhost';
        let out = `traceroute to ${host}, 30 hops max, 60 byte packets`;
        for (let i = 1; i <= 5; i++) {
          const time = (Math.random() * 20 + 1).toFixed(3);
          out += `\n ${i}  ${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}  ${time} ms  ${time} ms  ${time} ms`;
        }
        this.lastExitCode = 0;
        return out;
      }

      case 'tar':
      case 'gzip':
      case 'gunzip':
      case 'zip':
      case 'unzip':
      case 'bzip2':
      case 'xz':
        this.lastExitCode = 0;
        return `${ANSI.yellow}${cmd}: archive operations are simulated in this environment${ANSI.reset}`;

      case 'less':
      case 'more': {
        if (!positional[0] && !pipeInput) return `${ANSI.red}${cmd}: missing filename${ANSI.reset}`;
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (!res.success) return `${ANSI.red}${cmd}: ${positional[0]}: ${res.error}${ANSI.reset}`;
          content = res.content;
        }
        this.lastExitCode = 0;
        return content;
      }

      case 'xxd': {
        let content = pipeInput;
        if (!content && positional[0]) {
          const res = await this.execRemote('readFile', { path: this.stripPath(this.resolvePath(positional[0])) });
          if (res.success) content = res.content;
        }
        if (!content) return '';
        const bytes = new TextEncoder().encode(content);
        let out = '';
        for (let i = 0; i < Math.min(bytes.length, 256); i += 16) {
          const hex = Array.from(bytes.slice(i, i + 16)).map(b => b.toString(16).padStart(2, '0')).join(' ');
          const ascii = Array.from(bytes.slice(i, i + 16)).map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
          out += (out ? '\n' : '') + `${ANSI.dim}${i.toString(16).padStart(8, '0')}${ANSI.reset}: ${hex.padEnd(48)}  ${ANSI.green}${ascii}${ANSI.reset}`;
        }
        if (bytes.length > 256) out += `\n${ANSI.dim}... (${bytes.length - 256} more bytes)${ANSI.reset}`;
        this.lastExitCode = 0;
        return out;
      }

      case 'open':
      case 'preview': {
        if (!positional[0]) return `${ANSI.red}${cmd}: missing filename${ANSI.reset}`;
        const fullPath = this.resolvePath(positional[0]);
        const apiPath = this.stripPath(fullPath);
        window.open(`/filexplorer/${apiPath}`, '_blank');
        this.lastExitCode = 0;
        return `${ANSI.green}Opening: ${positional[0]}${ANSI.reset}`;
      }

      case 'vim':
      case 'nano':
      case 'vi':
      case 'emacs':
        this.lastExitCode = 0;
        return `${ANSI.yellow}${cmd}: interactive editors are not available in web terminal${ANSI.reset}\n${ANSI.dim}Use 'cat' to view files or redirect with '>' to write (admin only)${ANSI.reset}`;

      case 'git':
      case 'svn':
      case 'docker':
      case 'kubectl':
      case 'terraform':
      case 'ansible':
      case 'make':
      case 'gcc':
      case 'g++':
      case 'python':
      case 'python3':
      case 'node':
      case 'npm':
      case 'php':
      case 'ruby':
      case 'perl':
      case 'apt':
      case 'yum':
      case 'dnf':
      case 'pacman':
      case 'brew':
      case 'snap':
      case 'flatpak':
      case 'pip':
      case 'gem':
      case 'cargo':
      case 'ssh':
      case 'scp':
      case 'rsync':
      case 'ftp':
      case 'telnet':
      case 'crontab':
      case 'at':
      case 'systemctl':
      case 'service':
      case 'journalctl':
      case 'useradd':
      case 'userdel':
      case 'usermod':
      case 'groupadd':
      case 'passwd':
      case 'lsblk':
      case 'mount':
      case 'umount':
      case 'fdisk':
      case 'blkid':
      case 'mktemp':
      case 'sync':
      case 'nohup':
      case 'timeout':
      case 'watch':
      case 'tput':
      case 'stty':
      case 'script':
      case 'sl':
      case 'cmatrix':
      case 'lolcat':
        this.lastExitCode = 127;
        return `${ANSI.yellow}${cmd}: not available in web terminal environment${ANSI.reset}\n${ANSI.dim}This command requires a real Linux shell.${ANSI.reset}`;

      default:
        this.lastExitCode = 127;
        return `${ANSI.red}bash: ${cmd}: command not found${ANSI.reset}`;
    }
  }

  async tabComplete(input) {
    const parts = input.split(/\s+/);
    const isFirstWord = parts.length <= 1;
    const partial = parts[parts.length - 1] || '';

    if (isFirstWord) {
      const matches = BUILTIN_COMMANDS.filter(c => c.startsWith(partial));
      if (matches.length === 1) return matches[0] + ' ';
      if (matches.length > 1) return matches;
      return null;
    }

    const pathPart = partial;
    let dirPath, filePrefix;
    if (pathPart.includes('/')) {
      const lastSlash = pathPart.lastIndexOf('/');
      dirPath = this.resolvePath(pathPart.slice(0, lastSlash + 1) || '/');
      filePrefix = pathPart.slice(lastSlash + 1);
    } else {
      dirPath = this.cwd;
      filePrefix = pathPart;
    }

    const items = await this.fetchDir(dirPath);
    if (!items) return null;

    const matches = items.filter(i => i.name.startsWith(filePrefix));
    if (matches.length === 0) return null;
    if (matches.length === 1) {
      const baseParts = parts.slice(0, -1);
      const prefix = pathPart.includes('/') ? pathPart.slice(0, pathPart.lastIndexOf('/') + 1) : '';
      const completion = prefix + matches[0].name + (matches[0].isDir ? '/' : ' ');
      baseParts.push(completion);
      return baseParts.join(' ');
    }

    return matches.map(m => m.name);
  }
}


const TerminalApp = ({ winId }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const emulatorRef = useRef(null);
  const inputBufferRef = useRef('');
  const cursorPosRef = useRef(0);
  const { isAdmin, wbUser, closeWindow } = useWorkbench();

  const handleExit = useCallback(() => {
    if (closeWindow) closeWindow(winId || 'terminal');
  }, [closeWindow, winId]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      letterSpacing: 0,
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        cursorAccent: '#1a1b26',
        selectionBackground: 'rgba(73, 110, 155, 0.5)',
        selectionForeground: '#ffffff',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5',
      },
      allowProposedApi: true,
      scrollback: 5000,
      tabStopWidth: 4,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.loadAddon(searchAddon);

    term.open(terminalRef.current);

    setTimeout(() => {
      try { fitAddon.fit(); } catch {}
    }, 100);

    const userName = wbUser?.full_name || wbUser?.email?.split('@')[0] || 'user';
    const emulator = new BashEmulator(term, isAdmin, userName, handleExit);
    emulatorRef.current = emulator;
    xtermRef.current = term;

    for (const line of MOTD) {
      term.writeln(line);
    }
    emulator.writeFirstPrompt();

    let currentInput = '';
    let cursorPos = 0;

    const redrawInput = () => {
      const prompt = emulator.getPrompt();
      term.write('\r\x1b[K' + prompt + currentInput);
      const back = currentInput.length - cursorPos;
      if (back > 0) term.write(`\x1b[${back}D`);
    };

    term.onKey(({ key, domEvent }) => {
      const ev = domEvent;

      if (ev.ctrlKey && ev.key === 'c') {
        currentInput = '';
        cursorPos = 0;
        term.write('^C');
        emulator.writePrompt();
        return;
      }

      if (ev.ctrlKey && ev.key === 'l') {
        term.clear();
        term.write('\x1b[H\x1b[2J');
        term.write(emulator.getPrompt() + currentInput);
        return;
      }

      if (ev.ctrlKey && ev.key === 'a') {
        cursorPos = 0;
        redrawInput();
        return;
      }

      if (ev.ctrlKey && ev.key === 'e') {
        cursorPos = currentInput.length;
        redrawInput();
        return;
      }

      if (ev.ctrlKey && ev.key === 'u') {
        currentInput = currentInput.slice(cursorPos);
        cursorPos = 0;
        redrawInput();
        return;
      }

      if (ev.ctrlKey && ev.key === 'k') {
        currentInput = currentInput.slice(0, cursorPos);
        redrawInput();
        return;
      }

      if (ev.ctrlKey && ev.key === 'w') {
        const before = currentInput.slice(0, cursorPos);
        const after = currentInput.slice(cursorPos);
        const trimmed = before.replace(/\S+\s*$/, '');
        currentInput = trimmed + after;
        cursorPos = trimmed.length;
        redrawInput();
        return;
      }

      if (ev.ctrlKey && ev.key === 'd') {
        if (currentInput === '') {
          term.writeln('\r\nexit');
          handleExit();
          return;
        }
        if (cursorPos < currentInput.length) {
          currentInput = currentInput.slice(0, cursorPos) + currentInput.slice(cursorPos + 1);
          redrawInput();
        }
        return;
      }

      if (ev.keyCode === 13) {
        term.write('\r\n');
        const cmd = currentInput;
        currentInput = '';
        cursorPos = 0;
        if (cmd.trim()) {
          emulator.handleCommand(cmd).then(() => {
            emulator.writePrompt();
          });
        } else {
          emulator.writePrompt();
        }
        return;
      }

      if (ev.keyCode === 8) {
        if (cursorPos > 0) {
          currentInput = currentInput.slice(0, cursorPos - 1) + currentInput.slice(cursorPos);
          cursorPos--;
          redrawInput();
        }
        return;
      }

      if (ev.keyCode === 46) {
        if (cursorPos < currentInput.length) {
          currentInput = currentInput.slice(0, cursorPos) + currentInput.slice(cursorPos + 1);
          redrawInput();
        }
        return;
      }

      if (ev.keyCode === 38) {
        if (emulator.history.length > 0) {
          if (emulator.historyIndex === emulator.history.length) {
            emulator.currentInput = currentInput;
          }
          emulator.historyIndex = Math.max(0, emulator.historyIndex - 1);
          currentInput = emulator.history[emulator.historyIndex] || '';
          cursorPos = currentInput.length;
          redrawInput();
        }
        return;
      }

      if (ev.keyCode === 40) {
        if (emulator.historyIndex < emulator.history.length) {
          emulator.historyIndex++;
          if (emulator.historyIndex === emulator.history.length) {
            currentInput = emulator.currentInput || '';
          } else {
            currentInput = emulator.history[emulator.historyIndex] || '';
          }
          cursorPos = currentInput.length;
          redrawInput();
        }
        return;
      }

      if (ev.keyCode === 37) {
        if (cursorPos > 0) { cursorPos--; term.write('\x1b[D'); }
        return;
      }

      if (ev.keyCode === 39) {
        if (cursorPos < currentInput.length) { cursorPos++; term.write('\x1b[C'); }
        return;
      }

      if (ev.keyCode === 36) {
        cursorPos = 0;
        redrawInput();
        return;
      }

      if (ev.keyCode === 35) {
        cursorPos = currentInput.length;
        redrawInput();
        return;
      }

      if (ev.keyCode === 9) {
        ev.preventDefault();
        emulator.tabComplete(currentInput).then(result => {
          if (!result) return;
          if (typeof result === 'string') {
            currentInput = result;
            cursorPos = currentInput.length;
            redrawInput();
          } else if (Array.isArray(result)) {
            term.write('\r\n');
            const maxLen = Math.max(...result.map(r => r.length));
            const cols = Math.max(1, Math.floor(80 / (maxLen + 2)));
            for (let i = 0; i < result.length; i++) {
              term.write(result[i].padEnd(maxLen + 2));
              if ((i + 1) % cols === 0) term.write('\r\n');
            }
            if (result.length % cols !== 0) term.write('\r\n');
            term.write(emulator.getPrompt() + currentInput);
            const back = currentInput.length - cursorPos;
            if (back > 0) term.write(`\x1b[${back}D`);
          }
        });
        return;
      }

      if (!ev.altKey && !ev.ctrlKey && !ev.metaKey && key.length === 1) {
        currentInput = currentInput.slice(0, cursorPos) + key + currentInput.slice(cursorPos);
        cursorPos++;
        redrawInput();
      }
    });

    term.onData(data => {
      if (data.length > 1 && !data.startsWith('\x1b')) {
        for (const ch of data) {
          if (ch === '\r' || ch === '\n') continue;
          currentInput += ch;
          cursorPos++;
        }
        redrawInput();
      }
    });

    const handleResize = () => {
      try { fitAddon.fit(); } catch {}
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch {}
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      term.dispose();
    };
  }, [isAdmin, wbUser, handleExit]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#1a1b26',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div
        ref={terminalRef}
        style={{
          width: '100%',
          height: '100%',
          padding: '4px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

export default TerminalApp;