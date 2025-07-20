"use client";

import { useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onAuthSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin', onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  if (!isOpen) return null;

  const handleSwitchToSignUp = () => setMode('signup');
  const handleSwitchToSignIn = () => setMode('signin');

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
    onClose();
  };

  return (
    <>
      {mode === 'signin' && (
        <SignIn onSwitchToSignUp={handleSwitchToSignUp} onClose={handleAuthSuccess} />
      )}
      {mode === 'signup' && (
        <SignUp onSwitchToSignIn={handleSwitchToSignIn} onClose={handleAuthSuccess} />
      )}
    </>
  );
} 