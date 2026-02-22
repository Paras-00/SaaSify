import { ArrowRight, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import cartService from '../services/cartService';


export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItems, setUpdatingItems] = useState({});
  const navigate = useNavigate();


  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await cartService.getCart();
      setCart(response.data?.cart || { items: [], total: 0 });
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err.message || 'Failed to load cart');
      // Set empty cart as fallback
      setCart({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, period) => {
    if (period < 1) return;

    try {
      setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
      await cartService.updateCartItem(itemId, { period });
      await loadCart();
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const removeItem = async (itemId) => {
    try {
      setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
      await cartService.removeFromCart(itemId);
      await loadCart();
    } catch (err) {
      setError(err.message || 'Failed to remove item');
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartService.clearCart();
      setCart({ items: [], total: 0 });
    } catch (err) {
      setError(err.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-black">
        <Loader2 className="animate-spin h-10 w-10 text-brand-green" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-black py-20 font-sans">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-serif text-brand-text-primary mb-8">Shopping Cart</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-16 text-center">
            <div className="w-20 h-20 bg-brand-gray/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-300">
              <ShoppingCart className="h-8 w-8 text-brand-text-secondary" />
            </div>
            <h2 className="text-2xl font-medium text-brand-text-primary mb-3">Your cart is empty</h2>
            <p className="text-brand-text-secondary mb-8 text-lg">Looks like you haven't added any domains yet.</p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 bg-brand-green text-white px-8 py-3 rounded-xl hover:bg-brand-green-hover transition-all font-bold shadow-sm"
            >
              Search Domains
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-serif text-brand-text-primary">Shopping Cart</h1>
          {cart.items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 font-medium transition-colors text-sm"
            >
              Clear Cart
            </button>
          )}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-300 hover:border-[#004643] transition-all"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="text-xl font-bold text-brand-text-primary mb-2">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-block px-3 py-1 bg-brand-green/10 text-brand-green rounded-lg text-xs font-bold uppercase tracking-wider border border-brand-green/20">
                        {item.metadata?.tld || 'Domain'}
                      </span>
                      <span className="text-brand-text-secondary text-sm">
                        {item.period} {item.period === 1 ? 'year' : 'years'} registration
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-brand-text-secondary">Duration:</span>
                      <div className="flex items-center bg-brand-gray/5 rounded-lg border border-gray-300">
                        <button
                          onClick={() => updateQuantity(item.id, item.period - 1)}
                          disabled={item.period <= 1 || updatingItems[item.id]}
                          className="px-3 py-1.5 hover:bg-brand-gray/10 text-brand-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          -
                        </button>
                        <span className="px-3 py-1.5 border-x border-brand-gray/20 text-brand-text-primary font-mono text-sm min-w-[30px] text-center">
                          {item.period}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.period + 1)}
                          disabled={item.period >= 10 || updatingItems[item.id]}
                          className="px-3 py-1.5 hover:bg-brand-gray/10 text-brand-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-brand-text-secondary">(Max 10 years)</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-2xl font-serif text-brand-text-primary">
                      ${(item.price * item.period).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={updatingItems[item.id]}
                      className="text-brand-text-secondary hover:text-red-500 disabled:opacity-50 transition-colors p-2 hover:bg-brand-gray/10 rounded-lg"
                      title="Remove item"
                    >
                      {updatingItems[item.id] ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-8 sticky top-24">
              <h2 className="text-xl font-serif text-brand-text-primary mb-6">Order Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-brand-text-secondary">
                  <span>Subtotal</span>
                  <span className="text-brand-text-primary">${cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-text-secondary">
                  <span>Tax (18% GST)</span>
                  <span className="text-brand-text-primary">${(cart.total * 0.18).toFixed(2)}</span>
                </div>
                <div className="border-t border-brand-gray/20 pt-4">
                  <div className="flex justify-between text-xl font-medium">
                    <span className="text-brand-text-primary">Total</span>
                    <span className="text-brand-green">
                      ${(cart.total * 1.18).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/dashboard/checkout')}
                  className="w-full bg-brand-green text-white py-4 rounded-xl hover:bg-brand-green-hover transition-all font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  Proceed to Checkout
                  <ArrowRight size={20} />
                </button>
                <Link
                  to="/search"
                  className="block w-full text-center text-brand-text-secondary hover:text-brand-text-primary font-medium py-2 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-8 pt-8 border-t border-brand-gray/20">
                <h3 className="font-bold text-brand-text-primary text-sm uppercase tracking-wider mb-4">Included with every domain</h3>
                <ul className="text-sm text-brand-text-secondary space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                    Domain registration
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                    Free DNS management
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                    WHOIS privacy protection
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                    Email forwarding
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                    24/7 customer support
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
