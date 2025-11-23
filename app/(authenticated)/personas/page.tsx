export default function PersonasPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Personas</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Create Persona
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Personas management will be implemented here.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          This page will display:
        </p>
        <ul className="list-disc list-inside mt-2 text-sm text-gray-500 dark:text-gray-500">
          <li>List of all user personas</li>
          <li>Create new persona form</li>
          <li>Edit persona details</li>
          <li>Delete persona actions</li>
        </ul>
      </div>
    </div>
  );
}

