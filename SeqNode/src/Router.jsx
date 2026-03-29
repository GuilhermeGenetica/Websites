/**
 * Router.jsx — SeqNode-OS Application Router
 * App.jsx is completely unchanged — mounted at /app inside a protected route.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth.js';
import App            from './App.jsx';
import Landing        from './pages/Landing.jsx';
import Login          from './pages/Login.jsx';
import Register       from './pages/Register.jsx';
import ForgotPassword      from './pages/ForgotPassword.jsx';
import ResetPassword       from './pages/ResetPassword.jsx';
import ResendVerification  from './pages/ResendVerification.jsx';
import VerifyEmail         from './pages/VerifyEmail.jsx';
import Help           from './pages/Help.jsx';
import LogoutButton   from './components/LogoutButton.jsx';

function ProtectedRoute({ children }) {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    return children;
}

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/"         element={<Landing  />} />
                <Route path="/login"    element={<Login    />} />
                <Route path="/register"         element={<Register       />} />
                <Route path="/forgot-password"       element={<ForgotPassword     />} />
                <Route path="/reset-password"        element={<ResetPassword      />} />
                <Route path="/resend-verification"   element={<ResendVerification />} />
                <Route path="/verify-email"          element={<VerifyEmail        />} />
                <Route path="/help"             element={<Help           />} />
                <Route path="/app"      element={
                    <ProtectedRoute>
                        <>
                            <App />
                            <LogoutButton />
                        </>
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
