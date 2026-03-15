export default {
  id: 'aa_gradient',
  name: 'A-a Gradient',
  shortDescription: 'Alveolar-arterial oxygen gradient for hypoxemia evaluation',
  system: 'respiratory',
  specialty: ['Emergency Medicine', 'Pulmonology', 'Critical Care', 'Internal Medicine'],
  tags: ['A-a gradient', 'hypoxemia', 'oxygen', 'respiratory', 'ABG', 'PaO2'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Standard physiological calculation',
  creatorYear: '1960s',
  description: 'The alveolar-arterial (A-a) oxygen gradient measures the difference between alveolar (PAO₂) and arterial (PaO₂) oxygen tension. An elevated A-a gradient indicates a pulmonary cause of hypoxemia (V/Q mismatch, shunt, diffusion impairment), while a normal gradient with hypoxemia suggests hypoventilation or low FiO₂.',
  whyUse: 'Distinguishes pulmonary from non-pulmonary causes of hypoxemia. Helps narrow the differential diagnosis of hypoxemia. Important in PE evaluation — PE typically elevates the A-a gradient.',
  whenToUse: [
    'Evaluation of hypoxemia on ABG',
    'Differentiating causes of respiratory failure',
    'PE workup — A-a gradient is typically elevated',
    'Assessment of gas exchange efficiency',
  ],
  nextSteps: 'Normal A-a gradient with hypoxemia: Consider hypoventilation (CNS depression, neuromuscular disease) or low FiO₂ (altitude). Elevated A-a gradient: V/Q mismatch (PE, pneumonia, asthma), shunt (ARDS, AVM), or diffusion impairment (ILD).',
  pearls: [
    'Normal A-a gradient increases with age: expected normal ≈ (Age/4) + 4.',
    'On room air (FiO₂ 21%), A-a gradient < 10-15 mmHg is normal for young adults.',
    'The A-a gradient is most useful on room air — becomes less reliable at high FiO₂.',
    'An elevated A-a gradient with normal CXR should raise suspicion for PE.',
    'In pure hypoventilation (e.g., opioid overdose), the A-a gradient remains normal.',
    'At altitude, the reduced atmospheric pressure changes the alveolar gas equation values.',
  ],
  evidence: 'Based on the alveolar gas equation developed in the 1940s-1960s. Fundamental concept in pulmonary physiology used universally in clinical medicine. Age-adjusted normal values validated in multiple studies.',
  formula: 'PAO₂ = FiO₂ × (Patm - PH₂O) - (PaCO₂ / RQ)\nA-a gradient = PAO₂ - PaO₂\nPatm = 760 mmHg at sea level\nPH₂O = 47 mmHg\nRQ = 0.8 (typical)\nExpected normal = (Age/4) + 4',
  references: [
    { text: 'Kanber GJ et al. The alveolar-arterial oxygen gradient in young and elderly men during air and oxygen breathing. Am Rev Respir Dis. 1968;97(3):376-381.', url: 'https://pubmed.ncbi.nlm.nih.gov/5637789/' },
  ],
  links: [
    { title: 'MDCalc — A-a Gradient', url: 'https://www.mdcalc.com/calc/1/a-a-o2-gradient', description: 'Interactive A-a gradient calculator' },
  ],
  interpretations: [
    { range: '<10', label: 'Normal A-a gradient', action: 'If hypoxemic: consider hypoventilation or low FiO₂' },
    { range: '10-20', label: 'Mildly elevated (may be normal with age)', action: 'Compare to age-adjusted expected value; consider early lung pathology' },
    { range: '20-40', label: 'Moderately elevated', action: 'Likely V/Q mismatch or mild shunt; workup: PE, pneumonia, asthma, early ARDS' },
    { range: '>40', label: 'Severely elevated', action: 'Significant shunt or V/Q mismatch; consider ARDS, large PE, severe pneumonia' },
  ],
  fields: [
    { key: 'fio2', label: 'FiO₂', type: 'number', min: 21, max: 100, step: 1, placeholder: '%', hint: '% (21% = room air)' },
    { key: 'pao2', label: 'PaO₂ (arterial)', type: 'number', min: 10, max: 600, step: 1, placeholder: 'mmHg', hint: 'mmHg — from ABG' },
    { key: 'paco2', label: 'PaCO₂', type: 'number', min: 5, max: 150, step: 1, placeholder: 'mmHg', hint: 'mmHg — from ABG' },
    { key: 'age', label: 'Age (for expected normal)', type: 'number', min: 1, max: 120, step: 1, placeholder: 'years', hint: 'years' },
    { key: 'patm', label: 'Atmospheric pressure (optional)', type: 'number', min: 400, max: 800, step: 1, placeholder: 'mmHg', hint: 'mmHg — default 760 (sea level)', required: false },
  ],
  calculate: (vals) => {
    const fio2 = parseFloat(vals.fio2) / 100
    const pao2 = parseFloat(vals.pao2)
    const paco2 = parseFloat(vals.paco2)
    const age = parseFloat(vals.age)
    if (!fio2 || !pao2 || !paco2 || !age) return null
    const patm = parseFloat(vals.patm) || 760
    const ph2o = 47
    const rq = 0.8
    const pAO2 = fio2 * (patm - ph2o) - (paco2 / rq)
    const aaGradient = pAO2 - pao2
    const expectedNormal = (age / 4) + 4
    let interp = ''
    if (aaGradient <= expectedNormal) interp = 'A-a gradient within expected normal for age'
    else if (aaGradient <= 20) interp = 'Mildly elevated A-a gradient'
    else if (aaGradient <= 40) interp = 'Moderately elevated — likely V/Q mismatch or shunt'
    else interp = 'Severely elevated — significant pulmonary gas exchange impairment'
    return {
      result: aaGradient.toFixed(1),
      unit: 'mmHg',
      interpretation: interp,
      detail: `PAO₂ (alveolar): ${pAO2.toFixed(1)} mmHg, PaO₂ (arterial): ${pao2} mmHg`,
      breakdown: [
        { label: 'A-a Gradient', value: `${aaGradient.toFixed(1)} mmHg` },
        { label: 'Expected Normal (age-adjusted)', value: `≤ ${expectedNormal.toFixed(0)} mmHg` },
        { label: 'Alveolar PO₂ (PAO₂)', value: `${pAO2.toFixed(1)} mmHg` },
      ],
    }
  },
}
