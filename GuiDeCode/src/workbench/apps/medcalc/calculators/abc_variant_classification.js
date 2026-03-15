export default {
  id: 'abc_variant_classification',
  name: 'ABC System for Genetic Variant Classification',
  shortDescription: 'Stepwise functional (A) → clinical (B) → comment (C) classification for any type of genetic variant (Houge et al. 2021/2024)',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Laboratory Genetics', 'Pathology', 'Oncology'],
  tags: ['ABC', 'ESHG', 'variant', 'classification', 'functional', 'clinical', 'VUS', 'VOI', 'CNV', 'SNV', 'hypomorphic', 'risk factor', 'pathogenic', 'Houge'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Houge G, Laner A, Cirak S, de Leeuw N, Scheffer H, den Dunnen JT',
  creatorYear: '2021',
  description: 'The ABC system is a stepwise variant classification framework proposed by an ad hoc European Society of Human Genetics (ESHG) working group (Houge et al., Eur J Hum Genet 2022;30:150-159). It can classify ANY type of genetic variant — SNVs, indels, CNVs, runs of homozygosity (ROH), enhancer variants, hypomorphic alleles, imprinted alleles, and common risk alleles — which is a major advantage over the ACMG-AMP system that was primarily designed for high-penetrance Mendelian SNVs/indels. Classification proceeds in three steps: (A) Functional grading assesses the variant\'s biological consequences on gene/protein function, scored 0–5; (B) Clinical grading assesses the genotype–phenotype correlation, scored 0–5; (C) Standard comments linked to the combined A+B class guide reporting decisions. The two-dimensional separation of molecular and clinical evidence makes classification more transparent and reproducible. The system is an add-on or alternative to ACMG-AMP classification and was validated in a 43-laboratory international survey (Houge et al., Eur J Hum Genet 2024).',
  whyUse: 'Provides a universal framework applicable to ALL variant types (CNVs, ROH, regulatory, hypomorphic). Separates functional from clinical assessment for transparency. Splits the VUS category into fVUS (functional unknown) and cVUS (clinical unknown). Introduces "Variant of Interest" (VOI) and "Risk Factor" as clinically meaningful intermediate categories. Endorsed by ESHG working groups. Particularly useful for complex cases where ACMG fails (low penetrance, recessive carriers, non-coding variants, risk alleles).',
  whenToUse: [
    'Classifying any variant identified on WES, WGS, gene panels, or microarrays — especially variants poorly handled by ACMG (CNVs, ROH, regulatory, hypomorphic)',
    'Evaluating genotype–phenotype correlation independently from molecular predictions',
    'As an add-on to ACMG when a VUS result needs further stratification into fVUS vs. VOI',
    'Deciding whether a variant should be reported in the clinical context — ABC step C standard comments guide reporting',
    'Classifying risk factor variants (e.g., Factor V Leiden, HFE p.Cys282Tyr) that do not fit the binary P/B ACMG paradigm',
    'Multidisciplinary variant review meetings requiring transparent two-dimensional assessment',
    'Re-evaluating historic variants in light of new clinical data or expanded phenotype information',
  ],
  nextSteps: 'Class A (Benign/Likely Benign): Not reported unless specifically requested. No clinical follow-up needed. Class B (VUS): Report only if laboratory policy requires; no clinical action. Class C (Variant of Interest / VOI): Consider reporting with recommendation for follow-up — segregation analysis, functional studies, or re-review. Class D (Risk Factor): Report with context-specific risk information and management recommendations. Class E (Pathogenic — variable/low penetrance): Report with penetrance information; cascade testing may be offered with appropriate counseling. Class F (Pathogenic — high penetrance): Full clinical reporting; cascade family testing indicated; condition-specific management applies.',
  pearls: [
    'Step A (functional) is INDEPENDENT of clinical phenotype. A truncating variant in BRCA1 always gets A=5 regardless of whether the patient has cancer.',
    'Step B (clinical) evaluates genotype–phenotype FIT. The same variant can get B=5 in a breast cancer patient and B=0 in a patient with unrelated intellectual disability.',
    'The ABC system splits VUS into fVUS (A=0, lack of functional data) and cVUS (B=0, no clinical correlation). This distinction is critical for follow-up prioritization.',
    'A variant classified as A=3 (hypothetical functional effect) + B=1 (right type of gene) = Class C (VOI). This is the most important "rescue" from the ACMG VUS black hole.',
    'Risk Factor (Class D, B=2) captures low-penetrance disease alleles like Factor V Leiden (c.1601G>A), HFE p.Cys282Tyr, and APOE ε4 — variants that ACMG struggles to classify.',
    'In recessive disease, each allele is scored separately in step A. Step B then integrates the combined genotype: a single pathogenic allele = B=2 (carrier/risk), two pathogenic alleles = B=3–5.',
    'The ABC system avoids the paradox where a clearly pathogenic variant (e.g., known LoF in CFTR) is called VUS just because the patient lacks the expected phenotype.',
    'Step C standard comments are linked to each combined class and can be adapted to local or national laboratory policy for reporting thresholds.',
    'Bayesian-calculated ACMG classes and ABC classes mostly overlap for high-penetrance dominant conditions, but diverge for complex, recessive, and low-penetrance scenarios.',
    'In the 43-laboratory international comparison (2024), ABC-based classification showed more consistent reporting decisions than ACMG-based classification for challenging cases.',
  ],
  evidence: 'Houge G et al. Stepwise ABC system for classification of any type of genetic variant. Eur J Hum Genet. 2022;30(2):150-159. PMID:33981013. Validated in: Houge G et al. Comparison of the ABC and ACMG systems for variant classification. Eur J Hum Genet. 2024. PMID:38778080. 43 international laboratories participated. ABC showed more consistent reporting decisions especially for population-frequent disease-associated variants, recessive carriers, and low-penetrance conditions. Commentary: Campeau PM. An all-encompassing variant classification system proposed. Eur J Hum Genet. 2022;30(2):139. Chen JM et al. Expanding ACMG variant classification guidelines into a general framework. Hum Genomics. 2022;16:Article 407.',
  formula: 'STEP A — FUNCTIONAL GRADING (variant biology):\n  0 = fVUS (unknown functional significance)\n  1 = Normal function (NF) — high-frequency, biologically neutral\n  2 = Likely normal function (LNF)\n  3 = Hypothetical functional effect (HFE) — rare, predicted damaging by in silico\n  4 = Likely functional effect (LFE) / Hypomorphic — likely LoF or partial function\n  5 = Functional effect (FE) — proven LoF, known GoF, or known dominant-negative\n\nSTEP B — CLINICAL GRADING (genotype–phenotype fit):\n  0 = cVUS (unknown clinical significance)\n  1 = Right type of gene (VOI — variant of interest)\n  2 = Risk factor (low penetrance, carrier of recessive, or good clinical support)\n  3 = Pathogenic (penetrance unspecified)\n  4 = Pathogenic — moderate penetrance (20–40%)\n  5 = Pathogenic — high penetrance (>40%)\n\nCOMBINED CLASS (A+B → Final):\n  Class A: A=1–2 (benign/likely benign) → no B grading needed\n  Class B: A=0 (fVUS) or B=0 (cVUS) → VUS\n  Class C: A≥3 + B=1 → Variant of Interest (VOI)\n  Class D: A≥3 + B=2 → Risk Factor\n  Class E: A≥3 + B=3 → Pathogenic (penetrance unspecified)\n  Class E+: A≥3 + B=4 → Pathogenic — moderate penetrance\n  Class F: A≥3 + B=5 → Pathogenic — high penetrance',
  references: [
    { text: 'Houge G et al. Stepwise ABC system for classification of any type of genetic variant. Eur J Hum Genet. 2022;30(2):150-159.', url: 'https://pubmed.ncbi.nlm.nih.gov/33981013/' },
    { text: 'Houge G et al. Comparison of the ABC and ACMG systems for variant classification. Eur J Hum Genet. 2024.', url: 'https://pubmed.ncbi.nlm.nih.gov/38778080/' },
    { text: 'Campeau PM. An all-encompassing variant classification system proposed. Eur J Hum Genet. 2022;30(2):139.', url: 'https://pubmed.ncbi.nlm.nih.gov/34716404/' },
    { text: 'Chen JM et al. Expanding ACMG variant classification guidelines into a general framework. Hum Genomics. 2022;16:Article 407.', url: 'https://pubmed.ncbi.nlm.nih.gov/35978407/' },
    { text: 'Richards S et al. Standards and guidelines for the interpretation of sequence variants. Genet Med. 2015;17(5):405-424.', url: 'https://pubmed.ncbi.nlm.nih.gov/25741868/' },
  ],
  links: [
    { title: 'ESHG ABC System — Official Resources & Presentations', url: 'https://www.eshg.org/news-home/stepwise-abc-system-variant-classification-of-any-type-of-genetic-variant', description: 'ESHG page with downloadable presentations and updated ABC system materials (v2.0)' },
    { title: 'Houge et al. 2021 — Full Open Access Article', url: 'https://www.nature.com/articles/s41431-021-00903-z', description: 'Original ABC system publication in European Journal of Human Genetics' },
    { title: 'Houge et al. 2024 — Comparison Study', url: 'https://www.nature.com/articles/s41431-024-01617-8', description: '43-laboratory international comparison of ABC vs ACMG classification' },
    { title: 'DECIPHER Clinical Fit Calculator', url: 'https://decipher.sanger.ac.uk', description: 'DECIPHER tool for clinical fit scoring — supports ABC step B assessment' },
    { title: 'ClinVar', url: 'https://www.ncbi.nlm.nih.gov/clinvar/', description: 'Public variant database for cross-referencing existing classifications' },
  ],
  interpretations: [
    { range: 'Class A', label: 'Class A — Benign / Likely Benign', action: 'Not reported unless specifically requested. No clinical follow-up needed. Variant has normal or likely normal function.' },
    { range: 'Class B', label: 'Class B — VUS (fVUS or cVUS)', action: 'Insufficient functional or clinical data to classify. Report per laboratory policy. No clinical action based on this variant.' },
    { range: 'Class C', label: 'Class C — Variant of Interest (VOI)', action: 'Functional effect is hypothetical or likely, and gene fits phenotype. Consider reporting with follow-up recommendation. Segregation analysis, functional studies, or periodic re-review.' },
    { range: 'Class D', label: 'Class D — Risk Factor', action: 'Known or suspected risk factor / carrier of recessive condition. Report with context-specific risk and management information.' },
    { range: 'Class E', label: 'Class E — Pathogenic (penetrance variable/unspecified)', action: 'Pathogenic variant. Clinical reporting indicated. Cascade testing with appropriate genetic counseling about penetrance.' },
    { range: 'Class E+', label: 'Class E+ — Pathogenic (moderate penetrance 20–40%)', action: 'Pathogenic variant of moderate penetrance. Report with specific penetrance data. Cascade testing with nuanced counseling.' },
    { range: 'Class F', label: 'Class F — Pathogenic (high penetrance >40%)', action: 'Pathogenic variant of high penetrance. Full clinical reporting. Cascade family testing indicated. Condition-specific management.' },
  ],
  fields: [
    {
      key: 'variant_type', label: 'Variant Type', type: 'select', options: [
        { value: 'snv_missense', label: 'SNV — Missense' },
        { value: 'snv_nonsense', label: 'SNV — Nonsense (stop-gain)' },
        { value: 'snv_synonymous', label: 'SNV — Synonymous' },
        { value: 'snv_splice', label: 'SNV — Splice site' },
        { value: 'indel_frameshift', label: 'Indel — Frameshift' },
        { value: 'indel_inframe', label: 'Indel — In-frame' },
        { value: 'cnv_deletion', label: 'CNV — Deletion' },
        { value: 'cnv_duplication', label: 'CNV — Duplication' },
        { value: 'roh', label: 'ROH — Run of Homozygosity' },
        { value: 'regulatory', label: 'Regulatory / Enhancer variant' },
        { value: 'other', label: 'Other (structural, repeat expansion, etc.)' },
      ],
    },
    {
      key: 'inheritance_mode', label: 'Inheritance Mode of the Condition', type: 'select', options: [
        { value: 'ad', label: 'Autosomal Dominant' },
        { value: 'ar', label: 'Autosomal Recessive' },
        { value: 'xld', label: 'X-linked Dominant' },
        { value: 'xlr', label: 'X-linked Recessive' },
        { value: 'complex', label: 'Complex / Multifactorial' },
        { value: 'unknown', label: 'Unknown / Not applicable' },
      ],
    },
    {
      key: 'step_a', label: 'STEP A — Functional Grading: What is the predicted/proven biological consequence of this variant on gene/protein function?', type: 'select', options: [
        { value: '0', label: '0 — fVUS: Unknown functional significance (insufficient data to classify)' },
        { value: '1', label: '1 — Normal Function (NF): High-frequency variant, biologically neutral, no recessive/hypomorphic role' },
        { value: '2', label: '2 — Likely Normal Function (LNF): Moderate-frequency, no reason to suspect functional effect' },
        { value: '3', label: '3 — Hypothetical Functional Effect (HFE): Rare variant, could affect function based on in silico predictions or de novo occurrence' },
        { value: '4', label: '4 — Likely Functional Effect (LFE): Likely LoF; or hypomorphic allele (reduces but does not abolish function)' },
        { value: '5', label: '5 — Functional Effect (FE): Proven LoF, known GoF, or established dominant-negative; known disease-causing' },
      ],
    },
    {
      key: 'step_b', label: 'STEP B — Clinical Grading: How well does the genotype match the patient\'s phenotype?', type: 'select', options: [
        { value: 'skip', label: '— Skip (only if Step A = 1 or 2, i.e., benign)' },
        { value: '0', label: '0 — cVUS: Unknown clinical significance (gene unlikely to explain phenotype)' },
        { value: '1', label: '1 — Right Type of Gene (VOI): Gene fits the phenotype; variant COULD be pathogenic' },
        { value: '2', label: '2 — Risk Factor: Low penetrance dominant variant; OR carrier of single recessive allele in fitting gene; OR variant with good clinical support' },
        { value: '3', label: '3 — Pathogenic: Pathogenic variant (penetrance not specified)' },
        { value: '4', label: '4 — Pathogenic — Moderate Penetrance: Dominant pathogenic variant, 20–40% penetrance' },
        { value: '5', label: '5 — Pathogenic — High Penetrance: Dominant pathogenic variant, >40% penetrance' },
      ],
    },
    {
      key: 'second_allele', label: 'For Recessive Conditions: Is a second pathogenic allele present in trans?', type: 'select', options: [
        { value: 'na', label: 'Not applicable (dominant, X-linked, or not recessive)' },
        { value: 'yes_confirmed', label: 'Yes — second pathogenic allele confirmed in trans' },
        { value: 'yes_unconfirmed', label: 'Yes — second allele found but phase not confirmed' },
        { value: 'no', label: 'No — only one allele identified (carrier)' },
        { value: 'homozygous', label: 'Homozygous for this variant' },
      ],
    },
  ],
  calculate: (vals) => {
    if (!vals.step_a) return null

    const aScore = parseInt(vals.step_a, 10)
    const bInput = vals.step_b || 'skip'
    const bScore = bInput === 'skip' ? -1 : parseInt(bInput, 10)
    const variantType = vals.variant_type || 'other'
    const inheritanceMode = vals.inheritance_mode || 'unknown'
    const secondAllele = vals.second_allele || 'na'

    const aLabels = {
      0: 'fVUS (Unknown Functional Significance)',
      1: 'Normal Function (NF)',
      2: 'Likely Normal Function (LNF)',
      3: 'Hypothetical Functional Effect (HFE)',
      4: 'Likely Functional Effect (LFE)',
      5: 'Functional Effect (FE)',
    }

    const bLabels = {
      '-1': 'Skipped (benign functional grade)',
      0: 'cVUS (Unknown Clinical Significance)',
      1: 'Right Type of Gene / Variant of Interest (VOI)',
      2: 'Risk Factor',
      3: 'Pathogenic (penetrance unspecified)',
      4: 'Pathogenic — Moderate Penetrance (20–40%)',
      5: 'Pathogenic — High Penetrance (>40%)',
    }

    const aOdds = {
      0: 'Unknown',
      1: '<1% likelihood of functional effect',
      2: '1–10% likelihood of functional effect',
      3: '~50–90% likelihood of functional effect',
      4: '~90–99% likelihood of functional effect',
      5: '>99% certainty of functional effect',
    }

    let combinedClass = ''
    let combinedLabel = ''
    let combinedAction = ''
    let reportRecommendation = ''

    if (aScore === 1 || aScore === 2) {
      combinedClass = 'Class A'
      combinedLabel = 'Benign / Likely Benign'
      combinedAction = 'Variant has normal or likely normal function. No clinical grading needed. Not reported unless specifically requested by the clinician.'
      reportRecommendation = 'DO NOT REPORT (unless requested)'
    } else if (aScore === 0) {
      combinedClass = 'Class B'
      combinedLabel = 'VUS — Functional Unknown (fVUS)'
      combinedAction = 'Insufficient functional data to classify this variant. No clinical action should be taken. Report per laboratory policy only.'
      reportRecommendation = 'REPORT ONLY PER LABORATORY POLICY'
      if (bScore >= 1 && bScore !== -1) {
        combinedAction += ` Note: clinical grading (B=${bScore}) suggests potential relevance, but the functional basis remains unknown. Consider functional studies to resolve.`
      }
    } else if (aScore >= 3 && (bScore === -1 || bScore === 0)) {
      combinedClass = 'Class B'
      combinedLabel = 'VUS — Clinical Unknown (cVUS)'
      combinedAction = 'Variant has a predicted or proven functional effect, but no clinical correlation with the patient\'s phenotype. May be relevant in a different clinical context.'
      reportRecommendation = 'REPORT ONLY PER LABORATORY POLICY'
    } else if (aScore >= 3 && bScore === 1) {
      combinedClass = 'Class C'
      combinedLabel = 'Variant of Interest (VOI)'
      combinedAction = 'Variant is in the "right type of gene" for this phenotype and has a hypothetical or established functional effect. This is a strong candidate for additional investigation: segregation analysis, functional studies, or re-review in 6–12 months.'
      reportRecommendation = 'CONSIDER REPORTING with follow-up recommendation'
    } else if (aScore >= 3 && bScore === 2) {
      combinedClass = 'Class D'
      combinedLabel = 'Risk Factor'
      let riskContext = ''
      if (inheritanceMode === 'ar' && (secondAllele === 'no')) {
        riskContext = ' This patient is a CARRIER of a single recessive allele. Risk of disease is present only if a second allele is identified.'
      } else if (inheritanceMode === 'ad' || inheritanceMode === 'complex') {
        riskContext = ' This is a known or suspected low-penetrance variant. Clinical significance depends on family history and other risk factors.'
      }
      combinedAction = `Known or suspected risk factor for the patient\'s condition. Report with context-specific risk information.${riskContext}`
      reportRecommendation = 'REPORT with risk context and management guidance'
    } else if (aScore >= 3 && bScore === 3) {
      combinedClass = 'Class E'
      combinedLabel = 'Pathogenic (penetrance unspecified)'
      combinedAction = 'Pathogenic variant with clinical correlation confirmed. Penetrance data not specified. Full clinical reporting. Cascade testing indicated with appropriate counseling.'
      reportRecommendation = 'REPORT — Full clinical reporting'
    } else if (aScore >= 3 && bScore === 4) {
      combinedClass = 'Class E+'
      combinedLabel = 'Pathogenic — Moderate Penetrance (20–40%)'
      combinedAction = 'Pathogenic variant of moderate penetrance (20–40%). Report with specific penetrance data. Cascade testing with nuanced counseling about variable expression and incomplete penetrance.'
      reportRecommendation = 'REPORT — with penetrance counseling'
    } else if (aScore >= 3 && bScore === 5) {
      combinedClass = 'Class F'
      combinedLabel = 'Pathogenic — High Penetrance (>40%)'
      combinedAction = 'Pathogenic variant of high penetrance (>40%). Full clinical reporting. Cascade family testing indicated. Condition-specific management and surveillance guidelines apply.'
      reportRecommendation = 'REPORT — Full clinical reporting and cascade testing'
    } else {
      combinedClass = 'Class B'
      combinedLabel = 'VUS (unable to determine)'
      combinedAction = 'Classification could not be determined from the provided inputs. Review step A and step B grades.'
      reportRecommendation = 'REVIEW INPUTS'
    }

    let recessiveNote = ''
    if (inheritanceMode === 'ar') {
      if (secondAllele === 'yes_confirmed') {
        recessiveNote = 'Recessive: Second pathogenic allele confirmed in trans. Compound heterozygosity / homozygosity established — full clinical interpretation applies.'
      } else if (secondAllele === 'yes_unconfirmed') {
        recessiveNote = 'Recessive: Second allele identified but phase NOT confirmed. Parental testing (segregation) is recommended to confirm trans configuration.'
      } else if (secondAllele === 'homozygous') {
        recessiveNote = 'Recessive: Variant is homozygous. If functional grading supports pathogenicity and phenotype matches, this constitutes a molecular diagnosis.'
      } else if (secondAllele === 'no') {
        recessiveNote = 'Recessive: Only one pathogenic allele identified. Patient is a CARRIER. Clinical significance depends on identification of a second allele. Consider deep intronic, structural, or regulatory variants if clinical suspicion is high.'
      }
    }

    let stepCComments = []

    if (combinedClass === 'Class A') {
      stepCComments = [
        'C-A1: This variant is classified as benign / likely benign. It is not expected to contribute to the patient\'s condition.',
        'C-A2: This variant is a common polymorphism with no known functional consequence.',
      ]
    } else if (combinedClass === 'Class B') {
      stepCComments = [
        'C-B1: This variant is of uncertain significance. No clinical action is recommended based on this finding alone.',
        'C-B2: The functional or clinical significance of this variant cannot be determined with current knowledge. Re-analysis may be warranted as new data become available.',
      ]
    } else if (combinedClass === 'Class C') {
      stepCComments = [
        'C-C1: This variant of interest (VOI) is in a gene relevant to the clinical presentation. Additional investigation (segregation, functional studies) is recommended.',
        'C-C2: This VOI could explain the patient\'s phenotype if pathogenicity is confirmed. Consider re-evaluation in 6–12 months or when new evidence becomes available.',
        'C-C3: Family segregation analysis is recommended to assess co-segregation with the phenotype.',
      ]
    } else if (combinedClass === 'Class D') {
      stepCComments = [
        'C-D1: This variant is a known risk factor. Clinical management should consider this genetic risk in the context of other clinical and family history factors.',
        'C-D2: This is a single pathogenic allele in a recessive gene matching the phenotype. The patient is a carrier. Genetic counseling regarding reproductive risk is appropriate.',
        'C-D3: This low-penetrance variant may or may not cause disease in this individual. Surveillance per gene-specific guidelines may be appropriate.',
      ]
    } else if (combinedClass === 'Class E' || combinedClass === 'Class E+') {
      stepCComments = [
        'C-E1: This pathogenic variant explains (or is likely to explain) the patient\'s condition. Condition-specific management guidelines should be followed.',
        'C-E2: Cascade testing is recommended for at-risk family members, with appropriate pre-test counseling regarding variable penetrance and expressivity.',
        'C-E3: Penetrance is incomplete. Not all carriers will develop the condition. Surveillance recommendations should be individualized.',
      ]
    } else if (combinedClass === 'Class F') {
      stepCComments = [
        'C-F1: This highly penetrant pathogenic variant is the molecular diagnosis for the patient\'s condition. Cascade family testing is strongly recommended.',
        'C-F2: Predictive testing for at-risk relatives is indicated. Condition-specific surveillance and management should be initiated promptly.',
      ]
    }

    const variantTypeLabels = {
      snv_missense: 'SNV — Missense',
      snv_nonsense: 'SNV — Nonsense (stop-gain)',
      snv_synonymous: 'SNV — Synonymous',
      snv_splice: 'SNV — Splice site',
      indel_frameshift: 'Indel — Frameshift',
      indel_inframe: 'Indel — In-frame',
      cnv_deletion: 'CNV — Deletion',
      cnv_duplication: 'CNV — Duplication',
      roh: 'ROH — Run of Homozygosity',
      regulatory: 'Regulatory / Enhancer variant',
      other: 'Other',
    }

    const inheritLabels = {
      ad: 'Autosomal Dominant',
      ar: 'Autosomal Recessive',
      xld: 'X-linked Dominant',
      xlr: 'X-linked Recessive',
      complex: 'Complex / Multifactorial',
      unknown: 'Unknown / Not applicable',
    }

    return {
      result: `${combinedClass}: ${combinedLabel}`,
      unit: '',
      interpretation: combinedAction,
      detail: `ABC CLASSIFICATION SUMMARY\n\nStep A — Functional Grade: ${aScore} (${aLabels[aScore]})\n  Odds estimate: ${aOdds[aScore]}\n\nStep B — Clinical Grade: ${bScore === -1 ? 'Skipped' : bScore} (${bLabels[String(bScore)]})\n\nCombined Class: ${combinedClass} — ${combinedLabel}\nReporting Recommendation: ${reportRecommendation}\n\nVariant Type: ${variantTypeLabels[variantType] || variantType}\nInheritance: ${inheritLabels[inheritanceMode] || inheritanceMode}\n${recessiveNote ? '\n' + recessiveNote : ''}\n\nSTEP C — SUGGESTED STANDARD COMMENTS:\n${stepCComments.map((c, i) => `  ${c}`).join('\n')}\n\nNote: The ABC system separates functional (molecular) from clinical assessment for maximum transparency. ACMG criteria can be integrated into Step A grading when appropriate.`,
      breakdown: [
        { label: 'Variant Type', value: variantTypeLabels[variantType] || variantType },
        { label: 'Inheritance Mode', value: inheritLabels[inheritanceMode] || inheritanceMode },
        { label: 'Step A — Functional Grade', value: `${aScore}: ${aLabels[aScore]}` },
        { label: 'Step A — Odds', value: aOdds[aScore] },
        { label: 'Step B — Clinical Grade', value: `${bScore === -1 ? 'Skipped' : bScore}: ${bLabels[String(bScore)]}` },
        { label: 'Combined ABC Class', value: `${combinedClass}: ${combinedLabel}` },
        { label: 'Reporting Recommendation', value: reportRecommendation },
        { label: 'Recessive Allele Status', value: secondAllele === 'na' ? 'N/A' : secondAllele.replace(/_/g, ' ') },
        { label: 'Step C — Primary Comment', value: stepCComments[0] || 'N/A' },
      ],
    }
  },
}