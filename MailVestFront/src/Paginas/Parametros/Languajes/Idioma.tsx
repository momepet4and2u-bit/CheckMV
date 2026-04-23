/* eslint-disable @typescript-eslint/no-explicit-any */
import { Toast } from "primereact/toast";
import { useCallback, useRef, useState } from "react";
import { SmartDataTable, type LazyLoadState, type SmartColumn, type SmartLoaderResult } from "../../../Componentes/Shared/DataTable/SmartDataTable";
import type IdiomaCat from "./Modelos/IdiomaCat";
import { FilterMatchMode } from "primereact/api";
import { getFlagEmoji } from "../../../Utils/Language/languageFlags";
import { InputSwitch } from "primereact/inputswitch";
import API from "../../../API/ClientApi";
import { Dialog } from "primereact/dialog";
import FormularioLeng from "./IdiomaLeng";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

export default function Idioma() {
    const toast = useRef<Toast>(null);

    const [reloadKey, setReloadKey] = useState(0);

    const [showNewLeng, setShowNewLeng] = useState(false);
    const [defaultCount, setDefaultCount] = useState<number>(0);
    const [lastOrder, setLastOrder] = useState<number>(1);

    const [pendingUpdate, setPendingUpdate] = useState<any | null>(null);
    const [showEditLeng, setShowEditLeng] = useState(false);
    const [editLeng, setEditLeng] = useState<IdiomaCat | null>(null);
    const [allOrder, setAllOrder] = useState<number[]>([]);


    // eslint-disable-next-line react-hooks/exhaustive-deps
    const emptyParam: IdiomaCat = {
        Code: "",
        Name: "",
        IsDefault: false,
        Order: 0,
        Enabled: false
    };

    const [newLeng, setNewLeng] = useState<IdiomaCat>(emptyParam);

    const columns: SmartColumn<IdiomaCat>[] = [
        {
            field: "Name",
            header: "Idioma",
            filter: true,
            filterPlaceholder: "Buscar idioma",
            filterMatchMode: FilterMatchMode.CONTAINS,
            body: (row: IdiomaCat) => (
                <div className="flex align items-center gap-3">
                    <span style={{ fontSize: "1.5rem" }}>
                        {getFlagEmoji(row.Code)}
                    </span>

                    <div className="flex flex-column">
                        <span style={{ fontWeight: 600 }}>
                            {row.Name}
                        </span>

                        <small style={{ opacity: 0.7 }}>
                            {row.Code}
                        </small>
                    </div>
                </div>
            )
        },
        {
            field: "IsDefault",
            header: "Default",
            width: "8rem",
            body: (row: IdiomaCat) => (
                <InputSwitch checked={row.IsDefault} disabled />
            ),
            editor: (options: any) => (
                <InputSwitch
                    checked={Boolean(options.value)}
                    onChange={(e) => options.editorCallback?.(e.value)}
                />
            ),
            editable: true
        },
        {
            field: "Order",
            header: "Orden",
            width: "6rem",
            editable: true
        }
    ]

    const loader = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (_state: LazyLoadState): Promise<SmartLoaderResult<IdiomaCat>> => {
            try {
                const response = await API.get<IdiomaCat[]>("/parametros/languajes")

                const data = Array.isArray(response.data) ? response.data : [];

                const countDefaults = data.filter((x: any) => x?.IsDefault === true).length;
                setDefaultCount(countDefaults);

                const sortedData = [...data].sort(((a, b) => a.Order - b.Order));
                setLastOrder(sortedData.length > 0 ? sortedData[sortedData.length - 1].Order : 0);

                const allOrder = [...data].map((x: any) => x.Order);
                setAllOrder(allOrder);

                return {
                    data,
                    totalRecords: data.length
                }
            } catch (err) {
                console.error("Error obteniendo Idiomas", err)

                return {
                    data: [],
                    totalRecords: 0
                }
            }
        }, []
    )

    const updateLeng = useCallback(async (payload: IdiomaCat) => {
        try {
            await API.put(`/parametros/Idiomas/update/${payload.Code}`, payload);

            toast.current?.show({
                severity: 'success',
                summary: 'Actualización de idioma exitosa',
                detail: 'Los datos del idioma se guardaron correctamente.',
                life: 3000
            });

            setReloadKey(prev => prev + 1);
        } catch (err) {
            console.error("Error actualizando idioma", err);

            toast.current?.show({
                severity: 'error',
                summary: 'Error al actualizar idioma',
                detail: 'No se pudo actualizar el idioma. Intente de nuevo.',
                life: 3000
            });
        }
    }, []);

    const saveNewLeng = useCallback(async (payload: any) => {
        try {
            const response = await API.post('/parametros/newLeng', payload);
            if (response.status === 200) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Actualización de idioma exitosa',
                    detail: 'Los datos del idioma se guardaron correctamente.',
                    life: 3000,
                });
                setShowNewLeng(false);
                setReloadKey(prev => prev + 1);
            }
        } catch (err: any) {
            const backendMsg: string | undefined = err.response?.data?.message;

            const detail =
                backendMsg ??
                'No se pudo crear el idioma. Intente mas tarde.';

            toast.current?.show({
                severity: 'error',
                summary: 'Error al crear idioma',
                detail,
                life: 5000
            });
        }
    }, []);

    const handleAddClick = useCallback(() => {
        setNewLeng({
            ...emptyParam,
            Order: lastOrder + 1
        });
        setShowNewLeng(true);
    }, [emptyParam, lastOrder]);
    
    const openEditModal = (row: IdiomaCat) => {
        setEditLeng(row);
        setShowEditLeng(true);
    }

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog
                group="updateLeng"
                className="mv-confirm-dialog"
                maskClassName="mv-confirm-dialog-mask"
                content={(options: any) => {
                    if (!pendingUpdate) {
                        return null;
                    }

                    const iconClass = 'pi pi-save';

                    return (
                        <div ref={options.contentRef} className="mv-confirm-body">
                            <div className="mv-confirm-icon">
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
                                            updateLeng(pendingUpdate);
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
                <h2 className="text-2xl font-bold">
                    Idiomas del Portal
                </h2>
            </div>
            <Dialog
                visible={showNewLeng}
                onHide={() => setShowNewLeng(false)}
                header="Nuevo Idioma"
                modal
                resizable
                style={{ width: "42rem", minWidth: "42rem" }}
                headerClassName="dialog-header-gradient"
                contentClassName="dialog-content-user"
            >
                <p className="fu-subtitle">
                    Capturar información.
                </p>
                <FormularioLeng
                    defaultValues={newLeng}
                    defaultCount={defaultCount}
                    allOrder={allOrder}
                    onSubmit={async (values) => {
                        await saveNewLeng(values);
                        setShowNewLeng(false);
                    }}
                    onCancel={() => setShowNewLeng(false)}
                />
            </Dialog>
            <Dialog
                visible={showEditLeng}
                onHide={() => { setShowEditLeng(false) }}
                draggable={false}
                resizable
                style={{ width: "42rem", minWidth: "42rem" }}
                headerClassName="dialog-header-gradient"
                contentClassName="dialog-content-user"
            >
                <p className="fu-subtitle">Editar Idioma</p>
                {editLeng && (
                    <FormularioLeng
                        defaultValues={editLeng}
                        defaultCount={defaultCount}
                        allOrder={allOrder.filter(o => o !== editLeng.Order)}
                        onSubmit={async (values) => {
                            setPendingUpdate(values);
                            confirmDialog({
                                group: 'updateLeng',
                                message: `¿Guardar cambios para ${values.Name}?`,
                                header: 'Confirmar actualización',
                                className: 'mv-confirm-dialog',
                                acceptLabel: 'Guardar',
                                rejectLabel: 'Cancelar',
                                acceptClassName: 'p-button mv-confirm-accept',
                                rejectClassName: 'p-button-text mv-confirm-reject',
                                defaultFocus: 'accept',
                                accept: () => {
                                    updateLeng(values);
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
                            setShowEditLeng(false);
                        }}
                        onCancel={() => setShowEditLeng(false)}
                    />
                )}
            </Dialog>
            <SmartDataTable<IdiomaCat>
                key={reloadKey}
                idField="Code"
                title="Idiomas"
                columns={columns}
                pageSize={50}
                scrollHeight="550px"
                editMode="dialog"
                loadMode="client"
                loader={loader}
                canAdd={true}
                onAddClick={handleAddClick}
                canEdit={true}
                onEditRow={openEditModal}
                onRowEditComplete={(e: any) => updateLeng(e.newData)}
                globalFilterFields={[]}
            />
        </div >
    )
}