import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2, Copy, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import RuleCondition from '@/components/RuleCondition';
import { getDefaultRules } from '@/utils/defaultRules';

const RulesEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rulesByCategory, setRulesByCategory] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAccordionItems, setActiveAccordionItems] = useState([]);

  useEffect(() => {
    try {
      const savedRules = localStorage.getItem('customRules');
      if (savedRules) {
        setRulesByCategory(JSON.parse(savedRules));
      } else {
        setRulesByCategory(getDefaultRules());
      }
    } catch (error) {
      console.error("Failed to parse rules from localStorage:", error);
      setRulesByCategory(getDefaultRules());
    }
  }, []);

  const handleAddRule = (category) => {
    const newRule = {
      id: Date.now(),
      conditions: [
        { field: 'age', operator: 'greaterThan', value: [0] }
      ],
      logic: 'AND',
      response: ''
    };

    setRulesByCategory(prev => {
      const updatedCategory = [...(prev[category] || []), newRule];
      return { ...prev, [category]: updatedCategory };
    });
  };

  const handleDuplicateRule = (category, ruleToDuplicate) => {
    const newRule = {
      ...JSON.parse(JSON.stringify(ruleToDuplicate)), 
      id: Date.now()
    };
    setRulesByCategory(prev => {
      const categoryRules = prev[category];
      const index = categoryRules.findIndex(r => r.id === ruleToDuplicate.id);
      const newCategoryRules = [
        ...categoryRules.slice(0, index + 1),
        newRule,
        ...categoryRules.slice(index + 1),
      ];
      return { ...prev, [category]: newCategoryRules };
    });
  };

  const handleDeleteRule = (category, ruleId) => {
    setRulesByCategory(prev => ({
      ...prev,
      [category]: prev[category].filter(rule => rule.id !== ruleId)
    }));
  };

  const handleRuleChange = (category, ruleId, field, value) => {
    setRulesByCategory(prev => ({
      ...prev,
      [category]: prev[category].map(rule =>
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('customRules', JSON.stringify(rulesByCategory));
      toast({
        title: "Success!",
        description: "Rules have been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save rules:", error);
      toast({
        title: "Error",
        description: "Failed to save rules. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setRulesByCategory(getDefaultRules());
    toast({
      title: "Reset Complete",
      description: "Rules have been reset to default values.",
    });
  };

  const filteredCategories = useMemo(() => 
    Object.keys(rulesByCategory).filter(category =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [rulesByCategory, searchTerm]);
  
  useEffect(() => {
    if (searchTerm) {
      setActiveAccordionItems(filteredCategories);
    } else {
      setActiveAccordionItems([]);
    }
  }, [searchTerm, filteredCategories]);

  return (
    <>
      <Helmet>
        <title>Rules Engine Editor - Nutrigenomic Platform</title>
        <meta name="description" content="Configure and customize recommendation rules for the nutrigenomic analysis platform" />
      </Helmet>

      <ThemeToggle />

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-2xl p-8 border-2 gold-border"
          >
            <div className="flex justify-between items-center mb-6 border-b-2 gold-border pb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">Rules Engine Editor</h1>
                <p className="text-muted-foreground">Visually build and configure automated recommendation responses.</p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-2 gold-border"
                >
                  Reset to Default
                </Button>
                <Button
                  onClick={handleSave}
                  className="gold-bg text-primary hover:bg-yellow-500"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Rules
                </Button>
              </div>
            </div>

            <div className="mb-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Accordion 
              type="multiple" 
              className="w-full space-y-4"
              value={activeAccordionItems}
              onValueChange={setActiveAccordionItems}
            >
              {filteredCategories.length > 0 ? filteredCategories.map(category => (
                <AccordionItem value={category} key={category} className="bg-muted/30 rounded-lg border-border border">
                  <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline">
                    {category}
                  </AccordionTrigger>
                  <AccordionContent className="p-6 pt-0">
                    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
                      {rulesByCategory[category].map((rule, ruleIndex) => (
                        <motion.div
                          key={rule.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="bg-background rounded-lg p-6 border border-border"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-md font-semibold text-muted-foreground">Rule #{ruleIndex + 1}</h3>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDuplicateRule(category, rule)}
                                className="h-8 w-8"
                              >
                                <Copy className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRule(category, rule.id)}
                                className="text-destructive hover:text-destructive h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label>Conditions</Label>
                              <div className="mt-2 p-4 border rounded-md space-y-4 bg-muted/20">
                                {rule.conditions.map((cond, condIndex) => (
                                  <RuleCondition
                                    key={condIndex}
                                    condition={cond}
                                    onChange={(newCond) => {
                                      const newConditions = [...rule.conditions];
                                      newConditions[condIndex] = newCond;
                                      handleRuleChange(category, rule.id, 'conditions', newConditions);
                                    }}
                                    onDelete={() => {
                                      const newConditions = rule.conditions.filter((_, i) => i !== condIndex);
                                      handleRuleChange(category, rule.id, 'conditions', newConditions);
                                    }}
                                  />
                                ))}
                                 <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newConditions = [...rule.conditions, { field: 'age', operator: 'greaterThan', value: [0] }];
                                    handleRuleChange(category, rule.id, 'conditions', newConditions);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" /> AND
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor={`response-${rule.id}`}>Response</Label>
                              <Textarea
                                id={`response-${rule.id}`}
                                value={rule.response}
                                onChange={(e) => handleRuleChange(category, rule.id, 'response', e.target.value)}
                                placeholder="Enter the recommendation text that will appear in the report..."
                                className="mt-2"
                                rows={4}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      <div className="mt-6">
                        <Button
                          onClick={() => handleAddRule(category)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Rule to {category}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No categories match your search. Try a different term.</p>
                </div>
              )}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default RulesEditor;