import React from 'react';
import Image from 'next/image';
{/* <footer className="fixed bottom-0 left-0 right-0 bg-gray-200 py-4 text-center">
<p>Copyright {new Date().getFullYear()} Your Name</p>
</footer> */}
const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-md py-4">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-center items-center space-x-6 h-full">
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
      </div>
    </footer>
  );
};

export default Footer;