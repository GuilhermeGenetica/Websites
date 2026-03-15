export default {
  id: 'twin_mom_adjustment',
  name: 'First Trimester Twin MoM Adjustment',
  shortDescription: 'Corrects PAPP-A and free beta-hCG MoM values for twin pregnancies by chorionicity',
  system: 'obstetrics',
  specialty: ['Maternal-Fetal Medicine', 'Obstetrics', 'Clinical Genetics'],
  tags: ['twins', 'MoM', 'PAPP-A', 'hCG', 'first trimester', 'screening', 'aneuploidy', 'combined test', 'dichorionic', 'monochorionic'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Fetal Medicine Foundation (FMF) / Nicolaides et al.',
  creatorYear: '2014',
  description: 'Maternal serum levels of PAPP-A and free beta-hCG are naturally higher in multiple gestations due to increased placental mass. If these Multiples of the Median (MoM) are not corrected for chorionicity and gestational age, standard risk calculators will yield catastrophically high false-positive rates for Trisomy 21. This tool applies the FMF median correction factors stratified by chorionicity, and optionally by gestational age window.',
  whyUse: 'Allows for the accurate use of first-trimester combined screening tools in twin pregnancies. Without correction, virtually all twin pregnancies would screen positive.',
  whenToUse: [
    'Adjusting raw laboratory MoM values for a twin pregnancy before entering them into an aneuploidy risk calculator.',
    'Verifying the corrected MoM values provided by a laboratory when the correction method is uncertain.'
  ],
  nextSteps: 'Use the Adjusted MoM values in your standard Down Syndrome risk assessment software. Remember that in twin pregnancies, the NT measurement must be assessed for EACH fetus individually.',
  pearls: [
    'Dichorionic (DC) twins have roughly double the placental mass, hence correction factors are ~2.0-2.1.',
    'Monochorionic (MC) twins share a single placenta and have slightly lower MoM inflation (factors ~1.7-1.9).',
    'PAPP-A correction factors vary slightly with gestational age (higher correction at earlier gestations).',
    'In dichorionic twins discordant for aneuploidy, the affected twin\'s contribution to the biochemistry is diluted by the normal co-twin.',
    'For DC twins, per-fetus risk assessment using individual NT and adjusted biochemistry is the standard approach.',
    'For MC twins, both fetuses share the same karyotype, so a single combined assessment applies.',
    'IVF/ICSI pregnancies may have slightly different biochemical profiles; some labs apply an additional correction.'
  ],
  evidence: 'Spencer K, Nicolaides KH. Screening for trisomy 21 in twins using first trimester ultrasound and maternal serum biochemistry. BJOG. 2003;110:276-280. Prats P, et al. First trimester screening for Down syndrome in twin pregnancies. Prenat Diagn. 2014.',
  formula: 'Adjusted MoM = Raw MoM / Correction Factor\nDC: PAPP-A factor ~2.10, hCG factor ~2.00\nMC: PAPP-A factor ~1.70, hCG factor ~1.90',
  references: [
    { text: 'Spencer K, Nicolaides KH. Screening for trisomy 21 in twins. BJOG. 2003;110:276-280.', url: '' },
    { text: 'Fetal Medicine Foundation. First trimester screening in multiple pregnancies. 2014.', url: '' }
  ],
  links: [],
  interpretations: [
    { range: '0-10', label: 'Adjusted Values', action: 'Input into risk calculation software.' }
  ],
  fields: [
    { key: 'chorionicity', label: 'Chorionicity', type: 'select', options: [
      { value: 'DC', label: 'Dichorionic (DC) - Two placentas' },
      { value: 'MC', label: 'Monochorionic (MC) - One placenta' }
    ]},
    { key: 'ga_window', label: 'Gestational Age Window', type: 'select', options: [
      { value: 'standard', label: '11-13+6 weeks (Standard 1st Trimester)' },
      { value: 'early', label: '10-11 weeks (Early)' },
      { value: 'late', label: '14-16 weeks (Late 1st / Early 2nd)' }
    ]},
    { key: 'pappa', label: 'Raw PAPP-A MoM', type: 'number', min: 0.01, max: 20.0, step: 0.01, placeholder: 'e.g., 2.15' },
    { key: 'hcg', label: 'Raw free beta-hCG MoM', type: 'number', min: 0.01, max: 20.0, step: 0.01, placeholder: 'e.g., 2.40' },
    { key: 'ivf', label: 'IVF/ICSI conception?', type: 'select', options: [
      { value: 'no', label: 'No (Spontaneous)' },
      { value: 'yes', label: 'Yes (IVF/ICSI)' }
    ]}
  ],
  calculate: (vals) => {
    if (!vals.chorionicity || !vals.pappa || !vals.hcg || !vals.ga_window || !vals.ivf) return null

    const rawPappa = parseFloat(vals.pappa)
    const rawHcg = parseFloat(vals.hcg)
    if (isNaN(rawPappa) || isNaN(rawHcg)) return null

    let pappaFactor = 1.0
    let hcgFactor = 1.0

    if (vals.chorionicity === 'DC') {
      if (vals.ga_window === 'early') {
        pappaFactor = 2.20; hcgFactor = 2.05
      } else if (vals.ga_window === 'late') {
        pappaFactor = 2.00; hcgFactor = 1.95
      } else {
        pappaFactor = 2.10; hcgFactor = 2.00
      }
    } else {
      if (vals.ga_window === 'early') {
        pappaFactor = 1.80; hcgFactor = 1.95
      } else if (vals.ga_window === 'late') {
        pappaFactor = 1.60; hcgFactor = 1.85
      } else {
        pappaFactor = 1.70; hcgFactor = 1.90
      }
    }

    let ivfModifier = 1.0
    let ivfNote = ''
    if (vals.ivf === 'yes') {
      ivfModifier = 0.90
      ivfNote = ' An additional IVF/ICSI correction of ×0.90 has been applied to the adjusted PAPP-A MoM, as IVF pregnancies tend to have lower PAPP-A levels.'
    }

    const adjPappa = ((rawPappa / pappaFactor) * (vals.ivf === 'yes' ? ivfModifier : 1.0)).toFixed(3)
    const adjHcg = (rawHcg / hcgFactor).toFixed(3)

    let screeningFlag = ''
    if (parseFloat(adjPappa) < 0.4 || parseFloat(adjHcg) > 2.5) {
      screeningFlag = ' WARNING: After correction, one or more analytes remain outside normal screening thresholds. Consider that this may indicate genuine increased risk or a co-twin contribution.'
    }

    return {
      result: 'Values Adjusted',
      unit: '',
      interpretation: `Adjusted MoMs ready for risk calculation.${screeningFlag}`,
      detail: `For ${vals.chorionicity} twins at ${vals.ga_window === 'standard' ? '11-13+6' : vals.ga_window === 'early' ? '10-11' : '14-16'} weeks: PAPP-A divided by ${pappaFactor}, hCG divided by ${hcgFactor}.${ivfNote}`,
      breakdown: [
        { label: 'Raw PAPP-A MoM', value: rawPappa.toFixed(2) },
        { label: 'PAPP-A Correction Factor', value: `÷ ${pappaFactor}` },
        { label: 'Adjusted PAPP-A MoM', value: adjPappa },
        { label: 'Raw hCG MoM', value: rawHcg.toFixed(2) },
        { label: 'hCG Correction Factor', value: `÷ ${hcgFactor}` },
        { label: 'Adjusted hCG MoM', value: adjHcg },
        { label: 'Chorionicity', value: vals.chorionicity },
        { label: 'IVF Correction', value: vals.ivf === 'yes' ? 'Applied (×0.90 PAPP-A)' : 'N/A' }
      ]
    }
  }
}