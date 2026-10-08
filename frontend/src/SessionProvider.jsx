import { useEffect, useState } from 'react'
import { api } from './api'
import { SessionContext } from './session'

const KEY = 'skillbridge:session'
const DEFAULTS = { mode: 'business', businessId: 'B01', studentId: 'S01' }

function readSaved() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return DEFAULTS
  }
}

export default function SessionProvider({ children }) {
  const [session, setSession] = useState(readSaved)
  const [businesses, setBusinesses] = useState([])
  const [students, setStudents] = useState([])

  useEffect(() => {
    api.businesses().then(setBusinesses).catch(() => setBusinesses([]))
    api.students().then(setStudents).catch(() => setStudents([]))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(session))
    } catch {
      // Storage can be unavailable (private mode); the session then lasts for this tab only.
    }
  }, [session])

  const value = {
    ...session,
    businesses,
    students,
    business: businesses.find((b) => b.id === session.businessId),
    student: students.find((s) => s.id === session.studentId),
    update: (patch) => setSession((current) => ({ ...current, ...patch })),
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
