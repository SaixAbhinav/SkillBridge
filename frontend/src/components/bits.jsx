import { Star } from '@phosphor-icons/react'

function initials(name) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('')
}

export function Avatar({ name, large = false }) {
  return <span className={`avatar ${large ? 'lg' : ''}`} aria-hidden="true">{initials(name)}</span>
}

export function Rating({ student }) {
  if (student.completed_projects === 0) return <span className="tag">New</span>
  return (
    <span className="rating">
      <Star weight="fill" size={13} />
      {student.rating.toFixed(1)}
      <span className="faint">({student.completed_projects})</span>
    </span>
  )
}

export function Stars({ value }) {
  return (
    <span className="stars" aria-label={`Rated ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={18} weight={n <= value ? 'fill' : 'regular'} />)}
    </span>
  )
}
