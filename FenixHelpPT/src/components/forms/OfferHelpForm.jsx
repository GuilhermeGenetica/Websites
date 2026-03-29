import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const phaseOptions = {
  shortTerm: [
    { id: 'alojamento', label: 'Disponibilizar Alojamento' },
    { id: 'alimentacao', label: 'Doar Alimentos' },
    { id: 'roupas', label: 'Doar Roupas' },
    { id: 'higiene', label: 'Doar Produtos de Higiene' },
    { id: 'apoio-psicologico', label: 'Oferecer Apoio Psicológico' },
    { id: 'abrigo-animal', label: 'Oferecer Abrigo/Alimentação Animal' },
    { id: 'voluntariado-terreno', label: 'Voluntariado no Terreno' },
    { id: 'apoio-financeiro', label: 'Apoio Financeiro' }
  ],
  mediumTerm: [
    { id: 'material-construcao', label: 'Doar Material de Construção' },
    { id: 'mobiliario', label: 'Doar Mobiliário' },
    { id: 'eletrodomesticos', label: 'Doar Eletrodomésticos' },
    { id: 'apoio-juridico', label: 'Oferecer Apoio Jurídico' },
    { id: 'limpeza-terrenos', label: 'Ajudar na Limpeza de Terrenos' },
    { id: 'voluntariado-competencias', label: 'Voluntariado por Competências' }
  ],
  longTerm: [
    { id: 'reflorestacao', label: 'Apoiar Reflorestação/Paisagismo' },
    { id: 'mentoria-negocios', label: 'Oferecer Mentoria de Negócios' },
    { id: 'formacao-profissional', label: 'Oferecer Formação Profissional' },
    { id: 'emprego-profissional', label: 'Oferecer Emprego e Trabalho Remunerado' },
    { id: 'investimento-local', label: 'Empreendimentos e Investimento Local' },
    { id: 'consultoria', label: 'Oferecer Consultoria e Assessoria' }   
  ]
};

const countries = ['Portugal', 'Espanha', 'França', 'Alemanha', 'Itália', 'Reino Unido', 'Outro'];

const OfferHelpForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', country: 'Portugal', postalCode: '', description: '',
    phases: { shortTerm: [], mediumTerm: [], longTerm: [] }, volunteerSkills: '', consent: false
  });

  const [openSections, setOpenSections] = useState({ shortTerm: false, mediumTerm: false, longTerm: false });

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handlePhaseChange = (phase, optionId, checked) => {
    setFormData(prev => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phase]: checked ? [...prev.phases[phase], optionId] : prev.phases[phase].filter(id => id !== optionId)
      }
    }));
  };
  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-4">Informações do Doador/Voluntário</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="text-foreground">Nome ou Empresa *</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="O seu nome ou da empresa" className="mt-2" required />
          </div>
          <div>
            <Label htmlFor="phone" className="text-foreground">Contacto Telefónico *</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+351 900 000 000" className="mt-2" required />
          </div>
        </div>
        <div>
          <Label htmlFor="email" className="text-foreground">Email *</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="seuemail@exemplo.com" className="mt-2" required />
        </div>
        <div>
          <Label htmlFor="address" className="text-foreground">Endereço (para recolha ou base de operações) *</Label>
          <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="Rua, número, localidade" className="mt-2" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="country" className="text-foreground">País *</Label>
            <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o país" /></SelectTrigger>
              <SelectContent>{countries.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="postalCode" className="text-foreground">Código Postal *</Label>
            <Input id="postalCode" value={formData.postalCode} onChange={(e) => handleInputChange('postalCode', e.target.value)} placeholder="Ex: 3200-000" className="mt-2" required />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-4">Como Posso Ajudar</h2>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-200">Selecione as áreas onde pode oferecer ajuda. Pode escolher múltiplas opções.</p>
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
                  <p className="text-sm text-muted-foreground">{phaseKey === 'shortTerm' ? 'Ajuda imediata' : phaseKey === 'mediumTerm' ? 'Materiais, voluntariado' : 'Ações futuras'}</p>
                </div>
                {openSections[phaseKey] ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phaseOptions[phaseKey].map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox id={`offer-${phaseKey}-${option.id}`} checked={formData.phases[phaseKey].includes(option.id)} onCheckedChange={(checked) => handlePhaseChange(phaseKey, option.id, checked)} />
                    <Label htmlFor={`offer-${phaseKey}-${option.id}`} className="text-sm">{option.label}</Label>
                  </div>
                ))}
              </div>
              {phaseKey === 'mediumTerm' && formData.phases.mediumTerm.includes('voluntariado-competencias') && (
                <div className="mt-4">
                  <Label htmlFor="volunteerSkills" className="text-foreground">Especifique as suas competências</Label>
                  <Input id="volunteerSkills" value={formData.volunteerSkills} onChange={(e) => handleInputChange('volunteerSkills', e.target.value)} placeholder="Ex: Engenharia, Psicologia, Carpintaria..." className="mt-2" />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
      <div>
        <Label htmlFor="description" className="text-foreground">Detalhes da Oferta</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Descreva quantidades, disponibilidade, condições da sua oferta, etc." rows={4} className="mt-2" />
      </div>
      <div className="border-t pt-6">
        <div className="flex items-start space-x-3">
          <Checkbox id="consent" checked={formData.consent} onCheckedChange={(checked) => handleInputChange('consent', checked)} required />
          <Label htmlFor="consent" className="text-sm text-foreground leading-relaxed">Aceito que os meus dados sejam processados de acordo com o RGPD para fins de coordenação de ajuda humanitária. *</Label>
        </div>
      </div>
      <div className="flex justify-center pt-6">
        <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-lg font-semibold">
          <Heart className="w-5 h-5 mr-2" /> Quero Ajudar!
        </Button>
      </div>
    </form>
  );
};

export default OfferHelpForm;