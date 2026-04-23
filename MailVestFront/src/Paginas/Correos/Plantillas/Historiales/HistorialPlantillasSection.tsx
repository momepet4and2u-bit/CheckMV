/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "primereact/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SmartDataTable, type LazyLoadState, type SmartColumn, type SmartLoaderResult } from "../../../../Componentes/Shared/DataTable/SmartDataTable";
import { Tag } from "primereact/tag";
import { type EmailTemplate } from "../Templates/emailTemplates.store";
import { Toast } from "primereact/toast";
import API from "../../../../API/ClientApi";
import { useNavigate } from "react-router";
import EmailTemplatePreviewDialog from "./EmailTemplatePreviewDialog";
import { usePermiso } from "../../../../Hooks/usePermiso";
import { Permisos } from "../../../../Constantes/Permisos";
import { createHubConnection } from "../../../../Hooks/useSignalR";
import { useAuth } from "../../../../Context/UserContext/AuthContext";

type Props = {
    onOpenTemplate?: () => void;
};

type UploadMode = "IMAGE" | "FILE";

export type EmailTemplateApi = {
    Id: number;
    Name: string;
    ClickUrl: string;
    ImageUrlES?: string;
    ImageUrlEN?: string;

    Attachment?: any[];

    ImageAlt: string;
    ValidoDesde: string;
    ValidoHasta: string;
    Creado?: string;

    ES?: {
        Subject: string;
        Html: string;
    };
    EN?: {
        Subject: string;
        Html: string;
    };

    Bloqueado: boolean;

    EnEdicion?: boolean;
    EnEdicionPor?: string | null;
}

type EmailTemplateRows = EmailTemplateApi & {
    vigente: boolean;
    acciones: string;
    UploadMode: string;
}

function toSafeDate(value?: string): Date | null {

    if (!value) return null;

    const trimmed = value.replace(/(\.\d{3})\d+/, "$1");
    const d = new Date(trimmed);

    return Number.isNaN(d.getTime()) ? null : d;
}

function formatData(value?: string, withTime = false): string {

    const d = toSafeDate(value);
    if (!d) return value ?? "";

    return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    }).format(d);
}

function isActiveByDate(validFrom: string, validTo: string) {
    if (!validFrom || !validTo) return false;

    const now = new Date();
    const from = new Date(validFrom);
    const to = new Date(validTo);
    to.setHours(23, 59, 59, 999);
    const vigente = now >= from && now <= to 
    return vigente;
}

const detectUploadMode = (tpl: EmailTemplateApi): UploadMode => {
    const hasImg = !!tpl.ImageUrlES || !!tpl.ImageUrlEN;

    // Soporta Archivo como array (de lo que sea). Lo importante es la longitud.
    const hasFiles =
        Array.isArray(tpl.Attachment) && tpl.Attachment.length > 0;

    // Si tu negocio garantiza exclusividad, esto es suficiente.
    if (hasImg && !hasFiles) return "IMAGE";
    if (hasFiles && !hasImg) return "FILE";

    // Fallback (si API no manda archivos): si hay imagen, IMAGE; si no, FILE
    return hasImg ? "IMAGE" : "FILE";
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HistorialPlantillasSection(_props: Props) {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [refreshKey, setRefreshKey] = useState(0);
    const toast = useRef<Toast | null>(null);

    const navigate = useNavigate();

    const [viewOpen, setViewOpen] = useState(false);
    const [viewing, setViewing] = useState<EmailTemplateApi | null>(null);

    const { tienePermiso } = usePermiso();

    const puedeEditar = tienePermiso(Permisos.Correos.submodulos.AdminPlantillas.permisos.Cambio);
    const puedeBorrar = tienePermiso(Permisos.Correos.submodulos.AdminPlantillas.permisos.Baja);

    const { token } = useAuth();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rowPatch, setRowPatch] = useState<{ id: number; patch: any; nonce: number } | null>(null);

    const openView = (row: EmailTemplateApi) => {
        setViewing(row);
        setViewOpen(true);
    }

    const closeView = () => {
        setViewing(null);
        setViewOpen(false);
    }

    const eliminate = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (id: number) => {
            try {
                const response = await API.delete(`/plantillas/delete/${id}`);
                const data = Array.isArray(response.data) ? response.data : [];
                setRefreshKey(prev => prev + 1);
                return {
                    data,
                    totalRecords: data.length,
                };
            } catch (err) {
                console.error('Error obteniendo plantillas', err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron obtener las plantillas.',
                    life: 4000
                });
                return {
                    data: [],
                    totalRecords: 0,
                };
            }
        },
        [],
    );

    const columns: SmartColumn<EmailTemplateRows>[] = useMemo(() => {
        return [
            {
                field: 'Name',
                header: 'Nombre',
                width: '280px',
                filter: true,
                filterPlaceholder: 'Buscar...',
            },
            {
                field: 'ValidoDesde',
                header: 'Desde',
                width: '140px',
                filter: true,
                filterPlaceholder: 'YYYY-MM-DD',
            },
            {
                field: 'ValidoHasta',
                header: 'Hasta',
                width: '140px',
                filter: true,
                filterPlaceholder: 'YYYY-MM-DD',
            },
            {
                field: 'Creado',
                header: 'Creado',
                width: '140px',
                filter: true,
                filterPlaceholder: 'YYYY-MM-DD',
                body: (row) => formatData(row.Creado),
            },
            {
                field: 'vigente',
                header: 'Vigente',
                width: '110px',
                body: (row) => (
                    <Tag
                        value={row.vigente ? "Si" : "No"}
                        severity={row.vigente ? "success" : "danger"}
                    />
                ),
            },
            {
                field: 'acciones',
                header: 'Acciones',
                width: '320px',
                body: (row) => (
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            size="small"
                            icon="pi pi-eye"
                            label="Ver"
                            outlined
                            onClick={() => {
                                openView(row);
                            }}
                        />
                        <Button
                            size="small"
                            icon="pi pi-pencil"
                            label="Editar"
                            outlined
                            disabled={!puedeEditar || row.Bloqueado}
                            onClick={() => navigate(`/Plantillas/EditarPlantilla/${row.Id}`)}
                        />
                        <Button
                            size="small"
                            icon="pi pi-trash"
                            label="Eliminar"
                            security="danger"
                            outlined
                            disabled={!puedeBorrar || row.Bloqueado || row.EnEdicion}
                            onClick={async () => {
                                eliminate(row.Id);
                            }}
                        />
                    </div>
                ),
            },
            {
                field: 'EnEdicion',
                header: 'Edicion',
                body: (row) => row.EnEdicion ? <span>En edición: {row.EnEdicionPor ?? "otro usuario"}</span> : <span>Libre para editar</span>
            },
        ];
    }, [navigate, eliminate, puedeBorrar, puedeEditar]);

    const loader = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (_state: LazyLoadState): Promise<SmartLoaderResult<EmailTemplateRows>> => {
            try {
                const response = await API.get<EmailTemplate[]>('/plantillas/all');
                const raw = Array.isArray(response.data) ? response.data : [];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data: EmailTemplateRows[] = raw.map((t: any) => {
                    let vigente = false;
                    const vigenteTiemp = isActiveByDate(t.ValidoDesde, t.ValidoHasta);
                    const bloqueado = t.Bloqueado;
                    if(vigenteTiemp){
                        if(bloqueado){
                            vigente = false;
                        } else {
                            vigente = true;
                        }
                    }
                    return {
                        ...t,
                        vigente: vigente,
                        acciones: "x",
                        UploadMode: (detectUploadMode(t))
                    }
                });
                return {
                    data,
                    totalRecords: data.length,
                };
            } catch (err) {
                console.error('Error obteniendo plantillas', err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron obtener las plantillas.',
                    life: 4000
                });
                return {
                    data: [],
                    totalRecords: 0,
                };
            }
        },
        [],
    );

    useEffect(() => {
        let mounted = true;

        const conn = createHubConnection(() => token ?? "");

        async function start() {
            await conn.start();
            await conn.invoke("Join", "plantillas");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            conn.on("plantillaBloqueadaCambio", (payload: any) => {
                if (!mounted) return;

                const id = Number(payload?.id ?? payload?.Id);
                const bloqueado = Boolean(payload?.bloqueado ?? payload?.Bloqueado);

                setRowPatch({
                    id: id,
                    patch: { Bloqueado: bloqueado },
                    nonce: Date.now(),
                });
            });

            conn.on(
                "plantillaEdicionCambio",
                (payload: { id: number; enEdicion: boolean; enEdicionPor?: string | null }) => {
                    if (!mounted) return;

                    setRowPatch({
                        id: payload.id,
                        patch: {
                            EnEdicion: payload.enEdicion,
                            EnEdicionPor: payload.enEdicionPor ?? null,
                        },
                        nonce: Date.now(),
                    })
                }
            )
        };

        start().catch(console.error);

        return () => {
            mounted = false;
            conn.off("plantillaBloqueadaCambio");
            conn.off("plantillaEdicionCambio");
            conn.invoke("Leave", "plantillas").catch(() => { });
            conn.stop().catch(() => { });
        };
    }, [token]);

    return (
        <div>
            <Toast ref={toast} />

            <SmartDataTable<EmailTemplateRows>
                key={refreshKey}
                idField="Id"
                title="Plantillas"
                loadMode="client"
                columns={columns}
                loader={loader}
                externalRowPatch={rowPatch}
                pageSize={25}
                scrollHeight="650px"
                globalFilterFields={["Name", "ValidoDesde", "ValidoHasta", "Creado"]}
            />

            <EmailTemplatePreviewDialog
                open={viewOpen}
                template={viewing}
                onClose={closeView}
            />
        </div>
    )
}