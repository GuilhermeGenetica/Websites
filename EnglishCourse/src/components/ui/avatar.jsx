// Adress: src/components/ui/
// File: avatar.jsx
// Extension: .jsx

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

/**
 * Prevenção de Alucinação: Garante que o componente base Radix está importado
 * e que a função de utilidade 'cn' está disponível.
 * Prevenção de Erros: Implementa 'React.forwardRef' para correta propagação
 * de refs e faz verificações (com logs) para garantir que os componentes
 * base do Radix estão definidos.
 */

const Avatar = React.forwardRef(({ className, ...props }, ref) => {
  if (!AvatarPrimitive.Root) {
    console.error("AvatarPrimitive.Root is undefined. Check Radix UI import.");
    return null; // Falha segura
  }
  return (
    <AvatarPrimitive.Root
      ref={ref}
      // Classe padrão: 'h-10 w-10' para um avatar de tamanho comum
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName || "Avatar";

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => {
  if (!AvatarPrimitive.Image) {
    console.error("AvatarPrimitive.Image is undefined. Check Radix UI import.");
    return null; // Falha segura
  }
  return (
    <AvatarPrimitive.Image
      ref={ref}
      // Classe para garantir que a imagem preencha o container e tenha boa proporção
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName || "AvatarImage";

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => {
  if (!AvatarPrimitive.Fallback) {
    console.error("AvatarPrimitive.Fallback is undefined. Check Radix UI import.");
    return null; // Falha segura
  }
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      // Classe para preenchimento e centralização do conteúdo de fallback (geralmente iniciais)
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName || "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };