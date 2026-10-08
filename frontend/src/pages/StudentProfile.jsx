import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SealCheck } from '@phosphor-icons/react'
import { api } from '../api'
import SkillChips from '../components/SkillChips'
import { Avatar, Rating } from '../components/bits'
import { inr } from '../format'

const LEVELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert']

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

  if (error) return <div className="narrow"><p className="error">{error}</p></div>
  if (!s) return <div className="narrow"><div className="skeleton" /></div>

  const skills = Object.entries(s.skills).sort((a, b) => b[1] - a[1])

  return (
    <div className="narrow">
      {offers.map(({ project, business }) => (
        <div className="callout reveal" key={project.id}>
          <div className="row-between">
            <div>
              <p className="small muted">New offer from {business.name}</p>
              <h2>{project.title}</h2>
            </div>
            <div className="facts">
              <span><b>{inr(project.budget_inr)}</b></span>
              <span><b>{project.duration_weeks} wk</b></span>
            </div>
          </div>
          <div className="row">
            <button className="btn primary" disabled={busy} onClick={() => respond(project.id, true)}>Accept offer</button>
            <button className="btn" disabled={busy} onClick={() => respond(project.id, false)}>Decline</button>
          </div>
        </div>
      ))}

      <div className="profile-head">
        <Avatar name={s.name} large />
        <div>
          <h1>{s.name}</h1>
          <p className="muted">{s.college}, year {s.year}</p>
        </div>
      </div>
      <p style={{ maxWidth: '60ch' }}>{s.bio}</p>
      <div className="facts" style={{ marginTop: 14 }}>
        <Rating student={s} />
        <span>Available <b>{s.hours_per_week} h/wk</b></span>
        {s.completed_projects === 0 && <span>Looking for a first project</span>}
      </div>

      <section className="section">
        <h2>Skills</h2>
        <div className="skill-list">
          {skills.map(([skill, level]) => (
            <div className="skill-row" key={skill}>
              <span>{skill}</span>
              <span>{LEVELS[level]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Portfolio</h2>
        <div className="panel">
          {s.portfolio.length === 0 && <p className="muted">No completed projects yet.</p>}
          {s.portfolio.map((p) => (
            <div className="work" key={`${p.project_title}-${p.completed_on}`}>
              <div>
                <strong>{p.project_title}</strong>
                <div className="small muted">{p.business_name}, {p.completed_on}</div>
                <SkillChips skills={p.skills_used} />
              </div>
              {p.cert_id && (
                <Link className="verified" to={`/certificate/${p.cert_id}`}><SealCheck size={16} weight="fill" /> Verified</Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
