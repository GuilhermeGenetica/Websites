export default {
  id: 'centor',
  name: 'Centor Score (Modified/McIsaac)',
  shortDescription: 'Likelihood of streptococcal pharyngitis and need for testing/antibiotics',
  system: 'infectious_disease',
  specialty: ['Emergency Medicine', 'Primary Care', 'Pediatrics', 'Infectious Disease'],
  tags: ['strep', 'pharyngitis', 'sore throat', 'Centor', 'McIsaac', 'tonsillitis'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Centor RM / McIsaac WJ et al.',
  creatorYear: '1981 / 1998',
  description: 'The Modified Centor Score (McIsaac) estimates the probability of group A streptococcal (GAS) pharyngitis in patients with sore throat. It guides decisions about rapid antigen testing and empiric antibiotic use. The modification adds an age criterion to the original four Centor criteria.',
  whyUse: 'Reduces unnecessary antibiotic prescriptions for viral pharyngitis. Guides appropriate use of rapid strep testing. Cost-effective approach to sore throat management.',
  whenToUse: [
    'Acute sore throat / pharyngitis evaluation',
    'Deciding whether to perform rapid strep test or throat culture',
    'Antibiotic decision-making for pharyngitis',
  ],
  nextSteps: 'Score 0-1: No testing or antibiotics needed (risk < 10%). Score 2-3: Rapid antigen test; treat if positive. Score 4-5: Consider empiric antibiotics or test-and-treat.',
  pearls: [
    'Score 0-1 has < 10% probability of GAS — testing and antibiotics are NOT recommended.',
    'Most sore throats are viral — antibiotics provide no benefit and contribute to resistance.',
    'The original Centor criteria did not include age; McIsaac modification adds +1 for age 3-14 and -1 for ≥ 45.',
    'IDSA guidelines recommend testing (RADT ± culture) rather than empiric treatment, even with high scores.',
    'Consider Fusobacterium necrophorum (Lemierre syndrome) in adolescents with severe pharyngitis.',
    'Rapid strep test sensitivity is ~85-90%; consider throat culture backup in children with negative RADT.',
  ],
  evidence: 'Original Centor criteria (1981) validated for adult pharyngitis. McIsaac modification (1998) added age criterion, validated in 521 patients. IDSA 2012 guidelines incorporate the score for pharyngitis management.',
  formula: 'One point each for:\n• Tonsillar exudates (+1)\n• Tender anterior cervical lymphadenopathy (+1)\n• Fever (temperature > 38°C / 100.4°F) (+1)\n• Absence of cough (+1)\nAge modifier: 3-14 years (+1), 15-44 years (0), ≥ 45 years (-1)',
  references: [
    { text: 'Centor RM et al. The diagnosis of strep throat in adults in the emergency room. Med Decis Making. 1981;1(3):239-246.', url: 'https://pubmed.ncbi.nlm.nih.gov/6763125/' },
    { text: 'McIsaac WJ et al. A clinical score to reduce unnecessary antibiotic use in patients with sore throat. CMAJ. 1998;158(1):75-83.', url: 'https://pubmed.ncbi.nlm.nih.gov/9475915/' },
  ],
  links: [
    { title: 'MDCalc — Centor Score', url: 'https://www.mdcalc.com/calc/104/centor-score-modified-mcisaac-strep-pharyngitis', description: 'Interactive Centor/McIsaac calculator' },
  ],
  interpretations: [
    { range: '0', label: '~2-3% GAS probability', action: 'No testing or antibiotics; symptomatic treatment' },
    { range: '1', label: '~5-10% GAS probability', action: 'No testing or antibiotics; symptomatic treatment' },
    { range: '2', label: '~11-17% GAS probability', action: 'Rapid strep test; treat only if positive' },
    { range: '3', label: '~28-35% GAS probability', action: 'Rapid strep test; treat if positive' },
    { range: '4-5', label: '~51-53% GAS probability', action: 'Rapid strep test or empiric antibiotics; treat if positive' },
  ],
  fields: [
    { key: 'exudate', label: 'Tonsillar exudates', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'lymph', label: 'Tender anterior cervical lymphadenopathy', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'fever', label: 'Fever (temperature > 38°C / 100.4°F)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'cough', label: 'Absence of cough', type: 'score_picker', options: [{ value: 0, label: 'Cough present (0)' }, { value: 1, label: 'No cough (+1)' }] },
    {
      key: 'age_group', label: 'Age group', type: 'score_picker',
      options: [
        { value: 1, label: '3-14 years (+1)' },
        { value: 0, label: '15-44 years (0)' },
        { value: -1, label: '≥ 45 years (-1)' },
      ],
    },
  ],
  calculate: (vals) => {
    const fields = ['exudate', 'lymph', 'fever', 'cough', 'age_group']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    const bounded = Math.max(0, Math.min(5, score))
    const probTable = { 0: '~2-3%', 1: '~5-10%', 2: '~11-17%', 3: '~28-35%', 4: '~51-53%', 5: '~51-53%' }
    let interp = ''
    if (bounded <= 1) interp = 'Low probability — no testing or antibiotics needed'
    else if (bounded <= 3) interp = 'Moderate probability — rapid strep test recommended'
    else interp = 'High probability — rapid strep test or empiric antibiotics'
    return {
      result: String(bounded),
      unit: 'points (0-5)',
      interpretation: interp,
      detail: `GAS probability: ${probTable[bounded] || 'N/A'}`,
    }
  },
}
