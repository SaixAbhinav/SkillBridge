import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import SkillChips from '../components/SkillChips'

export default function Certificate() {
  const { id } = useParams()
  const [cert, setCert] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.certificate(id).then(setCert).catch((e) => setError(e.message))
  }, [id])

  if (error) return <p className="error">Certificate {id} could not be verified.</p>
  if (!cert) return <p className="muted">Verifying certificate…</p>

  return (
    <div className="narrow">
      <div className="certificate">
        <p className="eyebrow">SkillBridge AI · Verified Experience Certificate</p>
        <p>This certifies that</p>
        <h1>{cert.student_name}</h1>
        <p>successfully delivered <strong>{cert.project_title}</strong> for <strong>{cert.business_name}</strong>.</p>
        <SkillChips skills={cert.skills_verified} variant="good" />
        <p className="stars" aria-label={`Rated ${cert.rating} of 5`}>
          {'★'.repeat(cert.rating)}{'☆'.repeat(5 - cert.rating)}
        </p>
        <div className="cert-foot">
          <span>Issued {cert.issued_on}</span>
          <span>ID: {cert.id}</span>
        </div>
        <p className="small muted">Verify at {window.location.href}</p>
      </div>
      <div className="row no-print">
        <button className="btn" onClick={() => window.print()}>Print / Save PDF</button>
        <Link className="btn" to={`/students/${cert.student_id}`}>View portfolio</Link>
      </div>
    </div>
  )
}
