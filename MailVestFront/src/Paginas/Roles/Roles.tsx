/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useRef, useState } from "react"
import { usePermiso } from "../../Hooks/usePermiso";
import { Permisos } from "../../Constantes/Permisos";
import { SmartDataTable, type LazyLoadState, type SmartColumn, type SmartLoaderResult } from "../../Componentes/Shared/DataTable/SmartDataTable";
import { FilterMatchMode } from "primereact/api";
import type RolCatalogo from "../Roles/Modelos/Rol.model";
import { RoleChip } from "../../Componentes/Roles/RoleChip";
import { Toast } from "primereact/toast";
import { ColorPicker } from "primereact/colorpicker";
import API from "../../API/ClientApi";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputSwitch } from "primereact/inputswitch";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import type { TreeNode } from "primereact/treenode";
import { isEqual, pick, sortBy } from "lodash";
import CheckboxTreeSelector from "../../Componentes/Shared/Tree/CheckboxTreeSelector";
import FormularioRol from "./FormularioRol";
import type { RolAlta } from "./Modelos/RolAlta.model";

export default function Roles() {

    const { tienePermiso } = usePermiso();

    const puedeEditar = tienePermiso(Permisos.Configuracion.submodulos.AdminRoles.permisos.Cambio);
    const puedeExportar = tienePermiso(Permisos.Configuracion.submodulos.AdminRoles.permisos.Exportar);
    const puedeAgregar = tienePermiso(Permisos.Configuracion.submodulos.AdminRoles.permisos.Alta);
    const puedeApagarRol = tienePermiso(Permisos.Configuracion.submodulos.AdminRoles.permisos.Baja);

    const [reloadKey, setReloadKey] = useState(0);
    const toast = useRef<Toast | null>(null);

    const [editVisible, setEditVisible] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editRole, setEditRole] = useState<RolCatalogo | null>(null);

    const [permSelection, setPermSelection] = useState<string[]>([]);

    const rolePermCache = useRef<Record<number, string[]>>({});

    const [editLoadingPerms, setEditLoadingPerms] = useState(false);

    const [initialEditRole, setInitialEditRole] = useState<RolCatalogo | null>(null);
    const [initialPermSelection, setInitialPermSelection] = useState<string[]>([]);

    const [showNewRol, setShowNewRol] = useState(false);

    const emptyRol: RolCatalogo = {
        Id: 0,
        Descripcion: '',
        Estatus: true,
        ColorFondo: '',
        ColorTexto: '',
        ColorBorde: '',
    }

    const [newRol, setNewRol] = useState<RolCatalogo>(emptyRol);

    const role_compare_field: (keyof RolCatalogo)[] = [
        'Descripcion',
        'ColorFondo',
        'ColorTexto',
        'ColorBorde',
        'Estatus',
    ]

    const hasChanges = useMemo(() => {
        if (!editRole || !initialEditRole) {
            return false;
        }

        const currentRoleSlice = pick(editRole, role_compare_field);
        const initialRoleSlice = pick(initialEditRole, role_compare_field);
        const cambiosRol = !isEqual(currentRoleSlice, initialRoleSlice);

        const currentPermsSorted = sortBy(permSelection);
        const initialPermsSorted = sortBy(initialPermSelection);
        const cambiosPermisos = !isEqual(currentPermsSorted, initialPermsSorted);

        return cambiosRol || cambiosPermisos;
    }, [editRole, initialEditRole, permSelection, initialPermSelection]);

    const loader = useCallback(
        async (_state: LazyLoadState): Promise<SmartLoaderResult<RolCatalogo>> => {
            try {
                const response = await API.get<RolCatalogo[]>('/roles/all');
                const data = Array.isArray(response.data) ? response.data : [];

                return {
                    data,
                    totalRecords: data.length,
                };
            } catch (err) {
                console.error('Error obteniendo roles', err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron obtener los roles.',
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

    const renderColorCell = (hex: string | undefined, label: string) => {
        const display = hex || 'Sin color';

        return (
            <div
                className="flex items-center gap-2"
            >
                <span
                    style={{
                        width: '1.55em',
                        height: '1.5rem',
                        borderRadius: '9999px',
                        border: '1px solid #cccccc',
                        backgroundColor: hex || '#ffffff',
                    }}
                    aria-label={label}
                />
                <span className="text-xs">{display}</span>
            </div>
        );
    };

    const columns: SmartColumn<RolCatalogo>[] = [
        {
            field: 'Descripcion',
            header: 'Nombre del Rol',
            width: '14rem',
            filter: true,
            filterPlaceholder: 'Buscar Rol',
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: false,
            body: (row: RolCatalogo) => (
                <RoleChip nombre={row.Descripcion} rolCatalogo={row} />
            )
        },
        {
            field: 'ColorFondo',
            header: 'Color de fondo',
            width: '10rem',
            filter: false,
            editable: false,
            body: (row: RolCatalogo) => renderColorCell(row.ColorFondo, 'Color de fondo'),
        },
        {
            field: 'ColorTexto',
            header: 'Color del texto',
            width: '10rem',
            filter: false,
            editable: false,
            body: (row: RolCatalogo) => renderColorCell(row.ColorTexto, 'Color del texto'),
        },
        {
            field: 'ColorBorde',
            header: 'Color del borde',
            width: '10rem',
            filter: false,
            editable: false,
            body: (row: RolCatalogo) => renderColorCell(row.ColorBorde, 'Color del borde'),
        },
        {
            field: 'Estatus',
            header: 'Activo',
            width: '6rem',
            filter: true,
            filterPlaceholder: 'Buscar por estatus',
            filterMatchMode: FilterMatchMode.CONTAINS,
            editable: false,
            body: (row: RolCatalogo) => (
                <div className="flex items-center justify-center">
                    <InputSwitch checked={row.Estatus} disabled />
                </div>
            ),
        },
    ];

    // Estado y logica del dialog

    const permissionTreeNodes: TreeNode[] = useMemo(
        () =>
            Object.values(Permisos ?? {}).map((mod) => ({
                key: String(mod.codigo),
                label: mod.label,
                children: Object.values(mod.submodulos ?? {}).map((sub: any) => {
                    const esGrupo = !!sub.submodulos && Object.keys(sub.submodulos).length > 0;
                    const esHojaConPermisos =
                        !!sub.permisos && Object.keys(sub.permisos).length > 0;

                    if (esGrupo) {
                        // Grupo: anidar sus submodulos como hijos
                        return {
                            key: String(sub.codigo),
                            label: sub.label,
                            children: Object.values(sub.submodulos ?? {}).map((subHijo: any) => ({
                                key: String(subHijo.codigo),
                                label: subHijo.label,
                                // Si el hijo tiene permisos, agregarlos como nietos
                                children: Object.entries(subHijo.permisos ?? {})
                                    .filter(([nombrePermiso]) => nombrePermiso !== "Acceso")
                                    .map(([nombrePermiso, codigoPermiso]) => ({
                                        key: String(codigoPermiso),
                                        label: nombrePermiso,
                                    })),
                            })),
                        } satisfies TreeNode;
                    }

                    if (esHojaConPermisos) {
                        // Hoja: listar sus permisos como hijos
                        return {
                            key: String(sub.codigo),
                            label: sub.label,
                            children: Object.entries(sub.permisos ?? {})
                                .filter(([nombrePermiso]) => nombrePermiso !== "Acceso")
                                .map(([nombrePermiso, codigoPermiso]) => ({
                                    key: String(codigoPermiso),
                                    label: nombrePermiso,
                                })),
                        } satisfies TreeNode;
                    }

                    // Fallback: sub sin permisos y sin submodulos (raro, pero evitar crash)
                    return {
                        key: String(sub.codigo),
                        label: sub.label,
                        children: [],
                    } satisfies TreeNode;
                }),
            })),
        []
    );

    const updateEditField = <K extends keyof RolCatalogo>(
        field: K,
        value: RolCatalogo[K]
    ) => {
        setEditRole((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleColorChange =
        (field: 'ColorFondo' | 'ColorTexto' | 'ColorBorde') =>
            (hexWithoutHash: string) => {
                const hex = hexWithoutHash ? `#${hexWithoutHash}` : '';
                updateEditField(field, hex as any);
            };

    const closeEditDialog = () => {
        if (editSaving) {
            return;
        }
        setEditVisible(false);
        setEditRole(null);
        setPermSelection([]);
    };


    const loadRolePermissions = useCallback(
        async (roleId: number): Promise<string[]> => {
            const resp = await API.get<string[]>(`/roles/rolByPermisos/${roleId}`);
            const perms = Array.isArray(resp.data) ? resp.data : [];

            rolePermCache.current[roleId] = perms;

            return perms;
        },
        [],
    )

    const handleOpenEditRole = useCallback(
        async (role: RolCatalogo) => {

            setEditRole(role);
            setInitialEditRole({ ...role });

            setEditVisible(true);
            setEditLoadingPerms(true);

            setPermSelection([]);
            setInitialPermSelection([]);

            try {
                const perms = await loadRolePermissions(role.Id);
                setPermSelection(perms);
                setInitialPermSelection(perms);
            } catch (err) {
                console.error('Error cargando permisos del rol');
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron obtener los permisos del rol.',
                    life: 4000,
                });
            } finally {
                setEditLoadingPerms(false);
            }
        },
        [loadRolePermissions],
    );

    const saveRol = useCallback(
        async (payload: RolCatalogo) => {
            try {
                const response = await API.put(`/roles/updateRol/${payload.Id}`, payload);

                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Rol actualizado',
                        detail: 'Los datos se guardaron correctamente.',
                        life: 3000,
                    });
                    setReloadKey(prev => prev + 1);
                } else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error al actualizar el rol',
                        detail: 'No se pudo guardar el rol. Intente de nuevo.',
                        life: 5000
                    });
                }
            } catch (err) {
                console.error('Error actualizando el rol', err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error al actualizar rol',
                    detail: 'No se pudo guardar el rol. Intente de nuevo.',
                    life: 5000
                });
            }
        }, []);

    const savePermisos = useCallback(
        async (roleId: number, permisos: string[]) => {
            try {
                const response = await API.post(`/roles/updatePermisos/${roleId}`, { permisos });

                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Permisos actualizados',
                        detail: 'Los permisos se guardaron correctamente.',
                        life: 3000,
                    });
                } else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error al actualizar los permisos',
                        detail: 'No se pudo guardar los permisos. Intente de nuevo.',
                        life: 5000
                    });
                }
            } catch (err: any) {
                const backendMsg: string | undefined = err.response?.data?.message;

                const detail =
                    backendMsg ??
                    'No se pudo guardar los permisos. Intente de nuevo.';
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error al actualizar permisos',
                    detail,
                    life: 5000
                });
            }
        }, []);

    const saveNewRol = useCallback(
        async (payload: RolAlta) => {
            try {
                const response = await API.post("/roles/createRol", payload);
                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Usuario creado',
                        detail: 'El usuario se creo correctamente.',
                        life: 3000,
                    });
                    setShowNewRol(false);
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
        }, []);

    const performSave = useCallback(
        async () => {
            if (!editRole) {
                return;
            }

            setEditSaving(true);

            try {
                await savePermisos(editRole.Id, permSelection);
                await saveRol(editRole);

                closeEditDialog();
                setReloadKey((prev) => prev + 1);

                setEditVisible(false);
                setEditRole(null);
                setPermSelection([]);
            } catch (err) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error al guardar',
                    detail: 'No se pudo actualizar el rol. Intente de nuevo.',
                    life: 5000
                });
            } finally {
                setEditSaving(false);
            }
        }, [editRole, permSelection, saveRol, savePermisos]);

    const handleDialogSaveClick = () => {
        if (!editRole) return;
        if (!hasChanges) {
            return;
        }
        confirmDialog({
            header: `Guardar cambios para "${editRole.Descripcion}"?`,
            message: '¿Desea guardar los cambios del rol?',
            icon: 'pi pi-address-book',
            acceptLabel: 'Guardar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void performSave();
            },
            reject: () => {
                toast.current?.show({
                    severity: 'info',
                    summary: 'Edicion cancelada',
                    detail: 'No se guardaron los cambios',
                    life: 2500,
                });
            },
        });
    };

    const handleAddClick = useCallback(() => {
        setNewRol(emptyRol);
        setShowNewRol(true);
    }, [emptyRol]);


    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            <Dialog
                visible={editVisible}
                modal
                style={{ width: '50rem' }}
                header={editRole ? `Editar rol: ${editRole.Descripcion}` : 'Editar Rol'}
                onHide={closeEditDialog}
                className="mv-role-dialog dialog-header-gradient"
            >
                {!editRole ? null : editLoadingPerms ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Cargando permisos del rol...
                    </div>) : (
                    <div className="dialog-content-role">
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold">
                                Nombre del Rol
                            </label>
                            <InputText
                                value={editRole.Descripcion}
                                onChange={(e) =>
                                    updateEditField('Descripcion', e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <div className="role-section-title">
                                Colores
                            </div>
                            <div className="role-section-subtitle">
                                Define el color de fondo, texto y borde del rol.
                            </div>
                            <div className="mv-role-colors">
                                {/*Color Fondo */}
                                <div className="mv-role-color-row">
                                    <label className="mv-role-color-label">Color de fondo</label>
                                    <div className="mv-role-color-picker">
                                        <ColorPicker
                                            value={(editRole.ColorFondo ?? '').replace('#', '')}
                                            format="hex"
                                            onChange={(e) => handleColorChange('ColorFondo')(e.value as any)}
                                        />
                                    </div>
                                    <div className="mv-role-color-input">
                                        <InputText
                                            value={editRole.ColorFondo ?? ''}
                                            onChange={(e) =>
                                                updateEditField('ColorFondo', e.target.value)
                                            }
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                                {/*Color Texto */}
                                <div className="mv-role-color-row">
                                    <label className="mv-role-color-label">Color de Texto</label>
                                    <div className="mv-role-color-picker">
                                        <ColorPicker
                                            value={(editRole.ColorTexto ?? '').replace('#', '')}
                                            format="hex"
                                            onChange={(e) => handleColorChange('ColorTexto')(e.value as any)}
                                        />
                                    </div>
                                    <div className="mv-role-color-input">
                                        <InputText
                                            value={editRole.ColorTexto ?? ''}
                                            onChange={(e) =>
                                                updateEditField('ColorTexto', e.target.value)
                                            }
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                                {/*Color Borde */}
                                <div className="mv-role-color-row">
                                    <label className="mv-role-color-label">Color del borde</label>
                                    <div className="mv-role-color-picker">
                                        <ColorPicker
                                            value={(editRole.ColorBorde ?? '').replace('#', '')}
                                            format="hex"
                                            onChange={(e) => handleColorChange('ColorBorde')(e.value as any)}
                                        />
                                    </div>
                                    <div className="mv-role-color-input">
                                        <InputText
                                            value={editRole.ColorBorde ?? ''}
                                            onChange={(e) =>
                                                updateEditField('ColorBorde', e.target.value)
                                            }
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/*Estatus */}
                        <div className="flex items-center gap-3">
                            <span className="font-semibold">
                                Activo
                            </span>
                            <InputSwitch
                                checked={editRole.Estatus}
                                onChange={(e) => {
                                    if (!puedeApagarRol) {
                                        return;
                                    }
                                    updateEditField('Estatus', Boolean(e.value))
                                }
                                }
                                disabled={!puedeApagarRol}
                            />
                        </div>

                        <div>
                            <div className="role-section-title">
                                Permisos
                            </div>
                            <div className="role-section-subtitle">
                                Selecciona los módulos y acciones permitidas para este rol.
                            </div>
                            {/* Modulo/Permisos */}
                            <div className="mv-role-permissions-tree">
                                <CheckboxTreeSelector
                                    nodes={permissionTreeNodes}
                                    selectedIds={permSelection}
                                    onChange={setPermSelection}
                                />
                            </div>

                            {/*Botones del dialogo*/}
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    className="p-button p-button-text"
                                    onClick={closeEditDialog}
                                    disabled={editSaving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="p-button p-button-primary"
                                    onClick={handleDialogSaveClick}
                                    disabled={editSaving || !hasChanges}
                                >
                                    {editSaving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>

            <div className="flex justify-between mb-3">
                <h2 className="text-2x1 font-bold">Roles</h2>
            </div>
            <Dialog
                visible={showNewRol}
                onHide={() => { setShowNewRol(false); }}
                header="Nuevo Rol"
                modal
                resizable
                style={{ width: "42rem", minWidth: "42rem" }}
                headerClassName="dialog-header-gradient"
                contentClassName="dialog-content-user"
            >
                <p className="fu-subtitle">
                    Capturar información.
                </p>
                <FormularioRol
                    permisosTree={permissionTreeNodes}
                    onSubmit={async (values) => {
                        await saveNewRol(values);
                    }}
                    onCancel={() => setShowNewRol(false)}
                />
            </Dialog>

            <SmartDataTable<RolCatalogo>
                key={reloadKey}
                idField="Id"
                title="Roles"
                sliceNumber={-2}
                columns={columns}
                pageSize={50}
                scrollHeight="550px"
                canEdit={puedeEditar}
                canAdd={puedeAgregar}
                onAddClick={handleAddClick}
                editMode="dialog"
                canExport={puedeExportar}
                exportFileName="roles"
                globalFilterFields={['Descripcion'] as (keyof RolCatalogo)[]}
                loadMode="client"
                loader={loader}
                onEditRow={handleOpenEditRole}
                wrapperClassName="tabla-roles-wrapper"
                headerClassName="tabla-roles-header"
                tableClassName="tabla-roles-table"
                columnHeaderClassName="tabla-roles-th"
            />
        </div>
    )
}