'use client';

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Product } from '@/types/types';
import { useCart } from '@/hooks/use-cart';
import { Button } from './ui/Button';

const Cart = () => {
  const cart = useCart()

  const stripe = useStripe();
  const elements = useElements();

  const updateQuantity = (product: Product, newQuantity: number) => {
    cart.updateQty(product, newQuantity);
  };

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error) {
      console.error(error.message);
    }
  };

  const totalAmount = cart.items.reduce(
    (acc, item) => acc + item.qty * item.product.unitCost,
    0
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Left: Cart Summary */}
      <div className="w-full sm:w-2/3 p-6">
        <h2 className="text-2xl semi-bold mb-6">Cart Summary</h2>
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Product</th>
              <th className="py-2 px-4 border-b">Quantity</th>
              <th className="py-2 px-4 border-b">Unit Price</th>
              <th className="py-2 px-4 border-b">Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <tr key={item.product.id}>
                <td className="py-2 px-4 border-b">{item.product.name}</td>
                <td className="py-2 px-4 border-b text-center">
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      updateQuantity(item.product, Math.max(0, Number(e.target.value)))
                    }
                    className="w-20 p-2 border border-gray-300 rounded"
                  />
                </td>
                <td className="py-2 px-4 border-b text-center">${item.product.unitCost.toFixed(2)}</td>
                <td className="py-2 px-4 border-b text-center">
                  ${(item.qty * item.product.unitCost).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-between items-center">
          <h3 className="text-xl font-semibold">Total Amount</h3>
          <span className="text-2xl font-bold">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Right: Checkout Form */}
      <div className="w-full sm:w-1/3 p-6 border-l">
        <h2 className="text-2xl semi-bold mb-6">Checkout</h2>
        <form onSubmit={handleCheckout}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-lg mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="Your Name"
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="email" className="block text-lg mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Your Email"
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-lg mb-2">Payment</label>
            {/* <PaymentElement /> */}
          </div>

          <Button
            label={`Pay ${totalAmount.toFixed(2)}`}
            // disabled={!stripe}
            // className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
            onClickAction={handleCheckout}
          >
            
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Cart;
