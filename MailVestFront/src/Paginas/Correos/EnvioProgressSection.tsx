/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";
import { useMemo, useState } from "react";

type BatchProgess = {
    batchId: number;
    total: number;
    sent: number;
    failed: number;

    totalEs: number;
    sentEs: number;
    failedEs: number;

    totalEn: number;
    sentEn: number;
    failedEn: number;

    status: "Idle" | "Running" | "Completed" | "Failed";
};

function clampPct(n: number) {
    return Math.max(0, Math.min(100, n));
}

function pct(done: number, total: number) {
    if(!total) return 0;
    return clampPct(Math.round((done / total) * 100));
}

function EnvioProgressCard({ p }: { p: BatchProgess }) {
    const totalDone = p.sent + p.failed;

    const totalPct = useMemo(() => pct(totalDone, p.total), [totalDone, p.total]);
    const esPct = useMemo(() => pct(p.sentEs + p.failedEs, p.totalEs), [p.sentEs, p.failedEs, p.totalEs]);
    const enPct = useMemo(() => pct(p.sentEn + p.failedEn, p.totalEn), [p.sentEn, p.failedEn, p.totalEn]);

    const severity = 
    p.status === "Completed" ? "success" : p.status === "Failed" ? "danger" : p.status === "Running" ? "info" : "secondary";

    return (
        <Card className="mb-3" title = "Envio en progreso" subTitle={`Batch: ${p.batchId} ° Estado: $ ${p.status}`}>
            <div className="flex align-items-center justify-content-between gap-2 flex-wrap mb-2">
                <div className= "flex align-items-center gap-2">
                <Tag value={`Total: ${totalDone}/${p.total}`} severity={severity as any} />
                <Tag value={`Ok: ${p.sent}`} severity="success" />
                <Tag value={`Fail: ${p.failed}`} security="danger" />
                </div>
            <div className="text-sm text-600">Progreso general</div>
            </div>

            <ProgressBar value={totalPct} />
            <div className="grid mt-3">
                <div className="col-12 md:col-6">
                    <div className="flex align-items-center justify-content-between mb-2">
                        <div className="font-medium">Español</div>
                        <div className="text-sm text-600">
                            {p.sentEs + p.failedEs} / {p.totalEs} ° Ok {p.sentEs} ° Fail {p.failedEs}
                        </div>
                    </div>
                    <ProgressBar value={esPct} />
                </div>

                <div className="col-12 md:col-6">
                    <div className="flex align-items-center justify-content-between mb-2">
                        <div className="font-medium">Ingles</div>
                        <div className="text-sm text-600">
                            {p.sentEn + p.failedEn} / {p.totalEn} ° Ok {p.sentEn} ° Fail {p.failedEn}
                        </div>
                    </div>
                    <ProgressBar value={enPct} />
                </div>
            </div>
        </Card>
    );
}

export default function EnvioProgressSection() {

    const [progress] = useState<BatchProgess | null>(null);

    if(!progress){
        return null;
    }

    if(progress.status !== "Running"){
        return null;
    }

    return <EnvioProgressCard p={progress} />;
}