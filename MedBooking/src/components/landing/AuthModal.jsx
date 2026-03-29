import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AuthTabs from '@/components/landing/AuthTabs';

/**
 * A modal component that wraps the authentication tabs.
 * It can be opened or closed via props.
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls if the modal is open.
 * @param {Function} props.onClose - Function to call when the modal should be closed.
 */
const AuthModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-8 bg-card">
        <DialogHeader className="text-center mb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Welcome Back!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Access your account or create a new one to get started.
          </DialogDescription>
        </DialogHeader>
        {/* The AuthTabs component is rendered inside the modal */}
        <AuthTabs />
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
