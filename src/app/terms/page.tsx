import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BUSINESS_SETTINGS,
  PICKUP_ADDRESS_DISPLAY,
} from '@/config/app-config';

/*
 * ---------------------------------------------------------------------------
 * FILL THESE IN BEFORE DEPLOYING
 * ---------------------------------------------------------------------------
 * Everything else on this page is ready to publish. These four are details
 * only you can supply, and they are deliberately loud so a missed one is
 * obvious on the rendered page rather than buried in the prose.
 */

/** Trading name, e.g. 'Lazy Bread LLC' or 'Jane Doe, doing business as Lazy Bread'. */
const LEGAL_NAME = 'Lazy Bread LLC';

/**
 * What the kitchen genuinely handles, for the allergen section. Be honest and
 * specific — this is the sentence a customer with an allergy relies on.
 * e.g. 'wheat, dairy, eggs, tree nuts, peanuts, soy, sesame and seeds'
 */
const KITCHEN_ALLERGENS = '[WHAT YOUR KITCHEN HANDLES]';

/** Bump this whenever the terms change materially. */
const LAST_UPDATED = 'October 9, 2026';

/* ------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: 'Terms of Sale — Lazy Bread PDX',
  description:
    'Terms of sale and website use for Lazy Bread, a home bakery in Portland, Oregon.',
};

const Section: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({
  n,
  title,
  children,
}) => (
  <section className="mt-10">
    <h2 className="text-xl font-semibold text-earth-brown mb-3 font-body">
      {n}. {title}
    </h2>
    <div className="space-y-3 text-gray-700 leading-relaxed">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 sm:py-20 bg-warm-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-semibold text-earth-brown mb-2 font-body">
            Terms of Sale and Website Use
          </h1>
          <p className="text-sm text-gray-500 mb-8">Last updated {LAST_UPDATED}</p>

          <p className="text-gray-700 leading-relaxed">
            Lazy Bread is a home bakery in the Piedmont neighborhood of North
            Portland, Oregon. These terms cover this website
            and any order placed through it. Placing an order means you accept
            them.
          </p>

          <Section n={1} title="Who we are">
            <p>
              Lazy Bread, {LEGAL_NAME}, Portland, Oregon. Email{' '}
              <a
                href={`mailto:${BUSINESS_SETTINGS.email}`}
                className="text-bakery-primary-dark hover:text-bakery-primary-deep underline"
              >
                {BUSINESS_SETTINGS.email}
              </a>. Pickup is at{' '}
              {PICKUP_ADDRESS_DISPLAY}.
            </p>
          </Section>

          <Section n={2} title="Ordering">
            <p>
              Orders are placed on this site, up to
              three weeks ahead and at least 24 hours before the day you choose.
              There is a limit of {BUSINESS_SETTINGS.maxOrderQuantity} items per
              order; for anything larger, email or text and we will sort it out
              directly.
            </p>
            <p>
              Your order is an offer to buy, not a completed sale. It is accepted
              when we confirm it. We may decline or cancel an order: if we do,
              you are not charged.
            </p>
          </Section>

          <Section n={3} title="Prices">
            <p>
              Prices are shown per item on the order page. Pickup and local
              delivery are free, and there are no other fees. The price shown
              when you place an order is the price for that order; prices may
              change for future orders.
            </p>
          </Section>

          <Section
            n={4}
            title="Payment: we save your card and charge it after you have your bread"
          >
            <p>This is different from most bakeries, so it is worth reading.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                At checkout you enter your card details, which are collected and
                stored by our payment processor, <strong>Stripe</strong>. We
                never see or hold your full card number.
              </li>
              <li>
                <strong>We do not charge you at checkout.</strong> Your card is
                saved as a payment method on file for your order.
              </li>
              <li>
                By placing the order,{' '}
                <strong>
                  you authorize us to charge that saved card once, for the order
                  total shown at checkout, after your order has been picked up or
                  delivered.
                </strong>
              </li>
              <li>
                This is a single charge for a single order. It is not a
                subscription, there is no recurring billing, and we will never
                charge the card for anything you did not order.
              </li>
              <li>
                We normally take payment within 24 hours of handing your order
                over.
              </li>
              <li>
                If the card is declined we will email you, and you agree to
                settle the order by another method within 7 days.
              </li>
              <li>
                Canceling an order before the cutoff in section 7 withdraws this
                authorization, and no charge is made. Your card stays on file
                with Stripe while you have an open order and afterwards for our
                records: email us and we will remove it.
              </li>
            </ul>
          </Section>

          <Section n={5} title="Pickup">
            <p>
              Pickup is at {PICKUP_ADDRESS_DISPLAY}. We do not hold a fixed pickup window; we will let you
              know when your order is ready, and you can collect it any time that
              day. 
            </p>
            <p>
              If you cannot make it, tell us before the cutoff in section 7 and
              we will cancel the order at no charge. If an order is not collected
              on the day and you have not told us, we will get in touch: but the
              bread was baked for you, so we will charge for it.
            </p>
          </Section>

          <Section n={6} title="Delivery">
            <p>
              We deliver to addresses in Portland, within Multnomah County.
              Delivery is free.
            </p>
            <p>
              We deliver on the day you chose and will let you know when your
              order is on its way. We cannot give an exact time. You do not need
              to be home: unless you tell us otherwise, we leave your order at
              your door and let you know it has arrived. Once it has been left,
              the order is yours, including if it is taken or spoiled by weather.
            </p>
            <p>
              Please make sure the address is right and that we can reach the
              door. If we cannot deliver because the address is wrong or the
              property cannot be reached, we will try to contact you, and the
              order counts as delivered and will be charged.
            </p>
          </Section>

          <Section n={7} title="Changing or canceling an order">
            <p>
              You can change or cancel an order free of charge up to 24 hours
              before your pickup or delivery day, by email or text. After that
              the dough is mixed and the ingredients are bought, so we cannot
              cancel and the order will be charged in full.
            </p>
            <p>
              Because we take payment after handoff, canceling in time simply
              means no charge is made.
            </p>
          </Section>

          <Section n={8} title="We are a very small bakery">
            <p>
              If illness, an oven failure, or weather means we cannot bake, we
              will tell you as early as we can, cancel your order and not charge
              you. That is the full remedy we can offer: we are not able to
              cover costs you incur because an order did not arrive.
            </p>
          </Section>

          <Section n={9} title="Allergens, and what our kitchen is">
            <p className="font-medium text-earth-brown">
              Please read this if you have a food allergy or intolerance.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Everything we sell contains wheat.</strong> Our bread is
                sourdough, which is <strong>not</strong> gluten-free and is{' '}
                <strong>not</strong> safe for people with celiac disease,
                regardless of what you may have read about fermentation.
              </li>
              <li>
                Our products are made in a <strong>home kitchen</strong> that is
                also an ordinary family kitchen, under Oregon&apos;s home bakery
                exemption. That kitchen is{' '}
                <strong>not licensed or inspected</strong> by the Oregon
                Department of Agriculture. 
              </li>
              <li>
                We cannot guarantee that any product is free of any allergen, and
                we do not have separate equipment or preparation areas.
              </li>
              <li>
                Ingredients for each product are listed on its label. If you have
                an allergy, contact us before ordering and we will tell you
                honestly whether we think our bread is a sensible choice for you.
              </li>
            </ul>
          </Section>

          <Section n={10} title="Our bread is handmade">
            <p>
              Loaves vary in size, color, crumb and bake. Flavors rotate and the
              list on the order page changes. Focaccia is roughly 9.5 × 13 inches
              and sandwich loaves are a standard 9 inch size; both are
              approximate.
            </p>
          </Section>

          <Section n={11} title="Keeping it">
            <p>
              Our bread has no preservatives and is best the day you get it. Keep
              it at room temperature in paper or a bread bag for two to three
              days, or slice and freeze it. Do not refrigerate it. Once an order
              has been handed over or left at your door, storing it safely is up
              to you.
            </p>
          </Section>

          <Section n={12} title="If something is wrong">
            <p>
              Food is perishable, so we cannot accept returns. Instead, tell us
              as soon as you can, within 24 hours if possible, and no later than
              48 hours after pickup or delivery at{' '}
              <a
                href={`mailto:${BUSINESS_SETTINGS.email}`}
                className="text-bakery-primary-dark hover:text-bakery-primary-deep underline"
              >
                {BUSINESS_SETTINGS.email}
              </a>
              , with a photo of the item.
            </p>
            <p>
              If an order was wrong, short, or not up to standard, we will
              replace it on the next baking day or refund it, whichever you
              prefer. What we cannot do is refund for taste: sourdough tang, an
              open crumb and a dark crust are what the bread is, not faults.
            </p>
          </Section>

          <Section n={13} title="Email and messages">
            <p>
              If you sign up for our mailing list we will send occasional updates
              about flavors and where to find us, and you can unsubscribe from
              any of them. Emails and texts about an order you have placed are
              different: we will always send those, because they are how we tell
              you your bread is ready.
            </p>
          </Section>

          <Section n={14} title="This website">
            <p>
              The text, photographs and recipes on this site are ours. You are
              welcome to use them personally; please do not republish, resell or
              scrape them. We offer the site as it is, and we do not promise it
              will always be available or free of errors.
            </p>
          </Section>

          <Section n={15} title="Services we use">
            <p>
              We use <strong>Stripe</strong> to process payments,{' '}
              <strong>Mailchimp</strong> for the mailing list,{' '}
              <strong>Google reCAPTCHA</strong> to keep spam off our forms, and
              basic website analytics. This site is protected by reCAPTCHA, and
              Google&apos;s{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-bakery-primary-dark hover:text-bakery-primary-deep underline"
              >
                Privacy Policy
              </a>{' '}
              and{' '}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-bakery-primary-dark hover:text-bakery-primary-deep underline"
              >
                Terms of Service
              </a>{' '}
              apply.
            </p>
          </Section>

          <Section n={16} title="Limits on our responsibility">
            <p>
              To the fullest extent Oregon law allows, our total responsibility
              for any order is limited to the amount you paid for it, and we are
              not responsible for indirect or consequential losses like for example
              a canceled dinner or a replacement bought elsewhere.
            </p>
            <p>
              Nothing in these terms limits any responsibility that cannot be
              limited by law, including responsibility for death or personal
              injury caused by our negligence, or for fraud.
            </p>
          </Section>

          <Section n={17} title="Oregon law">
            <p>
              These terms are governed by the laws of the State of Oregon, and
              any dispute will be handled by the state or federal courts in
              Multnomah County, Oregon. Please email us first: almost everything
              is sorted out in one message.
            </p>
          </Section>

          <Section n={18} title="Changes to these terms">
            <p>
              We may update these terms. The version that applies to your order
              is the one published here when you placed it, and the date at the
              top tells you when it last changed.
            </p>
          </Section>

          <p className="mt-10 pt-6 border-t border-gray-200 text-gray-700">
            Questions about any of this:{' '}
            <a
              href={`mailto:${BUSINESS_SETTINGS.email}`}
              className="text-bakery-primary-dark hover:text-bakery-primary-deep underline"
            >
              {BUSINESS_SETTINGS.email}
            </a>
            . Ready to order?{' '}
            <Link
              href="/order"
              className="text-bakery-primary-dark hover:text-bakery-primary-deep underline"
            >
              Place an order
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
