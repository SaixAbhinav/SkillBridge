# Demo script (~3 minutes)

Before presenting: restart the backend (clean state), open the app, hit /api/health (llm_enabled: true),
close other tabs, zoom the browser to 125%.

1. Home (15s): "This is SkillBridge AI. 16 students and 5 local businesses are on the platform."
2. Post a project (45s): choose Spice Route Kitchen → "Use a sample request" → read it aloud.
   "Notice: the owner never says React or HTML. They just describe their problem."
   Click "Find required skills" → point at the extracted skills, budget, duration and the "Extracted by AI" tag.
3. Matches (60s): "Publish and match" → "In two stages: a transparent skill score shortlists students, then the AI
   reads their full profiles and past work." Point at #1: match %, the reason, green skills, amber gaps.
   "Gaps are shown honestly, so the business knows exactly what it's getting."
4. Offer + accept (40s): Send offer to #1 → "Students aren't assigned; they choose." → Open Ananya's view →
   "This is what Ananya sees" → "Accept offer".
5. Complete (25s): "Two weeks later the site is delivered" → 5 out of 5 → "Mark complete" → point at the split:
   "₹7,200 to Ananya, ₹800 platform fee. That's our business model, live."
6. Certificate (30s): View certificate → "A certificate with a unique ID that anyone can check at this link."
   Click View portfolio → "It shows up as a Verified entry in her portfolio. That's real experience."

If the AI is slow or offline: the tags switch to "Keyword fallback" and "Skill score only" and the flow still
works. Say: "The system is built to degrade gracefully. This is the deterministic fallback."

## Likely questions

1. **How does the AI matching actually work?** Use the two stages and the formula. Final = 50% rule + 50% LLM.
2. **What if the AI makes things up?** The output is structured JSON validated against a schema, unknown student IDs are dropped, scores are blended with a deterministic score, and there's a fallback on any failure.
3. **Why would a business trust a student?** Ratings, Certificate-backed portfolio entries and honestly shown skill gaps. Be upfront that skills are self-declared today, and that skill tests and escrow are future scope.
3a. **What if the student is busy?** They decline the Offer, the Project reopens, and the business offers the next Match.
3b. **Can a newcomer with no rating ever win?** Yes. Unrated students get a neutral 3/5 rating, not zero (point at Harsha's profile).
3c. **What happens to certificates if the server restarts?** This prototype keeps data in memory. Production would use a database.
4. **How do you make money?** A 10% platform fee on every completed project (shown live in the demo), plus business subscriptions.
5. **How is this different from Internshala/Fiverr?** Short paid projects, AI matching from plain English, beginner-friendly, verified portfolio.
6. **Chicken-and-egg: how do you get the first users?** Start with campus clubs and local businesses near colleges, with college partnerships as the long-term channel.
7. **What would you build next?** Login, escrow payments, skill assessments, a mobile app.
8. **Tech stack?** FastAPI, React and Llama 3.3 70B via Groq, with a deterministic fallback.
