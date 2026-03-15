export default {
  id: 'cohen_daniel_viability',
  name: 'Cohen & Daniel Viability Thresholds',
  shortDescription: 'Evaluates fetal survival potential of chromosome imbalances in reciprocal translocations',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Obstetrics', 'Maternal-Fetal Medicine'],
  tags: ['translocations', 'viability', 'Cohen', 'Daniel', 'monosomy', 'trisomy', 'reproductive risk', 'reciprocal translocation', 'meiotic segregation'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Cohen & Daniel',
  creatorYear: '1985',
  description: 'This calculator evaluates the fetal survival potential of chromosomal imbalances resulting from reciprocal translocations. It is based on the "viability triangle" concept, where maximum thresholds of autosomal monosomy and trisomy determine whether the pregnancy is likely to result in a malformed live birth or in utero lethality (spontaneous abortion). The human fetus tolerates less loss of genetic material (monosomy) than gain (trisomy), establishing asymmetric thresholds.',
  whyUse: 'Essential for stratifying the risk of an unbalanced pregnancy resulting in a live birth with multiple malformations versus a recurrent pregnancy loss, guiding reproductive counseling for translocation carriers.',
  whenToUse: [
    'Reproductive counseling for couples carrying reciprocal translocations.',
    'Estimating the risk of a malformed offspring versus the risk of recurrent miscarriage.',
    'Evaluating adjacent-1 or adjacent-2 segregation products from meiotic quadrivalent analysis.',
    'Providing quantitative context when discussing PGT-SR (Preimplantation Genetic Testing for Structural Rearrangements).'
  ],
  nextSteps: 'If classified as viable, the couple should receive detailed genetic counseling regarding severe morbidities and congenital malformations. If lethal in utero, explain the high risk of recurrent pregnancy loss and discuss reproductive alternatives like PGT-SR.',
  pearls: [
    'This model assumes genomic tolerance is strictly quantitative (the size of the imbalance matters more than the exact gene content for overall viability, though gene-rich chromosomes are exceptions).',
    'Imbalances exceeding these thresholds tend to cause early embryonic or fetal demise.',
    'Use in conjunction with the Haploid Autosomal Length (HAL) Calculator to obtain exact monosomy and trisomy percentages.',
    'The thresholds are NOT absolute: some chromosomes rich in dosage-sensitive genes (e.g., 17, 19) may be lethal at lower imbalance percentages.',
    'Outlying points exist in the literature where both segments are substantial yet survivable (e.g., t(5;10)(p13;q23.3) with 1.1% monosomy + 1.4% trisomy = 2.5% HAL total).',
    'Duplications (trisomy) are generally more tolerated than deletions (monosomy) because haploinsufficiency tends to be more deleterious than triplosensitivity.'
  ],
  evidence: 'Based on consolidated empirical survival data of chromosomal imbalances from multiple international series. The viability triangle has been validated across hundreds of translocation families (Stengel-Rutkowski et al. 1988, Cohen et al. 1992, 1994, Midro et al. 2000).',
  formula: 'Probable Viability = Monosomy ≤ 2% AND Trisomy ≤ 4%\nBorderline Zone = Monosomy 2-3% OR Trisomy 4-5%\nLethal = Monosomy > 3% OR Trisomy > 5%',
  references: [
    { text: 'Gardner RJM, Sutherland GR, Shaffer LG. Chromosome Abnormalities and Genetic Counseling. Oxford University Press.', url: '' },
    { text: 'Cohen O, Cans C, Cuillel M, et al. Cartographic study: breakpoints in 1574 families carrying human reciprocal translocations. Hum Genet. 1996;97:659-667.', url: '' },
    { text: 'Stengel-Rutkowski S, Stene J, Gallano P. Risk estimates in balanced familial reciprocal translocations. Expansion Scientifique Francaise, Paris. 1988.', url: '' }
  ],
  links: [],
  interpretations: [
    { range: 'Viable', label: 'Viable (Risk of malformed live birth)', action: 'Requires detailed genetic counseling regarding severe morbidities.' },
    { range: 'Borderline', label: 'Borderline Viability', action: 'Uncertain outcome; careful case-by-case evaluation needed.' },
    { range: 'Lethal', label: 'Lethal in utero', action: 'Extremely high risk of recurrent pregnancy loss (miscarriage).' }
  ],
  fields: [
    { key: 'monosomy_percent', label: 'Percentage of autosomal genome in monosomy (%)', type: 'number', min: 0, max: 15, step: 0.01, placeholder: 'e.g., 1.5', hint: 'Use HAL Calculator to derive this value' },
    { key: 'trisomy_percent', label: 'Percentage of autosomal genome in trisomy (%)', type: 'number', min: 0, max: 15, step: 0.01, placeholder: 'e.g., 3.2', hint: 'Use HAL Calculator to derive this value' },
    { key: 'gene_rich_chr', label: 'Does the imbalance involve a gene-rich chromosome?', type: 'select', options: [
      { value: 'no', label: 'No / Unknown' },
      { value: 'yes', label: 'Yes (e.g., chr 17, 19, 22)' }
    ]}
  ],
  calculate: (vals) => {
    const monosomy = parseFloat(vals.monosomy_percent)
    const trisomy = parseFloat(vals.trisomy_percent)

    if (isNaN(monosomy) || isNaN(trisomy)) return null

    const totalImbalance = monosomy + trisomy
    const geneRichWarning = vals.gene_rich_chr === 'yes'

    let resultStatus = ''
    let interpretationLabel = ''
    let detailText = ''
    let riskColor = ''

    if (monosomy <= 2.0 && trisomy <= 4.0) {
      if (geneRichWarning) {
        resultStatus = 'Borderline'
        interpretationLabel = 'Borderline Viability (Gene-Rich Region)'
        detailText = 'The genomic imbalance is within the standard viability triangle. However, because a gene-rich chromosome is involved, the effective tolerance may be lower. Some gene-rich regions (e.g., 17p, 19p, 22q) harbor many dosage-sensitive genes that can cause lethality or severe phenotypes even at low imbalance percentages. Detailed evaluation of the specific genes in the imbalanced segment is recommended.'
      } else {
        resultStatus = 'Viable'
        interpretationLabel = 'Viable (Risk of malformed live birth)'
        detailText = 'The genomic imbalance is within the "viability triangle". There is a considerable risk that the pregnancy will proceed to term, resulting in a live birth with congenital malformations and developmental delay. The severity depends on the specific chromosomal regions involved.'
      }
    } else if ((monosomy > 2.0 && monosomy <= 3.0) || (trisomy > 4.0 && trisomy <= 5.0)) {
      resultStatus = 'Borderline'
      interpretationLabel = 'Borderline Viability'
      detailText = 'The genomic imbalance falls in the borderline zone between the viability triangle and definite lethality. Outcomes are unpredictable. Some pregnancies in this range result in severely affected live births (often with early neonatal death), while others result in late miscarriage or stillbirth. Specific gene content of the imbalanced segments is critical for prognosis.'
    } else {
      resultStatus = 'Lethal'
      interpretationLabel = 'Lethal in utero'
      detailText = 'The amount of genomic imbalance exceeds the tolerance for human fetal development. It is highly likely that this unbalanced karyotype will result in in utero lethality (spontaneous abortion or fetal demise). Most losses occur in the first trimester.'
    }

    const monosomyMb = (monosomy * 28.75).toFixed(0)
    const trisomyMb = (trisomy * 28.75).toFixed(0)

    return {
      result: resultStatus,
      unit: '',
      interpretation: interpretationLabel,
      detail: detailText,
      breakdown: [
        { label: 'Monosomy Load', value: `${monosomy.toFixed(2)}% (~${monosomyMb} Mb)` },
        { label: 'Trisomy Load', value: `${trisomy.toFixed(2)}% (~${trisomyMb} Mb)` },
        { label: 'Total Imbalance', value: `${totalImbalance.toFixed(2)}%` },
        { label: 'Monosomy Threshold (≤2%)', value: monosomy <= 2.0 ? 'PASS' : 'EXCEEDED' },
        { label: 'Trisomy Threshold (≤4%)', value: trisomy <= 4.0 ? 'PASS' : 'EXCEEDED' },
        { label: 'Gene-Rich Region Warning', value: geneRichWarning ? 'YES' : 'No' }
      ]
    }
  }
}