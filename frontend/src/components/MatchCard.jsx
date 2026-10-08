import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import SkillChips from './SkillChips'
import { Avatar } from './bits'

export default function MatchCard({ rank, match, canOffer, declined, disabled, onOffer, style }) {
  return (
    <article className={`match reveal ${rank === 1 ? 'top' : ''}`} style={style}>
      <div className="match-head">
        <span className="rank">{String(rank).padStart(2, '0')}</span>
        <Avatar name={match.student_name} />
        <div className="grow">
          <Link to={`/students/${match.student_id}`} className="name">{match.student_name}</Link>
          <div className="small muted">{match.college}</div>
        </div>
        <div className="score" aria-label={`${match.match_percent} percent match`}>
          <strong>{match.match_percent}<small>%</small></strong>
        </div>
      </div>
      <p className="reason">{match.reason}</p>
      <div className="match-foot">
        <div className="match-skills">
          <SkillChips skills={match.matched_skills} />
          {match.gaps.length > 0 && <SkillChips skills={match.gaps} variant="gap" />}
        </div>
        {declined && <span className="tag">Declined</span>}
        {canOffer && !declined && (
          <button className="btn primary sm" disabled={disabled} onClick={onOffer}>
            Send offer <ArrowRight size={14} weight="bold" />
          </button>
        )}
      </div>
    </article>
  )
}
