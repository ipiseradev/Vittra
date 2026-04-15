export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
        <p className="text-gray-600 text-sm">Cargando...</p>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
      </div>
    </div>
  );
}
