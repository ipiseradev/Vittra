import { Banknote, CreditCard, Landmark, WalletCards } from "lucide-react";

import { FeaturePreviewPage } from "../../components";

export function PaymentsPage() {
  return (
    <FeaturePreviewPage
      eyebrow="Cobranza"
      title="Pagos"
      description="Vista demo para mostrar recaudación, medios de pago y conciliación diaria con un lenguaje visual más orientado a negocio."
      badge="Demo enfocada en caja y recaudación"
      stats={[
        {
          label: "Pagos registrados",
          value: "163",
          helper: "Movimientos del período",
          icon: CreditCard,
          tone: "sky",
        },
        {
          label: "Cobrado hoy",
          value: "$ 480k",
          helper: "Caja diaria acumulada",
          icon: Banknote,
          tone: "teal",
        },
        {
          label: "Transferencias",
          value: "28",
          helper: "Pagos conciliables",
          icon: Landmark,
          tone: "violet",
        },
        {
          label: "Saldo pendiente",
          value: "$ 154k",
          helper: "Pacientes por regularizar",
          icon: WalletCards,
          tone: "amber",
        },
      ]}
      sections={[
        {
          title: "Caja visible",
          description:
            "La demo permite contar de forma simple cuánto ingresó y por qué medio.",
          items: [
            "Tarjetas, efectivo, transferencia y billeteras en un único tablero.",
            "Corte diario y trazabilidad por profesional o sucursal.",
            "Resumen ideal para gerencia o administración.",
          ],
        },
        {
          title: "Conciliación rápida",
          description:
            "Pensado para bajar el tiempo operativo y transmitir sensación de control.",
          items: [
            "Pagos pendientes de confirmar o imputar.",
            "Relación directa entre cita, factura y cobro.",
            "Base preparada para reportes y exportaciones.",
          ],
        },
      ]}
      highlights={[
        "Caja diaria simple de narrar",
        "Pagos por canal y estado",
        "Mejor storytelling de negocio para demo",
      ]}
    />
  );
}
