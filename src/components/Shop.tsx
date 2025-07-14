'use client'
import SoupImg from '../../public/products/soup_butternut.jpeg'
import Image from 'next/image';
import { Tile } from './ui/Tile';
import { Button } from './ui/Button';
import { Product } from '@/types/types';
import { useCart } from '@/hooks/use-cart';

const PRODUCTS : Product[] = [
  {
    id: "soup",
    name: "Soup 32oz",
    unitCost: 13,
    description: "Delicious Soup",
  },
  {
    id: "broth",
    name: "Broth 16oz",
    unitCost: 5,
    description: "Delicious Soup",
  },
  {
    id: "bread",
    name: "Foccacia Bread",
    unitCost: 6,
    description: "Delicious Soup",
  },
  {
    id: "meal_for_two",
    name: "Meal For 2 (1 soup + 1 bread)",
    unitCost: 18,
    description: "Delicious Soup",
  }
];

export default function Shop() {

    const cart = useCart();

    const onClickAddToCart = (product: Product) => {
        cart.addQty(product, 1);
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
      {PRODUCTS.map((product) => (
        <Tile
          key={product.id}
          title=''
        //   className="flex flex-col items-center border p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow"
        >
          <Image
            src={SoupImg}
            alt={product.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h2 className="text-xl font-semibold text-center mb-2">{product.name}</h2>
          <p className="text-gray-600 text-sm text-center mb-4">{product.description}</p>
          <p className="text-lg font-bold mb-4">${product.unitCost}</p>
          <Button
            label='add to cart'
            onClickAction={() => onClickAddToCart(product)}
          />
        </Tile>
      ))}
    </div>
    );
}