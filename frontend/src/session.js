import { createContext, useContext } from 'react'

// Who the demo is acting as. There is no login: the visitor picks a mode and a persona in the nav.
export const SessionContext = createContext(null)

export const useSession = () => useContext(SessionContext)

export const homeFor = (mode) => (mode === 'student' ? '/student' : '/business')
