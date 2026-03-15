export default {
  id: 'wells_pe',
  name: "Wells' Criteria for PE",
  shortDescription: 'Clinical prediction rule for pulmonary embolism probability',
  system: 'cardiovascular',
  specialty: ['Emergency Medicine', 'Internal Medicine', 'Pulmonology'],
  tags: ['pulmonary embolism', 'PE', 'DVT', 'thromboembolism', 'Wells'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Wells PS et al.',
  creatorYear: '2000',
  description: "The Wells score for pulmonary embolism stratifies patients into risk categories to guide diagnostic workup. It uses clinical criteria to estimate pre-test probability of PE, determining whether D-dimer testing or CT pulmonary angiography (CTPA) is the appropriate next step.",
  whyUse: 'Guides evidence-based diagnostic strategy for suspected PE. Avoids unnecessary CTPA in low-risk patients. Combined with D-dimer, can safely exclude PE without imaging in low-risk patients.',
  whenToUse: [
    'Clinical suspicion of pulmonary embolism',
    'Acute dyspnea or chest pain workup',
    'Risk stratification before ordering CTPA',
    'Decision on D-dimer utility',
  ],
  nextSteps: 'Score ≤ 4: D-dimer; if negative, PE excluded. Score > 4: Proceed directly to CTPA. If CTPA positive, initiate anticoagulation. Consider PERC rule for very low-risk patients.',
  pearls: [
    'Most commonly used as dichotomized: PE unlikely (≤ 4) vs PE likely (> 4).',
    'D-dimer is only useful in low-probability patients — not recommended if Wells > 4.',
    'The "alternative diagnosis less likely" criterion is subjective but the most heavily weighted (+3).',
    'Modified Wells (simplified) gives +1 per criterion instead of the original weighting.',
    'PERC rule can be applied if Wells ≤ 4 to potentially avoid D-dimer testing.',
    'Remember: Wells is a pre-test probability tool, not a diagnostic test.',
  ],
  evidence: 'Validated in the Christopher Study (JAMA 2006): Wells + D-dimer safely excluded PE with 3-month VTE rate < 1%. The YEARS algorithm (Lancet 2017) provides an alternative approach.',
  formula: 'Sum of weighted criteria (0-12.5):\nClinical signs of DVT (+3), PE most likely dx (+3),\nHR > 100 (+1.5), Immobilization/surgery (+1.5),\nPrevious DVT/PE (+1.5), Hemoptysis (+1), Cancer (+1)',
  references: [
    { text: 'Wells PS et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism. Thromb Haemost. 2000;83(3):416-420.', url: 'https://pubmed.ncbi.nlm.nih.gov/10744147/' },
    { text: 'van Belle A et al. Effectiveness of managing suspected pulmonary embolism using an algorithm combining clinical probability, D-dimer testing, and computed tomography. JAMA. 2006;295(2):172-179.', url: 'https://pubmed.ncbi.nlm.nih.gov/16403929/' },
  ],
  links: [
    { title: 'MDCalc — Wells PE', url: 'https://www.mdcalc.com/calc/115/wells-criteria-pulmonary-embolism', description: 'Interactive Wells PE calculator' },
  ],
  interpretations: [
    { range: '0-1', label: 'Low probability (~1.3% PE prevalence)', action: 'D-dimer; if negative, PE excluded. Consider PERC rule.' },
    { range: '2-4', label: 'PE unlikely — moderate pre-test probability', action: 'D-dimer testing; if positive, proceed to CTPA' },
    { range: '5-6', label: 'PE likely — moderate-high probability', action: 'Proceed to CTPA directly' },
    { range: '>6', label: 'High probability (~40-50% PE prevalence)', action: 'CTPA urgently; consider empiric anticoagulation while awaiting imaging' },
  ],
  fields: [
    { key: 'dvt_signs', label: 'Clinical signs/symptoms of DVT (leg swelling, pain with palpation)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 3, label: 'Yes (+3)' }] },
    { key: 'pe_likely', label: 'PE is #1 diagnosis, or equally likely', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 3, label: 'Yes (+3)' }] },
    { key: 'hr', label: 'Heart rate > 100 bpm', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1.5, label: 'Yes (+1.5)' }] },
    { key: 'immobilization', label: 'Immobilization (≥ 3 days) or surgery in previous 4 weeks', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1.5, label: 'Yes (+1.5)' }] },
    { key: 'previous_dvt_pe', label: 'Previous DVT/PE', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1.5, label: 'Yes (+1.5)' }] },
    { key: 'hemoptysis', label: 'Hemoptysis', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'cancer', label: 'Malignancy (treatment within 6 months or palliative)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['dvt_signs', 'pe_likely', 'hr', 'immobilization', 'previous_dvt_pe', 'hemoptysis', 'cancer']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseFloat(vals[f]) || 0), 0)
    let interp = ''
    if (score <= 4) interp = 'PE unlikely — D-dimer to exclude; if negative, PE ruled out'
    else interp = 'PE likely — proceed to CTPA directly'
    let detail = ''
    if (score <= 1) detail = 'Low risk (~1.3% PE prevalence)'
    else if (score <= 4) detail = 'Moderate risk'
    else if (score <= 6) detail = 'Moderate-high risk'
    else detail = 'High risk (~40-50% PE prevalence)'
    return {
      result: score % 1 === 0 ? String(score) : score.toFixed(1),
      unit: 'points',
      interpretation: interp,
      detail: detail,
    }
  },
}
