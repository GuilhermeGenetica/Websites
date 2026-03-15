export default {
  id: 'nihss',
  name: 'NIH Stroke Scale (NIHSS)',
  shortDescription: 'Quantifies stroke severity to guide acute treatment decisions',
  system: 'neurology',
  specialty: ['Neurology', 'Emergency Medicine', 'Neurosurgery', 'Critical Care'],
  tags: ['stroke', 'NIHSS', 'thrombolysis', 'tPA', 'cerebrovascular', 'neuro'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Brott T, Adams HP et al.',
  creatorYear: '1989',
  description: 'The NIHSS is a systematic assessment tool that provides a quantitative measure of stroke-related neurological deficit. It evaluates 11 items including level of consciousness, gaze, visual fields, facial palsy, motor function, ataxia, sensory, language, dysarthria, and extinction/inattention. It is the standard tool for determining thrombolytic eligibility and monitoring stroke evolution.',
  whyUse: 'Required for thrombolysis eligibility assessment. Predicts stroke outcome and infarct volume. Guides acute treatment decisions (IV tPA, mechanical thrombectomy). Serial NIHSS tracks improvement or deterioration.',
  whenToUse: [
    'Acute stroke assessment in ED',
    'Before and after thrombolysis (tPA/tenecteplase)',
    'Thrombectomy candidacy evaluation',
    'Serial neurological monitoring during stroke hospitalization',
  ],
  nextSteps: 'NIHSS 0: Symptoms resolved, consider TIA workup. NIHSS 1-4: Minor stroke, consider IV tPA if within window. NIHSS 5-15: Moderate stroke, IV tPA + consider thrombectomy if LVO. NIHSS 16-20: Moderate-severe. NIHSS 21-42: Severe stroke.',
  pearls: [
    'NIHSS certification is required before administering tPA at most centers.',
    'NIHSS does NOT capture posterior circulation strokes well (vertebrobasilar) — clinical judgment needed.',
    'Score > 25 associated with high mortality and hemorrhagic transformation risk.',
    'A 4-point improvement in NIHSS is considered clinically significant.',
    'NIHSS is weighted toward left hemisphere/dominant functions (language) — right hemisphere strokes may score lower despite severe disability.',
    'Always document time of NIHSS assessment alongside the score.',
  ],
  evidence: 'Developed by Brott et al. (Stroke, 1989). Validated extensively. Required by AHA/ASA guidelines for acute stroke treatment decisions. Inter-rater reliability improved with certification training.',
  formula: 'Sum of 11 items (total 0-42):\n1a. LOC (0-3), 1b. LOC Questions (0-2), 1c. LOC Commands (0-2)\n2. Best Gaze (0-2), 3. Visual Fields (0-3)\n4. Facial Palsy (0-3), 5a. Motor Arm L (0-4), 5b. Motor Arm R (0-4)\n6a. Motor Leg L (0-4), 6b. Motor Leg R (0-4)\n7. Limb Ataxia (0-2), 8. Sensory (0-2)\n9. Best Language (0-3), 10. Dysarthria (0-2)\n11. Extinction/Inattention (0-2)',
  references: [
    { text: 'Brott T et al. Measurements of acute cerebral infarction: a clinical examination scale. Stroke. 1989;20(7):864-870.', url: 'https://pubmed.ncbi.nlm.nih.gov/2749846/' },
    { text: 'Powers WJ et al. Guidelines for the Early Management of Patients With Acute Ischemic Stroke: 2019 Update. Stroke. 2019;50(12):e344-e418.', url: 'https://pubmed.ncbi.nlm.nih.gov/31662037/' },
  ],
  links: [
    { title: 'MDCalc — NIHSS', url: 'https://www.mdcalc.com/calc/715/nih-stroke-scale-score-nihss', description: 'Interactive NIHSS calculator' },
  ],
  interpretations: [
    { range: '0', label: 'No stroke symptoms', action: 'Consider TIA workup; symptoms may have resolved' },
    { range: '1-4', label: 'Minor stroke', action: 'Consider IV tPA if within window; evaluate for LVO' },
    { range: '5-15', label: 'Moderate stroke', action: 'IV tPA if eligible; CTA for LVO — thrombectomy if indicated' },
    { range: '16-20', label: 'Moderate-severe stroke', action: 'IV tPA + thrombectomy evaluation; ICU admission' },
    { range: '21-42', label: 'Severe stroke', action: 'Goals of care discussion may be appropriate; high mortality risk' },
  ],
  fields: [
    { key: 'loc', label: '1a. Level of Consciousness', type: 'score_picker', options: [{ value: 0, label: 'Alert (0)' }, { value: 1, label: 'Not alert, arousable by minor stimulation (1)' }, { value: 2, label: 'Not alert, requires repeated stimulation (2)' }, { value: 3, label: 'Unresponsive or reflexive responses only (3)' }] },
    { key: 'loc_questions', label: '1b. LOC Questions (month + age)', type: 'score_picker', options: [{ value: 0, label: 'Both correct (0)' }, { value: 1, label: 'One correct (1)' }, { value: 2, label: 'Neither correct (2)' }] },
    { key: 'loc_commands', label: '1c. LOC Commands (open/close eyes, grip/release)', type: 'score_picker', options: [{ value: 0, label: 'Both correct (0)' }, { value: 1, label: 'One correct (1)' }, { value: 2, label: 'Neither correct (2)' }] },
    { key: 'gaze', label: '2. Best Gaze', type: 'score_picker', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Partial gaze palsy (1)' }, { value: 2, label: 'Forced deviation / total gaze paresis (2)' }] },
    { key: 'visual', label: '3. Visual Fields', type: 'score_picker', options: [{ value: 0, label: 'No visual loss (0)' }, { value: 1, label: 'Partial hemianopia (1)' }, { value: 2, label: 'Complete hemianopia (2)' }, { value: 3, label: 'Bilateral hemianopia / blind (3)' }] },
    { key: 'facial', label: '4. Facial Palsy', type: 'score_picker', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Minor paralysis (flattened nasolabial fold) (1)' }, { value: 2, label: 'Partial paralysis (lower face) (2)' }, { value: 3, label: 'Complete paralysis (upper + lower face) (3)' }] },
    { key: 'motor_arm_l', label: '5a. Motor Arm — Left', type: 'score_picker', options: [{ value: 0, label: 'No drift (holds 10s) (0)' }, { value: 1, label: 'Drift (holds but drifts before 10s) (1)' }, { value: 2, label: 'Some effort against gravity (2)' }, { value: 3, label: 'No effort against gravity (3)' }, { value: 4, label: 'No movement (4)' }] },
    { key: 'motor_arm_r', label: '5b. Motor Arm — Right', type: 'score_picker', options: [{ value: 0, label: 'No drift (holds 10s) (0)' }, { value: 1, label: 'Drift (1)' }, { value: 2, label: 'Some effort against gravity (2)' }, { value: 3, label: 'No effort against gravity (3)' }, { value: 4, label: 'No movement (4)' }] },
    { key: 'motor_leg_l', label: '6a. Motor Leg — Left', type: 'score_picker', options: [{ value: 0, label: 'No drift (holds 5s) (0)' }, { value: 1, label: 'Drift (holds but drifts before 5s) (1)' }, { value: 2, label: 'Some effort against gravity (2)' }, { value: 3, label: 'No effort against gravity (3)' }, { value: 4, label: 'No movement (4)' }] },
    { key: 'motor_leg_r', label: '6b. Motor Leg — Right', type: 'score_picker', options: [{ value: 0, label: 'No drift (holds 5s) (0)' }, { value: 1, label: 'Drift (1)' }, { value: 2, label: 'Some effort against gravity (2)' }, { value: 3, label: 'No effort against gravity (3)' }, { value: 4, label: 'No movement (4)' }] },
    { key: 'ataxia', label: '7. Limb Ataxia', type: 'score_picker', options: [{ value: 0, label: 'Absent (0)' }, { value: 1, label: 'Present in one limb (1)' }, { value: 2, label: 'Present in two limbs (2)' }] },
    { key: 'sensory', label: '8. Sensory', type: 'score_picker', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Mild-to-moderate loss (1)' }, { value: 2, label: 'Severe or total loss (2)' }] },
    { key: 'language', label: '9. Best Language', type: 'score_picker', options: [{ value: 0, label: 'No aphasia (0)' }, { value: 1, label: 'Mild-to-moderate aphasia (1)' }, { value: 2, label: 'Severe aphasia (2)' }, { value: 3, label: 'Mute / global aphasia (3)' }] },
    { key: 'dysarthria', label: '10. Dysarthria', type: 'score_picker', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Mild-to-moderate (1)' }, { value: 2, label: 'Severe / near unintelligible or mute (2)' }] },
    { key: 'extinction', label: '11. Extinction and Inattention', type: 'score_picker', options: [{ value: 0, label: 'No abnormality (0)' }, { value: 1, label: 'Inattention to one modality (1)' }, { value: 2, label: 'Profound hemi-inattention / extinction to > 1 modality (2)' }] },
  ],
  calculate: (vals) => {
    const fields = ['loc', 'loc_questions', 'loc_commands', 'gaze', 'visual', 'facial', 'motor_arm_l', 'motor_arm_r', 'motor_leg_l', 'motor_leg_r', 'ataxia', 'sensory', 'language', 'dysarthria', 'extinction']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let severity = ''
    if (score === 0) severity = 'No stroke symptoms'
    else if (score <= 4) severity = 'Minor stroke'
    else if (score <= 15) severity = 'Moderate stroke'
    else if (score <= 20) severity = 'Moderate-severe stroke'
    else severity = 'Severe stroke'
    return {
      result: String(score),
      unit: 'points (0-42)',
      interpretation: severity,
    }
  },
}
