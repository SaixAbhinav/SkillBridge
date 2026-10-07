import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const STEPS = [
  ['Post in plain English', 'A business describes what it needs. No tech jargon required.'],
  ['AI finds the right students', 'Skills are extracted automatically and students are ranked with clear reasons.'],
  ['Deliver, pay, verify', 'Students get paid and earn a verifiable certificate for their portfolio.'],
]

function Stat({ label, value }) {
  return (
    <div className="card stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function Home() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.stats().then(setStats).catch(() => setStats(null))
  }, [])

  return (
    <div>
      <section className="hero">
        <p className="eyebrow">AI-powered micro-internships</p>
        <h1>Every company wants experienced freshers.<br />We give freshers their first experience.</h1>
        <p className="lead">
          SkillBridge AI connects college students with startups and local businesses for short,
          paid, real-world projects, matched by AI on actual skills.
        </p>
        <div className="row">
          <Link className="btn primary" to="/post">Post a project</Link>
          <Link className="btn" to="/students">Browse students</Link>
        </div>
      </section>

      {stats && (
        <section className="grid stats">
          <Stat label="Students" value={stats.students} />
          <Stat label="Businesses" value={stats.businesses} />
          <Stat label="Projects posted" value={stats.projects_posted} />
          <Stat label="Certificates issued" value={stats.certificates_issued} />
          <Stat label="Paid to students" value={`₹${stats.paid_to_students_inr.toLocaleString('en-IN')}`} />
        </section>
      )}

      <h2>How it works</h2>
      <section className="grid">
        {STEPS.map(([title, text], i) => (
          <div className="card" key={title}>
            <span className="step-num">{i + 1}</span>
            <h3>{title}</h3>
            <p className="muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
