export default {
  id: 'gail_model',
  name: 'Gail Model — Breast Cancer Risk (BCRAT)',
  shortDescription: 'Estimates 5-year and lifetime risk of invasive breast cancer using validated clinical factors',
  system: 'genetics',
  specialty: ['Oncology', 'Gynecology', 'Primary Care', 'Clinical Genetics'],
  tags: ['breast cancer', 'Gail', 'BCRAT', 'screening', 'chemoprevention', 'risk assessment', 'NCI'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Gail MH et al.',
  creatorYear: '1989',
  description: 'The Gail Model (Breast Cancer Risk Assessment Tool — BCRAT) is the most widely used and validated tool for estimating a woman\'s absolute risk of developing invasive breast cancer over the next 5 years and over her lifetime (to age 90). Developed by scientists at the NCI and NSABP, it incorporates epidemiologic risk factors from a prospective cohort. The model uses a relative risk logistic regression combined with age- and race-specific baseline absolute risk rates derived from SEER population data and competing mortality tables.',
  whyUse: 'The primary clinical tool for identifying women at elevated breast cancer risk who may benefit from chemoprevention (tamoxifen, raloxifene, aromatase inhibitors — FDA-approved for 5-year risk ≥ 1.66%) or enhanced screening (supplemental MRI). Enables evidence-based, personalized conversation about risk reduction strategies.',
  whenToUse: [
    'Women aged 35 and older with no personal history of invasive breast cancer, DCIS, or LCIS',
    'Annual well-woman visits to assess breast cancer risk and guide screening decisions',
    'Evaluating chemoprevention eligibility (tamoxifen/raloxifene threshold: 5-year risk ≥ 1.66%)',
    'Patients with family history of breast cancer but no known high-penetrance mutation (BRCA1/2, PALB2, etc.)',
    'Population-based screening programs',
  ],
  nextSteps: 'If 5-year risk ≥ 1.66%: discuss chemoprevention (tamoxifen for premenopausal, raloxifene or AIs for postmenopausal) and consider earlier/supplemental MRI screening. If strong family history or suspected hereditary syndrome not captured by Gail: use BOADICEA or Tyrer-Cuzick and refer to genetics. Always discuss lifestyle modifications (weight, alcohol, hormone use).',
  pearls: [
    'CONTRAINDICATIONS: Do NOT use in women with personal history of breast cancer, DCIS, or LCIS.',
    'Do NOT use if patient has a known high-penetrance mutation (BRCA1/2, PALB2, PTEN, TP53, CDH1, STK11).',
    'The 1.66% threshold derives from the NSABP P-1 Breast Cancer Prevention Trial eligibility criterion — not a natural breakpoint in biology.',
    'Atypical hyperplasia on biopsy is the strongest individual risk factor in the model — nearly doubles relative risk.',
    'Gail UNDERESTIMATES risk in hereditary breast cancer syndromes. Use BOADICEA/Tyrer-Cuzick for >2 affected relatives.',
    'The model captures only first-degree relatives on the maternal side — paternal history is NOT incorporated.',
    'Validated primarily in White/Caucasian women; separate race-specific versions exist (African American, Asian American, Hispanic).',
    'A 5-year risk of 1.66% is roughly equivalent to average risk at age 60.',
  ],
  evidence: 'Originally developed from 2,852 breast cancer cases in the Breast Cancer Detection Demonstration Project (BCDDP) by Gail et al. (JNCI, 1989). Validated in the BCPT (P-1) trial (NSABP, 1998) and STAR trial. Baseline rates updated with SEER data. Endorsed by USPSTF, NCCN (v3.2023), ACOG, and NCI. The NCI BCRAT (bcrisktool.cancer.gov) uses the official implementation with competing mortality adjustment.',
  formula: 'logRR = Σ [βᵢ × Xᵢ] + interaction terms (Age × Biopsies, Relatives × 1stBirth)\nRR = exp(logRR)\n\nAbsolute 5-year Risk ≈ Baseline Hazard(Age, Race) × RR\n  (official NCI tool additionally subtracts competing non-breast-cancer mortality)\n\nKey coefficients (White females):\n  Menarche <12y: +0.205 | 12–13y: +0.093\n  Biopsies (age<50): ×1: +0.528 | ×2+: +1.058\n  Biopsies (age≥50): ×1: +0.239 | ×2+: +0.481\n  Atypical hyperplasia: +0.938\n  1 relative + nulliparous/≥30: +0.621 | 2+ relatives: additive interaction',
  references: [
    { text: 'Gail MH et al. Projecting individualized probabilities of developing breast cancer for white females who are being examined annually. J Natl Cancer Inst. 1989;81(24):1879-86.', url: 'https://pubmed.ncbi.nlm.nih.gov/2593165/' },
    { text: 'Costantino JP et al. Validation studies for models projecting the risk of invasive and total breast cancer incidence. J Natl Cancer Inst. 1999;91(18):1541-8.', url: 'https://pubmed.ncbi.nlm.nih.gov/10491430/' },
    { text: 'Gail MH. Discriminatory accuracy from single-nucleotide polymorphisms in models to predict breast cancer risk. J Natl Cancer Inst. 2008;100(14):1037-41.', url: 'https://pubmed.ncbi.nlm.nih.gov/18612136/' },
  ],
  links: [
    { title: 'NCI Breast Cancer Risk Assessment Tool (Official)', url: 'https://bcrisktool.cancer.gov/', description: 'Official NCI implementation with competing mortality adjustment' },
    { title: 'NCCN — Breast Cancer Risk Reduction Guidelines', url: 'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1419', description: 'NCCN clinical guidelines for risk assessment and chemoprevention' },
  ],
  interpretations: [
    { range: '<1.66', label: 'Average Risk (< 1.66%)', action: 'Standard breast cancer screening per guidelines (annual mammogram starting age 40–50). Discuss lifestyle modifications.' },
    { range: '≥1.66', label: 'Elevated Risk (≥ 1.66%)', action: 'Discuss chemoprevention (tamoxifen/raloxifene/AIs) and consider supplemental screening (MRI). Discuss BRCA/panel testing if family history warrants.' },
  ],
  fields: [
    { key: 'age', label: 'Current Age (35–85 years)', type: 'number', min: 35, max: 85, step: 1, placeholder: 'e.g., 50' },
    {
      key: 'menarche',
      label: 'Age at First Menstrual Period (Menarche)',
      type: 'select',
      options: [
        { value: '0', label: '≥ 14 years' },
        { value: '1', label: '12 to 13 years' },
        { value: '2', label: '< 12 years' },
      ],
    },
    {
      key: 'first_birth',
      label: 'Age at First Live Birth',
      type: 'select',
      options: [
        { value: '0', label: '< 20 years' },
        { value: '1', label: '20 to 24 years' },
        { value: '2', label: '25 to 29 years' },
        { value: '3', label: '≥ 30 years or Nulliparous (never given birth)' },
      ],
    },
    {
      key: 'relatives',
      label: 'Number of First-Degree Relatives with Breast Cancer (Mother, Sister, or Daughter)',
      type: 'select',
      options: [
        { value: '0', label: '0 — None affected' },
        { value: '1', label: '1 — One first-degree relative affected' },
        { value: '2', label: '2 or more — Two or more first-degree relatives affected' },
      ],
    },
    {
      key: 'biopsies',
      label: 'Number of Previous Breast Biopsies',
      type: 'select',
      options: [
        { value: '0', label: '0 — Never biopsied' },
        { value: '1', label: '1 — One biopsy' },
        { value: '2', label: '2 or more — Two or more biopsies' },
      ],
    },
    {
      key: 'atypia',
      label: 'Atypical Hyperplasia on Any Prior Biopsy?',
      type: 'select',
      options: [
        { value: '0', label: 'No — No atypia found' },
        { value: '1', label: 'Yes — Atypical ductal or lobular hyperplasia confirmed' },
        { value: 'unknown', label: 'Unknown — Biopsy done but pathology report unavailable' },
      ],
      required: false,
    },
  ],
  calculate: (vals) => {
    const age = parseInt(vals.age)
    if (!age || age < 35 || age > 85) return null

    const menarche = parseInt(vals.menarche)
    const firstBirth = parseInt(vals.first_birth)
    const relatives = parseInt(vals.relatives)
    const biopsies = parseInt(vals.biopsies)
    if (isNaN(menarche) || isNaN(firstBirth) || isNaN(relatives) || isNaN(biopsies)) return null

    let atypia = 0
    if (biopsies > 0) {
      if (vals.atypia === '1') atypia = 1
      else if (vals.atypia === 'unknown') atypia = 0.5
    }

    let logRR = 0

    if (menarche === 1) logRR += 0.093
    else if (menarche === 2) logRR += 0.205

    if (biopsies === 1) logRR += age < 50 ? 0.528 : 0.239
    else if (biopsies >= 2) logRR += age < 50 ? 1.058 : 0.481

    if (biopsies > 0) {
      if (atypia === 1) logRR += 0.938
      else if (atypia === 0.5) logRR += 0.469
    }

    let relBirthRisk = 0
    if (relatives === 0) {
      if (firstBirth === 1) relBirthRisk = 0.111
      else if (firstBirth === 2) relBirthRisk = 0.222
      else if (firstBirth === 3) relBirthRisk = 0.325
    } else if (relatives === 1) {
      if (firstBirth === 0) relBirthRisk = 0.322
      else if (firstBirth === 1) relBirthRisk = 0.435
      else if (firstBirth === 2) relBirthRisk = 0.518
      else if (firstBirth === 3) relBirthRisk = 0.621
    } else {
      if (firstBirth === 0) relBirthRisk = 0.636
      else if (firstBirth === 1) relBirthRisk = 0.855
      else if (firstBirth === 2) relBirthRisk = 1.018
      else if (firstBirth === 3) relBirthRisk = 1.221
    }
    logRR += relBirthRisk

    const relativeRisk = Math.exp(logRR)

    let baseline5yr = 1.0
    if (age < 40) baseline5yr = 0.6
    else if (age < 45) baseline5yr = 0.9
    else if (age < 50) baseline5yr = 1.2
    else if (age < 55) baseline5yr = 1.4
    else if (age < 60) baseline5yr = 1.7
    else if (age < 65) baseline5yr = 1.9
    else if (age < 70) baseline5yr = 2.2
    else if (age < 75) baseline5yr = 2.3
    else if (age < 80) baseline5yr = 2.4
    else baseline5yr = 2.2

    const absolute5yr = (baseline5yr * relativeRisk)
    const absolute5yrStr = absolute5yr.toFixed(2)

    let interp = ''
    let action = ''
    if (absolute5yr >= 1.66) {
      interp = 'Elevated Risk (≥ 1.66%) — Chemoprevention threshold met'
      action = 'Discuss tamoxifen (premenopausal), raloxifene or aromatase inhibitors (postmenopausal). Consider supplemental MRI screening. Evaluate for hereditary syndrome if family history is extensive.'
    } else {
      interp = 'Average Risk (< 1.66%) — Below chemoprevention threshold'
      action = 'Standard breast cancer screening per current guidelines. Discuss lifestyle modifications. Reassess annually.'
    }

    return {
      result: `${absolute5yrStr}%`,
      unit: '5-Year Absolute Risk of Invasive Breast Cancer',
      interpretation: interp,
      detail: `This patient\'s risk is approximately ${relativeRisk.toFixed(2)}× higher than an average woman of age ${age} with no risk factors (baseline: ${baseline5yr}%).\n\n${action}\n\n*Note: This is a client-side approximation of the Gail model. The official NCI BCRAT (bcrisktool.cancer.gov) applies competing non-breast-cancer mortality rates which may produce slightly different absolute percentages, particularly in older women. Verify borderline cases with the official tool.*`,
      breakdown: [
        { label: 'Calculated Relative Risk (RR)', value: `${relativeRisk.toFixed(3)}×` },
        { label: 'Age-Specific Baseline 5-Year Risk', value: `${baseline5yr}%` },
        { label: 'Patient\'s Estimated 5-Year Risk', value: `${absolute5yrStr}%` },
        { label: 'Chemoprevention Threshold (≥ 1.66%)', value: absolute5yr >= 1.66 ? '✓ Met' : '✗ Not Met' },
      ],
    }
  },
}
