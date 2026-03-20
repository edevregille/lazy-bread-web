"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Modal } from "@/components/ui/Modal";

interface SignInProps {
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
  onClose: () => void;
}

export default function SignIn({ onSwitchToSignUp, onSwitchToForgotPassword, onClose }: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);

      await signInWithEmailAndPassword(auth, email, password);

      onClose();
    } catch (error: unknown) {
      console.error("Sign in error:", error);

      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string };

        if (firebaseError.code === "auth/user-not-found") {
          setError("No account found with this email address");
        } else if (firebaseError.code === "auth/wrong-password") {
          setError("Incorrect password");
        } else if (firebaseError.code === "auth/invalid-email") {
          setError("Invalid email address");
        } else if (firebaseError.code === "auth/too-many-requests") {
          setError("Too many failed attempts. Please try again later");
        } else if (firebaseError.code === "auth/user-disabled") {
          setError("This account has been disabled");
        } else {
          setError("Failed to sign in. Please check your credentials.");
        }
      } else {
        setError("Failed to sign in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Sign In" panelClassName="max-w-md w-full">
      <div className="relative -m-6 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="signin-email"
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
            <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="signin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <div className="mt-1 text-right">
              <button type="button" onClick={onSwitchToForgotPassword} className="text-sm btn-text">
                Forgot Password?
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary">
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {loading && (
          <div
            className="absolute inset-0 bg-white/75 flex items-center justify-center rounded-lg"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-bakery-primary mb-3">
                <svg
                  className="animate-spin h-6 w-6 text-white"
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
              <p className="text-sm text-gray-600">Signing you in...</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <button type="button" onClick={onSwitchToSignUp} className="btn-text">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
}
