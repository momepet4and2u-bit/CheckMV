import { motion, useAnimation } from "motion/react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { useEffect, useState } from "react";
import HistorialPlantillasSection from "./Historiales/HistorialPlantillasSection";

type Props = {
    onOpenTemplate: () => void;
}

type ViewMode = "plantillas";

export default function PlantillasHistorialTab({ onOpenTemplate }: Props) {

    const [mode, setMode] = useState<ViewMode>("plantillas");

    const controls = useAnimation();

    const title = "Historial de Plantillas";

    useEffect(() => {
        const run = async () => {
            await controls.start({ opacity: 0, y: 8, transition: { duration: 0.12 } });
            await controls.start({ opacity: 1, y: 0, transition: { duration: 0.18 } });
        };
        run();
    }, [mode, controls]);

    return (
        <Card
            title="Historial"
            subTitle="Historial de plantillas"
        >
            <div className="flex align-items-center gap-2 flex-wrap">
                <Button
                    label="Plantillas"
                    icon="pi pi-folder"
                    outlined={mode !== "plantillas"}
                    onClick={() => setMode("plantillas")}
                    className={`mv-toggle-btn ${mode === "plantillas" ? "mv-toggle-btn--active" : "mv-toggle-btn--inactive"}`}
                />
            </div>

            <Divider className="my-3" />

            <div className="mb-2 font-medium">
                {title}
            </div>

            <motion.div animate={controls} initial={{ opacity: 1, y: 0 }}>
                <HistorialPlantillasSection onOpenTemplate={onOpenTemplate} />
            </motion.div>
        </Card>
    );
}