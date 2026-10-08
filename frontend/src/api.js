async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = typeof body.detail === 'string' ? body.detail : `Request failed (${res.status})`
    throw new Error(detail)
  }
  return res.json()
}

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })

export const api = {
  stats: () => request('/stats'),
  students: () => request('/students'),
  student: (id) => request(`/students/${id}`),
  businesses: () => request('/businesses'),
  extract: (description) => post('/projects/extract', { description }),
  createProject: (payload) => post('/projects', payload),
  project: (id) => request(`/projects/${id}`),
  matches: (id) => request(`/projects/${id}/matches`),
  studentOffers: (id) => request(`/students/${id}/offers`),
  offer: (id, studentId) => post(`/projects/${id}/offer`, { student_id: studentId }),
  accept: (id, studentId) => post(`/projects/${id}/accept`, { student_id: studentId }),
  decline: (id, studentId) => post(`/projects/${id}/decline`, { student_id: studentId }),
  complete: (id, rating) => post(`/projects/${id}/complete`, { rating }),
  certificate: (id) => request(`/certificates/${id}`),
  reset: () => post('/reset', {}),
}
