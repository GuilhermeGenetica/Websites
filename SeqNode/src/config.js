/**
 * config.js — SeqNode-OS Frontend Configuration
 *
 * Único ficheiro que conhece o endereço do backend.
 * Para apontar para uma VPS remota, definir as variáveis de ambiente:
 *   VITE_API_URL=http://SEU-VPS-IP:8000
 *   VITE_WS_URL=ws://SEU-VPS-IP:8000/ws
 *
 * Em desenvolvimento local (.env.local), as variáveis não são necessárias —
 * os defaults abaixo apontam para localhost:8000.
 */

// Se VITE_API_URL estiver definido (mesmo como string vazia), usa esse valor.
// String vazia = modo proxy PHP relativo (produção na Hostinger).
// Undefined (variável não definida) = fallback para localhost:8000 (dev local).
const _rawApi  = import.meta.env.VITE_API_URL;
const _rawWs   = import.meta.env.VITE_WS_URL;
const _rawAuth = import.meta.env.VITE_AUTH_URL;
export const API_URL  = (_rawApi  !== undefined) ? _rawApi  : "http://localhost:8000";
export const WS_URL   = (_rawWs   !== undefined) ? _rawWs   : "ws://localhost:8000/ws";
// AUTH_URL aponta para o backend PHP em /api/ (mesmo domínio na Hostinger)
export const AUTH_URL = (_rawAuth !== undefined) ? _rawAuth : "/api";


