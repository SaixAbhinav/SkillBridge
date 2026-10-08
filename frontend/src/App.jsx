import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Plus } from '@phosphor-icons/react'
import { api } from './api'
import { homeFor, useSession } from './session'

async function resetDemo() {
  if (!window.confirm('Clear all posted projects, offers and certificates?')) return
  await api.reset()
  window.location.assign('/')
}

export default function App() {
  const session = useSession()
  const navigate = useNavigate()
  const isStudent = session.mode === 'student'

  function switchMode(mode) {
    session.update({ mode })
    navigate(homeFor(mode))
  }

  function switchPersona(id) {
    session.update(isStudent ? { studentId: id } : { businessId: id })
    navigate(homeFor(session.mode))
  }

  const people = isStudent ? session.students : session.businesses

  return (
    <>
      <header className="nav no-print">
        <div className="nav-left">
          <Link to="/" className="wordmark">SkillBridge<span>ai</span></Link>
          <div className="switch" role="group" aria-label="View as">
            <button type="button" aria-pressed={!isStudent} onClick={() => switchMode('business')}>Business</button>
            <button type="button" aria-pressed={isStudent} onClick={() => switchMode('student')}>Student</button>
          </div>
          <label className="persona">
            <span className="faint">as</span>
            <select
              value={isStudent ? session.studentId : session.businessId}
              onChange={(e) => switchPersona(e.target.value)}
              aria-label={isStudent ? 'Acting as student' : 'Acting as business'}
            >
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>
        <nav>
          {isStudent ? (
            <>
              <NavLink to="/student" className="navlink">Offers and work</NavLink>
              <NavLink to={`/students/${session.studentId}`} className="navlink">My profile</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/business" className="navlink">Your projects</NavLink>
              <NavLink to="/students" end className="navlink">Students</NavLink>
              <Link to="/post" className="btn primary sm"><Plus size={14} weight="bold" /> Post a project</Link>
            </>
          )}
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
