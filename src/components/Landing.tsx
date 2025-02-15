// import Image from 'next/image';
// import landingImg from '@/content/landing.png'
import EmailSignup from './EmailSignup';
import { Tile } from './ui/Tile';

export default function Landing() {
  return (
    
      <div className="flex flex-col h-full w-full items-center mx-auto text-center mt-8 md:mt-0">
        {/* Tagline */}
        <div className="h-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Lazy Bread PDX <br/><br/>
          
            <span className="text-gradient_indigo-purple font-extrabold">
            Sourdough Focaccia Bread
            </span>
          </h1>
          <h2> (with a side of soup, coming soon)
          </h2>
        </div>
        <br/><br/><br/>

        {/* Image */}
        {/* <div className="mx-auto rounded-full overflow-hidden mb-8 ">
          <Image
            src={landingImg} // Replace with your image path
            alt="Landing Image"
            width={500} // Adjust based on the image dimensions
            height={500}
            className="object-cover rounded-lg light-purple-filter"
          />
        </div> */}

        {/* Email */}
        <div className="mt-30">
          <Tile title="">
            <h3>Lazy Bread is just launching: subscribe now to receive updates!</h3>
            <br/>
            <br/>
            <EmailSignup />
          </Tile>
        </div>

        {/* CTA Button */}
        {/* <a
          href="#explore"
          className="px-8 py-3 bg-black text-white rounded-lg hover:bg-black transition-all duration-300"
        >
          Shop
        </a> */}
      </div>
  );
}
