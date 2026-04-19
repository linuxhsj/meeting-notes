import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LangProvider, LangContext, t } from './i18n'
import RecordPage from './pages/RecordPage'
import NotesPage from './pages/NotesPage'
import HistoryPage from './pages/HistoryPage'
import { useContext } from 'react'

function LangToggle() {
  const { lang, toggle } = useContext(LangContext)
  return (
    <button
      onClick={toggle}
      className="ml-auto mr-3 px-3 py-1 text-xs rounded border border-gray-200 hover:bg-gray-100 transition-colors"
    >
      {lang === 'en' ? '中文' : 'EN'}
    </button>
  )
}

function AppInner() {
  const { lang } = useContext(LangContext)
  return (
    <div className="flex h-screen bg-white">
      {/* 左侧导航 */}
      <nav className="w-48 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="text-xl">🎙</span>
          <span className="font-semibold text-sm text-text-primary">{t(lang, 'app.title')}</span>
          <LangToggle />
        </div>
        {/* Nav Items */}
        <div className="flex-1 py-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 mx-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-gray-100'
              }`
            }
          >
            <span>🎤</span> {t(lang, 'nav.record')}
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 mx-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-gray-100'
              }`
            }
          >
            <span>📂</span> {t(lang, 'nav.history')}
          </NavLink>
        </div>
        {/* 底部版本 */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted">
            <span>v1.0.0</span>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<RecordPage />} />
          <Route path="/notes/:id" element={<NotesPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AppInner />
      </LangProvider>
    </BrowserRouter>
  )
}

export default App
