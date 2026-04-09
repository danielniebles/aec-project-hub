interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        {children}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>🔔</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">A</div>
            <div className="text-right leading-tight">
              <div className="text-xs font-medium text-gray-800">Arq. Javier Niebles</div>
              <div className="text-xs text-gray-400">Director de Obra</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
