export default {
  id: 'bishop',
  name: 'Bishop Score',
  shortDescription: 'Cervical readiness assessment for labor induction success prediction',
  system: 'obstetrics',
  specialty: ['Obstetrics', 'Midwifery'],
  tags: ['Bishop', 'cervix', 'induction', 'labor', 'obstetrics', 'delivery'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Bishop EH',
  creatorYear: '1964',
  description: 'The Bishop Score assesses cervical readiness for induction of labor. It evaluates five components: cervical dilation, effacement, station, consistency, and position. A score ≥ 8 indicates a favorable cervix with high likelihood of successful vaginal delivery after induction. A low score (< 6) suggests the need for cervical ripening before oxytocin.',
  whyUse: 'Standard tool for assessing cervical readiness before induction. Predicts likelihood of successful vaginal delivery. Guides decision on cervical ripening (prostaglandins, mechanical dilators) vs. direct oxytocin.',
  whenToUse: [
    'Before induction of labor',
    'Assessment of cervical ripening progress',
    'Decision on method of induction',
  ],
  nextSteps: 'Score ≥ 8: Favorable cervix — oxytocin induction likely to succeed. Score 6-7: Moderately favorable — consider cervical ripening or direct induction based on parity. Score < 6: Unfavorable — cervical ripening recommended (prostaglandin, Foley balloon).',
  pearls: [
    'Bishop ≥ 8 in multiparous women has very high success rate with oxytocin alone.',
    'Nulliparous women generally require higher Bishop scores for successful induction.',
    'Modified Bishop Score exists (adds fetal station adjustments) but original remains standard.',
    'Cervical ripening agents (misoprostol, dinoprostone, Foley catheter) improve Bishop score before oxytocin.',
    'The score has limited predictive value for cesarean delivery — clinical judgment is essential.',
    'Assessment is inherently subjective — inter-examiner variability exists.',
  ],
  evidence: 'Published by Bishop (Obstet Gynecol, 1964). Widely adopted internationally. ACOG and NICE recommend Bishop score assessment before induction. Validated as predictor of induction success in numerous studies.',
  formula: 'Sum of 5 cervical examination components (0-3 each except position 0-2):\nDilation, Effacement, Station, Consistency, Position\nFavorable: ≥ 8, Unfavorable: < 6',
  references: [
    { text: 'Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol. 1964;24:266-268.', url: 'https://pubmed.ncbi.nlm.nih.gov/14199536/' },
  ],
  links: [
    { title: 'MDCalc — Bishop Score', url: 'https://www.mdcalc.com/calc/3320/bishop-score-vaginal-delivery-induction-labor', description: 'Interactive Bishop Score calculator' },
  ],
  interpretations: [
    { range: '0-5', label: 'Unfavorable cervix', action: 'Cervical ripening recommended before oxytocin (prostaglandin or mechanical)' },
    { range: '6-7', label: 'Moderately favorable', action: 'Consider cervical ripening or direct induction based on parity and urgency' },
    { range: '8-13', label: 'Favorable cervix', action: 'High likelihood of successful induction with oxytocin' },
  ],
  fields: [
    { key: 'dilation', label: 'Dilation', type: 'score_picker', options: [{ value: 0, label: 'Closed (0)' }, { value: 1, label: '1-2 cm (1)' }, { value: 2, label: '3-4 cm (2)' }, { value: 3, label: '≥ 5 cm (3)' }] },
    { key: 'effacement', label: 'Effacement', type: 'score_picker', options: [{ value: 0, label: '0-30% (0)' }, { value: 1, label: '40-50% (1)' }, { value: 2, label: '60-70% (2)' }, { value: 3, label: '≥ 80% (3)' }] },
    { key: 'station', label: 'Fetal Station', type: 'score_picker', options: [{ value: 0, label: '-3 (0)' }, { value: 1, label: '-2 (1)' }, { value: 2, label: '-1, 0 (2)' }, { value: 3, label: '+1, +2 (3)' }] },
    { key: 'consistency', label: 'Cervical Consistency', type: 'score_picker', options: [{ value: 0, label: 'Firm (0)' }, { value: 1, label: 'Medium (1)' }, { value: 2, label: 'Soft (2)' }] },
    { key: 'position', label: 'Cervical Position', type: 'score_picker', options: [{ value: 0, label: 'Posterior (0)' }, { value: 1, label: 'Mid-position (1)' }, { value: 2, label: 'Anterior (2)' }] },
  ],
  calculate: (vals) => {
    const fields = ['dilation', 'effacement', 'station', 'consistency', 'position']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score < 6) interp = 'Unfavorable cervix — cervical ripening recommended before induction'
    else if (score < 8) interp = 'Moderately favorable — consider ripening vs. direct induction'
    else interp = 'Favorable cervix — high likelihood of successful induction'
    return {
      result: String(score),
      unit: 'points (0-13)',
      interpretation: interp,
      breakdown: [
        { label: 'Dilation', value: String(vals.dilation) },
        { label: 'Effacement', value: String(vals.effacement) },
        { label: 'Station', value: String(vals.station) },
        { label: 'Consistency', value: String(vals.consistency) },
        { label: 'Position', value: String(vals.position) },
      ],
    }
  },
}
