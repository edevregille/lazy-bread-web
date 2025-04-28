
// import landingImg from '@/content/landing.png'
import EmailSignup from './EmailSignup';
import { Tile } from './ui/Tile';
import BusinessOverview from './Home';



export default function Landing() {
  return (
    <div className='mb-16'>
        <BusinessOverview />

        {/* Email */}
        {/* <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="md:flex">
            <Tile title="Follow us!">
              <h3>Lazy Bread is just launching: subscribe now to receive updates!</h3>
              <br/>
              <br/>
              <EmailSignup />
            </Tile>
          </div>
        </div> */}

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
