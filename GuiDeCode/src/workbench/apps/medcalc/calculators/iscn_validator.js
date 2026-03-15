export default {
  id: 'iscn_validator',
  name: 'ISCN Cytogenetic Nomenclature Parser',
  shortDescription: 'Decodes ISCN karyotype strings into plain-language clinical descriptions',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Cytogenetics', 'Pathology'],
  tags: ['ISCN', 'karyotype', 'parser', 'translocation', 'chromosome', 'nomenclature', 'cytogenetics'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'ISCN',
  creatorYear: '2024',
  description: 'A lexical analysis engine that translates standard ISCN cytogenetic nomenclature strings into plain-language descriptions for clinical interpretation and patient communication. Supports karyotype strings including translocations, inversions, deletions, duplications, isochromosomes, rings, markers, mosaicism, and sex chromosome anomalies. Accepts both preset selections and free-text input for maximum flexibility.',
  whyUse: 'Helps non-geneticist physicians quickly understand complex cytogenetic reports. Breaks down each component of the ISCN string into its structural meaning.',
  whenToUse: [
    'Translating a karyotype report for a patient chart or clinical summary.',
    'Quickly verifying the structural components of an ISCN string.',
    'Teaching cytogenetics nomenclature to trainees.',
    'Preparing plain-language reports for multidisciplinary team meetings.'
  ],
  nextSteps: 'Clinical correlation required for specific breakpoints. For molecular karyotypes (arr notation), additional parsing rules apply.',
  pearls: [
    'The slash "/" separates different cell lines in mosaicism (e.g., 47,XX,+21/46,XX).',
    'The double slash "//" denotes chimerism (two genetically distinct cell populations, e.g., 46,XX//46,XY).',
    '"der" indicates a derivative chromosome resulting from a rearrangement.',
    '"t(X;Y)(pA;qB)" describes a translocation between chromosomes X and Y with breakpoints at pA and qB.',
    '"inv(X)(pA;qB)" describes a pericentric inversion (breaks in both arms); "inv(X)(qA;qB)" is paracentric (both breaks in same arm).',
    '"+21" means an extra chromosome 21 (gain); "-X" means loss of chromosome X.',
    '"ish" prefix indicates FISH confirmation; "arr" indicates microarray nomenclature.',
    'Nomenclature is case-sensitive: "p" = short arm, "q" = long arm.'
  ],
  evidence: 'ISCN 2024: An International System for Human Cytogenomic Nomenclature. S. Karger, Basel.',
  formula: 'Regex-based lexical parsing of ISCN string components.',
  references: [
    { text: 'ISCN 2024: An International System for Human Cytogenomic Nomenclature. McGowan-Jordan J, Hastings RJ, Moore S, eds. S. Karger, Basel.', url: '' },
    { text: 'Gardner RJM, Sutherland GR, Shaffer LG. Appendix B: Cytogenetic Abbreviations and Nomenclature.', url: '' }
  ],
  links: [],
  interpretations: [
    { range: 'Parsed', label: 'Translation Complete', action: 'Review generated text for accuracy.' }
  ],
  fields: [
    { key: 'input_mode', label: 'Input Mode', type: 'select', options: [
      { value: 'preset', label: 'Select from common examples' },
      { value: 'free', label: 'Free-text input (type any ISCN string)' }
    ]},
    { key: 'preset_karyotype', label: 'Select Karyotype (if preset mode)', type: 'select', required: false, options: [
      { value: '46,XX', label: '46,XX' },
      { value: '46,XY', label: '46,XY' },
      { value: '47,XX,+21', label: '47,XX,+21 (Trisomy 21 Female)' },
      { value: '47,XY,+21', label: '47,XY,+21 (Trisomy 21 Male)' },
      { value: '47,XX,+18', label: '47,XX,+18 (Trisomy 18 Female)' },
      { value: '47,XY,+13', label: '47,XY,+13 (Trisomy 13 Male)' },
      { value: '45,X', label: '45,X (Turner Syndrome)' },
      { value: '47,XXY', label: '47,XXY (Klinefelter Syndrome)' },
      { value: '47,XXX', label: '47,XXX (Triple X)' },
      { value: '47,XYY', label: '47,XYY' },
      { value: '69,XXX', label: '69,XXX (Triploidy)' },
      { value: '46,XX,t(9;22)(q34;q11.2)', label: '46,XX,t(9;22)(q34;q11.2) (Philadelphia)' },
      { value: '46,XY,t(11;22)(q23;q11.2)', label: '46,XY,t(11;22)(q23;q11.2)' },
      { value: '46,XY,del(5)(p15.2)', label: '46,XY,del(5)(p15.2) (Cri-du-chat)' },
      { value: '46,XX,del(7)(q11.23)', label: '46,XX,del(7)(q11.23) (Williams)' },
      { value: '46,XY,del(22)(q11.2)', label: '46,XY,del(22)(q11.2) (DiGeorge)' },
      { value: '46,XX,inv(9)(p12q13)', label: '46,XX,inv(9)(p12q13) (Common variant)' },
      { value: '46,XY,inv(3)(p25q21)', label: '46,XY,inv(3)(p25q21) (Pericentric)' },
      { value: '46,XX,dup(15)(q11.2q13)', label: '46,XX,dup(15)(q11.2q13)' },
      { value: '46,XY,r(13)', label: '46,XY,r(13) (Ring chromosome 13)' },
      { value: '46,XX,i(Xq)', label: '46,XX,i(Xq) (Isochromosome Xq)' },
      { value: '45,XX,rob(13;14)(q10;q10)', label: '45,XX,rob(13;14)(q10;q10) (Robertsonian)' },
      { value: '47,XY,+21/46,XY', label: '47,XY,+21/46,XY (Mosaic Down)' },
      { value: '46,XX//46,XY', label: '46,XX//46,XY (Chimerism)' },
      { value: '47,XY,+mar', label: '47,XY,+mar (Marker chromosome)' }
    ]},
    { key: 'free_karyotype', label: 'Type ISCN String (if free-text mode)', type: 'number', required: false, placeholder: 'e.g., 46,XX,t(4;11)(q21;q23)', hint: 'Enter as text, ignore the number keyboard' }
  ],
  calculate: (vals) => {
    let str = ''
    if (vals.input_mode === 'preset') {
      if (!vals.preset_karyotype) return null
      str = vals.preset_karyotype
    } else {
      if (!vals.free_karyotype) return null
      str = String(vals.free_karyotype).trim()
    }

    if (str.length < 2) return null

    const findings = []
    const components = []

    const isChimerism = str.includes('//')
    const isMosaic = !isChimerism && str.includes('/')

    if (isChimerism) {
      findings.push('CHIMERISM detected: Two genetically distinct cell populations are present (indicated by "//"). This is an extremely rare finding, potentially arising from fusion of two embryos or from double fertilization.')
      const lines = str.split('//')
      components.push({ label: 'Cell Lines (Chimerism)', value: lines.join(' // ') })
    } else if (isMosaic) {
      const lines = str.split('/')
      findings.push(`MOSAICISM detected: ${lines.length} distinct cell lines are present (indicated by "/"). The patient has cells with different chromosome constitutions.`)
      components.push({ label: 'Cell Lines', value: lines.join(' / ') })
    }

    const chrCountMatch = str.match(/^(\d+)/)
    if (chrCountMatch) {
      const count = parseInt(chrCountMatch[1])
      components.push({ label: 'Chromosome Count', value: String(count) })
      if (count === 46) findings.push('Normal chromosome count (46).')
      else if (count === 45) findings.push('Monosomy (45 chromosomes - one chromosome is missing).')
      else if (count === 47) findings.push('Trisomy (47 chromosomes - one extra chromosome is present).')
      else if (count === 48) findings.push('Tetrasomy or double trisomy (48 chromosomes).')
      else if (count === 69) findings.push('Triploidy (69 chromosomes - complete extra haploid set). This is a lethal condition, usually resulting in early pregnancy loss or partial hydatidiform mole.')
      else if (count === 92) findings.push('Tetraploidy (92 chromosomes). Invariably lethal.')
      else if (count < 45) findings.push(`Hypodiploid karyotype (${count} chromosomes).`)
      else if (count > 47 && count < 69) findings.push(`Hyperdiploid karyotype (${count} chromosomes).`)
    }

    if (str.includes(',XX')) { findings.push('Female sex chromosome constitution (XX).'); components.push({ label: 'Sex Chromosomes', value: 'XX (Female)' }) }
    else if (str.includes(',XY')) { findings.push('Male sex chromosome constitution (XY).'); components.push({ label: 'Sex Chromosomes', value: 'XY (Male)' }) }
    else if (str.includes(',X,') || str.match(/,X$/)) { findings.push('Single X chromosome (monosomy X). Consistent with Turner syndrome if 45,X.'); components.push({ label: 'Sex Chromosomes', value: 'X (Monosomy X)' }) }
    else if (str.includes(',XXY')) { findings.push('XXY sex chromosome constitution. Consistent with Klinefelter syndrome.'); components.push({ label: 'Sex Chromosomes', value: 'XXY (Klinefelter)' }) }
    else if (str.includes(',XXX')) { findings.push('Triple X (47,XXX). Usually associated with tall stature and normal or mildly reduced IQ.'); components.push({ label: 'Sex Chromosomes', value: 'XXX (Triple X)' }) }
    else if (str.includes(',XYY')) { findings.push('XYY sex chromosome constitution. Associated with tall stature.'); components.push({ label: 'Sex Chromosomes', value: 'XYY' }) }

    const trisomyMatches = str.match(/\+(\d+)/g)
    if (trisomyMatches) {
      trisomyMatches.forEach(m => {
        const chr = m.replace('+', '')
        const syndromes = { '21': 'Down Syndrome', '18': 'Edwards Syndrome', '13': 'Patau Syndrome' }
        const syn = syndromes[chr] ? ` (${syndromes[chr]})` : ''
        findings.push(`Gain of chromosome ${chr}${syn}: an extra copy is present (trisomy).`)
      })
    }

    const monosomyMatches = str.match(/-(\d+)/g)
    if (monosomyMatches) {
      monosomyMatches.forEach(m => {
        const chr = m.replace('-', '')
        findings.push(`Loss of chromosome ${chr}: one copy is missing (monosomy).`)
      })
    }

    const transMatches = str.match(/t\(([^)]+)\)\(([^)]+)\)/g)
    if (transMatches) {
      transMatches.forEach(m => {
        const chrs = m.match(/t\(([^)]+)\)/)[1]
        const bps = m.match(/\)\(([^)]+)\)/)[1]
        const chrList = chrs.split(';')
        const bpList = bps.split(';')
        let desc = `Reciprocal Translocation between chromosome${chrList.length > 2 ? 's' : ''} ${chrList.join(' and ')}`
        if (bpList.length === chrList.length) {
          const details = chrList.map((c, i) => `chr ${c} at band ${bpList[i]}`).join(', ')
          desc += ` with breakpoints at ${details}`
        }
        desc += '.'
        findings.push(desc)
      })
    }

    const robMatches = str.match(/rob\(([^)]+)\)\(([^)]+)\)/g)
    if (robMatches) {
      robMatches.forEach(m => {
        const chrs = m.match(/rob\(([^)]+)\)/)[1]
        findings.push(`Robertsonian Translocation involving chromosomes ${chrs.replace(';', ' and ')}. This is a fusion of two acrocentric chromosomes at their centromeres, reducing total count by one.`)
      })
    }

    const invMatches = str.match(/inv\(([^)]+)\)\(([^)]+)\)/g)
    if (invMatches) {
      invMatches.forEach(m => {
        const chr = m.match(/inv\(([^)]+)\)/)[1]
        const bands = m.match(/\)\(([^)]+)\)/)[1]
        const bpList = bands.split(/[;q]/).filter(Boolean)
        const hasP = bands.includes('p')
        const hasQ = bands.includes('q')
        const invType = (hasP && hasQ) ? 'Pericentric (involves centromere)' : 'Paracentric (does NOT involve centromere)'
        findings.push(`Inversion of chromosome ${chr} with breakpoints at ${bands}. Type: ${invType}.`)
      })
    }

    const delMatches = str.match(/del\(([^)]+)\)\(([^)]+)\)/g)
    if (delMatches) {
      delMatches.forEach(m => {
        const chr = m.match(/del\(([^)]+)\)/)[1]
        const bands = m.match(/\)\(([^)]+)\)/)[1]
        const knownDels = {
          '5': { 'p15.2': 'Cri-du-chat syndrome', 'p15': 'Cri-du-chat syndrome' },
          '7': { 'q11.23': 'Williams-Beuren syndrome' },
          '22': { 'q11.2': 'DiGeorge / Velocardiofacial syndrome (22q11.2 deletion)' },
          '15': { 'q11.2q13': 'Prader-Willi or Angelman syndrome (depending on parent of origin)' },
          '17': { 'p11.2': 'Smith-Magenis syndrome', 'p13.3': 'Miller-Dieker syndrome' },
          '4': { 'p16.3': 'Wolf-Hirschhorn syndrome' }
        }
        let synNote = ''
        if (knownDels[chr]) {
          for (const [band, name] of Object.entries(knownDels[chr])) {
            if (bands.includes(band)) { synNote = ` This is associated with ${name}.`; break }
          }
        }
        findings.push(`Deletion on chromosome ${chr} at band(s) ${bands}: loss of genetic material from this region.${synNote}`)
      })
    }

    const dupMatches = str.match(/dup\(([^)]+)\)\(([^)]+)\)/g)
    if (dupMatches) {
      dupMatches.forEach(m => {
        const chr = m.match(/dup\(([^)]+)\)/)[1]
        const bands = m.match(/\)\(([^)]+)\)/)[1]
        findings.push(`Duplication on chromosome ${chr} at band(s) ${bands}: gain (extra copy) of genetic material from this region.`)
      })
    }

    if (str.includes('+mar')) {
      findings.push('Marker chromosome detected (+mar): a small, unidentified extra chromosome of unknown origin. FISH or microarray is needed to determine its content and clinical significance.')
    }

    const ringMatch = str.match(/r\((\d+)\)/)
    if (ringMatch) {
      findings.push(`Ring chromosome ${ringMatch[1]}: the chromosome has formed a circular structure with loss of material from both telomeres. Ring chromosomes are inherently unstable during cell division and may cause mosaic monosomy.`)
    }

    const isoMatch = str.match(/i\((\d*[XY]?)([pq])\)/)
    if (isoMatch) {
      const isoChr = isoMatch[1] || '?'
      const isoArm = isoMatch[2] === 'p' ? 'short arm (p)' : 'long arm (q)'
      findings.push(`Isochromosome of the ${isoArm} of chromosome ${isoChr}: this chromosome consists of two copies of one arm with loss of the other arm.`)
    }

    if (str.includes('der(')) {
      findings.push('Derivative chromosome (der): a structurally rearranged chromosome resulting from translocation, inversion, or other complex rearrangement. The derivative chromosome\'s content should be evaluated for imbalance.')
    }

    if (findings.length === 0) {
      findings.push('Unable to fully parse this ISCN string. Please verify the notation and consult with a cytogeneticist.')
    }

    return {
      result: 'Parsed',
      unit: '',
      interpretation: findings.length > 0 ? 'Translation Complete' : 'Parsing Incomplete',
      detail: findings.join(' '),
      breakdown: [
        { label: 'Input ISCN', value: str },
        ...components,
        { label: 'Findings Count', value: String(findings.length) }
      ]
    }
  }
}