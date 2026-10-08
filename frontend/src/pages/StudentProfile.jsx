import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SealCheck } from '@phosphor-icons/react'
import { api } from '../api'
import SkillChips from '../components/SkillChips'
import { Avatar, Rating } from '../components/bits'

const LEVELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert']

// Public profile, as a business sees it. Offers are handled in the student view (/student).
export default function StudentProfile() {
  const { id } = useParams()
  const [s, setS] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.student(id).then(setS).catch((e) => setError(e.message))
  }, [id])

  if (error) return <div className="narrow"><p className="error">{error}</p></div>
  if (!s) return <div className="narrow"><div className="skeleton" /></div>

  const skills = Object.entries(s.skills).sort((a, b) => b[1] - a[1])

  return (
    <div className="narrow">
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
