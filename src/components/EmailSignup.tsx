'use client'

import { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Modal } from './ui/Modal';

const EmailSignup = () => {
  const [email, setEmail] = useState<string>('');
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [responseType, setResponseType] = useState<'success' | 'error' | ''>('');
  const [error, setError] = useState<string>('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleCaptchaChange = async (value: string | null) => {
    console.log('captcha value', value)
    setIsSubmitting(true);
    setResponseMessage('');
    setResponseType('');
    
    try {
      const response = await fetch('/api/stripe/signup', {
        method: 'POST',
        body: JSON.stringify({ email, captchaToken: value }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const responseJson = await response.json();
      console.log(responseJson)
      
      if (responseJson.error) {
        setResponseType('error');
        setResponseMessage(responseJson.message || 'Failed to subscribe. Please try again.');
      } else {
        setResponseType('success');
        setResponseMessage('Thank you for subscribing! You have been successfully added to our newsletter.');
        setEmail('');
      }
      
    } catch (error) {
      console.log(error)
      setResponseType('error');
      setResponseMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCaptchaModal = () => {
    setShowCaptcha(false);
    setResponseMessage('');
    setResponseType('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
    if(!isValidEmail){
      setError('Invalid email format');
    }
    else{
      setShowCaptcha(true);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2 w-full">
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
          className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />
        <button
          onClick={handleSubmit}
          className="bg-bakery-primary text-white px-6 py-3 rounded-md hover:bg-bakery-primary-dark transition-colors font-medium"
        >
          Submit
        </button>
        
      </div>
      <div>
        { error && <div className="text-left text-red-600 font-semibold mt-2">
          {error}
        </div>}
      </div>

      {/* Captcha Modal */}
      <Modal 
        isOpen={showCaptcha} 
        onClose={closeCaptchaModal}
        title={responseMessage ? (responseType === 'success' ? 'Success!' : 'Error') : "Verify you're human"}
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
                  <div className="text-red-500 text-sm">
                    reCAPTCHA is not configured. Please check your environment variables.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-4">
              <div className={`mb-4 p-4 rounded-lg ${
                responseType === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-center mb-2">
                  {responseType === 'success' ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <p className={`font-body text-lg ${
                  responseType === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {responseMessage}
                </p>
              </div>
              
              {isSubmitting && (
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bakery-primary"></div>
                  <span className="ml-2 text-gray-600 font-body">Processing...</span>
                </div>
              )}
              
              <button
                onClick={closeCaptchaModal}
                className="btn-bakery-secondary font-body font-bold text-lg px-6 py-2"
              >
                {responseType === 'success' ? 'Close' : 'Try Again'}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default EmailSignup;