import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Recipe {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  imagePlaceholder: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: string;
}

const DEFAULT_IMAGE = '/recipes/default.jpg';

const recipes: Recipe[] = [
  {
    id: 'simple-toast',
    title: 'Simple Toasted Focaccia',
    description: 'A classic way to enjoy focaccia - lightly toasted with butter for a crispy, golden exterior.',
    instructions: [
      'Slice focaccia into 1-inch thick pieces',
      'Toast in a toaster or under the broiler until golden brown',
      'Spread with room temperature butter',
    ],
    imagePlaceholder: '/recipes/toasted-focaccia.jpg',
    difficulty: 'Easy',
    prepTime: '5 minutes'
  },
  {
    id: 'sandwich',
    title: 'Focaccia Sandwich',
    description: 'Transform your focaccia into a hearty sandwich with fresh ingredients and premium fillings.',
    instructions: [
      'Slice focaccia horizontally to create top and bottom layers',
      'Layer with your favorite deli meats, cheese, and vegetables',
      'Add condiments like pesto, aioli, or mustard',
      'Press gently and cut into portions'
    ],
    imagePlaceholder: '/recipes/focaccia-sandwich.jpg',
    difficulty: 'Easy',
    prepTime: '10 minutes'
  },
  {
    id: 'soup-accompaniment',
    title: 'Focaccia with Soup',
    description: 'Perfect for dipping into warm soups or using as a base for soup toppings.',
    instructions: [
      'Warm focaccia in the oven at 350°F for 5 minutes',
      'Serve alongside your favorite soup',
      'Optional: top with grated cheese and broil until melted',
      'Use for dipping or as a soup garnish'
    ],
    imagePlaceholder: '/recipes/focaccia-soup.jpg',
    difficulty: 'Easy',
    prepTime: '8 minutes'
  },
  {
    id: 'crackers-focaccia',
    title: 'Focaccia Crackers',
    description: 'Add smoky flavor by grilling your focaccia for a unique twist on this classic bread.',
    instructions: [
      'Preheat grill to medium heat',
      'Brush focaccia with olive oil on both sides',
      'Grill for 2-3 minutes per side until char marks appear',
      'Serve with grilled vegetables or as a side to grilled meats'
    ],
    // imagePlaceholder: '/recipes/grilled-focaccia.jpg',
    imagePlaceholder: DEFAULT_IMAGE,
    difficulty: 'Medium',
    prepTime: '15 minutes'
  },
  {
    id: 'croutons',
    title: 'Focaccia Croutons',
    description: 'Transform day-old focaccia into crispy croutons perfect for salads and soups.',
    instructions: [
      'Cut focaccia into 1-inch cubes',
      'Toss with olive oil, salt, and herbs',
      'Bake at 375°F for 15-20 minutes until golden and crispy',
      'Cool completely before storing or using in salads'
    ],
    imagePlaceholder: '/recipes/focaccia-croutons.jpg',
    difficulty: 'Easy',
    prepTime: '25 minutes'
  },
  {
    id: 'bruschetta',
    title: 'Focaccia Bruschetta',
    description: 'Use focaccia as a base for classic Italian bruschetta with fresh tomatoes and basil.',
    instructions: [
      'Toast focaccia slices until golden brown',
      'Rub with garlic clove while still warm',
      'Top with diced tomatoes, fresh basil, and olive oil',
      'Season with salt and pepper to taste'
    ],
    // imagePlaceholder: '/recipes/focaccia-bruschetta.jpg',
    imagePlaceholder: DEFAULT_IMAGE,
    difficulty: 'Medium',
    prepTime: '12 minutes'
  }
];

export default function InspirationPage() {
  return (
    <div className="min-h-screen background-gradient-warm py-16">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-bakery-primary mb-6">
        A few thoughts on how to use our focaccia
        </h1>
      </div>

      {/* Recipes Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Image Placeholder */}
              <div className="relative h-64 bg-gradient-to-br from-amber-100 to-orange-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <Image src={recipe.imagePlaceholder || DEFAULT_IMAGE} alt={recipe.title} fill className="object-cover" />
                  </div>
                </div>
              </div>

              {/* Recipe Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{recipe.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    recipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {recipe.difficulty}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{recipe.description}</p>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {recipe.prepTime}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    {recipe.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Try These Recipes?
            </h2>
            <p className="text-gray-600 mb-6">
              Order our fresh focaccia bread and start creating these delicious dishes today!
            </p>
            <Link href="/order">
            <button className="btn-primary-lg">
              Order Focaccia Now
            </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
