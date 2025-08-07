"use client";

import { useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot-password';
  onAuthSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin', onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>(initialMode);

  if (!isOpen) return null;

  const handleSwitchToSignUp = () => setMode('signup');
  const handleSwitchToSignIn = () => setMode('signin');
  const handleSwitchToForgotPassword = () => setMode('forgot-password');

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
    onClose();
  };

  return (
    <>
      {mode === 'signin' && (
        <SignIn 
          onSwitchToSignUp={handleSwitchToSignUp} 
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
          onClose={handleAuthSuccess} 
        />
      )}
      {mode === 'signup' && (
        <SignUp onSwitchToSignIn={handleSwitchToSignIn} onClose={handleAuthSuccess} />
      )}
      {mode === 'forgot-password' && (
        <ForgotPassword onSwitchToSignIn={handleSwitchToSignIn} onClose={onClose} />
      )}
    </>
  );
} 