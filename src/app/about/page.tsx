
import About from '@/components/About';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function PageContact() {
  return (
    <div>
      <About />
      <section className="py-16 px-8 background-gradient-warm">
        <div className="max-w-6xl mx-auto">
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}
