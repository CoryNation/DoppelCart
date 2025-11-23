export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Login</h1>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Login functionality will be implemented here.
          </p>
          <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-4">
            This will use Supabase Auth with email magic links.
          </p>
        </div>
        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-blue-600 hover:underline"
          >
            ← Back to home
          </a>
        </div>
      </div>
    </main>
  );
}

