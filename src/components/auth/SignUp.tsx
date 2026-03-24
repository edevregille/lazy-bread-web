"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/ui/Modal";

interface SignUpProps {
  onSwitchToSignIn: () => void;
  onClose: () => void | Promise<void>;
  onSuccess?: () => void;
}

export default function SignUp({ onSwitchToSignIn, onClose, onSuccess }: SignUpProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const validateForm = () => {
    if (!displayName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      await signUp(email, password, displayName);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error("Signup error:", error);

      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === "auth/email-already-in-use") {
          setError("An account with this email already exists");
        } else if (firebaseError.code === "auth/weak-password") {
          setError("Password is too weak");
        } else if (firebaseError.code === "auth/invalid-email") {
          setError("Invalid email address");
        } else {
          setError("Failed to create account. Please try again.");
        }
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Sign Up" panelClassName="max-w-md w-full">
      <div className="relative -m-6 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label htmlFor="signup-displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="signup-displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
              placeholder="Enter your full name"
              required
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
              placeholder="Enter your email"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
              placeholder="Enter your password (min 6 characters)"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="signup-confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="signup-confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
              placeholder="Confirm your password"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary">
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {loading && (
          <div
            className="absolute inset-0 bg-white/75 flex items-center justify-center rounded-lg"
            role="status"
            aria-live="polite"
          >
            <div className="text-center px-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-bakery-primary mb-4">
                <svg
                  className="animate-spin h-8 w-8 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Creating Your Account</p>
              <p className="text-sm text-gray-600">Please wait while we set up your account and sign you in...</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button type="button" onClick={onSwitchToSignIn} className="btn-text">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
}
