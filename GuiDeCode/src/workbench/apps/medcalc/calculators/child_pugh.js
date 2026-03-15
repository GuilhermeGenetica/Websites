export default {
  id: 'child_pugh',
  name: 'Child-Pugh Score',
  shortDescription: 'Classification of severity of cirrhosis and hepatic dysfunction',
  system: 'gastro_hepatology',
  specialty: ['Hepatology', 'Gastroenterology', 'Surgery', 'Critical Care'],
  tags: ['cirrhosis', 'liver', 'Child-Pugh', 'hepatic', 'portal hypertension'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Child CG, Turcotte JG / Pugh RN et al.',
  creatorYear: '1964 / 1973',
  description: 'The Child-Pugh score classifies the severity of cirrhosis using five clinical measures: bilirubin, albumin, INR (or PT prolongation), ascites, and hepatic encephalopathy. It categorizes patients into Class A (well-compensated), B (significant functional compromise), or C (decompensated), each with distinct prognostic and surgical risk implications.',
  whyUse: 'Prognostication in cirrhosis. Guides surgical risk assessment in cirrhotic patients. Determines candidacy for procedures (TIPS, hepatic resection). Complements MELD for clinical decision-making.',
  whenToUse: [
    'Prognostication and follow-up of cirrhotic patients',
    'Pre-operative risk assessment in patients with liver disease',
    'TIPS candidacy evaluation',
    'Assessment of hepatic functional reserve',
  ],
  nextSteps: 'Class A (5-6): Good hepatic function, low surgical risk (~10% perioperative mortality). Class B (7-9): Significant compromise, moderate surgical risk (~30%). Class C (10-15): Decompensated, high risk (~80%), consider transplant evaluation.',
  pearls: [
    'Child-Pugh is simpler than MELD but less objective (ascites and encephalopathy are subjective).',
    'Not used for UNOS transplant allocation (MELD-Na is used instead).',
    'Albumin is affected by nutritional status and acute illness — interpret in context.',
    'INR may be elevated by anticoagulants, falsely increasing the score.',
    'Class C patients are generally not surgical candidates except for transplant.',
  ],
  evidence: 'Original description by Child and Turcotte (1964) for surgical risk. Modified by Pugh et al. (1973) replacing nutritional status with PT/INR. Widely validated for prognostication in cirrhosis. 1-year survival: Class A ~100%, Class B ~80%, Class C ~45%.',
  formula: 'Sum of 5 components (1-3 each), total 5-15:\nBilirubin, Albumin, INR/PT, Ascites, Encephalopathy\nClass A: 5-6 | Class B: 7-9 | Class C: 10-15',
  references: [
    { text: 'Pugh RN et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg. 1973;60(8):646-649.', url: 'https://pubmed.ncbi.nlm.nih.gov/4541913/' },
    { text: 'Durand F, Valla D. Assessment of the prognosis of cirrhosis: Child-Pugh versus MELD. J Hepatol. 2005;42 Suppl(1):S100-107.', url: 'https://pubmed.ncbi.nlm.nih.gov/15777564/' },
  ],
  links: [
    { title: 'MDCalc — Child-Pugh Score', url: 'https://www.mdcalc.com/calc/340/child-pugh-score-cirrhosis-mortality', description: 'Interactive Child-Pugh calculator' },
  ],
  interpretations: [
    { range: '5-6', label: 'Class A — Well-compensated', action: '1-year survival ~100%. Low surgical risk (~10% perioperative mortality)' },
    { range: '7-9', label: 'Class B — Significant compromise', action: '1-year survival ~80%. Moderate surgical risk (~30%). Consider alternatives to surgery.' },
    { range: '10-15', label: 'Class C — Decompensated', action: '1-year survival ~45%. High surgical risk (~80%). Transplant evaluation.' },
  ],
  fields: [
    {
      key: 'bilirubin', label: 'Total Bilirubin', type: 'score_picker',
      options: [
        { value: 1, label: '< 2 mg/dL (1)' },
        { value: 2, label: '2-3 mg/dL (2)' },
        { value: 3, label: '> 3 mg/dL (3)' },
      ],
    },
    {
      key: 'albumin', label: 'Serum Albumin', type: 'score_picker',
      options: [
        { value: 1, label: '> 3.5 g/dL (1)' },
        { value: 2, label: '2.8-3.5 g/dL (2)' },
        { value: 3, label: '< 2.8 g/dL (3)' },
      ],
    },
    {
      key: 'inr', label: 'INR', type: 'score_picker',
      options: [
        { value: 1, label: '< 1.7 (1)' },
        { value: 2, label: '1.7-2.3 (2)' },
        { value: 3, label: '> 2.3 (3)' },
      ],
    },
    {
      key: 'ascites', label: 'Ascites', type: 'score_picker',
      options: [
        { value: 1, label: 'None (1)' },
        { value: 2, label: 'Mild / controlled with diuretics (2)' },
        { value: 3, label: 'Moderate-Severe / refractory (3)' },
      ],
    },
    {
      key: 'encephalopathy', label: 'Hepatic Encephalopathy', type: 'score_picker',
      options: [
        { value: 1, label: 'None (1)' },
        { value: 2, label: 'Grade I-II (controlled) (2)' },
        { value: 3, label: 'Grade III-IV (poorly controlled) (3)' },
      ],
    },
  ],
  calculate: (vals) => {
    const fields = ['bilirubin', 'albumin', 'inr', 'ascites', 'encephalopathy']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let cls = ''
    let survival = ''
    if (score <= 6) { cls = 'Class A — Well-compensated cirrhosis'; survival = '~100% 1-year survival' }
    else if (score <= 9) { cls = 'Class B — Significant functional compromise'; survival = '~80% 1-year survival' }
    else { cls = 'Class C — Decompensated cirrhosis'; survival = '~45% 1-year survival' }
    return {
      result: String(score),
      unit: 'points (5-15)',
      interpretation: cls,
      detail: survival,
      breakdown: [
        { label: 'Bilirubin', value: String(vals.bilirubin) },
        { label: 'Albumin', value: String(vals.albumin) },
        { label: 'INR', value: String(vals.inr) },
        { label: 'Ascites', value: String(vals.ascites) },
        { label: 'Encephalopathy', value: String(vals.encephalopathy) },
      ],
    }
  },
}
