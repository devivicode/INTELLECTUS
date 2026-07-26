import { useState } from 'react'
import Layout, { type Page } from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import CaseDetails from './pages/CaseDetails'
import AIAssistant from './pages/AIAssistant'
import Analytics from './pages/Analytics'
import VoiceAssistant from './pages/AIAssistant'
import Settings from './pages/Setting'
import Admin from './pages/Admin'
import ToastContainer from './components/Toast'
import type { FIR } from './data/mockData'
import type { Lang } from './utils/translations'

const NO_LAYOUT_PAGES: Page[] = ['landing']

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [pageData, setPageData] = useState<unknown>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [lang, setLang] = useState<Lang>('en')

  function navigate(target: Page, data?: unknown) {
    setPage(target)
    if (data !== undefined) setPageData(data)
    window.scrollTo(0, 0)
  }

  const needsLayout = !NO_LAYOUT_PAGES.includes(page)

  function renderPage() {
    switch (page) {
      case 'landing':
        return <Landing onNavigate={navigate} lang={lang} />
      case 'dashboard':
        return <Dashboard onNavigate={navigate} darkMode={darkMode} lang={lang} />
      case 'search':
        return <Search onNavigate={navigate} darkMode={darkMode} lang={lang} initialQuery={(pageData as { query?: string })?.query ?? ''} />
      case 'case-details':
        return <CaseDetails fir={pageData as FIR | null} onNavigate={navigate} darkMode={darkMode} />
      case 'ai-assistant':
        return <AIAssistant darkMode={darkMode} onNavigate={navigate} lang={lang} />
      case 'analytics':
        return <Analytics darkMode={darkMode} lang={lang} />
      case 'voice-assistant':
        return <VoiceAssistant darkMode={darkMode} lang={lang} />
      case 'settings':
        return <Settings darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />
      case 'admin':
        return <Admin darkMode={darkMode} lang={lang} />
      default:
        return <AIAssistant darkMode={darkMode} onNavigate={navigate} lang={lang} />
    }
  }

  if (!needsLayout) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        {renderPage()}
        <ToastContainer />
      </div>
    )
  }

  return (
    <>
      <Layout currentPage={page} onNavigate={navigate} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} lang={lang} onToggleLang={() => setLang(l => l === 'en' ? 'kn' : 'en')}>
        {renderPage()}
      </Layout>
      <ToastContainer />
    </>
  )
}
