import { Link, NavLink, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <>
      <header className="nav no-print">
        <Link to="/" className="logo">Skill<span>Bridge</span> AI</Link>
        <nav>
          <NavLink to="/post">Post a project</NavLink>
          <NavLink to="/students">Students</NavLink>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}
