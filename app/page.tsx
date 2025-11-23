export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          DoppleCart
        </h1>
        <p className="text-center text-lg mb-8">
          Push a cart full of AI influencers
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login
          </a>
        </div>
      </div>
    </main>
  );
}

