export default function Cart() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Your cart is empty</p>
        </div>
      </div>
    </div>
  );
}
