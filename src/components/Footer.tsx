import React from 'react';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-0 text-white py-4">
      <div className="container mx-auto flex justify-center items-center space-x-6">
        {/* Instagram Logo */}
        <a href="https://www.instagram.com/lazybreadpdx/" target="_blank" rel="noopener noreferrer">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg"
            alt="Instagram"
            width={32}
            height={32}
          />
        </a>

        {/* Email Logo */}
        <a href="mailto:lazybreadpdx@gmail.com" className="text-white">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Email_Logo_PNG.png"
            alt="Email"
            width={32}
            height={32}
          />
        </a>
      </div>
    </footer>
  );
};

export default Footer;