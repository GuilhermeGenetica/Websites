export default {
  id: 'phq9',
  name: 'PHQ-9 (Patient Health Questionnaire)',
  shortDescription: 'Depression severity screening and monitoring tool',
  system: 'psychiatry',
  specialty: ['Psychiatry', 'Primary Care', 'Psychology', 'Family Medicine'],
  tags: ['depression', 'mental health', 'screening', 'PHQ', 'mood'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Kroenke K, Spitzer RL, Williams JBW',
  creatorYear: '2001',
  description: 'The PHQ-9 is a self-administered 9-item questionnaire based on DSM criteria for major depressive disorder. Each item is scored 0-3, yielding a total score of 0-27. It serves dual purposes: screening for depression and monitoring treatment response over time. It is one of the most widely validated depression instruments globally.',
  whyUse: 'Brief, validated, freely available screening tool for depression. Recommended by USPSTF for routine depression screening. Can monitor treatment response with serial administration. Maps directly to DSM-5 criteria.',
  whenToUse: [
    'Routine depression screening in primary care',
    'Monitoring treatment response (repeat every 2-4 weeks)',
    'Initial psychiatric assessment',
    'Pre-surgical psychological evaluation',
    'Research and clinical trials',
  ],
  nextSteps: 'Score 5-9: watchful waiting, repeat PHQ-9 at follow-up. Score 10-14: consider counseling and/or pharmacotherapy. Score 15-19: active treatment with antidepressant and/or psychotherapy recommended. Score 20+: aggressive treatment; consider psychiatric referral. Always assess item 9 (self-harm) regardless of total score.',
  pearls: [
    'ALWAYS assess item 9 (self-harm/suicidal ideation) independently — any positive response requires safety evaluation.',
    'A score ≥10 has sensitivity of 88% and specificity of 88% for major depression.',
    'A 5-point change is considered clinically significant for treatment monitoring.',
    'PHQ-9 can be falsely elevated in patients with chronic pain, fatigue-related conditions, or medical illness.',
    'PHQ-2 (items 1-2 only) can be used as an ultra-brief screen — score ≥3 warrants full PHQ-9.',
    'Available in over 70 languages; freely reproducible without permission.',
  ],
  evidence: 'Validated in >6,000 patients across primary care and obstetrics. Sensitivity 88%, specificity 88% for MDD at cutoff ≥10. USPSTF recommends depression screening in adults (Grade B). Widely adopted globally as the standard screening tool.',
  formula: 'Sum of 9 items, each scored 0-3:\n0 = Not at all\n1 = Several days\n2 = More than half the days\n3 = Nearly every day\nTotal range: 0-27',
  references: [
    { text: 'Kroenke K, Spitzer RL, Williams JBW. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606-613.', url: 'https://pubmed.ncbi.nlm.nih.gov/11556941/' },
    { text: 'USPSTF. Screening for Depression in Adults. JAMA. 2016;315(4):380-387.', url: 'https://pubmed.ncbi.nlm.nih.gov/26813211/' },
  ],
  links: [
    { title: 'MDCalc — PHQ-9', url: 'https://www.mdcalc.com/calc/1725/phq-9-patient-health-questionnaire-9', description: 'Interactive PHQ-9 calculator' },
    { title: 'PHQ Screeners — Official Site', url: 'https://www.phqscreeners.com/', description: 'Official PHQ instruments and translations' },
    { title: 'USPSTF Depression Screening', url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/depression-in-adults-screening', description: 'USPSTF screening recommendation' },
  ],
  interpretations: [
    { range: '0-4', label: 'Minimal or no depression', action: 'No treatment indicated; provide supportive counseling if appropriate' },
    { range: '5-9', label: 'Mild depression', action: 'Watchful waiting; repeat PHQ-9 at follow-up; consider counseling' },
    { range: '10-14', label: 'Moderate depression', action: 'Treatment plan: counseling and/or antidepressant pharmacotherapy' },
    { range: '15-19', label: 'Moderately severe depression', action: 'Active treatment: antidepressant + psychotherapy recommended' },
    { range: '20-27', label: 'Severe depression', action: 'Immediate treatment; psychiatric referral; assess safety' },
  ],
  fields: [
    {
      key: 'q1', label: '1. Little interest or pleasure in doing things',
      type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: '>Half days (2)' }, { value: 3, label: 'Nearly daily (3)' }],
    },
    {
      key: 'q2', label: '2. Feeling down, depressed, or hopeless',
      type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: '>Half days (2)' }, { value: 3, label: 'Nearly daily (3)' }],
    },
    {
      key: 'q3', label: '3. Trouble falling/staying asleep, or sleeping too much',
      type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: '>Half days (2)' }, { value: 3, label: 'Nearly daily (3)' }],
    },
    {
      key: 'q4', label: '4. Feeling tired or having little energy',
      type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: '>Half days (2)' }, { value: 3, label: 'Nearly daily (3)' }],
    },
    {
      key: 'q5', label: '5. Poor appetite or overeating',
      type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: '>Half days (2)' }, { value: 3, label: 'Nearly daily (3)' }],
    },
    {
      key: 'q6', label: '6. Feeling bad about yourself — or that you are a failure',
      type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: '>Half days (2)' }, { value: 3, label: 'Nearly daily (3)' }],
    },
    {
      key: 'q7', label: '7. Trouble concentrating on things',
      type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: '>Half days (2)' }, { value: 3, label: 'Nearly daily (3)' }],
    },
    {
      key: 'q8', label: '8. Moving/speaking slowly — or being fidgety/restless',
      type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: '>Half days (2)' }, { value: 3, label: 'Nearly daily (3)' }],
    },
    {
      key: 'q9', label: '9. Thoughts that you would be better off dead, or of hurting yourself',
      type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: '>Half days (2)' }, { value: 3, label: 'Nearly daily (3)' }],
    },
  ],
  calculate: (vals) => {
    const questions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9']
    const allFilled = questions.every(q => vals[q] !== undefined && vals[q] !== '' && vals[q] !== null)
    if (!allFilled) return null
    const scores = questions.map(q => parseInt(vals[q]) || 0)
    const total = scores.reduce((a, b) => a + b, 0)
    let severity = ''
    if (total <= 4) severity = 'Minimal or no depression'
    else if (total <= 9) severity = 'Mild depression'
    else if (total <= 14) severity = 'Moderate depression'
    else if (total <= 19) severity = 'Moderately severe depression'
    else severity = 'Severe depression'
  
    const q9val = parseInt(vals.q9) || 0
    let warning = ''
    if (q9val > 0) warning = ' ⚠ POSITIVE ITEM 9: Assess suicidal ideation and safety plan.'
    return {
      result: String(total),
      unit: 'points (0-27)',
      interpretation: severity + warning,
      detail: q9val > 0 ? 'Item 9 (self-harm) is positive — requires immediate safety assessment regardless of total score.' : null,
      breakdown: [
        { label: 'Anhedonia (Q1)', value: String(scores[0]) },
        { label: 'Depressed mood (Q2)', value: String(scores[1]) },
        { label: 'Sleep (Q3)', value: String(scores[2]) },
        { label: 'Energy (Q4)', value: String(scores[3]) },
        { label: 'Appetite (Q5)', value: String(scores[4]) },
        { label: 'Self-esteem (Q6)', value: String(scores[5]) },
        { label: 'Concentration (Q7)', value: String(scores[6]) },
        { label: 'Psychomotor (Q8)', value: String(scores[7]) },
        { label: 'Self-harm (Q9)', value: String(scores[8]) },
      ],
    }
  },
}
