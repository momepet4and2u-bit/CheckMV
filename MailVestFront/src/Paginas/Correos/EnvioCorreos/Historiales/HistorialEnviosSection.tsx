import { Card } from "primereact/card";

export default function HistorialEnviosSection() {
    return (
        <Card className="surface-0 border-1 border-200">
            <div className="text-600 mb-2">
                Aqui va el SmartDataTable
            </div>
            <div className="text-sm text-600">
                Proximo paso: lista de batches (total/sent/failed + mini ES/EN). Al abrir un batch, mostramos el detalle (outbox) del lote.
            </div>
        </Card>
    )
}