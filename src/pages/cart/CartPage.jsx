import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, updateCartQuantity, removeFromCart, clearCart } from '../../services/cart';
import { recordTransaction } from '../../services/transactions';
import { useAuth } from '../../store/authStore';
import { Trash2, CreditCard, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState('Visa');
  const [checkingOut, setCheckingOut] = useState(false);

  const { data: cart = [], isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, qty }) => updateCartQuantity(id, qty),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
    onError: (err) => toast.error(err.message),
  });

  const removeMut = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const total = cart.reduce((sum, item) => sum + (item.listing.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      for (const item of cart) {
        await recordTransaction({
          listingId: item.listing.id,
          sellerId: item.listing.seller_id,
          amount: item.listing.price * item.quantity,
          quantity: item.quantity,
          paymentMethod: paymentMethod
        });
      }
      await clearCart();
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Payment successful!');
      nav('/transactions');
    } catch (err) {
      toast.error(err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading cart...</div>;
  
  if (cart.length === 0) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
      <button onClick={() => nav('/')} className="btn-primary">Go Shopping</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_350px] gap-6">
      {/* Cart Items */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
        {cart.map((item) => (
          <div key={item.id} className="card p-4 flex gap-4">
            <img src={item.listing.image_url} alt="" className="w-24 h-24 object-cover rounded-lg bg-slate-100" />
            <div className="flex-1">
              <h3 className="font-bold">{item.listing.title}</h3>
              <p className="text-violet-600 font-medium">M {item.listing.price}</p>
              
              <div className="flex items-center gap-3 mt-2">
                <select 
                  value={item.quantity}
                  onChange={(e) => updateMut.mutate({ id: item.id, qty: Number(e.target.value) })}
                  className="border rounded-lg p-1 text-sm bg-white cursor-pointer outline-none focus:border-violet-500"
                >
                  {/* Dynamically generate options based on the stock in the database */}
                  {Array.from({ length: Math.min(item.listing.stock || 10, 50) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>Qty: {n}</option>
                  ))}
                </select>
                
                <span className="text-xs text-slate-400">
                  ({item.listing.stock} available)
                </span>

                <button onClick={() => removeMut.mutate(item.id)} className="text-red-500 text-sm hover:underline flex items-center gap-1 ml-auto">
                  <Trash2 size={14}/> Remove
                </button>
              </div>
            </div>
            <div className="font-bold text-right">
              M {(item.listing.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Summary */}
      <div className="card p-6 h-fit sticky top-24">
        <h2 className="text-lg font-bold mb-4">Order Summary</h2>
        
        <div className="space-y-2 text-sm mb-4 pb-4 border-b border-slate-100">
          <div className="flex justify-between"><span>Subtotal</span> <span>M {total.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Delivery</span> <span className="text-emerald-600">Free</span></div>
          <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span> <span>M {total.toFixed(2)}</span></div>
        </div>

        <h3 className="font-semibold mb-3">Payment Method</h3>
        <div className="space-y-2 mb-6">
          {[
            { id: 'Visa', label: 'Visa / Mastercard', icon: CreditCard },
            { id: 'M-Pesa', label: 'M-Pesa (Vodacom)', icon: Smartphone },
            { id: 'EcoCash', label: 'EcoCash (Econet)', icon: Smartphone },
          ].map((method) => (
            <label key={method.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === method.id ? 'border-violet-600 bg-violet-50' : 'border-slate-200 hover:border-violet-300'}`}>
              <input 
                type="radio" 
                name="payment" 
                value={method.id} 
                checked={paymentMethod === method.id}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-violet-600"
              />
              <method.icon size={18} className="text-slate-600" />
              <span className="text-sm font-medium">{method.label}</span>
            </label>
          ))}
        </div>

        <button 
          onClick={handleCheckout}
          disabled={checkingOut}
          className="btn-primary w-full py-3"
        >
          {checkingOut ? 'Processing...' : `Pay M ${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}