import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, SealCheck } from '@phosphor-icons/react'
import { api } from '../api'
import MatchCard from '../components/MatchCard'
import SkillChips from '../components/SkillChips'
import { inr } from '../format'
import { useSession } from '../session'

export default function ProjectMatches() {
  const { id } = useParams()
  const navigate = useNavigate()
  const session = useSession()
  const [detail, setDetail] = useState(null)
  const [matches, setMatches] = useState(null)
  const [aiUsed, setAiUsed] = useState(false)
  const [rating, setRating] = useState(5)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.project(id).then(setDetail).catch((e) => setError(e.message))
    api.matches(id)
      .then((res) => { setMatches(res.matches); setAiUsed(res.ai_used) })
      .catch((e) => setError(e.message))
  }, [id])

  async function sendOffer(studentId) {
    setBusy(true)
    try {
      await api.offer(id, studentId)
      setDetail(await api.project(id))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  function viewAsStudent(studentId) {
    session.update({ mode: 'student', studentId })
    navigate(`/student/projects/${id}`)
  }

  async function complete() {
    setBusy(true)
    try {
      const cert = await api.complete(id, rating)
      navigate(`/certificate/${cert.id}`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!detail) return <div className="narrow"><div className="skeleton" /></div>

  const { project, business, offered_student: offered, assigned_student: assigned } = detail

  return (
    <div className="narrow">
      <Link className="link back" to="/business"><ArrowLeft size={14} weight="bold" /> Your projects</Link>
      <header className="project-head">
        <p className="muted">{business.name}, {business.city}</p>
        <h1>{project.title}</h1>
        <p className="muted">{project.summary}</p>
        <SkillChips skills={project.required_skills} />
        <div className="facts">
          <span>Budget <b>{inr(project.budget_inr)}</b></span>
          <span>Duration <b>{project.duration_weeks} wk</b></span>
          <span>Effort <b>{project.hours_per_week} h/wk</b></span>
          <span>Level <b>{project.difficulty}</b></span>
        </div>
      </header>

      {project.status === 'offered' && offered && (
        <div className="callout reveal">
          <h2>Offer sent to {offered.name}</h2>
          <p className="muted">Waiting for {offered.name.split(' ')[0]} to accept or decline.</p>
          <div>
            <button className="btn sm" onClick={() => viewAsStudent(offered.id)}>
              Switch to {offered.name.split(' ')[0]}'s view <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {project.status === 'assigned' && assigned && (
        <div className="callout reveal">
          <h2>{assigned.name} is working on this</h2>
          <p className="muted">When the work is delivered, rate it. That releases the payout and issues a certificate.</p>
          <div className="row">
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} aria-label="Rating">
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} out of 5</option>)}
            </select>
            <button className="btn primary" disabled={busy} onClick={complete}>Mark complete</button>
          </div>
        </div>
      )}

      {project.status === 'completed' && (
        <div className="callout reveal">
          <h2 className="row"><SealCheck size={20} weight="fill" color="var(--accent)" /> Completed</h2>
          <div className="facts">
            <span>Paid to student <b>{inr(project.student_payout_inr)}</b></span>
            <span>Platform fee, 10% <b>{inr(project.platform_fee_inr)}</b></span>
            <span className="faint">Simulated payment</span>
          </div>
          <div><Link className="btn sm" to={`/certificate/${project.certificate_id}`}>View certificate</Link></div>
        </div>
      )}

      <section className="section">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2>Best matches</h2>
          {matches && <span className={`tag ${aiUsed ? 'on' : ''}`}>{aiUsed ? 'Ranked by AI' : 'Skill score only'}</span>}
        </div>
        {!matches && (
          <div className="match-list">
            <p className="small muted">Ranking students for this project</p>
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
          </div>
        )}
        {matches?.length === 0 && <p className="muted">No students list these skills yet. Try editing the required skills.</p>}
        <div className="match-list">
          {matches?.map((m, i) => (
            <MatchCard
              key={m.student_id}
              rank={i + 1}
              match={m}
              style={{ '--i': i }}
              canOffer={project.status === 'open'}
              declined={project.declined_student_ids.includes(m.student_id)}
              disabled={busy}
              onOffer={() => sendOffer(m.student_id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
