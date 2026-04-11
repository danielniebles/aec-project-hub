export const STATUS_LABEL: Record<string, string> = {
  prospect:   "Prospecto",
  design:     "Diseño",
  permitting: "Permisos",
  execution:  "Ejecución",
  closeout:   "Cierre",
  closed:     "Cerrado",
};

export const STATUS_BADGE: Record<string, string> = {
  prospect:   "bg-gray-100 text-gray-600",
  design:     "bg-primary/10 text-primary",
  permitting: "bg-purple-100 text-purple-700",
  execution:  "bg-blue-100 text-blue-700",
  closeout:   "bg-orange-100 text-orange-700",
  closed:     "bg-green-100 text-green-700",
};

export const STATUS_BORDER: Record<string, string> = {
  prospect:   "border-gray-300",
  design:     "border-primary/60",
  permitting: "border-purple-400",
  execution:  "border-blue-500",
  closeout:   "border-orange-400",
  closed:     "border-green-500",
};

export const TYPE_LABEL: Record<string, string> = {
  architecture: "Arquitectura",
  construction: "Construcción",
  civil:        "Civil",
  design_build: "Diseño y Obra",
};
