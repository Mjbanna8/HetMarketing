import React from 'react';
import { Link } from 'react-router-dom';

const mockOffers = [
  {
    id: '1',
    title: 'Denver Deep Cleanse Charcoal, Oil Clear & Acne Clear Face Wash (50 g)',
    image: 'https://placehold.co/400x400/93c5fd/1e3a8a?text=Denver+Wash',
    originalPrice: 580,
    discountPrice: 199,
    discountPercentage: 67
  },
  {
    id: '2',
    title: 'Everyuth Naturals Sun Block Lotion SPF 50 (50 gm)',
    image: 'https://placehold.co/400x400/93c5fd/1e3a8a?text=Everyuth+Lotion',
    originalPrice: 289,
    discountPrice: 99,
    discountPercentage: 65
  },
  {
    id: '3',
    title: 'Iba Young Forever Diamond Facial Kit',
    image: 'https://placehold.co/400x400/bfdbfe/1e3a8a?text=Iba+Facial',
    originalPrice: 349,
    discountPrice: 99,
    discountPercentage: 72
  },
  {
    id: '4',
    title: 'Meglow Instant Glow Facewash (350 g)',
    image: 'https://placehold.co/400x400/93c5fd/1e3a8a?text=Meglow',
    originalPrice: 238,
    discountPrice: 99,
    discountPercentage: 58
  },
  {
    id: '5',
    title: 'Denver Hamilton Premium Body Talc (100 g Each - Pack of 2)',
    image: 'https://placehold.co/400x400/bfdbfe/1e3a8a?text=Denver+Talc',
    originalPrice: 156,
    discountPrice: 79,
    discountPercentage: 50
  },
  {
    id: '6',
    title: 'Denver Black Code Talcum Powder (300 g Each - Pack of 2)',
    image: 'https://placehold.co/400x400/93c5fd/1e3a8a?text=Denver+Black+Code',
    originalPrice: 259,
    discountPrice: 169,
    discountPercentage: 35
  }
];

export function MarqueeOffers(): React.ReactElement {
  // Duplicate the array to create a seamless infinite scroll illusion
  const duplicatedOffers = [...mockOffers, ...mockOffers];

  return (
    <section className="bg-gradient-to-r from-red-50 to-orange-50 py-12 md:py-16 overflow-hidden">
      <div className="container-page mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Special Offers</h2>
            <p className="text-surface-500 mt-1">Grab these deals before they're gone</p>
          </div>
          <Link to="/products" className="text-primary-600 font-medium text-sm hover:text-primary-700 transition-colors">
            View All →
          </Link>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative flex w-full group">
        <div className="flex animate-marquee group-hover:[animation-play-state:paused] whitespace-nowrap min-w-max">
          {duplicatedOffers.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="w-64 sm:w-72 md:w-80 mx-3 shrink-0 rounded-xl shadow-md overflow-hidden bg-[#93c5fd] relative border border-transparent hover:border-primary-200 transition-all cursor-pointer flex flex-col"
            >
              {/* Discount Badge */}
              <div className="absolute top-3 left-3 bg-white/40 backdrop-blur-md border border-white/50 text-surface-900 shadow-sm text-xs font-bold px-2 py-1 rounded-sm z-10 flex items-center gap-1">
                <span className="text-red-600">{product.discountPercentage}% OFF</span>
              </div>

              {/* Product Image Placeholder */}
              <div className="relative aspect-[4/3] w-full p-4 flex items-center justify-center bg-blue-300">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Product Info */}
              <div className="p-4 flex flex-col flex-1 bg-white">
                <p className="text-xs text-primary-600 font-semibold mb-1">Daily Use</p>
                <h3 className="font-semibold text-surface-900 text-sm md:text-base whitespace-normal line-clamp-2 min-h-[2.5rem] mb-3 leading-snug">
                  {product.title}
                </h3>

                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-lg font-bold text-surface-900">₹{product.discountPrice}</span>
                  <span className="text-sm text-surface-400 line-through">₹{product.originalPrice}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
