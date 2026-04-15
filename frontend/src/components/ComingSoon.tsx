import { Lightbulb } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="rounded-full bg-blue-100 p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Lightbulb className="text-blue-600" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
        {description && (
          <p className="text-gray-600 mb-6">{description}</p>
        )}
        <div className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg">
          <p className="text-sm font-medium">Próximamente</p>
        </div>
      </div>
    </div>
  );
}
