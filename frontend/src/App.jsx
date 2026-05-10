import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { LayoutDashboard, Upload, BarChart3, FileText, Sparkles, Command, LogOut } from 'lucide-react'
import Dashboard from './pages/Dashboard.jsx'
import UploadPage from './pages/UploadPage.jsx'
import AnalyzePage from './pages/AnalyzePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'

const NAV = [
  { to: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/upload',    label: 'Upload',     Icon: Upload           },
  { to: '/analyze',   label: 'Analyze',    Icon: Sparkles         },
  { to: '/results',   label: 'Results',    Icon: BarChart3        },
]

export default function App() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-60 bg-gray-50 border-r border-gray-200 flex flex-col p-5 z-50">
        <div className="flex items-center gap-2.5 px-1 mb-8">
          <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center text-white shadow-sm">
            <Command size={14} strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold tracking-tight text-gray-900">RecruitAI</span>
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => 
                isActive ? 'nav-item-active' : 'nav-item'
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="pt-5 border-t border-gray-200 mt-auto space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase shadow-sm">
              {user?.username?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-gray-900 truncate">{user?.username}</div>
              <div className="text-[10px] text-gray-400 font-medium truncate uppercase tracking-tighter">Recruiter</div>
            </div>
            <button 
              onClick={logout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div>
            <div className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</div>
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] font-semibold text-gray-600">Secure Environment</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 ml-60 p-10">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/"        element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}  />
            <Route path="/upload"  element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/analyze" element={<ProtectedRoute><AnalyzePage /></ProtectedRoute>}/>
            <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>}/>
            <Route path="*"        element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
