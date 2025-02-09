'use client';

import Cart from '@/components/Cart';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.STRIPE_PUBLIC_KEY || 'pk_live_51Qlh7eG05wamoDo7dClCWEZHfALQOvbdw2uKAbu1x8kbU6HQbXmIDzOJhZaYQu6FkcgreEALUrU1BTu0zcnchtXm00ToVAKW3j');

export default function PageCart() {
  return (
    <Elements stripe={stripePromise}>
      <Cart />
    </Elements>
  );
}
