import Link from "next/link";

const TERM_LABEL: Record<string, string> = {
  net30: "Net 30d",
  net60: "Net 60d",
  net90: "Net 90d",
  fixed_day: "Día fijo",
};

type Props = {
  client: {
    id: string;
    name: string;
    taxId: string | null;
    email: string | null;
    contactName: string | null;
    paymentTermType: string;
    fixedDay: number | null;
    active: boolean;
    _count: { projects: number; invoices: number };
  };
};

export default function ClientCard({ client }: Props) {
  const termLabel =
    client.paymentTermType === "fixed_day"
      ? `Día ${client.fixedDay ?? "?"}`
      : (TERM_LABEL[client.paymentTermType] ?? client.paymentTermType);

  return (
    <Link href={`/clientes/${client.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-transparent hover:border-primary/10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{client.name}</h3>
            {client.taxId && (
              <p className="text-xs text-gray-400 mt-0.5">NIT {client.taxId}</p>
            )}
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/5 text-primary">
            {termLabel}
          </span>
        </div>
        {client.contactName && (
          <p className="text-xs text-gray-500 mb-2">{client.contactName}</p>
        )}
        {client.email && (
          <p className="text-xs text-gray-400 mb-3 truncate">{client.email}</p>
        )}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-400">
          <span>{client._count.projects} proyecto{client._count.projects !== 1 ? "s" : ""}</span>
          <span>{client._count.invoices} factura{client._count.invoices !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </Link>
  );
}
