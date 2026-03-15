export default {
  id: 'nutric_score',
  name: 'NUTRIC Score',
  shortDescription: 'Nutritional Risk in the Critically Ill — identifies ICU patients who benefit from aggressive nutrition.',
  system: 'nutrition',
  specialty: ['Critical Care', 'Nutrition', 'Intensive Care Unit'],
  tags: ['NUTRIC', 'nutrition', 'ICU', 'critical care', 'enteral', 'malnutrition', 'APACHE'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Heyland DK et al.',
  creatorYear: '2011',
  description: 'The NUTRIC Score identifies critically ill patients who are most likely to benefit from aggressive nutritional therapy. The modified NUTRIC score excludes IL-6 (often unavailable). Higher scores indicate higher nutritional risk and potential benefit from high-dose nutrition.',
  whyUse: 'Standard ICU nutrition guidelines (SCCM/ASPEN) recommend NUTRIC as the preferred nutritional risk tool in the ICU. Identifies patients for whom achieving >80% of caloric target improves mortality.',
  whenToUse: [
    'Critically ill adults within first 24-48 hours of ICU admission',
    'Deciding on intensity of nutritional support',
    'Identifying patients who benefit from early and high-dose enteral nutrition',
  ],
  nextSteps: 'Modified NUTRIC ≥5: High nutritional risk — target 100% of caloric goal; early EN within 24-48h. Score <5: Low risk — standard nutrition protocol.',
  pearls: [
    'Modified NUTRIC (without IL-6) is most commonly used in clinical practice.',
    'High NUTRIC + inadequate calories = worse outcomes; these patients benefit most from optimized EN.',
    'NUTRIC was derived specifically for ICU (unlike NRS-2002 or MUST which are for general ward).',
    'Score ≥5 without IL-6 (or ≥6 with IL-6) = high nutritional risk.',
  ],
  evidence: 'Heyland et al. JPEN 2011. Validated in Canadian ICU cohort (n=597). NUTRIC ≥5 associated with significantly higher 28-day mortality if calories <80% of goal.',
  formula: `Age: <50=0, 50-74=1, ≥75=2
APACHE II: <15=0, 15-19=1, 20-27=2, ≥28=3
SOFA: <6=0, 6-9=1, ≥10=2
Number of comorbidities: 0-1=0, ≥2=1
Days in hospital before ICU: <1=0, ≥1=1
Modified NUTRIC (no IL-6): max 9. High risk ≥5.`,
  references: [
    { text: 'Heyland DK et al. Identifying critically ill patients who benefit the most from nutritional therapy. Crit Care. 2011;15(6):R268.', url: 'https://pubmed.ncbi.nlm.nih.gov/22085763/' },
    { text: 'McClave SA et al. SCCM/ASPEN Guidelines for Nutrition Support Therapy in Adult ICU. JPEN. 2016;40(2):159-211.', url: 'https://pubmed.ncbi.nlm.nih.gov/26773077/' },
  ],
  links: [
    { title: 'MDCalc — NUTRIC Score', url: 'https://www.mdcalc.com/calc/3815/nutrition-risk-critically-ill-nutric-score', description: 'Interactive NUTRIC Score calculator' },
  ],
  interpretations: [
    { range: '0-4', label: 'Low nutritional risk', action: 'Standard nutrition protocol; low risk of adverse outcomes from nutrition deficit' },
    { range: '5-9', label: 'High nutritional risk', action: 'Aggressive nutrition therapy indicated; target ≥80% caloric goal; early EN within 24-48h' },
  ],
  fields: [
    { key: 'age', label: 'Age', type: 'select', options: [{ value: 0, label: '<50 years (0)' }, { value: 1, label: '50-74 years (+1)' }, { value: 2, label: '≥75 years (+2)' }] },
    { key: 'apache2', label: 'APACHE II Score', type: 'select', options: [{ value: 0, label: '<15 (0)' }, { value: 1, label: '15-19 (+1)' }, { value: 2, label: '20-27 (+2)' }, { value: 3, label: '≥28 (+3)' }] },
    { key: 'sofa', label: 'SOFA Score', type: 'select', options: [{ value: 0, label: '<6 (0)' }, { value: 1, label: '6-9 (+1)' }, { value: 2, label: '≥10 (+2)' }] },
    { key: 'comorbidities', label: 'Number of comorbidities', type: 'select', options: [{ value: 0, label: '0-1 comorbidities (0)' }, { value: 1, label: '≥2 comorbidities (+1)' }] },
    { key: 'days_hosp', label: 'Days in hospital before ICU admission', type: 'select', options: [{ value: 0, label: '<1 day (0)' }, { value: 1, label: '≥1 day (+1)' }] },
  ],
  calculate(fields) {
    const score = ['age','apache2','sofa','comorbidities','days_hosp'].reduce((s, k) => s + parseFloat(fields[k] || 0), 0)
    const highRisk = score >= 5
    const breakdown = [
      { label: 'Age', value: `+${fields.age}` },
      { label: 'APACHE II', value: `+${fields.apache2}` },
      { label: 'SOFA', value: `+${fields.sofa}` },
      { label: 'Comorbidities', value: `+${fields.comorbidities}` },
      { label: 'Hospital days pre-ICU', value: `+${fields.days_hosp}` },
    ]
    return {
      result: score,
      unit: '/ 9 (modified NUTRIC)',
      interpretation: highRisk
        ? 'HIGH nutritional risk (≥5): Aggressive early enteral nutrition indicated. Target ≥80% of caloric goal within 24-48h of ICU admission.'
        : 'LOW nutritional risk (<5): Standard nutrition protocol. Reassess if clinical status changes.',
      breakdown,
    }
  },
}
