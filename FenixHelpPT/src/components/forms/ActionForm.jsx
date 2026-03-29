import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Loader2 } from 'lucide-react';

const activityTypes = [
  'Limpeza de Terrenos',
  'Reconstrução de Estruturas',
  'Distribuição de Bens',
  'Apoio a Animais',
  'Reflorestação',
  'Apoio Psicológico Comunitário',
  'Outro'
];

const ActionForm = ({ onSubmit, isLoading, initialData = {} }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    activityType: initialData.activityType || '',
    activityDate: initialData.activityDate || '',
    location: initialData.location || '',
    country: initialData.country || 'Portugal',
    postalCode: initialData.postalCode || '',
    responsiblePerson: initialData.responsiblePerson || '',
    responsibleEmail: initialData.responsibleEmail || '',
    responsiblePhone: initialData.responsiblePhone || '',
    description: initialData.description || '',
    notes: initialData.notes || ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-4">Detalhes da Atividade</h2>
        <div>
          <Label htmlFor="title">Título da Atividade *</Label>
          <Input id="title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Ex: Mutirão de Limpeza da Mata da Margaraça" className="mt-2" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="activityType">Tipo de Atividade *</Label>
            <Select value={formData.activityType} onValueChange={(value) => handleInputChange('activityType', value)} required>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>{activityTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="activityDate">Data da Atividade *</Label>
            <Input id="activityDate" type="date" value={formData.activityDate} onChange={(e) => handleInputChange('activityDate', e.target.value)} className="mt-2" required />
          </div>
        </div>
        <div>
          <Label htmlFor="location">Localização (Freguesia, Concelho) *</Label>
          <Input id="location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="Ex: Poiares, Freixo de Espada à Cinta" className="mt-2" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="country">País</Label>
            <Input id="country" value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="postalCode">Código Postal</Label>
            <Input id="postalCode" value={formData.postalCode} onChange={(e) => handleInputChange('postalCode', e.target.value)} placeholder="Ex: 6400-000" className="mt-2" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-4">Informações do Responsável</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="responsiblePerson">Nome do Responsável *</Label>
            <Input id="responsiblePerson" value={formData.responsiblePerson} onChange={(e) => handleInputChange('responsiblePerson', e.target.value)} placeholder="O seu nome completo" className="mt-2" required />
          </div>
          <div>
            <Label htmlFor="responsiblePhone">Telemóvel / WhatsApp *</Label>
            <Input id="responsiblePhone" type="tel" value={formData.responsiblePhone} onChange={(e) => handleInputChange('responsiblePhone', e.target.value)} placeholder="+351 900 000 000" className="mt-2" required />
          </div>
        </div>
        <div>
          <Label htmlFor="responsibleEmail">Email de Contacto *</Label>
          <Input id="responsibleEmail" type="email" value={formData.responsibleEmail} onChange={(e) => handleInputChange('responsibleEmail', e.target.value)} placeholder="seuemail@exemplo.com" className="mt-2" required />
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b pb-4">Descrição e Notas</h2>
        <div>
          <Label htmlFor="description">Descrição Completa da Atividade</Label>
          <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Descreva o que será feito, ponto de encontro, materiais necessários, etc." rows={5} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="notes">Notas e Outras Informações</Label>
          <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Alguma informação adicional importante? (Ex: Levar almoço, ferramentas específicas, etc.)" rows={3} className="mt-2" />
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-lg font-semibold" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ClipboardList className="w-5 h-5 mr-2" />}
          {isLoading ? 'A Submeter...' : 'Submeter Atividade'}
        </Button>
      </div>
    </form>
  );
};

export default ActionForm;
