/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

// PrimeReact Components
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Editor, type EditorTextChangeEvent } from "primereact/editor";
import { TabView, TabPanel } from "primereact/tabview";
import { Card } from "primereact/card";
import { SelectButton } from "primereact/selectbutton";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { objetivoSchema } from "./Templates/objetivoTemplate.schema";
import type { PortalLanguageDto } from "../../../Utils/Language/portalLanguages.type";
import { useEffect, useState } from "react";
import { getPortalLanguages } from "../../../Utils/Language/portalLanguages.api";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";

/* -------------------------------------------------------------------------- */
/*                                2. COMPONENTE                               */
/* -------------------------------------------------------------------------- */
export default function GeneradorObjetivoPlantilla() {
    const statusOptions = [
        { label: "Borrador", value: "DRAFT", icon: "pi pi-pencil" },
        { label: "Activado", value: "ACTIVE", icon: "pi pi-check-circle" },
        { label: "Apagado", value: "DISABLED", icon: "pi pi-stop-circle" },
    ];

    const form = useForm({
        resolver: yupResolver(objetivoSchema, {
            context: { ConfigCampos: {} } // Se actualizará vía watch
        }) as any,
        defaultValues: {
            Nombre: "",
            Status: "DRAFT",
            IdiomaCodigo: "", // Inicializado vacío
            ListasDistribucion: [], // Array vacío de IDs
            ConfigCampos: {
                Asunto: { Visible: true, Requerido: false, Bloqueado: false },
                Body: { Visible: true, Requerido: false, Bloqueado: false },
                UrlReunion: { Visible: true, Requerido: false, Bloqueado: false },
            },
            Contenido: { Subject: "", Html: "", UrlReunion: "" } // Ya no es ContenidoIdiomas
        }
    });

    const { control, register, handleSubmit, setValue, getValues, watch, formState: { errors } } = form;

    const configWatch = useWatch({ control, name: "ConfigCampos" });
    const status = watch("Status");

    const onSubmit = (data: any) => {
        console.log("Payload Final:", data);
    };

    const [portalLanguages, setPortalLanguages] = useState<PortalLanguageDto[]>([]);
    const [listasPorIdioma, setListasPorIdioma] = useState<any[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                // 1. Cargar Idiomas
                const languages = await getPortalLanguages();
                if (!cancelled) setPortalLanguages(languages);

                // 2. Aquí podrías cargar TODAS las listas una sola vez 
                // o esperar a que el usuario elija un idioma (Punto 3 abajo)
            } catch (error) {
                console.error("Error cargando catálogos", error);
            }
        })();

        return () => { cancelled = true; };
    }, []); // <--- IMPORTANTE: Array vacío aquí

    // Observamos qué idioma seleccionó el jefe en el Dropdown
    const selectedLang = watch("IdiomaCodigo");

    useEffect(() => {
        if (!selectedLang) {
            setListasPorIdioma([]); // Limpiar si no hay idioma
            return;
        }

        (async () => {
            try {
                // Supongamos que tienes esta función en tu API
                // const listas = await getListasDistribucionByLang(selectedLang);
                // setListasPorIdioma(listas);
                console.log("Cargando listas para:", selectedLang);
            } catch {
                console.error("Error al cargar listas");
            }
        })();
    }, [selectedLang]); // <--- Reacciona cada vez que el dropdown cambia

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
            {/* HEADER: Nombre y Status */}
            <div className="flex justify-content-between align-items-center mb-4 surface-card p-3 shadow-1 border-round">
                <div className="flex flex-column gap-2 w-full md:w-5">
                    <label className="font-bold">Nombre del Objetivo</label>
                    <InputText {...register("Nombre")} placeholder="Ej: Recuperación de contraseña" />
                    {errors.Nombre && <small className="p-error">{errors.Nombre.message as string}</small>}
                </div>

                <div className="flex flex-column align-items-end gap-2">
                    <label className="font-bold">Estatus del Objetivo</label>
                    <Controller
                        name="Status"
                        control={control}
                        render={({ field }) => (
                            <SelectButton
                                {...field}
                                options={statusOptions}
                                itemTemplate={(option) => (
                                    <div className="flex align-items-center gap-2">
                                        <i className={option.icon}></i>
                                        <span>{option.label}</span>
                                    </div>
                                )}
                            />
                        )}
                    />
                </div>
                {/* Añadir esto debajo del input de 'Nombre' */}
                <div className="grid w-full mt-3">
                    <div className="col-12 md:col-4 field">
                        <label className="font-bold">Idioma</label>
                        <Controller
                            name="IdiomaCodigo"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    {...field}
                                    options={portalLanguages} // Viene de tu catálogo
                                    optionLabel="Name"
                                    optionValue="Code"
                                    placeholder="Seleccione Idioma"
                                    className="w-full"
                                />
                            )}
                        />
                    </div>
                    <div className="col-12 md:col-8 field">
                        <label className="font-bold">Listas de Distribución Sugeridas</label>
                        <Controller
                            name="ListasDistribucion"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    {...field}
                                    options={listasPorIdioma} // Se filtra cuando cambia el Dropdown de arriba
                                    optionLabel="Nombre"
                                    optionValue="Id"
                                    placeholder="Seleccione Listas"
                                    className="w-full"
                                    display="chip"
                                    disabled={!watch("IdiomaCodigo")}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            <div className="grid">
                {/* COLUMNA IZQUIERDA: REGLAS (SWITCHES) */}
                <div className="col-12 md:col-4">
                    <Card title="Configuración de Reglas" className="h-full shadow-2">
                        {Object.entries(configWatch).map(([key, value]: [string, any]) => (
                            <div key={key} className="mb-4 p-3 surface-100 border-round">
                                <div className="flex justify-content-between mb-2">
                                    <span className="font-bold text-primary capitalize">{key === 'Body' ? 'Cuerpo' : key}</span>
                                    {value.Bloqueado && <Tag severity="danger" value="CONTENIDO FIJO" />}
                                </div>

                                <div className="flex flex-column gap-2">
                                    <div className="flex justify-content-between">
                                        <label>¿Visible?</label>
                                        <InputSwitch checked={value.Visible} onChange={(e) => setValue(`ConfigCampos.${key}.Visible` as any, e.value)} />
                                    </div>
                                    <div className="flex justify-content-between text-sm opacity-70">
                                        <label>¿Obligatorio?</label>
                                        <InputSwitch checked={value.Requerido} onChange={(e) => setValue(`ConfigCampos.${key}.Requerido` as any, e.value)} />
                                    </div>
                                    <div className="flex justify-content-between text-sm">
                                        <label className="text-red-500 font-semibold">¿Bloquear?</label>
                                        <InputSwitch checked={value.Bloqueado} onChange={(e) => setValue(`ConfigCampos.${key}.Bloqueado` as any, e.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Message severity="info" className="w-full" text="Los campos bloqueados se vuelven 'Sólo Lectura' en la creación de la plantilla." />
                    </Card>
                </div>

                {/* COLUMNA DERECHA: CONTENIDO (TABS IDIOMAS) */}
                <div className="col-12 md:col-8">
                    <Card title="Contenido Base / Default" className="shadow-2">
                        {/* ASUNTO */}
                        {configWatch.Asunto.Visible && (
                            <div className="field mb-4">
                                <label className="block font-bold mb-2">Asunto</label>
                                <InputText
                                    className="w-full"
                                    disabled={configWatch.Asunto.Bloqueado}
                                    {...register("Contenido.Asunto" as any)}
                                    placeholder={configWatch.Asunto.Bloqueado ? "Escribe el contenido fijo aquí..." : "Asunto opcional..."}
                                />
                            </div>
                        )}

                        {/* CUERPO TIPO OUTLOOK */}
                        {configWatch.Body.Visible && (
                            <div className="field mb-4">
                                <label className="block font-bold mb-2">Cuerpo del Correo</label>
                                <Controller
                                    name={'Contenido.Html'}
                                    control={control}
                                    render={({ field }) => (
                                        <Editor
                                            value={typeof field.value === 'string' ? field.value : ""}
                                            onTextChange={(e: EditorTextChangeEvent) => field.onChange(e.htmlValue)}
                                            style={{ height: '320px' }}
                                            // headerTemplate={renderHeaderEditor()}
                                            readOnly={configWatch.Body.Bloqueado}
                                            placeholder={configWatch.Body.Bloqueado ? "Este contenido no se podrá editar después..." : "Escribe aquí..."}
                                        />
                                    )}
                                />
                            </div>
                        )}

                        {/* URL REUNION */}
                        {configWatch.UrlReunion.Visible && (
                            <div className="field">
                                <label className="block font-bold mb-2">URL Reunión</label>
                                <InputText
                                    className="w-full"
                                    disabled={configWatch.UrlReunion.Bloqueado}
                                    {...register(`ContenidoIdiomas.UrlReunion` as any)}
                                />
                            </div>
                        )}
                    </Card>

                    <div className="flex justify-content-end mt-4 gap-3">
                        <Button type="button" label="Cancelar" outlined severity="secondary" />
                        <Button type="submit" label="Guardar Objetivo" icon="pi pi-save" />
                    </div>
                </div>
            </div>
        </form>
    );
}
