import { TabPanel, TabView } from "primereact/tabview";
import { useState } from "react"
import EnvioProgressSection from "../EnvioProgressSection";
import CrearCorreo from "./CrearCorreo";
import CorreosHistorial from "./CorreosHistorial";

export default function Correos() {

    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="p-3">
            <EnvioProgressSection />

            <TabView  className="mv-tabview-clean" activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                <TabPanel header="Historial">
                    <CorreosHistorial
                        onOpenMail={() => setActiveIndex(1)}
                    />
                </TabPanel>
                <TabPanel header="Nuevo">
                    <CrearCorreo
                        onCreated={() => setActiveIndex(0)}
                    />
                </TabPanel>
            </TabView>
        </div>
    );
}