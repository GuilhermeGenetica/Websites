export default {
  id: 'penn_ii',
  name: 'PENN II — BRCA1/2 Mutation Probability Score',
  shortDescription: 'Point-based score estimating prior probability of identifying a BRCA1 or BRCA2 pathogenic variant',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Oncology', 'Gynecology', 'Surgical Oncology'],
  tags: ['BRCA', 'BRCA1', 'BRCA2', 'breast cancer', 'ovarian cancer', 'hereditary', 'oncogenetics', 'screening', 'HBOC'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Armstrong K et al. (University of Pennsylvania)',
  creatorYear: '2000',
  description: 'The PENN II Risk Model is a validated, point-based clinical scoring system that estimates the prior probability that an individual carries a germline pathogenic variant in BRCA1 or BRCA2. It utilizes personal and family history of breast, ovarian, and related cancers to generate a weighted score. A score of ≥ 10 is widely accepted as indicating a ≥ 10% prior probability of carrying a BRCA1/2 mutation — the conventional threshold justifying referral for genetic counseling and consideration of genetic testing. Unlike probability-model tools (BRCAPRO, BOADICEA, Tyrer-Cuzick), PENN II requires only a paper and pencil, making it practical for rapid clinic triage.',
  whyUse: 'Provides a rapid, validated, externally applicable tool for point-of-care screening of patients who should be referred for BRCA1/2 genetic counseling. Does not require specialized software or complex pedigree modeling. Widely used in primary care, gynecology, and oncology settings. Validated against BRCAPRO in multiple independent cohorts. Useful for insurance pre-authorization documentation.',
  whenToUse: [
    'Initial triage in primary care, gynecology, or oncology to identify patients warranting hereditary breast and ovarian cancer (HBOC) genetics referral',
    'Rapid assessment of BRCA1/2 testing eligibility at first presentation',
    'Insurance pre-authorization documentation for BRCA1/2 or multigene panel testing',
    'Screening mammography or oncology clinics without on-site genetic counselors',
  ],
  nextSteps: 'Score ≥ 10: Refer for formal genetic counseling and consider comprehensive BRCA1/BRCA2 testing or multigene hereditary cancer panel (NCCN Category 1). Score < 10: Patient may still warrant testing per NCCN criteria not captured by PENN II (e.g., triple-negative breast cancer age < 60, Ashkenazi ancestry alone, certain bilateral ovarian patterns). Always apply current NCCN Genetic/Familial High-Risk Guidelines v2.2024 for final determination.',
  pearls: [
    'Only count BLOOD relatives — bilateral breast cancer in one relative counts as TWO primary cancers if both breasts were separate primaries.',
    'Ashkenazi Jewish ancestry adds 4 points due to three founder pathogenic variants (BRCA1 185delAG, BRCA1 5382insC, BRCA2 6174delT) with ~2.5% carrier frequency.',
    'Male breast cancer is heavily weighted (+7) — a single affected male relative is nearly sufficient alone to trigger referral.',
    'This model assesses probability of BRCA1/2 mutation — NOT the risk of developing cancer. A non-carrier relative with cancer does NOT increase the patient\'s mutation probability.',
    'Score < 10 does NOT exclude HBOC — newer multigene panel genes (PALB2, CHEK2, ATM, BRIP1, RAD51C/D) are not assessed by PENN II.',
    'Validated in mammography (Bellcross 2009), primary care, and oncology populations with sensitivity 85–90% and specificity 40–65% for ≥ 10% mutation probability.',
    'Consider BOADICEA or Tyrer-Cuzick for more precise quantitative estimates, especially in pedigrees with complex multi-generation history.',
  ],
  evidence: 'Originally developed at the University of Pennsylvania by Armstrong et al. (2000). Validated by Bellcross et al. (Genet Med, 2009) in a mammography population — sensitivity 91%, specificity 45% for ≥ 10% mutation probability. Endorsed as an acceptable HBOC screening tool by NCCN Genetic/Familial High-Risk: Breast, Ovarian, and Pancreatic Guidelines (Category 2A). Compared favorably to BRCAPRO in screening settings due to simplicity.',
  formula: 'Total score = sum of weighted points:\n\nPERSONAL HISTORY:\n  Breast CA < 40 yrs ............. +4\n  Breast CA 40–49 yrs ............ +3\n  Bilateral / multiple primaries .. +4\n  Ovarian / fallopian / peritoneal . +7\n  Male breast cancer .............. +7\n  Ashkenazi Jewish ancestry ....... +4\n\nFAMILY HISTORY (1st/2nd degree):\n  Ovarian cancer ......... +7 each relative\n  Breast CA < 50 ......... +3 each relative\n  Breast CA ≥ 50 ......... +2 each relative\n  Male breast cancer ..... +7 each relative\n\nThreshold: Score ≥ 10 → ≥ 10% probability of BRCA1/2 mutation',
  references: [
    { text: 'Armstrong K et al. Assessing the risk of breast cancer. N Engl J Med. 2000;342(8):564-571.', url: 'https://pubmed.ncbi.nlm.nih.gov/10684916/' },
    { text: 'Bellcross CA et al. Evaluation of a breast/ovarian cancer genetics referral screening tool in a mammography population. Genet Med. 2009;11(11):783-789.', url: 'https://pubmed.ncbi.nlm.nih.gov/19816183/' },
    { text: 'NCCN Clinical Practice Guidelines in Oncology: Genetic/Familial High-Risk Assessment: Breast, Ovarian, and Pancreatic. Version 2.2024.', url: 'https://www.nccn.org/guidelines/guidelines-detail?category=2&id=1503' },
  ],
  links: [
    { title: 'NCCN — HBOC Genetic Testing Criteria', url: 'https://www.nccn.org/guidelines/guidelines-detail?category=2&id=1503', description: 'NCCN guidelines for hereditary breast and ovarian cancer screening' },
    { title: 'BOADICEA Risk Calculator', url: 'https://www.canrisk.org/', description: 'More comprehensive quantitative BRCA/PALB2 mutation probability tool' },
  ],
  interpretations: [
    { range: '0-9', label: 'Low Probability (< 10%)', action: 'Genetic testing not indicated by this model alone. Apply NCCN criteria for additional indications. Consider family history referral pathway if borderline.' },
    { range: '10-19', label: 'High Probability — Moderate Score (10–19)', action: 'Refer for formal genetic counseling. Consider BRCA1/BRCA2 sequencing or comprehensive multigene panel.' },
    { range: '20-29', label: 'High Probability — Strong Score (20–29)', action: 'Strong indication for genetic counseling and comprehensive panel testing. Discuss cascade family testing.' },
    { range: '30-100', label: 'Very High Probability (≥ 30)', action: 'Very strong clinical suspicion for BRCA1/2 or other HBOC gene. Urgent genetics referral. Prioritize comprehensive panel.' },
  ],
  fields: [
    { key: 'ph_breast_under_40', label: 'Personal History: Breast cancer diagnosed < 40 years of age', type: 'checkbox', checkboxLabel: 'Yes (+4 points)', required: false },
    { key: 'ph_breast_40_49', label: 'Personal History: Breast cancer diagnosed age 40–49 years', type: 'checkbox', checkboxLabel: 'Yes (+3 points)', required: false },
    { key: 'ph_breast_bilateral', label: 'Personal History: Bilateral breast cancer OR ≥ 2 separate primary breast cancers', type: 'checkbox', checkboxLabel: 'Yes (+4 points)', required: false },
    { key: 'ph_ovarian', label: 'Personal History: Ovarian, fallopian tube, or primary peritoneal cancer (any age)', type: 'checkbox', checkboxLabel: 'Yes (+7 points)', required: false },
    { key: 'ph_male_breast', label: 'Personal History: Male breast cancer (any age)', type: 'checkbox', checkboxLabel: 'Yes (+7 points)', required: false },
    { key: 'ph_ashkenazi', label: 'Personal or Family History: Ashkenazi Jewish ancestry', type: 'checkbox', checkboxLabel: 'Yes (+4 points)', required: false },
    {
      key: 'fh_ovarian',
      label: 'Family History: 1st or 2nd degree relatives with ovarian / fallopian / peritoneal cancer',
      type: 'number', min: 0, max: 20, step: 1, placeholder: '0',
      hint: 'Number of affected relatives (+7 per relative). Count biological relatives only.',
      required: false,
    },
    {
      key: 'fh_breast_under_50',
      label: 'Family History: 1st or 2nd degree relatives with breast cancer diagnosed < 50 years',
      type: 'number', min: 0, max: 20, step: 1, placeholder: '0',
      hint: 'Number of affected relatives (+3 per relative). Count biological relatives only.',
      required: false,
    },
    {
      key: 'fh_breast_over_50',
      label: 'Family History: 1st or 2nd degree relatives with breast cancer diagnosed ≥ 50 years',
      type: 'number', min: 0, max: 20, step: 1, placeholder: '0',
      hint: 'Number of affected relatives (+2 per relative). Count biological relatives only.',
      required: false,
    },
    {
      key: 'fh_male_breast',
      label: 'Family History: 1st or 2nd degree relatives with male breast cancer (any age)',
      type: 'number', min: 0, max: 20, step: 1, placeholder: '0',
      hint: 'Number of affected male relatives (+7 per relative). Count biological relatives only.',
      required: false,
    },
  ],
  calculate: (vals) => {
    let score = 0
    const breakdown = []

    if (vals.ph_breast_under_40) { score += 4; breakdown.push({ label: 'Personal Hx: Breast CA < 40y', value: '+4' }) }
    if (vals.ph_breast_40_49) { score += 3; breakdown.push({ label: 'Personal Hx: Breast CA 40–49y', value: '+3' }) }
    if (vals.ph_breast_bilateral) { score += 4; breakdown.push({ label: 'Personal Hx: Bilateral / Multiple Primary Breast CA', value: '+4' }) }
    if (vals.ph_ovarian) { score += 7; breakdown.push({ label: 'Personal Hx: Ovarian / Fallopian / Peritoneal CA', value: '+7' }) }
    if (vals.ph_male_breast) { score += 7; breakdown.push({ label: 'Personal Hx: Male Breast CA', value: '+7' }) }
    if (vals.ph_ashkenazi) { score += 4; breakdown.push({ label: 'Ashkenazi Jewish Ancestry', value: '+4' }) }

    const fhOvarian = Math.max(0, parseInt(vals.fh_ovarian) || 0)
    if (fhOvarian > 0) { const pts = fhOvarian * 7; score += pts; breakdown.push({ label: `Family Hx: Ovarian CA (×${fhOvarian} relative${fhOvarian > 1 ? 's' : ''})`, value: `+${pts}` }) }

    const fhBreastU50 = Math.max(0, parseInt(vals.fh_breast_under_50) || 0)
    if (fhBreastU50 > 0) { const pts = fhBreastU50 * 3; score += pts; breakdown.push({ label: `Family Hx: Breast CA < 50y (×${fhBreastU50} relative${fhBreastU50 > 1 ? 's' : ''})`, value: `+${pts}` }) }

    const fhBreastO50 = Math.max(0, parseInt(vals.fh_breast_over_50) || 0)
    if (fhBreastO50 > 0) { const pts = fhBreastO50 * 2; score += pts; breakdown.push({ label: `Family Hx: Breast CA ≥ 50y (×${fhBreastO50} relative${fhBreastO50 > 1 ? 's' : ''})`, value: `+${pts}` }) }

    const fhMale = Math.max(0, parseInt(vals.fh_male_breast) || 0)
    if (fhMale > 0) { const pts = fhMale * 7; score += pts; breakdown.push({ label: `Family Hx: Male Breast CA (×${fhMale} relative${fhMale > 1 ? 's' : ''})`, value: `+${pts}` }) }

    let interp = ''
    let action = ''
    let urgency = ''

    if (score === 0) {
      interp = 'Score: 0 — No risk factors entered'
      action = 'No BRCA1/2 risk factors identified by this tool. Apply NCCN criteria independently for complete assessment.'
    } else if (score < 10) {
      interp = 'Low Probability (< 10% prior probability of BRCA1/2 mutation)'
      action = 'Genetic testing not indicated by PENN II score alone. Review NCCN criteria for additional testing indications (triple-negative breast CA, Ashkenazi ethnicity, etc.).'
    } else if (score < 20) {
      interp = 'High Probability — Moderate Score (≥ 10% prior probability)'
      action = 'Refer for formal genetic counseling. Consider BRCA1/2 sequencing or comprehensive multigene hereditary cancer panel.'
      urgency = 'Referral indicated.'
    } else if (score < 30) {
      interp = 'High Probability — Strong Score (≥ 10% prior probability)'
      action = 'Strong indication for genetic counseling and comprehensive multigene panel testing. Discuss cascade family testing if proband is positive.'
      urgency = 'Referral indicated. Consider prioritizing.'
    } else {
      interp = 'Very High Probability (≥ 10% prior probability — strong clinical suspicion)'
      action = 'Urgent genetics referral. Comprehensive hereditary cancer panel strongly indicated. Discuss immediate clinical management implications while awaiting genetic testing results.'
      urgency = 'Urgent referral.'
    }

    if (breakdown.length === 0) {
      breakdown.push({ label: 'No risk factors selected', value: '0' })
    }
    breakdown.push({ label: '──────────── TOTAL SCORE ────────────', value: String(score) })

    return {
      result: String(score),
      unit: 'points',
      interpretation: interp,
      detail: `${action}${urgency ? '\n\n' + urgency : ''}\n\nNote: PENN II assesses BRCA1/2 probability only. Newer HBOC genes (PALB2, CHEK2, ATM, BRIP1, RAD51C/D) require NCCN criteria and multigene panel assessment regardless of PENN II score.`,
      breakdown,
    }
  },
}
