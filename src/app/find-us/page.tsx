
import FindUs from '../../components/FindUs';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function PageFindUs() {
  return (
    <div>
      <FindUs />
      <section className="py-16 px-8 background-gradient-warm">
        <div className="max-w-6xl mx-auto">
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}
