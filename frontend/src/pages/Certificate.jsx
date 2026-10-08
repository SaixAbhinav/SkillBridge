import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Printer, SealCheck } from '@phosphor-icons/react'
import { api } from '../api'
import SkillChips from '../components/SkillChips'
import { Stars } from '../components/bits'

export default function Certificate() {
  const { id } = useParams()
  const [cert, setCert] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.certificate(id).then(setCert).catch((e) => setError(e.message))
  }, [id])

  if (error) return <div className="narrow"><p className="error">Certificate {id} could not be verified.</p></div>
  if (!cert) return <div className="narrow"><div className="skeleton" style={{ height: 360 }} /></div>

  return (
    <div className="narrow">
      <article className="certificate reveal">
        <div className="cert-top">
          <span className="wordmark">SkillBridge<span>ai</span></span>
          <span className="verified"><SealCheck size={18} weight="fill" /> Verified experience</span>
        </div>
        <div>
          <p className="muted">This certifies that</p>
          <h1>{cert.student_name}</h1>
        </div>
        <p className="cert-body">
          delivered <strong>{cert.project_title}</strong> for <strong>{cert.business_name}</strong>, using the skills below.
        </p>
        <SkillChips skills={cert.skills_verified} />
        <div className="cert-meta">
          <div><span>Business rating</span><Stars value={cert.rating} /></div>
          <div><span>Issued</span><b>{cert.issued_on}</b></div>
          <div><span>Certificate ID</span><b>{cert.id}</b></div>
        </div>
        <p className="small faint">Verify at {window.location.href}</p>
      </article>
      <div className="row no-print" style={{ marginTop: 16 }}>
        <button className="btn" onClick={() => window.print()}><Printer size={16} /> Print or save PDF</button>
        <Link className="btn" to={`/students/${cert.student_id}`}>View portfolio</Link>
      </div>
    </div>
  )
}
