"use client";

import { useId, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Modal } from "./ui/Modal";

const EmailSignup = () => {
  const [email, setEmail] = useState<string>("");
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [responseMessage, setResponseMessage] = useState<string>("");
  const [responseType, setResponseType] = useState<"success" | "error" | "">("");
  const [error, setError] = useState<string>("");
  const emailFieldId = useId();
  const emailErrorId = useId();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleCaptchaChange = async (value: string | null) => {
    setIsSubmitting(true);
    setResponseMessage("");
    setResponseType("");

    try {
      const response = await fetch("/api/stripe/signup", {
        method: "POST",
        body: JSON.stringify({ email, captchaToken: value }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const responseJson = await response.json();

      if (responseJson.error) {
        setResponseType("error");
        setResponseMessage(responseJson.message || "Failed to subscribe. Please try again.");
      } else {
        setResponseType("success");
        setResponseMessage("Thank you for subscribing! You have been successfully added to our newsletter.");
        setEmail("");
      }
    } catch {
      setResponseType("error");
      setResponseMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCaptchaModal = () => {
    setShowCaptcha(false);
    setResponseMessage("");
    setResponseType("");
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    if (!isValidEmail) {
      setError("Invalid email format");
    } else {
      setShowCaptcha(true);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-start gap-2 w-full">
        <div className="flex-1 w-full">
          <label htmlFor={emailFieldId} className="sr-only">
            Email address for newsletter
          </label>
          <input
            type="email"
            id={emailFieldId}
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            autoComplete="email"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? emailErrorId : undefined}
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">
          Submit
        </button>
      </form>
      {error && (
        <div id={emailErrorId} className="text-left text-red-600 font-semibold mt-2" role="alert">
          {error}
        </div>
      )}

      <Modal
        isOpen={showCaptcha}
        onClose={closeCaptchaModal}
        title={
          responseMessage ? (responseType === "success" ? "Success!" : "Error") : "Verify you're human"
        }
      >
        <div className="text-center">
          {!responseMessage ? (
            <>
              <p className="text-gray-600 mb-4 font-body">
                Please complete the verification to subscribe to our newsletter.
              </p>
              <div className="flex justify-center">
                {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
                  <ReCAPTCHA
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                    onChange={handleCaptchaChange}
                  />
                ) : (
                  <div className="text-red-500 text-sm" role="alert">
                    reCAPTCHA is not configured. Please check your environment variables.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-4">
              <div
                className={`mb-4 p-4 rounded-lg ${
                  responseType === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
                role={responseType === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                <div className="flex items-center justify-center mb-2">
                  {responseType === "success" ? (
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <p
                  className={`font-body text-lg ${
                    responseType === "success" ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {responseMessage}
                </p>
              </div>

              {isSubmitting && (
                <div className="flex items-center justify-center mb-4" role="status" aria-live="polite">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bakery-primary" aria-hidden="true" />
                  <span className="ml-2 text-gray-600 font-body">Processing...</span>
                </div>
              )}

              <button type="button" onClick={closeCaptchaModal} className="btn-bakery-secondary font-body font-bold text-lg px-6 py-2">
                {responseType === "success" ? "Close" : "Try Again"}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default EmailSignup;
