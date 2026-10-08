import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, SealCheck, Warning } from '@phosphor-icons/react'
import { api } from '../api'
import SkillChips from '../components/SkillChips'
import { useSession } from '../session'
import { PLATFORM_FEE_RATE, inr, payoutFor } from '../format'

const STAGE = { offered: 'New offer', assigned: 'In progress', completed: 'Completed' }

export default function OfferDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { studentId } = useSession()
  const [detail, setDetail] = useState(null)
  const [student, setStudent] = useState(null)
  const [match, setMatch] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.project(id).then(setDetail).catch((e) => setError(e.message))
    api.student(studentId).then(setStudent).catch((e) => setError(e.message))
    api.matches(id)
      .then((res) => setMatch(res.matches.find((m) => m.student_id === studentId) ?? null))
      .catch(() => setMatch(null))
  }, [id, studentId])

  async function accept() {
    setBusy(true)
    try {
      await api.accept(id, studentId)
      setDetail(await api.project(id))
      setStudent(await api.student(studentId))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function decline() {
    if (!window.confirm('Decline this offer? The business will be able to offer it to someone else.')) return
    setBusy(true)
    try {
      await api.decline(id, studentId)
      navigate('/student')
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (error) return <div className="narrow"><p className="error">{error}</p></div>
  if (!detail || !student) return <div className="narrow"><div className="skeleton" style={{ height: 320 }} /></div>

  const { project, business } = detail
  const isMine = project.offered_student_id === studentId || project.assigned_student_id === studentId
  if (!isMine) {
    const declined = project.declined_student_ids.includes(studentId)
    return (
      <div className="narrow empty">
        <h2>{declined ? 'You declined this offer' : `This offer is not for ${student.name}`}</h2>
        <p className="muted">Switch student in the top bar, or go back to your offers.</p>
        <Link className="btn" to="/student">Your offers</Link>
      </div>
    )
  }

  const mySkills = new Set(Object.keys(student.skills).map((s) => s.toLowerCase()))
  const have = project.required_skills.filter((s) => mySkills.has(s))
  const toLearn = project.required_skills.filter((s) => !mySkills.has(s))
  const fee = Math.round(project.budget_inr * PLATFORM_FEE_RATE)
  const shortOnTime = student.hours_per_week < project.hours_per_week

  return (
    <div>
      <Link className="link back" to="/student"><ArrowLeft size={14} weight="bold" /> Offers and work</Link>

      <header className="project-head" style={{ borderBottom: 0, paddingBottom: 8 }}>
        <div className="row">
          <span className="muted">{business.name}, {business.type.toLowerCase()} in {business.city}</span>
          <span className="tag on">{STAGE[project.status]}</span>
        </div>
        <h1>{project.title}</h1>
        <p className="muted" style={{ maxWidth: '60ch' }}>{project.summary}</p>
      </header>

      <div className="offer-layout">
        <div className="offer-main">
          <section>
            <h2>What {business.name} wrote</h2>
            <blockquote className="quote">{project.description}</blockquote>
          </section>

          <section>
            <h2>Skills this needs</h2>
            <div className="skill-split">
              <div>
                <p className="small muted">You have</p>
                {have.length ? <SkillChips skills={have} /> : <p className="small faint">None listed on your profile</p>}
              </div>
              <div>
                <p className="small muted">New for you</p>
                {toLearn.length ? <SkillChips skills={toLearn} variant="gap" /> : <p className="small faint">Nothing, you cover every skill</p>}
              </div>
            </div>
          </section>

          {match && (
            <section>
              <h2>Why you were matched</h2>
              <div className="why">
                <strong className="mono">{match.match_percent}<small>%</small></strong>
                <p>{match.reason}</p>
              </div>
            </section>
          )}
        </div>

        <aside className="panel offer-aside">
          <p className="small muted">You receive</p>
          <p className="payout mono">{inr(project.student_payout_inr ?? payoutFor(project.budget_inr))}</p>
          <div className="kv"><span>Budget</span><b>{inr(project.budget_inr)}</b></div>
          <div className="kv"><span>Platform fee, 10%</span><b>-{inr(project.platform_fee_inr ?? fee)}</b></div>
          <div className="kv"><span>Duration</span><b>{project.duration_weeks} weeks</b></div>
          <div className="kv"><span>Effort</span><b>{project.hours_per_week} h/week</b></div>
          <div className="kv"><span>Level</span><b>{project.difficulty}</b></div>
          {shortOnTime && project.status === 'offered' && (
            <p className="small warn"><Warning size={14} weight="fill" /> You list {student.hours_per_week} h/week. This needs {project.hours_per_week}.</p>
          )}

          <div className="aside-actions">
            {project.status === 'offered' && (
              <>
                <button className="btn primary" disabled={busy} onClick={accept}><Check size={16} weight="bold" /> Accept offer</button>
                <button className="btn" disabled={busy} onClick={decline}>Decline</button>
              </>
            )}
            {project.status === 'assigned' && (
              <p className="small muted">You accepted this. {business.name} marks it complete when you deliver, which releases your payout and issues a certificate.</p>
            )}
            {project.status === 'completed' && (
              <Link className="btn" to={`/certificate/${project.certificate_id}`}><SealCheck size={16} weight="fill" /> View certificate</Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
