import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import SkillChips from '../components/SkillChips'
import { Avatar, Rating } from '../components/bits'

export default function Students() {
  const [students, setStudents] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.students().then(setStudents).catch((e) => setError(e.message))
  }, [])

  return (
    <>
      <div className="page-head">
        <h1>Students</h1>
        <p className="muted">Skills are self-declared. Completed projects carry a verifiable certificate.</p>
      </div>
      {error && <p className="error">{error}</p>}
      {!students && !error && <div className="people">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" />)}</div>}
      <div className="people">
        {students?.map((s, i) => (
          <Link key={s.id} to={`/students/${s.id}`} className="person reveal" style={{ '--i': i }}>
            <div className="person-head">
              <Avatar name={s.name} />
              <div>
                <div className="name">{s.name}</div>
                <div className="small muted">{s.college}, year {s.year}</div>
              </div>
            </div>
            <SkillChips skills={Object.keys(s.skills).slice(0, 4)} />
            <Rating student={s} />
          </Link>
        ))}
      </div>
    </>
  )
}
