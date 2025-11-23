export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Dashboard content will be implemented here.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          This page will display:
        </p>
        <ul className="list-disc list-inside mt-2 text-sm text-gray-500 dark:text-gray-500">
          <li>Overview of all personas</li>
          <li>Upcoming scheduled posts</li>
          <li>Recent analytics</li>
          <li>Quick actions</li>
        </ul>
      </div>
    </div>
  );
}

