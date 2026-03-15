import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { WorkbenchProvider } from '@/contexts/WorkbenchContext'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const HomePage = lazy(() => import('@/pages/HomePage'))
const BlogPage = lazy(() => import('@/pages/BlogPage'))
const ArticlePage = lazy(() => import('@/pages/ArticlePage'))
const AdminLogin = lazy(() => import('@/pages/AdminLogin'))
const AdminPanel = lazy(() => import('@/pages/AdminPanel'))
const ArticleEditor = lazy(() => import('@/pages/ArticleEditor'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const WorkbenchLogin = lazy(() => import('@/pages/WorkbenchLogin'))
const WorkbenchDesktop = lazy(() => import('@/pages/WorkbenchDesktop'))

const PrivateRoute = lazy(() => import('@/components/PrivateRoute'))

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkbenchProvider>
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/index.html" element={<Navigate to="/" replace />} />

              <Route path="/blog" element={<BlogPage />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/contact" element={<ContactPage />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <PrivateRoute><AdminPanel /></PrivateRoute>
                </Suspense>
              } />
              <Route path="/admin/editor/:id?" element={
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <PrivateRoute><ArticleEditor /></PrivateRoute>
                </Suspense>
              } />

              <Route path="/workbench/login" element={<WorkbenchLogin />} />
              <Route path="/workbench" element={<WorkbenchDesktop />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </WorkbenchProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App