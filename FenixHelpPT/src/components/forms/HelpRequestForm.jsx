import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const phaseOptions = {
  shortTerm: [
    { id: 'alojamento', label: 'Alojamento' },
    { id: 'alimentacao', label: 'Alimentação' },
    { id: 'roupas', label: 'Roupas' },
    { id: 'higiene', label: 'Produtos de Higiene' },
    { id: 'apoio-psicologico', label: 'Apoio Psicológico' },
    { id: 'abrigo-animal', label: 'Abrigo ou Alimentação Animal' }
  ],
  mediumTerm: [
    { id: 'material-construcao', label: 'Material de Construção' },
    { id: 'mobiliario', label: 'Mobiliário' },
    { id: 'eletrodomesticos', label: 'Eletrodomésticos' },
    { id: 'apoio-juridico', label: 'Apoio Jurídico' },
    { id: 'limpeza-terrenos', label: 'Limpeza de Terrenos' },
    { id: 'financeiro-emprego', label: 'Apoio Financeiro / Emprego' }
  ],
  longTerm: [
    { id: 'reflorestacao', label: 'Reflorestação/Paisagismo' },
    { id: 'mentoria-negocios', label: 'Mentoria de Negócios' },
    { id: 'formacao-profissional', label: 'Formação Profissional' },
    { id: 'projetos', label: 'Interesse em acolher projetos' }
  ]
};

const countries = [
  'Portugal', 'Espanha', 'França', 'Alemanha', 'Itália', 'Reino Unido', 'Outro'
];

const HelpRequestForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', location: '', address: '', people: '', country: 'Portugal', postalCode: '',
    socialSecurityNumber: '', taxIdNumber: '', citizenCardNumber: '',
    damageDescription: '', damageValue: '', damageDate: '', affectedArea: '',
    photoLink: '', description: '', phases: { shortTerm: [], mediumTerm: [], longTerm: [] },
    consent: false, phoneConsent: false
  });

  const [openSections, setOpenSections] = useState({ shortTerm: false, mediumTerm: false, longTerm: false });

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handlePhaseChange = (phase, optionId, checked) => {
    setFormData(prev => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phase]: checked
          ? [...prev.phases[phase], optionId]
          : prev.phases[phase].filter(id => id !== optionId)
      }
    }));
  };
  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-4">Informações Básicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="text-foreground">Nome Completo *</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="O seu nome completo" className="mt-2" required />
          </div>
          <div>
            <Label htmlFor="phone" className="text-foreground">Contacto Telefónico *</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+351 900 000 000" className="mt-2" required />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="email" className="text-foreground">Email (opcional)</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="seuemail@exemplo.com" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="people" className="text-foreground">Número de Pessoas *</Label>
            <Input id="people" type="number" min="1" value={formData.people} onChange={(e) => handleInputChange('people', e.target.value)} placeholder="Ex: 4" className="mt-2" required />
          </div>
        </div>
        <div>
            <Label htmlFor="address" className="text-foreground">Morada Completa (opcional)</Label>
            <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="Rua, número, andar" className="mt-2" />
        </div>
        <div>
          <Label htmlFor="location" className="text-foreground">Localidade/Freguesia *</Label>
          <Input id="location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="Ex: Pedrógão Grande, Leiria" className="mt-2" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="country" className="text-foreground">País (opcional)</Label>
            <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o país" /></SelectTrigger>
              <SelectContent>{countries.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="postalCode" className="text-foreground">Código Postal (opcional)</Label>
            <Input id="postalCode" value={formData.postalCode} onChange={(e) => handleInputChange('postalCode', e.target.value)} placeholder="Ex: 3200-000" className="mt-2" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-4">Documentação e Prejuízos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="socialSecurityNumber" className="text-foreground">Nº Segurança Social (opcional)</Label>
                <Input id="socialSecurityNumber" value={formData.socialSecurityNumber} onChange={(e) => handleInputChange('socialSecurityNumber', e.target.value)} placeholder="O seu número da Segurança Social" className="mt-2" />
            </div>
            <div>
                <Label htmlFor="taxIdNumber" className="text-foreground">Nº Identificação Fiscal (NIF) (opcional)</Label>
                <Input id="taxIdNumber" value={formData.taxIdNumber} onChange={(e) => handleInputChange('taxIdNumber', e.target.value)} placeholder="O seu NIF" className="mt-2" />
            </div>
        </div>
        <div>
            <Label htmlFor="citizenCardNumber" className="text-foreground">Nº Cartão Cidadão ou Passaporte (opcional)</Label>
            <Input id="citizenCardNumber" value={formData.citizenCardNumber} onChange={(e) => handleInputChange('citizenCardNumber', e.target.value)} placeholder="O seu número de identificação" className="mt-2" />
        </div>
        <div>
            <Label htmlFor="damageDescription" className="text-foreground">Descrição do Prejuízo (opcional)</Label>
            <Textarea id="damageDescription" value={formData.damageDescription} onChange={(e) => handleInputChange('damageDescription', e.target.value)} placeholder="Descreva os danos materiais (casa, recheio, viaturas, etc.)" rows={3} className="mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="damageValue" className="text-foreground">Valor Estimado do Prejuízo (€) (opcional)</Label>
                <Input id="damageValue" type="number" min="0" value={formData.damageValue} onChange={(e) => handleInputChange('damageValue', e.target.value)} placeholder="Ex: 5000" className="mt-2" />
            </div>
            <div>
                <Label htmlFor="damageDate" className="text-foreground">Data da Ocorrência (opcional)</Label>
                <Input id="damageDate" type="date" value={formData.damageDate} onChange={(e) => handleInputChange('damageDate', e.target.value)} className="mt-2" />
            </div>
        </div>
        <div>
            <Label htmlFor="affectedArea" className="text-foreground">Área Total Afetada (m²) (opcional)</Label>
            <Input id="affectedArea" type="text" value={formData.affectedArea} onChange={(e) => handleInputChange('affectedArea', e.target.value)} placeholder="Ex: 120m² (habitação), 5000m² (terreno)" className="mt-2" />
        </div>
        <div>
          <Label htmlFor="photoLink" className="text-foreground">Link para Fotos (Google Drive - opcional)</Label>
          <Input id="photoLink" type="url" value={formData.photoLink} onChange={(e) => handleInputChange('photoLink', e.target.value)} placeholder="https://drive.google.com/..." className="mt-2" />
          <p className="text-sm text-muted-foreground mt-1">Partilhe fotos que ajudem a compreender a situação</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-4">Tipo de Ajuda Necessária</h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">Selecione as áreas onde precisa de ajuda. Pode escolher múltiplas opções.</p>
          </div>
        </div>
        {['shortTerm', 'mediumTerm', 'longTerm'].map(phaseKey => (
          <Collapsible key={phaseKey} open={openSections[phaseKey]} onOpenChange={() => toggleSection(phaseKey)}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between p-6 h-auto text-left" type="button">
                <div>
                  <h3 className={`text-lg font-semibold ${phaseKey === 'shortTerm' ? 'text-orange-600' : phaseKey === 'mediumTerm' ? 'text-blue-600' : 'text-green-600'}`}>
                    {phaseKey === 'shortTerm' ? 'Curto Prazo - Emergência' : phaseKey === 'mediumTerm' ? 'Médio Prazo - Reconstrução' : 'Longo Prazo - Revitalização'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{phaseKey === 'shortTerm' ? 'Necessidades imediatas' : phaseKey === 'mediumTerm' ? 'Materiais, apoio' : 'Ações futuras'}</p>
                </div>
                {openSections[phaseKey] ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phaseOptions[phaseKey].map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox id={`${phaseKey}-${option.id}`} checked={formData.phases[phaseKey].includes(option.id)} onCheckedChange={(checked) => handlePhaseChange(phaseKey, option.id, checked)} />
                    <Label htmlFor={`${phaseKey}-${option.id}`} className="text-sm">{option.label}</Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
      <div>
        <Label htmlFor="description" className="text-foreground">Descrição Detalhada Adicional</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Descreva a sua situação e outras necessidades específicas..." rows={4} className="mt-2" />
      </div>
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-start space-x-3">
          <Checkbox id="consent" checked={formData.consent} onCheckedChange={(checked) => handleInputChange('consent', checked)} required />
          <Label htmlFor="consent" className="text-sm text-foreground leading-relaxed">Aceito que os meus dados sejam processados de acordo com o RGPD para fins de coordenação de ajuda humanitária. *</Label>
        </div>
        <div className="flex items-start space-x-3">
          <Checkbox id="phoneConsent" checked={formData.phoneConsent} onCheckedChange={(checked) => handleInputChange('phoneConsent', checked)} />
          <Label htmlFor="phoneConsent" className="text-sm text-foreground leading-relaxed">Autorizo contacto telefónico para coordenação da ajuda.</Label>
        </div>
      </div>
      <div className="flex justify-center pt-6">
        <Button type="submit" size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-12 py-4 text-lg font-semibold">
          <AlertTriangle className="w-5 h-5 mr-2" /> Enviar Pedido de Ajuda
        </Button>
      </div>
    </form>
  );
};

export default HelpRequestForm;
