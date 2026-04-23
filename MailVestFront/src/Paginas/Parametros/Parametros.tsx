/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef, useState } from "react";
import { Permisos } from "../../Constantes/Permisos";
import { usePermiso } from "../../Hooks/usePermiso"
import { Toast } from "primereact/toast";
import type ParametrosCat from "./Modelos/ParametrosCat";
import API from "../../API/ClientApi";
import { SmartDataTable, type LazyLoadState, type SmartColumn, type SmartLoaderResult } from "../../Componentes/Shared/DataTable/SmartDataTable";
import { FilterMatchMode } from "primereact/api";
import { InputSwitch } from "primereact/inputswitch";
import type { DataTableRowEditCompleteEvent } from "primereact/datatable";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import FormularioParam from "./FormularioParam";
import { Button } from "primereact/button";
import { useNavigate } from "react-router";

export default function Parametros() {

    const { tienePermiso } = usePermiso();

    const puedeEditar = tienePermiso(Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminParametros.permisos.Cambio);
    const puedeAgregar = tienePermiso(Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminParametros.permisos.Alta);
    const puedeApagar = tienePermiso(Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminParametros.permisos.Baja);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [parametros, setParametros] = useState<ParametrosCat[]>([]);
    const [reloadKey, setReloadKey] = useState(0);
    const toast = useRef<Toast | null>(null);

    const [pendingUpdate, setPendingUpdate] = useState<any | null>(null);
    const [showNewParam, setShowNewParam] = useState(false);

    const parametroCorreos = ((import.meta as any).env.VITE_PARAMETROS_CORREOS as string | undefined) ?? "";

     const navigate = useNavigate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const emptyParam: ParametrosCat = {
        Id: 0,
        Parametro: "",
        Descripcion: "",
        Valor: "",
        Estatus: true,
    };

    const [newParam, setNewParam] = useState<ParametrosCat>(emptyParam);

    const columns: SmartColumn<ParametrosCat>[] = [
        {
            field: "Parametro",
            header: "Nombre Parametro",
            width: "2rem",
            filter: true,
            filterPlaceholder: "Buscar parametro",
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: (row) => (row?.Parametro ?? '').trim() !== parametroCorreos.toString(),
        },
        {
            field: "Descripcion",
            header: "Descripcion",
            width: "10rem",
            filter: true,
            filterPlaceholder: "Buscar Descripcion",
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
        },
        {
            field: "Valor",
            header: "Valor",
            width: "5rem",
            filter: true,
            filterPlaceholder: "Buscar por valor",
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
        },
        {
            field: "Estatus",
            header: "Estatus",
            width: "6rem",
            filter: true,
            filterPlaceholder: "Buscar por estatus",
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: puedeApagar,
            body: (row: ParametrosCat) => (
                <div className="flex items-center justify-center">
                    <InputSwitch checked={row.Estatus} disabled={true} />
                </div>
            ),
            editor: (options: any) => (
                <div className="flex items-center justify-center">
                    <InputSwitch
                        checked={Boolean(options.value)}
                        disabled={!puedeApagar}
                        onChange={(e) => {
                            if (!puedeApagar) return;
                            options.editorCallback?.(e.value)
                        }}
                    />
                </div>
            )
        },
    ];

    const loader = useCallback(
        async (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _state: LazyLoadState,
        ): Promise<SmartLoaderResult<ParametrosCat>> => {
            try {
                const response = await API.get<ParametrosCat[]>('/parametros/all');
                const data = Array.isArray(response.data) ? response.data : [];
                setParametros(data.map(pa => ({
                    Id: Number(pa.Id),
                    Parametro: pa.Parametro,
                    Descripcion: pa.Descripcion,
                    Valor: pa.Valor,
                    Estatus: pa.Estatus,
                })));
                return {
                    data,
                    totalRecords: data.length,
                };
            } catch (err) {
                console.error("Error obteniendo parametros", err);

                return {
                    data: [],
                    totalRecords: 0
                };
            }
        },
        [],
    );

    const saveParam = useCallback(
        async (payload: any) => {
            try {
                const response = await API.put(`/parametros/updateParam/${payload.Id}`, payload);
                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Actualización de paramatero exitosa',
                        detail: 'Los datos del parametro se guardaron correctamente.',
                        life: 3000,
                    });
                    setReloadKey(prev => prev + 1);
                }
                else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error al actualizar parametro.',
                        detail: 'No se pudo actualizar el parametro. Intente de nuevo.',
                        life: 3000,
                    });
                }
            } catch (err) {
                console.error("Error actualizando parametro", err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error al actualizar parametro',
                    detail: 'No se pudo actualizar el parametro. Contactar al administrador.',
                    life: 3000
                });
            }
        }, []
    );

    const saveNewParam = useCallback(
        async (payload: any) => {
            try {
                const response = await API.post('/parametros/newParam', payload);
                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Actualización de paramatero exitosa',
                        detail: 'Los datos del parametro se guardaron correctamente.',
                        life: 3000,
                    });
                    setShowNewParam(false);
                    setReloadKey(prev => prev + 1);
                }
            } catch (err: any) {
                const backendMsg: string | undefined = err.response?.data?.message;

                const detail =
                    backendMsg ??
                    'No se pudo crear el parametro. Intente mas tarde.';

                toast.current?.show({
                    severity: 'error',
                    summary: 'Error al crear parametro',
                    detail,
                    life: 5000
                });
            }
        }, []
    );

    const handleRowEditComplete = useCallback(
        async (e: DataTableRowEditCompleteEvent) => {
            const newData = e.newData as ParametrosCat;
            const original = e.data as ParametrosCat;

            const payload = {
                Id: newData.Id,
                Parametro: newData.Parametro,
                Descripcion: newData.Descripcion,
                Valor: newData.Valor,
                Estatus: puedeApagar ? newData.Estatus : original.Estatus,
            };
            setPendingUpdate(payload);

            confirmDialog({
                group: 'updateParam',
                message: `¿Guardar cambios para ${newData.Parametro}?`,
                header: 'Confirmar actualización',
                className: 'mv-confirm-dialog',
                acceptLabel: 'Guardar',
                rejectLabel: 'Cancelar',
                acceptClassName: 'p-button mv-confirm-accept',
                rejectClassName: 'p-button-text mv-confirm-reject',
                defaultFocus: 'accept',
                accept: () => {
                    saveParam(payload);
                },
                reject: () => {
                    toast.current?.show({
                        severity: 'info',
                        summary: 'Edicion cancelada',
                        detail: 'No se guardaron los cambios',
                        life: 2500
                    });
                },
            });
        }, [puedeApagar, saveParam]
    );

    const handleAddClick = useCallback(() => {
        setNewParam(emptyParam);
        setShowNewParam(true);
    }, [emptyParam]);

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog
                group="updateParam"
                className="mv-confirm-dialog"
                maskClassName="mv-confirm-dialog-mask"
                content={(options: any) => {
                    if (!pendingUpdate) {
                        return null;
                    }

                    const iconClass = 'pi pi-save';

                    return (
                        <div ref={options.contentRef} className="mv-confirm-body">
                            <div className="mv-confirm-icon" >
                                <i className={iconClass} />
                            </div>
                            <h3 ref={options.headerRef} className="mv-confirm-title">
                                {options.message?.header}
                            </h3>
                            <p className="mv-confirm-text">
                                {options.message?.message}
                            </p>
                            <div ref={options.footerRef} className="mv-confirm-footer">
                                <button
                                    type="button"
                                    className="p-button p-component p-button-primary w-8rem mv-confirm-accept"
                                    style={{ justifyContent: "center" }}
                                    onClick={(event) => {
                                        options.hide(event);
                                        if (pendingUpdate) {
                                            saveParam(pendingUpdate);
                                        }
                                    }}
                                >
                                    Guardar
                                </button>
                                <button
                                    type="button"
                                    className="p-button p-component p-button-outlined w-8rem mv-confirm-reject"
                                    style={{ justifyContent: "center" }}
                                    onClick={(event) => {
                                        options.hide(event);
                                        toast.current?.show({
                                            severity: 'info',
                                            summary: 'Edicion cancelada',
                                            detail: 'No se guardaron los cambios',
                                            life: 3000,
                                        });
                                    }}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )
                }}
            />
            <div className="flex  align-items-center justify-content-between mb-3">
                <h2 className="text-2x1 font-bold">
                    Parametros
                </h2>
                <Button
                    type="button"
                    label="Idiomas"
                    outlined
                    onClick={() => navigate("/Idiomas")}
                    disabled={!puedeEditar || !puedeAgregar || !puedeApagar} 
                />
            </div>
            <Dialog
                visible={showNewParam}
                onHide={() => { setShowNewParam(false); }}
                header="Nuevo Parametro"
                modal
                resizable
                style={{ width: "42rem", minWidth: "42rem" }}
                headerClassName="dialog-header-gradient"
                contentClassName="dialog-content-user"
            >
                <p className="fu-subtitle">
                    Capturar información.
                </p>
                <FormularioParam
                    defaultValues={newParam}
                    onSubmit={async (values) => {
                        await saveNewParam(values);
                        setShowNewParam(false);
                    }}
                    onCancel={() => setShowNewParam(false)}
                />
            </Dialog>
            <SmartDataTable<ParametrosCat>
                key={reloadKey}
                idField="Id"
                title="Parametros"
                columns={columns}
                pageSize={50}
                scrollHeight="550px"
                canEdit={puedeEditar}
                canAdd={puedeAgregar}
                onAddClick={handleAddClick}
                editMode="row"
                onRowEditComplete={puedeEditar ? handleRowEditComplete : undefined}
                exportFileName="parametros"
                globalFilterFields={
                    ['Descripcion', 'Parametro', 'Valor'] as (keyof ParametrosCat)[]
                }
                loadMode="client"
                loader={loader}
            />
        </div>
    )
}