import { Link } from 'react-router-dom'
import SkillChips from './SkillChips'

export default function MatchCard({ rank, match, canOffer, declined, disabled, onOffer }) {
  return (
    <div className="card match">
      <div className="match-head">
        <span className="rank">#{rank}</span>
        <div className="grow">
          <Link to={`/students/${match.student_id}`} className="name">{match.student_name}</Link>
          <div className="small muted">{match.college}</div>
        </div>
        <div className="score">
          <strong>{match.match_percent}%</strong>
          <span className="small muted">match</span>
        </div>
      </div>
      <div className="bar"><div style={{ width: `${match.match_percent}%` }} /></div>
      <p>{match.reason}</p>
      <SkillChips skills={match.matched_skills} variant="good" />
      {match.gaps.length > 0 && (
        <>
          <div className="small muted">Skill gaps</div>
          <SkillChips skills={match.gaps} variant="gap" />
        </>
      )}
      {declined && <span className="badge">Declined</span>}
      {canOffer && !declined && (
        <button className="btn primary" disabled={disabled} onClick={onOffer}>Send offer</button>
      )}
    </div>
  )
}
