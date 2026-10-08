import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, SealCheck } from '@phosphor-icons/react'
import { api } from '../api'
import { Avatar } from '../components/bits'
import { useSession } from '../session'
import { inr, payoutFor, shortDate } from '../format'

function WorkRow({ project, business, children }) {
  return (
    <Link to={`/student/projects/${project.id}`} className="list-row">
      <div className="grow">
        <strong>{project.title}</strong>
        <div className="small muted">{business.name}, {inr(payoutFor(project.budget_inr))} payout</div>
      </div>
      {children}
      <ArrowRight size={18} className="faint" />
    </Link>
  )
}

export default function StudentHome() {
  const { studentId, student } = useSession()
  const [loaded, setLoaded] = useState({ forId: null, work: null })
  const [error, setError] = useState('')

  useEffect(() => {
    api.studentProjects(studentId)
      .then((work) => setLoaded({ forId: studentId, work }))
      .catch((e) => setError(e.message))
  }, [studentId])

  // Ignore results that belong to the previously selected student.
  const work = loaded.forId === studentId ? loaded.work : null

  return (
    <div className="narrow">
      {student && (
        <div className="profile-head">
          <Avatar name={student.name} large />
          <div>
            <h1>{student.name}</h1>
            <p className="muted">{student.college}, year {student.year}. <Link className="link" to={`/students/${studentId}`}>Public profile</Link></p>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {!work && !error && <div className="skeleton" />}

      {work && (
        <>
          <section className="section" style={{ marginTop: 8 }}>
            <h2>New offers {work.offers.length > 0 && <span className="count">{work.offers.length}</span>}</h2>
            {work.offers.length === 0 ? (
              <div className="empty">
                <p className="muted">
                  No offers right now. Businesses find you through your skills
                  {student && <>: {Object.keys(student.skills).slice(0, 3).join(', ')}</>}.
                </p>
              </div>
            ) : (
              <div className="offer-grid">
                {work.offers.map(({ project, business }, i) => (
                  <Link key={project.id} to={`/student/projects/${project.id}`} className="offer-card reveal" style={{ '--i': i }}>
                    <span className="small muted">{business.name}, posted {shortDate(project.created_at)}</span>
                    <strong className="offer-title">{project.title}</strong>
                    <div className="facts">
                      <span>Payout <b>{inr(payoutFor(project.budget_inr))}</b></span>
                      <span><b>{project.duration_weeks} wk</b></span>
                      <span><b>{project.hours_per_week} h/wk</b></span>
                    </div>
                    <span className="link">Review offer <ArrowRight size={14} weight="bold" /></span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <h2>In progress</h2>
            {work.active.length === 0
              ? <p className="muted">Nothing in progress. Accepted offers show up here.</p>
              : <div className="list">{work.active.map((w) => <WorkRow key={w.project.id} {...w} />)}</div>}
          </section>

          <section className="section">
            <h2>Completed</h2>
            {work.completed.length === 0
              ? <p className="muted">Completed projects earn a certificate that appears on your public profile.</p>
              : (
                <div className="list">
                  {work.completed.map((w) => (
                    <WorkRow key={w.project.id} {...w}>
                      <span className="verified"><SealCheck size={16} weight="fill" /> Certified</span>
                    </WorkRow>
                  ))}
                </div>
              )}
          </section>
        </>
      )}
    </div>
  )
}
