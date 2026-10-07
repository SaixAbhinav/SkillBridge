import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import MatchCard from '../components/MatchCard'
import SkillChips from '../components/SkillChips'

export default function ProjectMatches() {
  const { id } = useParams()
  const navigate = useNavigate()
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
  if (!detail) return <p className="muted">Loading project…</p>

  const { project, business, offered_student: offered, assigned_student: assigned } = detail
  const inr = (n) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="narrow">
      <div className="card">
        <p className="eyebrow">{business.name} · {business.city}</p>
        <h1>{project.title}</h1>
        <p className="muted">{project.summary}</p>
        <SkillChips skills={project.required_skills} />
        <p className="meta">
          {inr(project.budget_inr)} · {project.duration_weeks} week(s) · {project.hours_per_week} hrs/week · {project.difficulty}
        </p>
      </div>

      {project.status === 'offered' && offered && (
        <div className="card highlight">
          <h2>Offer sent to {offered.name}</h2>
          <p className="muted">Waiting for {offered.name} to accept or decline.</p>
          <Link className="btn" to={`/students/${offered.id}`}>Open {offered.name}'s view →</Link>
        </div>
      )}

      {project.status === 'assigned' && assigned && (
        <div className="card highlight">
          <h2>Assigned to {assigned.name}</h2>
          <p className="muted">When the work is delivered, rate it to release payment and issue a verified certificate.</p>
          <div className="row">
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>)}
            </select>
            <button className="btn primary" disabled={busy} onClick={complete}>Mark complete & issue certificate</button>
          </div>
        </div>
      )}

      {project.status === 'completed' && (
        <div className="card highlight">
          <h2>Completed ✓</h2>
          <p>
            Payout to student: <strong>{inr(project.student_payout_inr)}</strong> · Platform fee (10%): {inr(project.platform_fee_inr)}
            <span className="small muted"> (simulated)</span>
          </p>
          <Link className="btn" to={`/certificate/${project.certificate_id}`}>View certificate</Link>
        </div>
      )}

      <div className="row-between">
        <h2>Top matches</h2>
        {matches && <span className={`badge ${aiUsed ? 'ai' : ''}`}>{aiUsed ? 'AI-ranked' : 'Rule-based ranking'}</span>}
      </div>
      {!matches && <p className="muted">AI is ranking students for this project…</p>}
      {matches?.length === 0 && <p className="muted">No students match these skills yet.</p>}
      {matches?.map((m, i) => (
        <MatchCard
          key={m.student_id}
          rank={i + 1}
          match={m}
          canOffer={project.status === 'open'}
          declined={project.declined_student_ids.includes(m.student_id)}
          disabled={busy}
          onOffer={() => sendOffer(m.student_id)}
        />
      ))}
    </div>
  )
}
