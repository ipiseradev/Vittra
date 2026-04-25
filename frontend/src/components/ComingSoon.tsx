import { Lightbulb } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="page-shell">
      <div className="page-header text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-sky-100">
          <Lightbulb className="text-sky-700" size={40} />
        </div>
        <h1 className="page-title">{title}</h1>
        {description ? (
          <p className="page-description mx-auto">{description}</p>
        ) : null}
        <span className="mt-6 inline-flex rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800">
          Próximamente en el roadmap de Vittra
        </span>
      </div>
    </div>
  );
}
