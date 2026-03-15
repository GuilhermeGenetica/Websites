export default {
  id: 'fib4',
  name: 'FIB-4 Index',
  shortDescription: 'Non-invasive liver fibrosis assessment using routine lab values',
  system: 'gastro_hepatology',
  specialty: ['Hepatology', 'Gastroenterology', 'Primary Care', 'Internal Medicine'],
  tags: ['fibrosis', 'liver', 'FIB-4', 'NAFLD', 'hepatitis', 'cirrhosis'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Sterling RK et al.',
  creatorYear: '2006',
  description: 'The FIB-4 Index is a non-invasive marker for hepatic fibrosis using readily available laboratory values: age, AST, ALT, and platelet count. Originally validated in HIV/HCV co-infection, it is now widely used for NAFLD/NASH, hepatitis B, and other chronic liver diseases. It helps determine which patients need further evaluation (e.g., FibroScan or liver biopsy).',
  whyUse: 'Non-invasive, inexpensive fibrosis assessment using routine labs. Recommended as first-line screening for advanced fibrosis in NAFLD (AASLD/EASL guidelines). Reduces unnecessary liver biopsies and specialist referrals.',
  whenToUse: [
    'Screening for advanced fibrosis in NAFLD/NASH',
    'Chronic hepatitis B or C fibrosis assessment',
    'Primary care screening before hepatology referral',
    'Longitudinal monitoring of fibrosis progression',
  ],
  nextSteps: 'FIB-4 < 1.30: Low risk for advanced fibrosis, reassess in 1-2 years. FIB-4 1.30-2.67: Indeterminate — proceed to FibroScan or ELF test. FIB-4 > 2.67: High probability of advanced fibrosis — refer to hepatology.',
  pearls: [
    'FIB-4 < 1.30 has > 90% negative predictive value for excluding advanced fibrosis.',
    'Less reliable in patients < 35 or > 65 years (age is a component of the formula).',
    'For patients > 65, a higher cutoff of < 2.0 for low risk may be more appropriate.',
    'Platelet count can be falsely low due to non-hepatic causes (ITP, medications).',
    'Acute hepatitis with very high AST/ALT can falsely elevate FIB-4.',
    'Combine with FibroScan for best non-invasive fibrosis staging.',
  ],
  evidence: 'Developed by Sterling et al. (Hepatology 2006) in HIV/HCV patients. Extensively validated in NAFLD populations. Endorsed by AASLD (2023), EASL (2021), and AGA (2020) guidelines for NAFLD fibrosis screening.',
  formula: 'FIB-4 = (Age × AST) / (Platelets × √ALT)\nAge in years, AST and ALT in U/L, Platelets in 10⁹/L',
  references: [
    { text: 'Sterling RK et al. Development of a simple noninvasive index to predict significant fibrosis in patients with HIV/HCV coinfection. Hepatology. 2006;43(6):1317-1325.', url: 'https://pubmed.ncbi.nlm.nih.gov/16729309/' },
    { text: 'Shah AG et al. Comparison of noninvasive markers of fibrosis in patients with nonalcoholic fatty liver disease. Clin Gastroenterol Hepatol. 2009;7(10):1104-1112.', url: 'https://pubmed.ncbi.nlm.nih.gov/19523535/' },
  ],
  links: [
    { title: 'MDCalc — FIB-4 Index', url: 'https://www.mdcalc.com/calc/2200/fibrosis-4-fib-4-index-liver-fibrosis', description: 'Interactive FIB-4 calculator' },
  ],
  interpretations: [
    { range: '<1.30', label: 'Low risk for advanced fibrosis', action: 'Reassure; reassess in 1-2 years with repeat labs' },
    { range: '1.30-2.67', label: 'Indeterminate', action: 'Further assessment: FibroScan, ELF test, or hepatology referral' },
    { range: '>2.67', label: 'High probability of advanced fibrosis (F3-F4)', action: 'Hepatology referral; consider FibroScan or biopsy for staging' },
  ],
  fields: [
    { key: 'age', label: 'Age', type: 'number', min: 18, max: 120, step: 1, placeholder: 'years', hint: 'years' },
    { key: 'ast', label: 'AST (SGOT)', type: 'number', min: 1, max: 10000, step: 1, placeholder: 'U/L', hint: 'U/L' },
    { key: 'alt', label: 'ALT (SGPT)', type: 'number', min: 1, max: 10000, step: 1, placeholder: 'U/L', hint: 'U/L' },
    { key: 'platelets', label: 'Platelet Count', type: 'number', min: 1, max: 1000, step: 1, placeholder: '×10⁹/L', hint: '×10⁹/L' },
  ],
  calculate: (vals) => {
    const age = parseFloat(vals.age)
    const ast = parseFloat(vals.ast)
    const alt = parseFloat(vals.alt)
    const plt = parseFloat(vals.platelets)
    if (!age || !ast || !alt || !plt || plt <= 0 || alt <= 0) return null
    const fib4 = (age * ast) / (plt * Math.sqrt(alt))
    let interp = ''
    if (fib4 < 1.30) interp = 'Low risk for advanced fibrosis (NPV > 90%)'
    else if (fib4 <= 2.67) interp = 'Indeterminate — further assessment recommended'
    else interp = 'High probability of advanced fibrosis (F3-F4)'
    return {
      result: fib4.toFixed(2),
      unit: '',
      interpretation: interp,
      detail: `Age: ${age}, AST: ${ast} U/L, ALT: ${alt} U/L, Platelets: ${plt} ×10⁹/L`,
    }
  },
}
