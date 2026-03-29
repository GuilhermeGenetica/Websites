// Adress: src/components/ui/
// File: accordion.jsx
// Extension: .jsx

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Prevenção de alucinação: Garante que todos os subcomponentes sejam exportados
 * corretamente e que a dependência 'cn' de '@/lib/utils' esteja disponível
 * para classes dinâmicas, o que é um padrão do Shadcn/ui.
 * * Prevenção de erro: Uso de 'React.forwardRef' para garantir compatibilidade
 * com sistemas de ref e prevenir problemas de renderização em ambientes
 * onde a ref é importante.
 */

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef(({ className, ...props }, ref) => {
  if (!AccordionPrimitive.Item) {
    console.error("AccordionPrimitive.Item is undefined. Check Radix UI import.");
    return null; // Prevenção de erro: Não renderiza se o componente base falhar
  }
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn("border-b", className)}
      {...props}
    />
  );
});
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  if (!AccordionPrimitive.Trigger) {
    console.error("AccordionPrimitive.Trigger is undefined. Check Radix UI import.");
    return null; // Prevenção de erro: Não renderiza se o componente base falhar
  }
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName || "AccordionTrigger";

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => {
  if (!AccordionPrimitive.Content) {
    console.error("AccordionPrimitive.Content is undefined. Check Radix UI import.");
    return null; // Prevenção de erro: Não renderiza se o componente base falhar
  }
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName || "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };