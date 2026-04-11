"use client";

import { STATUS_LABEL } from "@/lib/projectStatus";
import type { ProjectStatus } from "@prisma/client";

type Props = {
  suggestedStatus: string;
  projectId: string;
  onAccept: (newStatus: string) => void;
  onDismiss: () => void;
};

export default function StatusSuggestionBanner({ suggestedStatus, onAccept, onDismiss }: Props) {
  const label = STATUS_LABEL[suggestedStatus as ProjectStatus] ?? suggestedStatus;

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-sm">
      <div className="flex-1 text-amber-800">
        <span className="font-medium">Sugerencia:</span> ¿Actualizar el estado del proyecto a{" "}
        <span className="font-semibold">{label}</span>?
      </div>
      <button
        onClick={() => onAccept(suggestedStatus)}
        className="px-3 py-1 rounded text-white text-xs font-medium bg-primary"
      >
        Actualizar estado
      </button>
      <button
        onClick={onDismiss}
        className="px-3 py-1 rounded border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50"
      >
        Ignorar
      </button>
    </div>
  );
}
