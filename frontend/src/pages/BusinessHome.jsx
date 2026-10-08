import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from '@phosphor-icons/react'
import { api } from '../api'
import SkillChips from '../components/SkillChips'
import { useSession } from '../session'
import { STATUS_LABEL, inr, shortDate } from '../format'

export default function BusinessHome() {
  const { businessId, business } = useSession()
  const [loaded, setLoaded] = useState({ forId: null, items: null })
  const [error, setError] = useState('')

  useEffect(() => {
    api.businessProjects(businessId)
      .then((items) => setLoaded({ forId: businessId, items }))
      .catch((e) => setError(e.message))
  }, [businessId])

  // Ignore results that belong to the previously selected business.
  const projects = loaded.forId === businessId ? loaded.items : null

  return (
    <div className="narrow">
      <div className="page-head row-between">
        <div>
          <h1>{business?.name ?? 'Your projects'}</h1>
          {business && <p className="muted">{business.type}, {business.city}</p>}
        </div>
        <Link className="btn primary" to="/post"><Plus size={16} weight="bold" /> Post a project</Link>
      </div>

      {error && <p className="error">{error}</p>}
      {!projects && !error && <div className="skeleton" />}

      {projects?.length === 0 && (
        <div className="empty">
          <h2>No projects yet</h2>
          <p className="muted">Describe what you need in plain words. We will work out the skills and suggest students.</p>
          <Link className="btn primary" to="/post">Post your first project</Link>
        </div>
      )}

      {projects?.length > 0 && (
        <div className="list">
          {projects.map((p, i) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="list-row reveal" style={{ '--i': i }}>
              <div className="grow">
                <div className="row-between">
                  <strong>{p.title}</strong>
                  <span className={`tag ${p.status === 'open' ? 'on' : ''}`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <div className="small muted">{inr(p.budget_inr)}, {p.duration_weeks} wk, posted {shortDate(p.created_at)}</div>
                <SkillChips skills={p.required_skills} />
              </div>
              <ArrowRight size={18} className="faint" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
