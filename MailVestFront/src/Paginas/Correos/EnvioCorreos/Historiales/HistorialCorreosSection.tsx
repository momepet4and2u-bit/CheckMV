import { Toast } from "primereact/toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { usePermiso } from "../../../../Hooks/usePermiso";
import { Permisos } from "../../../../Constantes/Permisos";
import { useAuth } from "../../../../Context/UserContext/AuthContext";
import API from "../../../../API/ClientApi";
import { SmartDataTable, type LazyLoadState, type SmartColumn, type SmartLoaderResult } from "../../../../Componentes/Shared/DataTable/SmartDataTable";
import { createHubConnection } from "../../../../Hooks/useSignalR";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";

type Props = {
    onOpenMail?: () => void;
};
type EmailDraftApi = {
    Id: number;
    PlantillaNombre: string;

    Estatus: number;
    Revision: number;

    CreadoPor: string;
    Creacion: string;
    Actualizado: string;

    IsApprover?: boolean;

    RequiredCount?: number;
    RequiredApprovedCount?: number;
    HasRequiredRejection?: boolean;

    EnEdicion?: boolean;
    EnEdicionPor?: string;

};

type EmailDraftRows = EmailDraftApi & {
    acciones: string;
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
};

function estatusLabel(estatus: number): { label: string; severity: "success" | "warning" | "danger" | "info" | "secondary" } {
    switch (estatus) {
        case 0:
            return { label: "Borrador", severity: "secondary" };
        case 1:
            return { label: "En revisión", severity: "info" };
        case 2:
            return { label: "Aprobado", severity: "success" };
        case 3:
            return { label: "Rechazado", severity: "danger" };
        case 4:
            return { label: "Envio", severity: "warning" };
        case 5:
            return { label: "Enviado", severity: "success" };
        case 6:
            return { label: "Fallido", severity: "danger" };
        default:
            return { label: `Estatus ${estatus}`, severity: "secondary" };
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HistorialCorreosSection(_props: Props) {

    const [refreshKey, setRefreshKey] = useState(0);
    const toast = useRef<Toast | null>(null);

    const navigate = useNavigate();

    const { tienePermiso } = usePermiso();

    const puedeEditar = tienePermiso(Permisos.Correos.submodulos.AdminCorreos.permisos.Cambio);
    const puedeEnviar = tienePermiso(Permisos.Correos.submodulos.AdminCorreos.permisos.Envio);

    const { token, user } = useAuth();

    const currentUsername = user?.Usuario;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rowPatch, setRowPatch] = useState<{ id: number; patch: any; nonce: number; } | null>(null);

    const aprobar = useCallback(
        async (id: number) => {
            try {
                await API.post(`/correosDraft/aprobar/${id}`);
                toast.current?.show({
                    severity: "success",
                    summary: "Aprobado",
                    detail: "Aprobacion registrada.",
                    life: 2500,
                });
                setRefreshKey((x) => x + 1);
            } catch (err) {
                console.error(err);
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "No se pudo aprobar el correo.",
                    life: 2500,
                });
            }
        }, []
    );

    const rechazar = useCallback(
        async (id: number) => {
            try {
                await API.post(`/correosDraft/rechazar/${id}`);
                toast.current?.show({
                    severity: "success",
                    summary: "Rechazado",
                    detail: "Rechazo registrado.",
                    life: 2500,
                });
                setRefreshKey((x) => x + 1);
            } catch (err) {
                console.error(err);
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "No se pudo rechazar el correo.",
                    life: 2500,
                });
            }
        }, []
    );

    const sendPrueba = useCallback(
        async (id: number) => {
            try{
                await API.post(`/correosDraft/enviarPrueba/${id}`);
            } catch{ /**/}
        }, []
    );

    const columns: SmartColumn<EmailDraftRows>[] = useMemo(() => {
        return [
            {
                field: 'PlantillaNombre',
                header: 'Plantilla origen',
                with: '280px',
                filter: true,
                filterPlaceholder: 'Buscar...',
            },
            {
                field: 'Creacion',
                header: 'Creado',
                width: '140px',
                filter: true,
                filterPlaceholder: 'YYYY-MM-DD',
                body: (row) => formatData(row.Creacion),
            },
            {
                field: 'CreadoPor',
                header: 'Creado por',
                width: '140px',
                filter: true,
                filterPlaceholder: 'Creado por...',
            },
            {
                field: 'Actualizado',
                header: 'Actualizado',
                width: '140px',
                filter: true,
                filterPlaceholder: 'YYYY-MM-DD',
                body: (row) => formatData(row.Actualizado),
            },
            {
                field: 'Estatus',
                header: 'Estatus',
                width: '110px',
                filter: true,
                filterPlaceholder: 'Estatus',
                body: (row) => {
                    const x = estatusLabel(Number(row.Estatus));
                    return <Tag value={x.label} severity={x.severity} />;
                }
            },
            {
                field: 'Revision',
                header: 'Version de correo',
                width: '110px',
                filter: true,
                filterPlaceholder: 'Revision...'
            },
            {
                field: 'EnEdicion',
                header: 'Edición',
                body: (row) => (row.EnEdicion && row.IsApprover) ? <span>En edición: {row.EnEdicionPor ?? "otro usuario"}</span> : <span>Libre para editar</span>
            },
            {
                field: 'acciones',
                header: 'Acciones',
                width: '320px',
                body: (row) => {
                    const approve = !!row.IsApprover && puedeEnviar;
                    const allowApprove = approve && row.Estatus === 1;
                    const canEdit = row.Estatus === 0 || row.Estatus === 3;
                    const lockedByOther = !!row.EnEdicion && !!row.EnEdicionPor && row.EnEdicionPor !== currentUsername;
                    return (
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                size="small"
                                icon="pi pi-eye"
                                label="Ver"
                                outlined
                                onClick={() => navigate(`/Correos/VerCorreo/${row.Id}`)}
                            />
                            <Button
                                size="small"
                                icon="pi pi-pencil"
                                label="Editar"
                                outlined
                                disabled={!puedeEditar ||!canEdit || lockedByOther}
                                onClick={() => navigate(`/Correos/EditarCorreo/${row.Id}`)}
                            />
                            <Button
                            size="small"
                            icon= "pi pi-send"
                            label="Enviar prueba."
                            outlined
                            disabled={!puedeEnviar || row.Estatus !== 0}
                            onClick={async () => {
                                sendPrueba(row.Id);
                            }}
                            />
                            {allowApprove && (
                                <>
                                    <Button
                                        size="small"
                                        icon="pi pi-check-circle"
                                        label="Aprobar"
                                        severity="success"
                                        outlined
                                        disabled={!puedeEnviar}
                                        onClick={async () => {
                                            aprobar(row.Id);
                                        }}
                                    />
                                    <Button
                                        size="small"
                                        icon="pi pi-times"
                                        label="Rechazar"
                                        severity="danger"
                                        outlined
                                        disabled={row.Estatus == 2}
                                        onClick={() => {
                                            rechazar(row.Id);
                                        }}
                                    />
                                </>
                            )}
                        </div>
                    )
                }

            }
        ];
    }, [aprobar, currentUsername, navigate, puedeEditar, puedeEnviar, rechazar, sendPrueba]);

    const loader = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (_state: LazyLoadState): Promise<SmartLoaderResult<EmailDraftRows>> => {
            try {
                const response = await API.get<EmailDraftApi[]>('/correosDraft/all');
                const raw = Array.isArray(response.data) ? response.data : [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data: EmailDraftRows[] = raw.map((t: any) => {
                    return {
                        ...t,
                        acciones: "x",
                    }
                });
                return {
                    data,
                    totalRecords: data.length,
                };
            } catch (err) {
                console.error('Error obteniendo correos', err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron obtener los correos.',
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patchRow = (payload: any) => {
            if (!mounted) return;

            const id = Number(payload?.id ?? payload?.Id);
            if (!id) return;

            const patch = payload?.patch ?? {
                Estatus: payload?.Estatus ?? payload?.estatus,
                Revision: payload?.Revision ?? payload?.revision,
                IsApprover: payload?.IsApprover ?? payload?.isApprover,
            };

            setRowPatch({ id, patch, nonce: Date.now() });
        };
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patchRowEdit = (payload: any) => {
            if(!mounted) return;

            const id = Number(payload?.id ?? payload?.Id);
            if(!id) return;

            const patch = payload?.patch ?? {
                EnEdicion: payload?.EnEdicion ?? payload?.enEdicion,
                EnEdicionPor: payload?.EnEdicionPor ?? payload?.enEdicionPor,
            };
            setRowPatch({id, patch, nonce: Date.now()});
        }

        async function start() {
            try {
                await conn.start();
                await conn.invoke("Join", "correos");
                await conn.invoke("Join", "mailDraft");

                conn.on("correosBloqueoCambio", patchRow);
                conn.on("correoDraftActualizado", patchRow);
                conn.on("mailDraftEdicionCambio",patchRowEdit);
            } catch (e) {
                console.error(e);
            }
        };

        start().catch(console.error);

        return () => {
            mounted = false;
            conn.off("correosBloqueoCambio", patchRow);
            conn.off("correoDraftActualizacion", patchRow);
            conn.off("mailDraftEdicionCambio", patchRowEdit);
            conn.invoke("Leave", "mailDraft").catch(() => { });
            conn.invoke("Leave", "correos").catch(() => { });
            conn.stop().catch(() => { });
        };
    }, [token]);

    return (
        <div>
            <Toast ref={toast} />

            <SmartDataTable<EmailDraftRows>
                key={refreshKey}
                idField="Id"
                title="Plantillas"
                loadMode="client"
                columns={columns}
                loader={loader}
                externalRowPatch={rowPatch}
                pageSize={25}
                scrollHeight="650px"
                globalFilterFields={["PlantillaNombre", "Creacion", "CreadoPor", "Actualizado", "Estatus", "Revision"]}
            />
        </div>
    )
}