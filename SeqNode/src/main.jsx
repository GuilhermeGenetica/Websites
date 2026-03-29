import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './Router.jsx'

// StrictMode removido: causava double-mount dos useEffect em dev,
// resultando em duas ligações WebSocket e loop de reconexão infinito.
createRoot(document.getElementById('root')).render(<Router />)

