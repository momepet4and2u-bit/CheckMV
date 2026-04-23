/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react"
import type UsuarioAlta from "./Modelos/Usuario.model";
import API from "../../API/ClientApi";
import { usePermiso } from "../../Hooks/usePermiso";
import { Permisos } from "../../Constantes/Permisos";
import { SmartDataTable, type LazyLoadState, type SmartColumn, type SmartLoaderResult } from "../../Componentes/Shared/DataTable/SmartDataTable";
import { FilterMatchMode } from "primereact/api";
import type RolCatalogo from "../Roles/Modelos/Rol.model";
import { RoleChip } from "../../Componentes/Roles/RoleChip";
import { Dropdown } from "primereact/dropdown";
import type { DataTableRowEditCompleteEvent } from "primereact/datatable";
import type { ColumnEditorOptions } from "primereact/column";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputSwitch } from "primereact/inputswitch";
import { Dialog } from "primereact/dialog";
import FormularioUsuario from "./FormularioUsuario";

export default function Usuarios() {

    const { tienePermiso } = usePermiso();

    const puedeEditar = tienePermiso(Permisos.Configuracion.submodulos.AdminUsuarios.permisos.Cambio);
    const puedeExportar = tienePermiso(Permisos.Configuracion.submodulos.AdminUsuarios.permisos.Exportar);
    const puedeAgregar = tienePermiso(Permisos.Configuracion.submodulos.AdminUsuarios.permisos.Alta);
    const puedeApagarUser = tienePermiso(Permisos.Configuracion.submodulos.AdminUsuarios.permisos.Baja);

    const [roles, setRoles] = useState<RolCatalogo[]>([]);
    const [reloadKey, setReloadKey] = useState(0);
    const toast = useRef<Toast | null>(null);

    const [pendingUpdate, setPendingUpdate] = useState<any | null>(null);
    const [confirmIcon, setConfirmIcon] = useState<string>('pi pi-exclamation-triangle');

    const [showNewUser, setShowNewUser] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const emptyUser: UsuarioAlta = {
        Id: 0,
        Usuario: '',
        Nombre: '',
        Email: '',
        Nomina: '',
        Puesto: '',
        Rol: '',
        IdRol: 0,
        Activo: true,
    }

    const [newUser, setNewUser] = useState<UsuarioAlta>(emptyUser);

    useEffect(() => {
        const loadRoles = async () => {
            const response = await API.get<RolCatalogo[]>('/roles/all');
            setRoles(response.data.map(r => ({
                Id: Number(r.Id),
                Descripcion: r.Descripcion,
                Estatus: r.Estatus,
                ColorFondo: r.ColorFondo,
                ColorTexto: r.ColorTexto,
                ColorBorde: r.ColorBorde
            })));
        }
        loadRoles();
    }, []);


    const columns: SmartColumn<UsuarioAlta>[] = [
        {
            field: 'Usuario',
            header: 'Usuario',
            width: '2rem',
            filter: true,
            filterPlaceholder: 'Buscar Usuario',
            filterMatchMode: FilterMatchMode.STARTS_WITH,
            editable: true,
        },
        {
            field: 'Nombre',
            header: 'Nombre',
            width: '10rem',
            filter: true,
            filterPlaceholder: 'Buscar nombre',
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
        },
        {
            field: 'Email',
            header: 'Email',
            width: '5rem',
            filter: true,
            filterPlaceholder: 'Buscar por email',
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
        },
        {
            field: 'Nomina',
            header: 'Nomina',
            width: '8rem',
            filter: true,
            filterPlaceholder: 'Buscar por nomina',
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
        },
        {
            field: 'Puesto',
            header: 'Puesto',
            width: '5rem',
            filter: true,
            filterPlaceholder: 'Buscar por puesto',
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
        },
        {
            field: 'Activo',
            header: 'Activo',
            width: '6rem',
            filter: true,
            filterPlaceholder: 'Buscar por estatus',
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: puedeApagarUser,
            body: (row: UsuarioAlta) => (
                <div className="flex items-center justify-center">
                    <InputSwitch checked={row.Activo} disabled={true} />
                </div>
            ),
            editor: (options: any) => (
                <div className="flex items-center justify-center">
                    <InputSwitch
                        checked={Boolean(options.value)}
                        disabled={!puedeApagarUser}
                        onChange={(e) =>{ 
                            if(!puedeApagarUser) return;
                            options.editorCallback?.(e.value)}}
                    />
                </div>
            )
        },
        {
            field: 'Rol',
            header: 'Rol',
            width: '5rem',
            filter: true,
            filterPlaceholder: 'Buscar por rol',
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: true,
            body: (row: UsuarioAlta) => {
                const rolCat = roles.find(r => r.Descripcion === row.Rol) ?? null;

                return row.Rol ? (
                    <RoleChip nombre={row.Rol} rolCatalogo={rolCat} />
                ) : (
                    <span className="sdt-cell-muted">Sin rol</span>
                );
            },
            editor: (options: ColumnEditorOptions) => {

                const currentValue = options.value as string | undefined;

                const selectedRow =
                    roles.find(r => r.Descripcion === currentValue) ?? null;

                return (
                    <Dropdown
                        value={selectedRow}
                        options={roles}
                        optionLabel="Descripcion"
                        placeholder="Selecciona un Rol"
                        className="mv-role-dropdown"
                        itemTemplate={(opt: RolCatalogo) => (
                            <RoleChip nombre={opt.Descripcion} rolCatalogo={opt} />
                        )}
                        valueTemplate={(opt: RolCatalogo | null) => {
                            if (!opt) {
                                return (
                                    <span className="mv-role-chip mv-role-chip--placeholder">
                                        Selecciona un Rol
                                    </span>
                                );
                            }
                            return <RoleChip nombre={opt.Descripcion} rolCatalogo={opt} />;
                        }}
                        onChange={(e) => {
                            const nuevoRol = e.value as RolCatalogo | null;

                            options.editorCallback?.(nuevoRol?.Descripcion ?? '');
                        }}
                        panelClassName="mv-role-dropdown-panel"
                    />
                )
            }
        },
    ];

    const loader = useCallback(
        async (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _state: LazyLoadState,
        ): Promise<SmartLoaderResult<UsuarioAlta>> => {
            try {
                const response = await API.get<UsuarioAlta[]>('/users/all');
                const data = Array.isArray(response.data) ? response.data : [];
                return {
                    data,
                    totalRecords: data.length,
                };
            } catch (err) {
                console.error("Error obteniendo usuarios", err);

                return {
                    data: [],
                    totalRecords: 0
                };
            }
        },
        [],
    ); 
    const saveUser = useCallback(
        async (payload: any) => {
            try {
                const response = await API.put(`/users/updateUser/${payload.Id}`, payload)
                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Usuario actualizado',
                        detail: 'Los datos se guardaron correctamente.',
                        life: 3000,
                    });
                    setReloadKey(prev => prev + 1);
                }
                else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error al actualizar usuario',
                        detail: 'No se pudo guardar el usuario. Intente de nuevo.',
                        life: 5000
                    });
                }
            } catch (err) {
                console.error("Error actualizando usuario", err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error al actualizar usuario',
                    detail: 'No se pudo guardar el usuario. Intente de nuevo.',
                    life: 5000
                });
            }
        },
        []
    );

    const saveNewUser = useCallback(
        async (payload: UsuarioAlta) => {
            try {
                const response = await API.post("/users/addUser", payload);

                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Usuario creado',
                        detail: 'El usuario se creo correctamente.',
                        life: 3000,
                    });
                    setShowNewUser(false);
                    setReloadKey(prev => prev + 1);
                } else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error al crear usuario',
                        detail: 'No se pudo crear el usuario. Intente de nuevo.',
                        life: 5000
                    });
                }
            } catch (err: any) {
                const backendMsg: string | undefined = err.response?.data?.message;

                const detail =
                backendMsg ??
                'No se pudo crear el usuario. Intente mas tarde.';

                toast.current?.show({
                    severity: 'error',
                    summary: 'Error al crear usuario',
                    detail,
                    life: 5000
                });
            }
        }, []
    );
    const handleRowEditComplete = useCallback(
        async (e: DataTableRowEditCompleteEvent) => {
            const newData = e.newData as UsuarioAlta;
            const original = e.data as UsuarioAlta;

            const rolCat = roles.find(r => r.Descripcion === newData.Rol);
            if (!rolCat) {
                console.error('Rol no encontrado en catálogos: ', newData.Rol);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se encontro el rol seleccionado.',
                    life: 4000
                });
                return;
            }

            const payload = {
                Id: newData.Id,
                Usuario: newData.Usuario,
                Nombre: newData.Nombre,
                Email: newData.Email,
                Area: newData.Puesto,
                Nomina: newData.Nomina,
                IdRol: rolCat.Id,
                Rol: newData.Rol,
                Activo: puedeApagarUser ? newData.Activo : original.Activo,
            };
            setPendingUpdate(payload);

            setConfirmIcon('pi pi-user-edit');

            confirmDialog({
                group: 'updateUser',
                message: `¿Guardar cambios para ${newData.Usuario}?`,
                header: 'Confirmar actualización',
                className: 'mv-confirm-dialog',
                acceptLabel: 'Guardar',
                rejectLabel: 'Cancelar',
                acceptClassName: 'p-button mv-confirm-accept',
                rejectClassName: 'p-button-text mv-confirm-reject',
                defaultFocus: 'accept',
                accept: () => saveUser(payload),
                reject: () => {
                    toast.current?.show({
                        severity: 'info',
                        summary: 'Edicion cancelada',
                        detail: 'No se guardaron los cambios',
                        life: 2500
                    });
                },
            });
        }, [roles, puedeApagarUser, saveUser]
    );

    const handleAddClick = useCallback(() => {
        setNewUser(emptyUser);
        setShowNewUser(true);
    }, [emptyUser]);

    return (
        <div className="p-4">
            <Toast ref={toast} />

            <ConfirmDialog
                group="updateUser"
                className="mv-confirm-dialog"
                maskClassName="mv-confirm-dialog-mask"
                content={(options: any) => {
                    if(!pendingUpdate){
                        return null;
                    }

                    const iconClass = confirmIcon || 'pi pi-exclamation-triangle';

                    return(
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
                                onClick={(event) => {
                                    options.hide(event);
                                    if(pendingUpdate){
                                        saveUser(pendingUpdate);
                                    }
                                }}
                                >
                                Guardar
                                </button>
                                <button
                                type="button"
                                className="p-button p-component p-button-outlined w-8rem mv-confirm-reject"
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
                    Usuarios
                </h2>
            </div>
            <Dialog
                visible={showNewUser}
                onHide={() => { setShowNewUser(false); }}
                header="Nuevo Usuario"
                modal
                resizable
                style={{ width: "42rem" , minWidth: "42rem"}}
                headerClassName="dialog-header-gradient"
                contentClassName="dialog-content-user"
            >
                <p className="fu-subtitle">
                    Capturar información.
                </p>
                <FormularioUsuario
                    defaultValues={newUser}
                    roles={roles}
                    onSubmit={async (values) => {
                        await saveNewUser(values);
                        setShowNewUser(false);
                    }}
                    onCancel={() => setShowNewUser(false)}
                />
            </Dialog>
            <SmartDataTable<UsuarioAlta>
                key={reloadKey}
                idField="Id"
                title="Usuarios"
                columns={columns}
                pageSize={50}
                scrollHeight="550px"
                canEdit={puedeEditar}
                canAdd={puedeAgregar}
                onAddClick={handleAddClick}
                editMode="row"
                onRowEditComplete={puedeEditar ? handleRowEditComplete : undefined}
                canExport={puedeExportar}
                exportFileName="usuarios"
                globalFilterFields={
                    ['Usuario', 'Nombre', 'Email', 'Nomina', 'Puesto'] as (keyof UsuarioAlta)[]
                }
                loadMode="client"
                loader={loader}
            />
        </div>
    )
}