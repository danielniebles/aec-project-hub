import { Suspense } from "react";
import NewInvoiceForm from "@/components/billing/InvoiceForm";

export default function NuevaFacturaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Cargando...</div>}>
      <NewInvoiceForm />
    </Suspense>
  );
}
