export default {
  id: 'aspects',
  name: 'ASPECTS',
  shortDescription: 'Alberta Stroke Program Early CT Score — ischemic stroke CT scoring.',
  system: 'neurology',
  specialty: ['Neurology', 'Radiology', 'Emergency Medicine', 'Neurosurgery'],
  tags: ['ASPECTS', 'stroke', 'ischemic', 'CT', 'MCA', 'thrombolysis', 'thrombectomy'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Barber PA et al.',
  creatorYear: '2000',
  description: 'ASPECTS is a 10-point topographic CT scan score dividing the MCA territory into 10 regions. Each region with early ischemic change subtracts 1 point from 10. Used to identify patients likely to benefit from reperfusion therapy.',
  whyUse: 'Standardizes early ischemic change assessment on non-contrast CT. Score <6 associated with poor outcome and high risk of hemorrhagic transformation with thrombolysis.',
  whenToUse: [
    'Acute ischemic stroke with suspected MCA territory involvement',
    'Before IV tPA or mechanical thrombectomy decision',
    'Standardizing CT reporting for acute stroke',
  ],
  nextSteps: 'Score 8-10: Good candidate for reperfusion therapy (low infarct burden). Score 7: Borderline. Score ≤6: High infarct burden — increased hemorrhage risk; individualize decision.',
  pearls: [
    'Score starts at 10; subtract 1 for each region with early ischemic change.',
    'Only applies to MCA territory strokes.',
    'Assesses hypoattenuation, swelling, or loss of gray-white differentiation.',
    'Interrater reliability improves with training (experienced neuroradiologists preferred).',
    'Does NOT include posterior circulation (PCA, vertebrobasilar territory).',
  ],
  evidence: 'Barber et al. Lancet 2000. ASPECTS ≥8 predicted good outcome (mRS 0-1) at 3 months with AUC 0.82.',
  formula: `Start at 10 points.
Subtract 1 for early ischemic change in each region:
Ganglionic: C (caudate), L (lentiform), IC (internal capsule), I (insular ribbon)
Cortical MCA: M1, M2, M3 (anterior), M4, M5, M6 (posterior)
Score range: 0 (complete MCA infarct) to 10 (normal)`,
  references: [
    { text: 'Barber PA et al. Validity and reliability of a quantitative computed tomography score in predicting outcome of hyperacute stroke before thrombolytic therapy. Lancet. 2000;355(9216):1670-1674.', url: 'https://pubmed.ncbi.nlm.nih.gov/10905241/' },
    { text: 'Hill MD et al. Selection of acute ischemic stroke patients for IV-tPA using ASPECTS. Stroke. 2003;34(2):e43-e45.', url: 'https://pubmed.ncbi.nlm.nih.gov/12574564/' },
  ],
  links: [
    { title: 'MDCalc — ASPECTS', url: 'https://www.mdcalc.com/calc/3858/alberta-stroke-program-early-ct-score-aspects', description: 'Interactive ASPECTS calculator' },
    { title: 'ASPECTS Website', url: 'http://www.aspectsinstroke.com', description: 'Official ASPECTS training resource' },
  ],
  interpretations: [
    { range: '8-10', label: '8-10 — Low infarct burden', action: 'Good candidate for reperfusion; favorable prognosis' },
    { range: '6-7', label: '6-7 — Moderate infarct burden', action: 'Individualize treatment; borderline risk-benefit for thrombolysis' },
    { range: '0-5', label: '0-5 — High infarct burden', action: 'High risk of hemorrhagic transformation; weigh against reperfusion benefit' },
  ],
  fields: [
    { key: 'C', label: 'C — Caudate nucleus', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
    { key: 'L', label: 'L — Lentiform nucleus', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
    { key: 'IC', label: 'IC — Internal capsule', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
    { key: 'I', label: 'I — Insular ribbon', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
    { key: 'M1', label: 'M1 — Anterior MCA cortex', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
    { key: 'M2', label: 'M2 — MCA cortex lateral to insular ribbon', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
    { key: 'M3', label: 'M3 — Posterior MCA cortex', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
    { key: 'M4', label: 'M4 — Anterior MCA territory (above M1)', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
    { key: 'M5', label: 'M5 — Lateral MCA territory (above M2)', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
    { key: 'M6', label: 'M6 — Posterior MCA territory (above M3)', type: 'select', options: [{ value: 0, label: 'Normal (0)' }, { value: 1, label: 'Ischemic change (-1)' }] },
  ],
  calculate(fields) {
    const regions = ['C','L','IC','I','M1','M2','M3','M4','M5','M6']
    const affectedCount = regions.reduce((s, k) => s + parseFloat(fields[k] || 0), 0)
    const score = 10 - affectedCount
    const breakdown = regions.map(r => ({ label: r, value: fields[r] == 1 ? 'Ischemic' : 'Normal' }))
    let interp, action
    if (score >= 8) { interp = 'Low infarct burden'; action = 'Good reperfusion candidate' }
    else if (score >= 6) { interp = 'Moderate infarct burden'; action = 'Borderline — individualize decision' }
    else { interp = 'High infarct burden'; action = 'High hemorrhagic transformation risk — carefully weigh reperfusion benefit' }
    return {
      result: score,
      unit: '/ 10',
      interpretation: `${interp}: ${action}`,
      breakdown,
    }
  },
}
