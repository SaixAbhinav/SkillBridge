import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import SkillChips from '../components/SkillChips'

export default function Students() {
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.students().then(setStudents).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <h1>Students</h1>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {students.map((s) => (
          <Link key={s.id} to={`/students/${s.id}`} className="card student-card">
            <strong>{s.name}</strong>
            <span className="small muted">{s.college} · Year {s.year}</span>
            <SkillChips skills={Object.keys(s.skills).slice(0, 4)} />
            <span className="small">
              {s.completed_projects > 0 ? `★ ${s.rating} · ${s.completed_projects} projects` : 'New talent'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
