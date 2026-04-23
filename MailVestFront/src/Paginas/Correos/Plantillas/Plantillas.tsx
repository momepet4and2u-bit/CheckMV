import { TabPanel, TabView } from "primereact/tabview";
import { useEffect, useState } from "react"
import PlantillasHistorialTab from "./PlantillasHistorialTab";
import EnvioProgressSection from "../EnvioProgressSection";
import PlantillasNuevaTab from "./PlantillasNuevaTab";
import { motion, useAnimation } from "motion/react";

export default function Plantillas() {

    const [activeIndex, setActiveIndex] = useState(0);

    const controls = useAnimation();
    // Efecto que escucha el cambio de pestaña
    useEffect(() => {
        const animateTab = async () => {
            // 1. Desvanecer y bajar un poco (hacia afuera)
            await controls.start({
                opacity: 0,
                y: 8,
                transition: { duration: 0.20 }
            });

            // 2. Aparecer y subir (entrada suave)
            await controls.start({
                opacity: 1,
                y: 0,
                transition: { duration: 0.20, ease: "easeOut" }
            });
        };

        animateTab();
    }, [activeIndex, controls]); // Se dispara cuando activeIndex cambia

    return (
        <div className="p-3">
            <EnvioProgressSection />

            {/* El motion.div envuelve el contenido que quieres que reaccione */}
            <motion.div animate={controls} initial={{ opacity: 1, y: 0 }}>
                <TabView
                    className="mv-tabview-clean"
                    activeIndex={activeIndex}
                    onTabChange={(e) => setActiveIndex(e.index)}
                >
                    <TabPanel header="Historial">
                        <PlantillasHistorialTab
                            onOpenTemplate={() => setActiveIndex(1)}
                        />
                    </TabPanel>
                    <TabPanel header="Nuevo">
                        <PlantillasNuevaTab
                            onCreated={() => setActiveIndex(0)}
                        />
                    </TabPanel>
                </TabView>
            </motion.div>
        </div>
    );
}