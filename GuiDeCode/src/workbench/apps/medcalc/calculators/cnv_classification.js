export default {
  id: 'cnv_classification',
  name: 'CNV Analytical Classification System',
  shortDescription: 'ACMG/ClinGen-inspired scoring for constitutional Copy Number Variants',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Pathology', 'Pediatrics'],
  tags: ['CNV', 'microarray', 'CMA', 'ACMG', 'ClinGen', 'pathogenicity', 'deletion', 'duplication', 'array CGH'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'ACMG / ClinGen Framework (Simplified)',
  creatorYear: '2020',
  description: 'Categorizes Copy Number Variants (Deletions or Duplications) identified on chromosomal microarray (CMA) into 5 standard tiers based on a simplified point-based scoring system inspired by ACMG/ClinGen technical standards (Riggs et al. 2020). Evaluates: CNV type, size, gene content, inheritance, overlap with known syndrome regions, and number of OMIM genes.',
  whyUse: 'Helps clinicians quickly gauge the clinical relevance of a reported CNV when standard interpretive guidelines are needed at the point of care. This is a SCREENING/EDUCATIONAL tool; formal laboratory curation is always required.',
  whenToUse: [
    'Reviewing microarray reports at the bedside.',
    'Explaining CNV pathogenicity logic to patients and families.',
    'Triaging CNVs for further workup in a clinical setting.',
    'Teaching residents and fellows the principles of CNV classification.'
  ],
  nextSteps: 'Pathogenic/Likely Pathogenic: Consider phenotype correlation and genetic counseling. VUS: May warrant parental studies, literature review, or ClinGen database check. Likely Benign/Benign: Generally reassuring but clinical correlation always required.',
  pearls: [
    'Deletions are generally less tolerated than duplications of the same region and size.',
    'De novo status strongly increases pathogenicity, BUT confirm with maternity/paternity testing.',
    'Inheritance from a HEALTHY parent pushes towards Benign but does not guarantee it (variable expressivity, incomplete penetrance).',
    'Known syndrome region overlap (e.g., DiGeorge 22q11.2, Williams 7q11.23) is the strongest evidence for pathogenicity.',
    'ClinGen curated haploinsufficiency (HI) and triplosensitivity (TS) scores should be checked for all OMIM genes in the interval.',
    'Intragenic CNVs disrupting a single gene may be highly pathogenic even if small (<50kb).',
    'CNVs in gene deserts or segmental duplications are more likely benign.',
    'Compound heterozygosity: A deletion inherited from a healthy parent may unmask a recessive allele on the other chromosome.'
  ],
  evidence: 'Riggs ER et al. Technical standards for the interpretation and reporting of constitutional copy-number variants: a joint consensus recommendation of the ACMG and ClinGen. Genet Med. 2020;22:245-257.',
  formula: 'Score = Gene Content Points + Size Points + Inheritance Points + Syndrome Region Points + Type Modifier\nPathogenic ≥ 5 | Likely Pathogenic 3-4.9 | VUS 0-2.9 | Likely Benign -1 to -0.1 | Benign ≤ -1',
  references: [
    { text: 'Riggs ER, Andersen EF, Cherry AM, et al. Technical standards for the interpretation and reporting of constitutional copy-number variants. Genet Med. 2020;22:245-257.', url: '' },
    { text: 'Gardner RJM, Sutherland GR, Shaffer LG. Chromosome Abnormalities and Genetic Counseling. Chapter 17.', url: '' }
  ],
  links: [],
  interpretations: [
    { range: 'Pathogenic', label: 'Pathogenic', action: 'Diagnostic - clinical correlation and genetic counseling' },
    { range: 'Likely Pathogenic', label: 'Likely Pathogenic', action: 'Highly suspicious - clinical correlation required' },
    { range: 'VUS', label: 'Variant of Uncertain Significance', action: 'Do NOT use for clinical management without further evidence' },
    { range: 'Likely Benign', label: 'Likely Benign / Benign', action: 'Likely non-contributory' }
  ],
  fields: [
    { key: 'cnv_type', label: 'CNV Type', type: 'select', options: [
      { value: 'DEL', label: 'Deletion (Loss / Copy Number = 1)' },
      { value: 'DUP', label: 'Duplication (Gain / Copy Number = 3)' }
    ]},
    { key: 'cnv_size', label: 'Size in Kilobases (Kb)', type: 'number', min: 1, max: 250000, step: 1, placeholder: 'e.g., 500', hint: '1 Mb = 1000 Kb' },
    { key: 'gene_content', label: 'Gene Content (highest category)', type: 'select', options: [
      { value: 'desert', label: 'Gene desert (no RefSeq coding genes)' },
      { value: 'no_omim', label: 'Genes present, but NO OMIM disease association' },
      { value: 'omim_ar', label: 'Contains OMIM Autosomal Recessive gene(s) only' },
      { value: 'omim_ad_uncertain', label: 'Contains OMIM AD gene (uncertain HI/TS evidence)' },
      { value: 'omim_ad', label: 'Contains OMIM AD gene (established Haploinsufficient or Triplosensitive)' }
    ]},
    { key: 'num_omim_genes', label: 'Number of OMIM morbid genes in interval', type: 'number', min: 0, max: 200, step: 1, placeholder: 'e.g., 3' },
    { key: 'inheritance', label: 'Inheritance', type: 'select', options: [
      { value: 'denovo', label: 'De novo (confirmed - parents tested negative)' },
      { value: 'denovo_unconfirmed', label: 'Apparently de novo (one parent not tested)' },
      { value: 'affected', label: 'Inherited from AFFECTED parent' },
      { value: 'healthy', label: 'Inherited from HEALTHY parent' },
      { value: 'unknown', label: 'Unknown / Not tested' }
    ]},
    { key: 'syndrome_overlap', label: 'Overlaps a known syndrome region?', type: 'select', options: [
      { value: 'no', label: 'No known syndrome overlap' },
      { value: 'partial', label: 'Partial overlap with known syndrome region' },
      { value: 'full', label: 'Full overlap with established microdeletion/microduplication syndrome' }
    ]},
    { key: 'dgv_frequency', label: 'Found in Database of Genomic Variants (DGV) / gnomAD SV?', type: 'select', options: [
      { value: 'absent', label: 'Absent from population databases' },
      { value: 'rare', label: 'Rare (<0.1% frequency)' },
      { value: 'common', label: 'Common polymorphism (>1% frequency)' }
    ]}
  ],
  calculate: (vals) => {
    if (!vals.cnv_type || !vals.cnv_size || !vals.gene_content || !vals.inheritance || !vals.syndrome_overlap || !vals.dgv_frequency) return null

    const sizeKb = parseFloat(vals.cnv_size)
    const numOmim = parseInt(vals.num_omim_genes) || 0
    let score = 0
    let breakdown = []

    if (vals.gene_content === 'desert') {
      score -= 1; breakdown.push({ label: 'Gene Desert', value: '-1.0' })
    } else if (vals.gene_content === 'no_omim') {
      score += 0; breakdown.push({ label: 'No OMIM Morbid Genes', value: '0' })
    } else if (vals.gene_content === 'omim_ar') {
      score += 1; breakdown.push({ label: 'OMIM AR Gene(s)', value: '+1.0' })
    } else if (vals.gene_content === 'omim_ad_uncertain') {
      score += 2; breakdown.push({ label: 'OMIM AD Gene (uncertain HI/TS)', value: '+2.0' })
    } else if (vals.gene_content === 'omim_ad') {
      score += 3; breakdown.push({ label: 'OMIM AD Gene (established HI/TS)', value: '+3.0' })
    }

    if (vals.cnv_type === 'DEL') {
      if (sizeKb >= 5000) { score += 2.5; breakdown.push({ label: 'Very Large DEL (≥5Mb)', value: '+2.5' }) }
      else if (sizeKb >= 3000) { score += 2; breakdown.push({ label: 'Large DEL (3-5Mb)', value: '+2.0' }) }
      else if (sizeKb >= 1000) { score += 1; breakdown.push({ label: 'Moderate DEL (1-3Mb)', value: '+1.0' }) }
      else if (sizeKb >= 400) { score += 0.5; breakdown.push({ label: 'Small DEL (400Kb-1Mb)', value: '+0.5' }) }
      else { score += 0; breakdown.push({ label: 'Micro DEL (<400Kb)', value: '0' }) }
    } else {
      if (sizeKb >= 7000) { score += 1.5; breakdown.push({ label: 'Very Large DUP (≥7Mb)', value: '+1.5' }) }
      else if (sizeKb >= 5000) { score += 1; breakdown.push({ label: 'Large DUP (5-7Mb)', value: '+1.0' }) }
      else if (sizeKb >= 1000) { score += 0.5; breakdown.push({ label: 'Moderate DUP (1-5Mb)', value: '+0.5' }) }
      else { score += 0; breakdown.push({ label: 'Small DUP (<1Mb)', value: '0' }) }
    }

    if (numOmim > 10) { score += 1; breakdown.push({ label: `Many OMIM Genes (${numOmim})`, value: '+1.0' }) }
    else if (numOmim >= 3) { score += 0.5; breakdown.push({ label: `Several OMIM Genes (${numOmim})`, value: '+0.5' }) }

    if (vals.inheritance === 'denovo') {
      score += 2; breakdown.push({ label: 'De Novo (confirmed)', value: '+2.0' })
    } else if (vals.inheritance === 'denovo_unconfirmed') {
      score += 1.5; breakdown.push({ label: 'Apparently De Novo', value: '+1.5' })
    } else if (vals.inheritance === 'affected') {
      score += 1.5; breakdown.push({ label: 'Inherited from Affected', value: '+1.5' })
    } else if (vals.inheritance === 'healthy') {
      score -= 2; breakdown.push({ label: 'Inherited from Healthy', value: '-2.0' })
    } else {
      score += 0; breakdown.push({ label: 'Inheritance Unknown', value: '0' })
    }

    if (vals.syndrome_overlap === 'full') {
      score += 3; breakdown.push({ label: 'Full Syndrome Region Overlap', value: '+3.0' })
    } else if (vals.syndrome_overlap === 'partial') {
      score += 1; breakdown.push({ label: 'Partial Syndrome Overlap', value: '+1.0' })
    }

    if (vals.dgv_frequency === 'common') {
      score -= 3; breakdown.push({ label: 'Common Population Variant', value: '-3.0' })
    } else if (vals.dgv_frequency === 'rare') {
      score -= 0.5; breakdown.push({ label: 'Rare in Population DBs', value: '-0.5' })
    } else {
      score += 0.5; breakdown.push({ label: 'Absent from Population DBs', value: '+0.5' })
    }

    if (vals.cnv_type === 'DUP' && score > 0) {
      const penalty = -0.5
      score += penalty
      breakdown.push({ label: 'Duplication Tolerance Modifier', value: `${penalty}` })
    }

    let classification = ''
    let classDetail = ''
    if (score >= 5) {
      classification = 'Pathogenic'
      classDetail = 'Strong evidence of pathogenicity. Clinical correlation and genetic counseling are essential.'
    } else if (score >= 3) {
      classification = 'Likely Pathogenic'
      classDetail = 'Substantial evidence suggesting pathogenicity. Parental studies and phenotype correlation recommended.'
    } else if (score >= 0) {
      classification = 'VUS (Variant of Uncertain Significance)'
      classDetail = 'Insufficient evidence to classify. Do NOT use for clinical management. Consider parental studies, literature review, and ClinGen/DECIPHER database queries.'
    } else if (score >= -1) {
      classification = 'Likely Benign'
      classDetail = 'Evidence leans towards benignity. Likely non-contributory to the clinical phenotype, but absolute certainty is not possible.'
    } else {
      classification = 'Benign'
      classDetail = 'Strong evidence of benignity. Common population variant or inherited from a healthy parent with no gene content.'
    }

    breakdown.push({ label: 'TOTAL SCORE', value: score.toFixed(1) })

    return {
      result: classification,
      unit: `(Score: ${score.toFixed(1)})`,
      interpretation: classDetail,
      detail: `This is a simplified scoring matrix inspired by ACMG/ClinGen guidelines for educational and triage purposes. Formal laboratory curation by a certified cytogenomicist is always required for clinical diagnosis. Score thresholds: Pathogenic ≥5, Likely Pathogenic 3-4.9, VUS 0-2.9, Likely Benign -1 to -0.1, Benign ≤-1.`,
      breakdown: breakdown
    }
  }
}