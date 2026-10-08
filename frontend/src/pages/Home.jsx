import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { api } from '../api'
import MatchCard from '../components/MatchCard'
import { inr } from '../format'
import { homeFor, useSession } from '../session'

// A real match from the seeded restaurant demo, rendered with the same component the app uses.
const EXAMPLE_MATCH = {
  student_id: 'S01',
  student_name: 'Ananya Reddy',
  college: 'CBIT',
  match_percent: 87,
  matched_skills: ['html', 'css', 'javascript', 'responsive design', 'whatsapp api'],
  gaps: [],
  reason: 'Built online ordering sites for two cafés, strong in React and responsive layouts.',
}

const STEPS = [
  ['Describe', 'The business writes what it needs in plain words. "A website with our menu and WhatsApp ordering" is enough.'],
  ['Match', 'AI turns that into required skills, then ranks students with a score, a reason and any skill gaps.'],
  ['Offer', 'The business sends an offer. The student decides whether to take it.'],
  ['Deliver', 'On completion the student is paid and gets a certificate that anyone can verify.'],
]

export default function Home() {
  const session = useSession()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  function enter(mode) {
    session.update({ mode })
    navigate(homeFor(mode))
  }

  useEffect(() => {
    api.stats().then(setStats).catch(() => setStats(null))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="reveal">
          <h1>Every fresher needs a <em>first real project.</em></h1>
          <p className="lead">Companies want experience. We match college students to short, paid projects from local businesses, so they can get it.</p>
          <div className="row">
            <button className="btn primary" onClick={() => enter('business')}>I'm a business <ArrowRight size={16} weight="bold" /></button>
            <button className="btn" onClick={() => enter('student')}>I'm a student</button>
          </div>
        </div>
        <div className="hero-preview reveal" style={{ '--i': 2 }}>
          <div className="preview-caption small">
            <span><strong>Website for Spice Route Kitchen</strong></span>
            <span className="faint mono">{inr(8000)}, 2 weeks</span>
          </div>
          <MatchCard rank={1} match={EXAMPLE_MATCH} />
        </div>
      </section>

      {stats && (
        <section className="stats" aria-label="Platform numbers">
          <div className="stat"><strong>{stats.students}</strong><span>Students</span></div>
          <div className="stat"><strong>{stats.businesses}</strong><span>Businesses</span></div>
          <div className="stat"><strong>{stats.projects_posted}</strong><span>Projects posted</span></div>
          <div className="stat"><strong>{stats.certificates_issued}</strong><span>Certificates issued</span></div>
          <div className="stat"><strong>{inr(stats.paid_to_students_inr)}</strong><span>Paid to students</span></div>
        </section>
      )}

      <section className="how">
        <div>
          <h2>From a plain request to a verified portfolio</h2>
          <p>No job descriptions and no tech jargon. Four steps, usually done within a couple of weeks.</p>
        </div>
        <ol className="steps">
          {STEPS.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
