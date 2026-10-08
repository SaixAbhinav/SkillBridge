import { Link, NavLink, Outlet } from 'react-router-dom'
import { api } from './api'

async function resetDemo() {
  if (!window.confirm('Clear all posted projects, offers and certificates?')) return
  await api.reset()
  window.location.assign('/')
}

export default function App() {
  return (
    <>
      <header className="nav no-print">
        <Link to="/" className="wordmark">SkillBridge<span>ai</span></Link>
        <nav>
          <NavLink to="/students" className="navlink">Students</NavLink>
          <Link to="/post" className="btn primary sm">Post a project</Link>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
      <footer className="footer no-print">
        <span>SkillBridge AI, a course prototype. Payments are simulated.</span>
        <button type="button" className="link" onClick={resetDemo}>Reset demo data</button>
      </footer>
    </>
  )
}
