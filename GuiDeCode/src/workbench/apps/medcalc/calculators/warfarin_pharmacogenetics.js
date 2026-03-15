export default {
  id: 'warfarin_pharmacogenetics',
  name: 'Warfarin Pharmacogenetic Dosing (Gage Algorithm)',
  shortDescription: 'Estimates therapeutic daily warfarin dose using genetics (CYP2C9/VKORC1) and clinical factors',
  system: 'pharmacology',
  specialty: ['Clinical Genetics', 'Cardiology', 'Internal Medicine', 'Hematology'],
  tags: ['pharmacogenetics', 'warfarin', 'CYP2C9', 'VKORC1', 'anticoagulation', 'PGx', 'CPIC', 'dosing'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Gage BF et al.',
  creatorYear: '2008',
  description: 'Warfarin is the most widely prescribed oral anticoagulant globally, but its narrow therapeutic index and extraordinary inter-individual variability (10–100-fold range in effective dose) make empirical dosing dangerous. The Gage et al. pharmacogenetic algorithm, validated in >5,000 patients, incorporates clinical factors and the two most important pharmacogenetic determinants: (1) VKORC1 -1639 G>A — modulates warfarin pharmacodynamic sensitivity (warfarin\'s target enzyme vitamin K epoxide reductase complex); (2) CYP2C9 *2 and *3 alleles — reduce warfarin pharmacokinetic clearance. Together, VKORC1 and CYP2C9 explain ~35–50% of warfarin dose variance, compared to ~15% explained by clinical factors alone. The algorithm produces a predicted steady-state maintenance dose that can guide initial prescribing and reduce time to therapeutic INR.',
  whyUse: 'Prevents dangerous over-anticoagulation (leading cause of serious adverse drug events and inpatient hospitalization) during warfarin initiation. Particularly important in CYP2C9 *3/*3 or VKORC1 A/A patients who may only require 1–2 mg/day — an dose 3–5× lower than standard empirical initiation. CPIC and the FDA (2010 label update) support pharmacogenetic-guided warfarin dosing.',
  whenToUse: [
    'Initiating warfarin therapy in a patient with known VKORC1 and/or CYP2C9 genotyping results',
    'Explaining to patients why their required dose is significantly lower or higher than expected',
    'Pre-emptive pharmacogenomics programs (reactive PGx) where genotyping is done before prescribing',
    'When starting warfarin concurrently with amiodarone (major metabolic interaction)',
  ],
  nextSteps: 'Use predicted dose to guide initiation. Monitor INR at 3–4 days, 7 days, and regularly thereafter — the algorithm predicts maintenance dose, not loading. Individual titration is still required. Consider twice-weekly INR monitoring for VKORC1 A/A + CYP2C9 *2/*3 or *3/*3 patients during first 2 weeks. Transition to validated point-of-care INR systems once stable.',
  pearls: [
    'VKORC1 -1639 A/A: ~30% dose reduction vs GG. This is the single most impactful genetic variant.',
    'CYP2C9 *3/*3 (Poor Metabolizer): ~70% dose reduction. Very rare but critical to identify before starting.',
    'CYP2C9 *1/*3 or *2/*3: ~40–50% dose reduction. More common than *3/*3 and clinically very relevant.',
    'Amiodarone inhibits CYP2C9 — functionally converts extensive metabolizers toward poor metabolizer phenotype; the algorithm adjusts accordingly.',
    'African ancestry increases warfarin requirement slightly (VKORC1 haplotype distribution differs).',
    'Results are maintenance dose estimates. Initiation still requires overlap with heparin and frequent INR monitoring.',
    'CYP2C9 *5, *6, *8, *11 are more common in African populations and are NOT captured by this algorithm — consider extended panel testing.',
    'CPIC recommends specific initiation tables combining VKORC1 and CYP2C9 phenotype groups. This algorithm provides continuous dose estimates consistent with those tables.',
  ],
  evidence: 'Gage BF et al. Use of pharmacogenetic and clinical factors to predict the therapeutic dose of warfarin. Clin Pharmacol Ther. 2008;84(3):326-331. Validated in 5,052 patients from three academic medical centers. CPIC Level A recommendation (actionable pharmacogenomic evidence). The International Warfarin Pharmacogenetics Consortium (IWPC) algorithm (Klein et al., NEJM 2009) similarly validated, yielding comparable results. FDA updated warfarin labeling in 2010 to include pharmacogenetic information.',
  formula: 'Predicted Daily Dose (mg/day) = exp(5.6044\n  − 0.2614 × [Age in decades]\n  + 0.0087 × [Height in cm]\n  + 0.0128 × [Weight in kg]\n  − 0.8677 × VKORC1_AA\n  − 0.4060 × VKORC1_GA\n  − 0.0456 × VKORC1_unknown\n  − 0.2546 × CYP2C9_*1/*2\n  − 0.4008 × CYP2C9_*1/*3\n  − 0.4854 × CYP2C9_*2/*2\n  − 0.8876 × CYP2C9_*2/*3\n  − 1.1336 × CYP2C9_*3/*3\n  − 0.1512 × CYP2C9_unknown\n  − 0.5695 × Amiodarone\n  + 0.1092 × African_Ancestry\n  + 0.2760 × DVT_PE_Indication\n  + 0.1181 × [Target INR > 2.5])',
  references: [
    { text: 'Gage BF et al. Use of pharmacogenetic and clinical factors to predict the therapeutic dose of warfarin. Clin Pharmacol Ther. 2008;84(3):326-331.', url: 'https://pubmed.ncbi.nlm.nih.gov/18305455/' },
    { text: 'Klein TE et al. Estimation of the Warfarin Dose with Clinical and Pharmacogenetic Data. N Engl J Med. 2009;360(8):753-764.', url: 'https://pubmed.ncbi.nlm.nih.gov/19228618/' },
    { text: 'Johnson JA et al. CPIC: Clinical Pharmacogenetics Implementation Consortium Guidelines for CYP2C9 and VKORC1 Genotypes and Warfarin Dosing. Clin Pharmacol Ther. 2011;90(4):625-629.', url: 'https://pubmed.ncbi.nlm.nih.gov/21900891/' },
  ],
  links: [
    { title: 'CPIC — CYP2C9/VKORC1 Warfarin Guidelines', url: 'https://cpicpgx.org/guidelines/guideline-for-warfarin-and-cyp2c9-and-vkorc1/', description: 'Full CPIC pharmacogenetic dosing guidelines for warfarin' },
    { title: 'WarfarinDosing.org — Official Gage Calculator', url: 'https://www.warfarindosing.org/', description: 'Official implementation of the Gage and IWPC algorithms' },
    { title: 'PharmGKB — Warfarin Pathway', url: 'https://www.pharmgkb.org/pathway/PA145011113', description: 'Pharmacogenomics knowledge base warfarin pathway' },
  ],
  interpretations: [
    { range: '0-2.9', label: 'Highly Sensitive (< 3 mg/day)', action: 'Very low maintenance dose. Monitor INR very closely. Initiate with ≤ 2 mg. Screen for VKORC1 A/A + CYP2C9 poor metabolizer.' },
    { range: '3-6', label: 'Standard Sensitivity (3–6 mg/day)', action: 'Typical dose range. Standard initiation protocol. Monitor INR per routine schedule.' },
    { range: '6.1-15', label: 'Warfarin Resistant (> 6 mg/day)', action: 'Higher dose required. Check for CYP2C9 *1/*1 + VKORC1 G/G. Consider dietary vitamin K assessment. Verify indication and target INR.' },
  ],
  fields: [
    { key: 'age', label: 'Age (years)', type: 'number', min: 18, max: 120, step: 1, placeholder: 'e.g., 65' },
    { key: 'height', label: 'Height (cm)', type: 'number', min: 100, max: 250, step: 1, placeholder: 'e.g., 170' },
    { key: 'weight', label: 'Weight (kg)', type: 'number', min: 30, max: 250, step: 0.5, placeholder: 'e.g., 75' },
    {
      key: 'target_inr',
      label: 'Target INR Range',
      type: 'select',
      options: [
        { value: '2.5', label: '2.0 – 3.0 (Target 2.5) — AF, DVT/PE, bioprosthetic valve' },
        { value: '3.0', label: '2.5 – 3.5 (Target 3.0) — Mechanical heart valve, high-risk AF' },
      ],
    },
    {
      key: 'amiodarone',
      label: 'Currently Taking Amiodarone?',
      type: 'select',
      options: [
        { value: '0', label: 'No' },
        { value: '1', label: 'Yes — Major CYP2C9 inhibitor; dose will be significantly reduced' },
      ],
    },
    {
      key: 'dvt_pe',
      label: 'Primary Indication: DVT or Pulmonary Embolism?',
      type: 'select',
      options: [
        { value: '0', label: 'No — AF, valve, other' },
        { value: '1', label: 'Yes — DVT or PE (slightly higher dose tendency)' },
      ],
    },
    {
      key: 'african',
      label: 'African or African-American Ancestry?',
      type: 'select',
      options: [
        { value: '0', label: 'No' },
        { value: '1', label: 'Yes — VKORC1 haplotype distribution differs; slight dose adjustment' },
      ],
    },
    {
      key: 'vkorc1',
      label: 'VKORC1 -1639 G>A Genotype (rs9923231)',
      type: 'select',
      options: [
        { value: 'unknown', label: 'Unknown — Genotype not available (population average used)' },
        { value: 'GG', label: 'G/G — Normal / Low Sensitivity (Wild-type)' },
        { value: 'GA', label: 'G/A — Intermediate Sensitivity (Heterozygous)' },
        { value: 'AA', label: 'A/A — High Sensitivity (Homozygous variant — lowest dose required)' },
      ],
    },
    {
      key: 'cyp2c9',
      label: 'CYP2C9 Diplotype (Metabolizer Phenotype)',
      type: 'select',
      options: [
        { value: 'unknown', label: 'Unknown — Genotype not available (population average used)' },
        { value: '*1/*1', label: '*1/*1 — Normal Metabolizer (standard clearance)' },
        { value: '*1/*2', label: '*1/*2 — Intermediate Metabolizer (mild reduction)' },
        { value: '*1/*3', label: '*1/*3 — Intermediate Metabolizer (moderate reduction)' },
        { value: '*2/*2', label: '*2/*2 — Poor Metabolizer (significant reduction)' },
        { value: '*2/*3', label: '*2/*3 — Poor Metabolizer (major reduction)' },
        { value: '*3/*3', label: '*3/*3 — Poor Metabolizer (extreme reduction — 70%+ lower dose)' },
      ],
    },
  ],
  calculate: (vals) => {
    const age = parseFloat(vals.age)
    const height = parseFloat(vals.height)
    const weight = parseFloat(vals.weight)
    if (!age || !height || !weight) return null
    if (age < 18 || height < 100 || weight < 30) return null

    const ageDecades = age / 10
    const targetInr = parseFloat(vals.target_inr) || 2.5
    const amiodarone = parseInt(vals.amiodarone) || 0
    const dvtPe = parseInt(vals.dvt_pe) || 0
    const african = parseInt(vals.african) || 0

    let vkorc1_GA = 0, vkorc1_AA = 0, vkorc1_unknown = 0
    if (vals.vkorc1 === 'GA') vkorc1_GA = 1
    else if (vals.vkorc1 === 'AA') vkorc1_AA = 1
    else if (vals.vkorc1 === 'unknown' || !vals.vkorc1) vkorc1_unknown = 1

    let cyp_12 = 0, cyp_13 = 0, cyp_22 = 0, cyp_23 = 0, cyp_33 = 0, cyp_unknown = 0
    if (vals.cyp2c9 === '*1/*2') cyp_12 = 1
    else if (vals.cyp2c9 === '*1/*3') cyp_13 = 1
    else if (vals.cyp2c9 === '*2/*2') cyp_22 = 1
    else if (vals.cyp2c9 === '*2/*3') cyp_23 = 1
    else if (vals.cyp2c9 === '*3/*3') cyp_33 = 1
    else cyp_unknown = 1

    const lnDose = 5.6044
      - (0.2614 * ageDecades)
      + (0.0087 * height)
      + (0.0128 * weight)
      - (0.8677 * vkorc1_AA)
      - (0.4060 * vkorc1_GA)
      - (0.0456 * vkorc1_unknown)
      - (0.2546 * cyp_12)
      - (0.4008 * cyp_13)
      - (0.4854 * cyp_22)
      - (0.8876 * cyp_23)
      - (1.1336 * cyp_33)
      - (0.1512 * cyp_unknown)
      - (0.5695 * amiodarone)
      + (0.1092 * african)
      + (0.2760 * dvtPe)
      + (0.1181 * (targetInr >= 3.0 ? 1 : 0))

    let dailyDose = Math.exp(lnDose)
    if (dailyDose < 0.5) dailyDose = 0.5
    if (dailyDose > 15) dailyDose = 15

    const dailyDoseStr = dailyDose.toFixed(1)
    const weeklyDose = (dailyDose * 7).toFixed(1)

    let interp = ''
    if (dailyDose < 3) interp = 'Highly Sensitive: Very low maintenance dose required. Risk of over-anticoagulation if standard dosing used.'
    else if (dailyDose > 6) interp = 'Warfarin Resistant: Higher than average dose required for therapeutic INR.'
    else interp = 'Standard Sensitivity: Predicted dose falls within typical therapeutic range.'

    const vkorc1Label = vals.vkorc1 && vals.vkorc1 !== 'unknown' ? vals.vkorc1 : 'Unknown (population avg)'
    const cyp2c9Label = vals.cyp2c9 && vals.cyp2c9 !== 'unknown' ? vals.cyp2c9 : 'Unknown (population avg)'

    let phenotype = ''
    if (cyp_33) phenotype = 'Poor Metabolizer (CYP2C9 *3/*3)'
    else if (cyp_23) phenotype = 'Poor Metabolizer (CYP2C9 *2/*3)'
    else if (cyp_22) phenotype = 'Poor Metabolizer (CYP2C9 *2/*2)'
    else if (cyp_13) phenotype = 'Intermediate Metabolizer (CYP2C9 *1/*3)'
    else if (cyp_12) phenotype = 'Intermediate Metabolizer (CYP2C9 *1/*2)'
    else if (!cyp_unknown) phenotype = 'Normal Metabolizer (CYP2C9 *1/*1)'
    else phenotype = 'Unknown'

    return {
      result: dailyDoseStr,
      unit: 'mg / day (estimated maintenance dose)',
      interpretation: interp,
      detail: `Estimated weekly dose: ${weeklyDose} mg/week.\n\nThis is a predicted MAINTENANCE dose. Warfarin initiation still requires close INR monitoring (day 3–4, day 7, then weekly until stable). Do not use this as a loading dose.`,
      breakdown: [
        { label: 'VKORC1 Genotype', value: vkorc1Label },
        { label: 'CYP2C9 Genotype', value: cyp2c9Label },
        { label: 'CYP2C9 Phenotype', value: phenotype },
        { label: 'Amiodarone Co-therapy', value: amiodarone ? 'Yes — dose significantly reduced' : 'No' },
        { label: 'Target INR', value: targetInr === 3.0 ? '2.5–3.5 (valve/high-risk)' : '2.0–3.0 (standard)' },
        { label: 'Estimated Daily Dose', value: `${dailyDoseStr} mg/day` },
        { label: 'Estimated Weekly Dose', value: `${weeklyDose} mg/week` },
      ],
    }
  },
}
