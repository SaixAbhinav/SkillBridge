import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import SkillChips from '../components/SkillChips'

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [s, setS] = useState(null)
  const [offers, setOffers] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.student(id).then(setS).catch((e) => setError(e.message))
    api.studentOffers(id).then(setOffers).catch((e) => setError(e.message))
  }, [id])

  async function respond(projectId, accept) {
    setBusy(true)
    try {
      if (accept) {
        await api.accept(projectId, id)
        navigate(`/projects/${projectId}`)
      } else {
        await api.decline(projectId, id)
        setOffers(await api.studentOffers(id))
        setBusy(false)
      }
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!s) return <p className="muted">Loading profile…</p>

  const skills = Object.entries(s.skills).sort((a, b) => b[1] - a[1])

  return (
    <div className="narrow">
      {offers.length > 0 && (
        <div className="card highlight">
          <h2>Pending offers</h2>
          {offers.map(({ project, business }) => (
            <div className="portfolio-item" key={project.id}>
              <div>
                <strong>{project.title}</strong>
                <div className="small muted">
                  {business.name} · ₹{project.budget_inr.toLocaleString('en-IN')} · {project.duration_weeks} week(s)
                </div>
              </div>
              <div className="row">
                <button className="btn primary" disabled={busy} onClick={() => respond(project.id, true)}>Accept</button>
                <button className="btn" disabled={busy} onClick={() => respond(project.id, false)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h1>{s.name}</h1>
        <p className="muted">{s.college} · Year {s.year}</p>
        <p>{s.bio}</p>
        <p className="meta">
          {s.completed_projects > 0
            ? `★ ${s.rating} · ${s.completed_projects} projects completed`
            : 'New to SkillBridge, looking for a first project'}
          {' · '}{s.hours_per_week} hrs/week available
        </p>
      </div>

      <div className="card">
        <h2>Skills</h2>
        {skills.map(([skill, level]) => (
          <div className="skill-row" key={skill}>
            <span>{skill}</span>
            <div className="bar small-bar"><div style={{ width: `${level * 20}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Verified portfolio</h2>
        {s.portfolio.length === 0 && <p className="muted">No completed projects yet.</p>}
        {s.portfolio.map((p) => (
          <div className="portfolio-item" key={`${p.project_title}-${p.completed_on}`}>
            <div>
              <strong>{p.project_title}</strong>
              <div className="small muted">{p.business_name} · {p.completed_on}</div>
              <SkillChips skills={p.skills_used} />
            </div>
            {p.cert_id && <Link className="badge ai" to={`/certificate/${p.cert_id}`}>Verified ✓</Link>}
          </div>
        ))}
      </div>
    </div>
  )
}
