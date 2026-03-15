export default {
  id: 'nipt_ppv',
  name: 'NIPT Positive Predictive Value (PPV/NPV)',
  shortDescription: 'Calculates PPV and NPV of a cfDNA prenatal screening result using Bayes theorem',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Obstetrics', 'Maternal-Fetal Medicine'],
  tags: ['NIPT', 'cfDNA', 'PPV', 'NPV', 'prenatal', 'aneuploidy', 'Bayes', 'screening', 'trisomy', 'microdeletion'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Bayesian Framework (Applied to NIPT)',
  creatorYear: '2011',
  description: 'Non-Invasive Prenatal Testing (NIPT) analyzes cell-free DNA (cfDNA) from maternal plasma to screen for fetal chromosomal abnormalities. Despite high sensitivity and specificity, a positive NIPT result does NOT confirm diagnosis — its Positive Predictive Value (PPV) depends critically on the background prevalence (prior probability) of the condition, which is primarily driven by maternal age and gestational age-specific risks for aneuploidies, and by general population rates for microdeletions (which are age-independent). This calculator uses Bayes theorem to compute PPV and NPV from any combination of prevalence, sensitivity, and specificity.',
  whyUse: 'Prevents the grave clinical error of treating a "high risk" NIPT as a diagnosis. Demonstrates that even with 99.9% specificity, a rare condition (e.g., T13 at age 25, or 22q11.2 deletion at any age) will have a surprisingly low PPV. Essential for informed pre- and post-test counseling.',
  whenToUse: [
    'Pre-test counseling: explain the limitations of NIPT before the patient draws blood',
    'Post-test counseling: calculate the true probability of aneuploidy after a "screen positive" result',
    'Explaining why diagnostic confirmation (CVS or amniocentesis) is mandatory after a positive NIPT',
    'Counseling patients who refuse invasive confirmation despite a positive NIPT',
    'Comparing performance of NIPT for common trisomies vs. sex chromosome aneuploidies vs. microdeletions',
  ],
  nextSteps: 'Always offer diagnostic testing (CVS or amniocentesis) to confirm any "high risk" NIPT result before making irreversible pregnancy decisions. A negative NIPT (NPV typically >99.9%) is highly reassuring but does not exclude all chromosomal conditions. NIPT does not screen for all birth defects — anatomy scan remains essential.',
  pearls: [
    'For T21 at age 35 (prevalence ~1/250), NIPT PPV is typically 80-95% — excellent, but still 5-20% false positive.',
    'For T21 at age 25 (prevalence ~1/1,000), PPV drops to ~60-80% despite same test performance.',
    'For microdeletions (e.g., 22q11.2, prevalence ~1/4,000), PPV is often only 10-35%, even with 99.5% specificity.',
    'NPV is nearly always >99.9% because these conditions are rare — a negative result is highly reliable.',
    'Confined placental mosaicism (CPM) and vanishing twin are major causes of false-positive NIPT.',
    '"High risk" NIPT = screen positive. NOT diagnostic. Invasive confirmation is the standard of care (ACOG, SMFM, ACMG).',
    'Sex chromosome aneuploidies (e.g., Turner 45,X) have lower sensitivity (~90%) and moderate PPV.',
    'Always use the maternal age- and gestational age-specific prevalence, not generic population figures.',
  ],
  evidence: 'Introduced clinically in 2011. Endorsed by ACOG (Practice Bulletin 226, 2020), SMFM, ACMG, and ISPD as a screening — not diagnostic — test. PPV calculation is required before clinical decision-making per ACOG guidelines. Large validation studies include NEXT trial (Norton et al., NEJM 2015) and CLARITY trial (Bianchi et al., NEJM 2014).',
  formula: 'PPV = (Sensitivity × Prevalence) / [(Sensitivity × Prevalence) + ((1 − Specificity) × (1 − Prevalence))]\n\nNPV = (Specificity × (1 − Prevalence)) / [(Specificity × (1 − Prevalence)) + ((1 − Sensitivity) × Prevalence)]\n\nFalse Positive Rate = 1 − Specificity\nFalse Discovery Rate (given positive) = 1 − PPV',
  references: [
    { text: 'ACOG Practice Bulletin 226: Screening for Fetal Chromosomal Abnormalities. Obstet Gynecol. 2020;136(4):e48-e69.', url: 'https://pubmed.ncbi.nlm.nih.gov/32804883/' },
    { text: 'Norton ME et al. Cell-free DNA Analysis for Noninvasive Examination of Trisomy. N Engl J Med. 2015;372:1589-1597.', url: 'https://pubmed.ncbi.nlm.nih.gov/25830321/' },
    { text: 'Bianchi DW et al. DNA Sequencing versus Standard Prenatal Aneuploidy Screening. N Engl J Med. 2014;370:799-808.', url: 'https://pubmed.ncbi.nlm.nih.gov/24571752/' },
    { text: 'Gregg AR et al. Noninvasive prenatal screening for fetal aneuploidy, 2016 update. Genet Med. 2016;18(10):1056-65.', url: 'https://pubmed.ncbi.nlm.nih.gov/27467454/' },
  ],
  links: [
    { title: 'ACOG — NIPT Counseling Resources', url: 'https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2020/10/screening-for-fetal-chromosomal-abnormalities', description: 'ACOG Practice Bulletin on fetal chromosomal screening' },
    { title: 'SMFM — cfDNA Screening Consult', url: 'https://www.smfm.org/publications/280-smfm-consult-series-42-prenatal-aneuploidy-screening-using-cell-free-dna', description: 'SMFM consult series on NIPT screening' },
  ],
  interpretations: [
    { range: '0-24', label: 'Very Low PPV (< 25%)', action: 'Most likely false positive. Diagnostic testing (CVS/amnio) strongly recommended. Avoid clinical decisions based on NIPT alone.' },
    { range: '25-49', label: 'Low PPV (25–49%)', action: 'Less likely true positive than false positive. Diagnostic testing required before any irreversible decision.' },
    { range: '50-74', label: 'Moderate PPV (50–74%)', action: 'Higher chance true positive, but false positives remain significant. Diagnostic confirmation essential.' },
    { range: '75-89', label: 'High PPV (75–89%)', action: 'Likely true positive. Diagnostic testing still required to confirm before clinical management decisions.' },
    { range: '90-100', label: 'Very High PPV (≥ 90%)', action: 'Very likely true positive. Diagnostic testing still recommended — standard of care regardless of PPV.' },
  ],
  fields: [
    {
      key: 'prevalence_denom',
      label: 'Condition Prevalence / Prior Probability (1 in X)',
      type: 'number', min: 1, max: 1000000, step: 1, placeholder: 'e.g., 250',
      hint: 'T21 at 35y ≈ 1:250 | T21 at 25y ≈ 1:1,000 | T18 at 35y ≈ 1:750 | T13 ≈ 1:5,000 | 22q11.2 ≈ 1:4,000 | Turner ≈ 1:2,000',
    },
    {
      key: 'sensitivity',
      label: 'Test Sensitivity (%)',
      type: 'number', min: 1, max: 100, step: 0.1, placeholder: 'e.g., 99.3',
      hint: 'T21: ~99%; T18: ~97%; T13: ~91%; Sex chr: ~90%; Microdeletions: ~60–90% — check lab spec sheet',
    },
    {
      key: 'specificity',
      label: 'Test Specificity (%)',
      type: 'number', min: 1, max: 100, step: 0.01, placeholder: 'e.g., 99.9',
      hint: 'T21: ~99.9%; T18/T13: ~99.7–99.9%; Microdeletions: ~99.0–99.5% — check lab spec sheet',
    },
  ],
  calculate: (vals) => {
    const prevDenom = parseFloat(vals.prevalence_denom)
    const sensPct = parseFloat(vals.sensitivity)
    const specPct = parseFloat(vals.specificity)
    if (!prevDenom || !sensPct || !specPct) return null
    if (sensPct <= 0 || sensPct > 100 || specPct <= 0 || specPct > 100) return null

    const prevalence = 1 / prevDenom
    const sensitivity = sensPct / 100
    const specificity = specPct / 100
    const fpr = 1 - specificity

    const truePos = sensitivity * prevalence
    const falsePos = fpr * (1 - prevalence)
    const ppv = truePos / (truePos + falsePos)

    const trueNeg = specificity * (1 - prevalence)
    const falseNeg = (1 - sensitivity) * prevalence
    const npv = trueNeg / (trueNeg + falseNeg)

    const ppvPct = (ppv * 100).toFixed(1)
    const npvPct = (npv * 100).toFixed(3)
    const fdrPct = ((1 - ppv) * 100).toFixed(1)
    const fprPct = (fpr * 100).toFixed(3)

    const forEvery10000Screened = {
      truePos: Math.round(truePos * 10000),
      falsePos: Math.round(falsePos * 10000),
      trueNeg: Math.round(trueNeg * 10000),
      falseNeg: Math.round(falseNeg * 10000),
    }

    let interp = ''
    const ppvNum = parseFloat(ppvPct)
    if (ppvNum < 25) interp = 'Very Low PPV: Positive result more likely false positive (3:1 or greater ratio). Diagnostic confirmation is critical.'
    else if (ppvNum < 50) interp = 'Low PPV: More false positives than true positives expected. Do not act on this result without invasive confirmation.'
    else if (ppvNum < 75) interp = 'Moderate PPV: Likely true positive but false positives remain significant. Diagnostic confirmation required.'
    else if (ppvNum < 90) interp = 'High PPV: Probably a true positive. Diagnostic testing still mandatory per standard of care.'
    else interp = 'Very High PPV: Highly likely true positive. Diagnostic confirmation still required before clinical decision-making.'

    return {
      result: `${ppvPct}%`,
      unit: 'Positive Predictive Value (PPV)',
      interpretation: interp,
      detail: `If the test is POSITIVE: ${ppvPct}% chance it is a TRUE positive and ${fdrPct}% chance it is a FALSE positive.\nIf the test is NEGATIVE: ${npvPct}% chance it is a TRUE negative.\n\nPer 10,000 pregnancies screened: ${forEvery10000Screened.truePos} true positives | ${forEvery10000Screened.falsePos} false positives | ${forEvery10000Screened.falseNeg} missed cases (false negatives).`,
      breakdown: [
        { label: 'Condition Prevalence', value: `1 in ${prevDenom.toLocaleString()} (${(prevalence * 100).toFixed(4)}%)` },
        { label: 'Test Sensitivity', value: `${sensPct}%` },
        { label: 'Test Specificity', value: `${specPct}%` },
        { label: 'False Positive Rate', value: `${fprPct}%` },
        { label: 'Positive Predictive Value (PPV)', value: `${ppvPct}%` },
        { label: 'False Discovery Rate (if positive)', value: `${fdrPct}%` },
        { label: 'Negative Predictive Value (NPV)', value: `${npvPct}%` },
      ],
    }
  },
}
