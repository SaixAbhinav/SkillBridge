import { Link, NavLink, Outlet } from 'react-router-dom'

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
        <span>SkillBridge AI, a course prototype</span>
        <span>Payments on this demo are simulated</span>
      </footer>
    </>
  )
}
