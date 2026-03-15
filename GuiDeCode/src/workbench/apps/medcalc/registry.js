const calculatorModules = import.meta.glob('./calculators/*.js', { eager: true })

const SYSTEMS = {
  cardiovascular: { name: 'Cardiovascular / Vascular', icon: '♥', color: '#f38ba8' },
  critical_care: { name: 'Critical Care / ICU', icon: '⚕', color: '#fab387' },
  respiratory: { name: 'Respiratory / Pulmonology', icon: '◎', color: '#89b4fa' },
  neurology: { name: 'Neurology / Stroke', icon: '⟁', color: '#cba6f7' },
  surgery_trauma: { name: 'Surgery / Trauma / Emergency', icon: '✚', color: '#f9e2af' },
  gastro_hepatology: { name: 'Gastroenterology / Hepatology', icon: '⬡', color: '#a6e3a1' },
  nephrology: { name: 'Nephrology / Fluids / Acid-Base', icon: '◈', color: '#74c7ec' },
  endocrinology: { name: 'Endocrinology / Metabolic', icon: '◇', color: '#f2cdcd' },
  hematology_oncology: { name: 'Hematology / Oncology', icon: '◉', color: '#eba0ac' },
  infectious_disease: { name: 'Infectious Disease', icon: '⬢', color: '#94e2d5' },
  pharmacology: { name: 'Pharmacology / Medications', icon: '℞', color: '#89dceb' },
  pediatrics: { name: 'Pediatrics / Neonatology', icon: '◐', color: '#f5c2e7' },
  obstetrics: { name: 'Obstetrics / Maternal', icon: '◑', color: '#f5e0dc' },
  nutrition: { name: 'Nutrition / Enteral / TPN', icon: '▣', color: '#a6e3a1' },
  psychiatry: { name: 'Psychiatry / Mental Health', icon: '◎', color: '#b4befe' },
  dermatology: { name: 'Dermatology', icon: '◻', color: '#fab387' },
  genetics: { name: 'Clinical Genetics', icon: '⧖', color: '#cba6f7' },
  radiology: { name: 'Radiology / Radiation Oncology', icon: '☢', color: '#f9e2af' },
  utilities: { name: 'Clinical Utilities', icon: '⚙', color: '#9399b2' },
}

const allCalculators = []

Object.entries(calculatorModules).forEach(([path, mod]) => {
  const calc = mod.default
  if (calc && calc.id && calc.name && calc.calculate) {
    const fileName = path.split('/').pop().replace('.js', '')
    allCalculators.push({
      ...calc,
      _fileName: fileName,
      _path: path,
      system: calc.system || 'utilities',
      specialty: calc.specialty || [],
      tags: calc.tags || [],
      version: calc.version || '1.0.0',
      updatedAt: calc.updatedAt || '2025-01-01',
      description: calc.description || '',
      shortDescription: calc.shortDescription || '',
      references: calc.references || [],
      links: calc.links || [],
      evidence: calc.evidence || '',
      pearls: calc.pearls || [],
      pitfalls: calc.pitfalls || [],
      whenToUse: calc.whenToUse || [],
      whyUse: calc.whyUse || '',
      nextSteps: calc.nextSteps || '',
      creatorName: calc.creatorName || '',
      creatorYear: calc.creatorYear || '',
      interpretations: calc.interpretations || [],
      formula: calc.formula || '',
    })
  }
})

allCalculators.sort((a, b) => a.name.localeCompare(b.name))

const getCalculatorsBySystem = () => {
  const grouped = {}
  allCalculators.forEach(calc => {
    const sys = calc.system
    if (!grouped[sys]) grouped[sys] = []
    grouped[sys].push(calc)
  })
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)))
  return grouped
}

const getCalculatorsBySpecialty = () => {
  const grouped = {}
  allCalculators.forEach(calc => {
    const specs = calc.specialty.length > 0 ? calc.specialty : ['Unclassified']
    specs.forEach(s => {
      if (!grouped[s]) grouped[s] = []
      if (!grouped[s].find(c => c.id === calc.id)) grouped[s].push(calc)
    })
  })
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)))
  return grouped
}

const searchCalculators = (query) => {
  if (!query || !query.trim()) return allCalculators
  const q = query.toLowerCase().trim()
  const terms = q.split(/\s+/)
  return allCalculators.filter(calc => {
    const searchable = [
      calc.name,
      calc.shortDescription,
      calc.description,
      calc.system,
      ...(calc.specialty || []),
      ...(calc.tags || []),
      calc.creatorName || '',
    ].join(' ').toLowerCase()
    return terms.every(term => searchable.includes(term))
  }).sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()
    const aExact = aName.includes(q)
    const bExact = bName.includes(q)
    if (aExact && !bExact) return -1
    if (!aExact && bExact) return 1
    return aName.localeCompare(bName)
  })
}

export { SYSTEMS, allCalculators, getCalculatorsBySystem, getCalculatorsBySpecialty, searchCalculators }
