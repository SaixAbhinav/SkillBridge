# SkillBridge AI

A two-sided marketplace where Businesses post short, paid Projects and college Students are matched to them by skill, deliver the work, and earn a Certificate for their Portfolio.

## Language

### Parties

**Student**:
A college student who offers their skills to deliver Projects.
_Avoid_: Freelancer, candidate, intern, talent

**Business**:
A startup, SME, or local business that posts Projects.
_Avoid_: Employer, client, company, customer

### Work

**Project**:
A short (1–12 weeks), paid, scoped piece of work posted by one Business and delivered by one Student. "Micro-internship" is the marketing name for the category, not a separate concept.
_Avoid_: Gig, job, task, internship, listing

**Requirements**:
The structured form of a Project (Required Skills, budget, duration, weekly hours) derived from the Business's plain-English description.
_Avoid_: Spec, JD

**Required Skill**:
A skill a Project needs, named in the shared skill vocabulary.

**Skill Gap**:
A Required Skill that a matched Student does not list.
_Avoid_: Missing skill, weakness

### Matching

**Match**:
A Student ranked against a specific Project, with a Match Score, a reason, and Skill Gaps.
_Avoid_: Recommendation, suggestion, candidate

**Shortlist**:
The top Matches (at most 8) chosen by the Skill Score before AI review.

**Skill Score**:
The deterministic 0–100 score from skill overlap, rating, experience and availability.
_Avoid_: Rule score (in user-facing text)

**Match Score**:
The final 0–100 score shown to the Business; a blend of Skill Score and the AI's judgment when AI is available, otherwise equal to the Skill Score.
_Avoid_: Fit, compatibility, match percent

### Lifecycle

**Offer**:
A Business's invitation to exactly one Student to deliver an open Project. At most one Offer is pending per Project.
_Avoid_: Assignment, invite, proposal

**Accept / Decline**:
The Student's response to an Offer. Accepting makes the Project Assigned; declining reopens it, and that Student cannot be offered the same Project again.

**Assigned**:
The state of a Project whose Offer was accepted and whose work is in progress.
_Avoid_: Hired, in progress

**Completion**:
The Business confirming delivery and giving a 1–5 rating, which releases the Payout and issues a Certificate.
_Avoid_: Closing, finishing

### Money

**Budget**:
The amount in INR the Business pays for a Project.

**Platform Fee**:
SkillBridge's 10% commission, taken from the Budget at Completion.
_Avoid_: Cut, charge, commission (in UI)

**Payout**:
The Budget minus the Platform Fee, paid to the Student at Completion.
_Avoid_: Salary, stipend, payment

### Trust

**Certificate**:
A record issued by SkillBridge at Completion, with a unique ID, proving a Student delivered a specific Project for a specific Business.
_Avoid_: Badge, credential

**Portfolio**:
The list of a Student's past Projects. An entry is **Verified** only if it is backed by a Certificate.

**Verified**:
Backed by a Certificate. Self-declared skills and imported past work are never called verified.
_Avoid_: Using "verified" for Students or skills

**Unrated**:
A Student with no Completions yet. Treated as a neutral (3/5) rating in matching, so that newcomers can still win Projects.
_Avoid_: New user, beginner
