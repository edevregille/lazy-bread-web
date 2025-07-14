'use client'

import { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const EmailSignup = () => {
  const [email, setEmail] = useState<string>('');
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
  // const [ captchaToken, setCaptchaToken]= useState<string | null>(null);
  // const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleCaptchaChange = async (value: string | null) => {
    console.log('captcha value', value)
    // setCaptchaToken(value)
    try {
      // Example API request to submit email (replace with your backend logic)
      const response = await fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify({ email, captchaToken: value }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const responseJson = await response.json();
      console.log(responseJson)
      if (responseJson.error) {
        setError(responseJson.message);
      }
      else {
        setShowCaptcha(false)
        alert('Thank you for subscribing!');
        setEmail('');
      }
      
    } catch (error) {
      console.log(error)
      // setError(JSON.stringify(error));
    } 
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
          className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <button
          onClick={handleSubmit}
          className="background-gradient_indigo-purple text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none"
        >
          Submit
        </button>
        
      </div>
      <div>
      {showCaptcha && <><br/><br/><ReCAPTCHA
          sitekey="6Lfp-9AqAAAAALeF0QMRqyhsUgDvbnfjTDlzzJ5x"// Replace with your reCAPTCHA site key
          onChange={handleCaptchaChange}
        /></>}
      </div>
      <div>
        { error && <div className="text-left text-red-600 font-semibold mt-2">
          {error}
        </div>}
      </div>
    </>
  );
};

export default EmailSignup;