import { motion, useAnimation } from "motion/react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { useEffect, useMemo, useState } from "react";
import HistorialCorreosSection from "./Historiales/HistorialCorreosSection";
import HistorialEnviosSection from "./Historiales/HistorialEnviosSection";

type Props = {
    onOpenMail: () => void;
}

type ViewMode = "correos" | "envios";

export default function CorreosHistorial({ onOpenMail }:Props) {

    const [mode, setMode] = useState<ViewMode>("correos");

    const controls = useAnimation();

    const title = useMemo(() => {
        return mode === "correos" ? "Historial de Correos" : "Historial de Envios";
    }, [mode]);

    useEffect(() => {
        const run = async () => {
            await controls.start({ opacity: 0, y: 8, transition: { duration: 0.12 }});
            await controls.start({ opacity: 1, y: 0, transition: { duration: 0.18 }});
        };
        run();
    }, [mode, controls]);

    return (
        <Card
        title="Historial"
        subTitle="Cambia entre correos y envios de los correos."
        >
            <div className="flex align-items-center gap-2 flex-wrap">
                <Button
                label="Correos"
                icon="pi pi-folder"
                outlined={mode !== "correos"}
                onClick={() => setMode("correos")}
                className={`mv-toggle-btn ${mode === "correos" ? "mv-toggle-btn--active" :  "mv-toggle-btn--inactive"}`}
                />
                <Button
                label="Envios"
                icon="pi pi-send"
                outlined={ mode !== "envios"}
                onClick={() => setMode("envios")}
                className={`mv-toggle-btn ${mode === "envios" ? "mv-toggle-btn--active" :  "mv-toggle-btn--inactive"}`}
                />
            </div>

            <Divider className="my-3" />
            
            <div className="mb-2 font-medium">
                {title}
            </div>

            <motion.div animate = {controls} initial = {{opacity: 1, y: 0}}>
                {mode === "correos" ? (
                    <HistorialCorreosSection onOpenMail={onOpenMail} />
                ) : (
                    <HistorialEnviosSection />
                )}
            </motion.div>
        </Card>
    )
}