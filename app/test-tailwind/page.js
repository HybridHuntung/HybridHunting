export default function Test() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-red-500">Tailwind Test</h1>
      <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded-lg">
        If this text is red and box is blue, Tailwind works!
      </div>
      <button className="mt-4 px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600">
        Test Button
      </button>
    </div>
  )
}