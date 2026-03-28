'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';

type ProductType = 'tshirt' | 'hoodie' | 'hat' | 'tote' | 'vinyl' | 'poster';

const productTypes: { key: ProductType; label: string; icon: string; baseCost: number; suggestedPrice: number }[] = [
  { key: 'tshirt', label: 'T-Shirt', icon: '👕', baseCost: 12.00, suggestedPrice: 29.99 },
  { key: 'hoodie', label: 'Hoodie', icon: '🧥', baseCost: 22.00, suggestedPrice: 54.99 },
  { key: 'hat', label: 'Hat', icon: '🧢', baseCost: 8.00, suggestedPrice: 24.99 },
  { key: 'tote', label: 'Tote Bag', icon: '👜', baseCost: 6.00, suggestedPrice: 19.99 },
  { key: 'vinyl', label: 'Vinyl Sleeve', icon: '💿', baseCost: 15.00, suggestedPrice: 34.99 },
  { key: 'poster', label: 'Poster', icon: '🖼️', baseCost: 5.00, suggestedPrice: 14.99 },
];

const colorOptions = [
  { name: 'Black', value: '#111111' },
  { name: 'White', value: '#F5F5F5' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Navy', value: '#1E3A5F' },
  { name: 'Forest', value: '#166534' },
  { name: 'Purple', value: '#7C3AED' },
];

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

const productGradients: Record<ProductType, string> = {
  tshirt: 'from-red-600/30 to-red-900/30',
  hoodie: 'from-purple-600/30 to-purple-900/30',
  hat: 'from-blue-600/30 to-blue-900/30',
  tote: 'from-green-600/30 to-green-900/30',
  vinyl: 'from-amber-600/30 to-amber-900/30',
  poster: 'from-pink-600/30 to-pink-900/30',
};

export default function MerchDesignerPage() {
  const { status } = useSession();
  const { toast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<ProductType>('tshirt');
  const [selectedColor, setSelectedColor] = useState('#111111');
  const [customText, setCustomText] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [price, setPrice] = useState('29.99');

  const currentProduct = productTypes.find((p) => p.key === selectedProduct)!;
  const priceNum = parseFloat(price) || 0;
  const profit = Math.max(0, priceNum - currentProduct.baseCost);

  const handleProductChange = (key: ProductType) => {
    setSelectedProduct(key);
    const product = productTypes.find((p) => p.key === key)!;
    setPrice(product.suggestedPrice.toFixed(2));
  };

  const handleCreateListing = () => {
    if (!customText.trim()) {
      toast('Please add custom text to your design.', 'error');
      return;
    }
    if (priceNum <= currentProduct.baseCost) {
      toast('Price must be higher than production cost.', 'error');
      return;
    }
    toast(`${currentProduct.label} listing created! It will appear in the marketplace shortly.`, 'success');
  };

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">🎨</p>
        <p className="text-gray-400 text-lg">Sign in to access the merch designer</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Merch Designer</h1>
        <p className="text-gray-400">Create custom merchandise and sell directly to your fans.</p>
      </div>

      {/* Product Type Selector */}
      <div className="flex gap-3 overflow-x-auto mb-8 pb-2">
        {productTypes.map((product) => (
          <button
            key={product.key}
            onClick={() => handleProductChange(product.key)}
            className={`flex flex-col items-center gap-2 px-5 py-4 rounded-xl text-sm font-medium transition whitespace-nowrap min-w-[100px] ${
              selectedProduct === product.key
                ? 'bg-red-600/10 border border-red-600/30 text-white'
                : 'bg-[#15151f] text-gray-400 hover:text-white hover:bg-[#1a1a2e]'
            }`}
          >
            <span className="text-2xl">{product.icon}</span>
            <span>{product.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Design Preview */}
        <div className="rounded-xl bg-[#15151f] p-6">
          <h2 className="font-bold mb-4">Preview</h2>
          <div
            className={`relative rounded-xl bg-gradient-to-br ${productGradients[selectedProduct]} h-96 flex flex-col items-center justify-center border border-white/5`}
            style={{ backgroundColor: selectedColor + '20' }}
          >
            <div
              className="w-48 h-48 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/20"
              style={{ backgroundColor: selectedColor + '40' }}
            >
              <span className="text-6xl">{currentProduct.icon}</span>
            </div>
            {customText && (
              <p className="mt-4 text-lg font-bold text-white/90 text-center px-4 max-w-xs">
                {customText}
              </p>
            )}
            {!customText && (
              <p className="mt-4 text-sm text-gray-500 italic">Add custom text below</p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>{currentProduct.label}</span>
            <span>Size: {selectedSize}</span>
            <span>{colorOptions.find((c) => c.value === selectedColor)?.name}</span>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="space-y-6">
          {/* Color Picker */}
          <div className="rounded-xl bg-[#15151f] p-6">
            <h3 className="font-semibold mb-3">Color</h3>
            <div className="flex gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                  className={`w-10 h-10 rounded-full transition-all ${
                    selectedColor === color.value
                      ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#15151f] scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>

          {/* Custom Text */}
          <div className="rounded-xl bg-[#15151f] p-6">
            <h3 className="font-semibold mb-3">Custom Text</h3>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
              placeholder="Enter text for your merch..."
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-2">{customText.length}/50 characters</p>
          </div>

          {/* Size Selector */}
          <div className="rounded-xl bg-[#15151f] p-6">
            <h3 className="font-semibold mb-3">Size</h3>
            <div className="flex gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedSize === size
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Price Input */}
          <div className="rounded-xl bg-[#15151f] p-6">
            <h3 className="font-semibold mb-3">Price</h3>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-4 py-3 text-white focus:outline-none focus:border-red-600 transition"
                />
              </div>
              <button
                onClick={() => setPrice(currentProduct.suggestedPrice.toFixed(2))}
                className="px-3 py-3 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition whitespace-nowrap"
              >
                Suggested: ${currentProduct.suggestedPrice.toFixed(2)}
              </button>
            </div>
          </div>

          {/* Profit Calculator */}
          <div className="rounded-xl bg-[#15151f] p-6 border border-white/5">
            <h3 className="font-semibold mb-3">Profit Calculator</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Your Price</span>
                <span className="font-medium">${priceNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Production Cost</span>
                <span className="font-medium text-red-400">- ${currentProduct.baseCost.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="font-semibold">Your Profit (per item)</span>
                <span className={`font-bold text-lg ${profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${profit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Create Listing Button */}
          <button
            onClick={handleCreateListing}
            className="w-full rounded-full bg-red-600 px-6 py-3.5 font-semibold text-white hover:bg-red-500 transition text-lg"
          >
            Create Listing
          </button>
        </div>
      </div>

      {/* Product Mockup Grid */}
      <section>
        <h2 className="text-xl font-bold mb-6">All Product Types</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {productTypes.map((product) => (
            <button
              key={product.key}
              onClick={() => handleProductChange(product.key)}
              className={`rounded-xl bg-[#15151f] p-4 text-center transition hover:bg-[#1a1a2e] ${
                selectedProduct === product.key ? 'ring-1 ring-red-600' : ''
              }`}
            >
              <div className={`h-24 rounded-lg bg-gradient-to-br ${productGradients[product.key]} flex items-center justify-center text-3xl mb-3`}>
                {product.icon}
              </div>
              <p className="font-medium text-sm">{product.label}</p>
              <p className="text-xs text-gray-500 mt-1">From ${product.baseCost.toFixed(2)}</p>
              <p className="text-xs text-red-400 mt-0.5">${product.suggestedPrice.toFixed(2)} suggested</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
