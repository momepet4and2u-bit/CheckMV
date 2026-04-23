/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef, useState } from "react";
import { Permisos } from "../../Constantes/Permisos";
import { usePermiso } from "../../Hooks/usePermiso"
import { Toast } from "primereact/toast";
import API from "../../API/ClientApi";
import { SmartDataTable, type LazyLoadState, type SmartColumn, type SmartLoaderResult } from "../../Componentes/Shared/DataTable/SmartDataTable";
import { FilterMatchMode } from "primereact/api";
import { InputSwitch } from "primereact/inputswitch";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import type AprobadoresCat from "./Modelos/AprobadoresCat";
import FormularioAprobador from "./FormularioAprobador";

export default function Aprobadores() {

    const { tienePermiso } = usePermiso();

    const puedeEditar = tienePermiso(Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminAprobador.permisos.Cambio);
    const puedeAgregar = tienePermiso(Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminAprobador.permisos.Alta);
    const puedeApagar = tienePermiso(Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminAprobador.permisos.Baja);
    const puedeEditarDefault = tienePermiso(Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminAprobador.permisos.CambioDefault);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [aprobadores, setAprobadores] = useState<AprobadoresCat[]>([]);
    const [defaultCount, setDefaultCount] = useState<number>(0);
    const [reloadKey, setReloadKey] = useState(0);
    const toast = useRef<Toast | null>(null);

    const [pendingUpdate, setPendingUpdate] = useState<any | null>(null);
    const [showNewApprov, setShowNewApprov] = useState(false);

    const [showEditApprov, setShowEditApprov] = useState(false);
    const [editApprov, setEditApprov] = useState<AprobadoresCat | null>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const emptyAprobador: AprobadoresCat = {
        Id: 0,
        Usuario: "",
        Email: "",
        UltimoUso: "",
        Estatus: true,
        IsDefault: false,
    };

    const [newAprob, setNewAprob] = useState<AprobadoresCat>(emptyAprobador);

    const columns: SmartColumn<AprobadoresCat>[] = [
        {
            field: "Usuario",
            header: "Usuario",
            width: "2rem",
            filter: true,
            filterPlaceholder: "Buscar usuario",
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
        },
        {
            field: "Email",
            header: "Email",
            width: "10rem",
            filter: true,
            filterPlaceholder: "Buscar email",
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
        },
        {
            field: "UltimoUso",
            header: "Ultima vez que aprobo",
            width: "5rem",
            filter: true,
            filterPlaceholder: "Buscar por fecha de uso",
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
        },
        {
            field: "IsDefault",
            header: "Default",
            width: "1rem",
            filter: false,
            editable: false,
            body: (rowData) => (
                <span>{rowData.IsDefault ? "Si" : "No"}</span>
            )
        },
        {
            field: "Estatus",
            header: "Estatus",
            width: "6rem",
            filter: true,
            filterPlaceholder: "Buscar por estatus",
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: puedeApagar,
            body: (row: AprobadoresCat) => (
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
        ): Promise<SmartLoaderResult<AprobadoresCat>> => {
            try {
                const response = await API.get<AprobadoresCat[]>('/aprobadores/all');
                const data = Array.isArray(response.data) ? response.data : [];

                const countDefaults = data.filter((x: any) => x?.IsDefault === true).length;
                setDefaultCount(countDefaults);

                setAprobadores(data.map(pa => ({
                    Id: Number(pa.Id),
                    Usuario: pa.Usuario,
                    Email: pa.Email,
                    UltimoUso: pa.UltimoUso,
                    IsDefault: Boolean(pa.IsDefault),
                    Estatus: Boolean(pa.Estatus),
                })));
                return {
                    data,
                    totalRecords: data.length,
                };
            } catch (err) {
                console.error("Error obteniendo Aprobadores", err);

                return {
                    data: [],
                    totalRecords: 0
                };
            }
        },
        [],
    );

    const saveProv = useCallback(
        async (payload: any) => {
            setPendingUpdate(payload);
            try {
                const response = await API.put(`/aprobadores/updateAprob/${payload.Id}`, payload);
                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Actualización de Aprobadores exitosa',
                        detail: 'Los datos del Aprobador se guardaron correctamente.',
                        life: 3000,
                    });
                    setReloadKey(prev => prev + 1);
                }
                else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error al actualizar Aprobador.',
                        detail: 'No se pudo actualizar el Aprobador. Intente de nuevo.',
                        life: 3000,
                    });
                }
            } catch (err) {
                console.error("Error actualizando Aprobador", err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error al actualizar Aprobador',
                    detail: 'No se pudo actualizar el Aprobador. Contactar al administrador.',
                    life: 3000
                });
            }
        }, []
    );

    const saveNewProv = useCallback(
        async (payload: any) => {
            try {
                const response = await API.post('/aprobadores/newAprob', payload);
                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Actualización de paramatero exitosa',
                        detail: 'Los datos del parametro se guardaron correctamente.',
                        life: 3000,
                    });
                    setShowNewApprov(false);
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

    const handleAddClick = useCallback(() => {
        setNewAprob(emptyAprobador);
        setShowNewApprov(true);
    }, [emptyAprobador]);

    const openEditModal = (row: AprobadoresCat) => {
        setEditApprov(row);
        setShowEditApprov(true);
    }

    return (
        <div className="p-4">
            <Toast ref={toast} />

            <ConfirmDialog
                group="updateAprob"
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
                                            saveProv(pendingUpdate);
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
            <div className="flex justify-between mb-3">
                <h2 className="text-2x1 font-bold">
                    Aprobadores
                </h2>
            </div>
            <Dialog
                visible={showNewApprov}
                onHide={() => { setShowNewApprov(false); }}
                header="Nuevo Aprobador"
                modal
                resizable
                style={{ width: "42rem", minWidth: "42rem" }}
                headerClassName="dialog-header-gradient"
                contentClassName="dialog-content-user"
            >
                <p className="fu-subtitle">
                    Capturar información.
                </p>
                <FormularioAprobador
                    defaultValues={newAprob}
                    defaultCount={defaultCount}
                    canEditDefaults={puedeEditarDefault}
                    canEditEstatus={puedeApagar}
                    editOrNew={true}
                    onSubmit={async (values) => {
                        await saveNewProv(values);
                        setShowNewApprov(false);
                    }}
                    onCancel={() => setShowNewApprov(false)}
                />
            </Dialog>
            <Dialog
                visible={showEditApprov}
                onHide={() => { setShowEditApprov(false) }}
                draggable={false}
                resizable
                style={{ width: "42rem", minWidth: "42rem" }}
                headerClassName="dialog-header-gradient"
                contentClassName="dialog-content-user"
            >
                <p className="fu-subtitle">Editar Aprobador</p>
                {editApprov && (
                    <FormularioAprobador
                        defaultValues={editApprov}
                        defaultCount={defaultCount}
                        canEditDefaults={puedeEditarDefault}
                        canEditEstatus={puedeApagar}
                        onSubmit={async (values) => {
                            setPendingUpdate(values);
                            confirmDialog({
                                group: 'updateAprob',
                                message: `¿Guardar cambios para ${values.Usuario}?`,
                                header: 'Confirmar actualización',
                                className: 'mv-confirm-dialog',
                                acceptLabel: 'Guardar',
                                rejectLabel: 'Cancelar',
                                acceptClassName: 'p-button mv-confirm-accept',
                                rejectClassName: 'p-button-text mv-confirm-reject',
                                defaultFocus: 'accept',
                                accept: () => {
                                    saveProv(values);
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
                            setShowEditApprov(false);
                        }}
                        onCancel={() => setShowEditApprov(false)}
                    />
                )}
            </Dialog>
            <SmartDataTable<AprobadoresCat>
                key={reloadKey}
                idField="Id"
                title="Aprobadores"
                sliceNumber={-2}
                columns={columns}
                pageSize={50}
                scrollHeight="550px"
                canEdit={puedeEditar || puedeApagar || puedeEditarDefault}
                canAdd={puedeAgregar}
                onAddClick={handleAddClick}
                editMode="dialog"
                onEditRow={openEditModal}
                exportFileName="parametros"
                globalFilterFields={
                    ['Usuario', 'Email', 'UltimoUso'] as (keyof AprobadoresCat)[]
                }
                loadMode="client"
                loader={loader}
            />
        </div>
    )
}