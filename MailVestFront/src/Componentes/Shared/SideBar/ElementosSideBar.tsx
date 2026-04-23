/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { StyleClass } from "primereact/styleclass";
import { Ripple } from "primereact/ripple";
import { NavLink } from "react-router";
import { useAuth } from "../../../Context/UserContext/AuthContext";
import { usePermiso } from "../../../Hooks/usePermiso";
import { SideBar_Modulos, type SideBarModulo, type SideBarSubmodulo } from "../../../Constantes/SideBarConfig";

function GrupoToggle({
    icon,
    label,
    collapsed,
    children,
}: {
    icon: string;
    label: string;
    collapsed: boolean;
    children: React.ReactNode;
}) {
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);

    return (
        <>
            <StyleClass
                nodeRef={btnRef as any}
                selector="@next"
                enterFromClassName="hidden"
                enterActiveClassName="slidedown"
                leaveToClassName="hidden"
                leaveActiveClassName="slideup"
            >
                <button
                    ref={btnRef}
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={
                        "text-decoration-none p-ripple flex align-items-center cursor-pointer px-3 py-1 border-round text-700 hover:surface-100 transition-duration-150 transition-colors w-full" +
                        (collapsed ? " justify-content-center" : "")
                    }
                    style={{ background: "transparent", border: "none", width: "100%" }}
                    aria-expanded={open}
                >
                    <i className={`${icon} mr-2`} />
                    {!collapsed && <span className="font-medium">{label}</span>}
                    {!collapsed && (
                        <i className={`pi ml-3 ${open ? "pi-chevron-down" : "pi-chevron-up"}`} />
                    )}
                    <Ripple />
                </button>
            </StyleClass>

            {/* Contenedor con las mismas clases que usas en el módulo */}

<ul
  className={
    "list-none p-0 m-0 hidden overflow-y-hidden w-100" +
    (collapsed ? "" : " mt-1")
  }
>
  {children}
</ul>

        </>
    );
}

function SubmoduloList({ items, collapsed }: { items: SideBarSubmodulo[]; collapsed: boolean }) {
    return (
        <>
            {items.map((sub) => {
                const isGroup = !sub.to && (sub.submodulos?.length ?? 0) > 0;

                return (
                    <li key={sub.id}>
                        {isGroup ? (
                            <GrupoToggle icon={sub.icon} label={sub.label} collapsed={collapsed}>
                                {/* hijos del grupo; se animan mediante StyleClass */}
                                <div className={collapsed ? "" : "pl-4"}>
                                    <SubmoduloList items={sub.submodulos ?? []} collapsed={collapsed} />
                                </div>
                            </GrupoToggle>
                        ) : sub.to ? (
                            <NavLink
                                to={sub.to}
                                className={
                                    "text-decoration-none p-ripple flex align-items-center cursor-pointer px-3 py-1 border-round text-700 hover:surface-100 transition-duration-150 transition-colors w-full" +
                                    (collapsed ? " justify-content-center" : "")
                                }
                            >
                                <i className={`${sub.icon} mr-2`} />
                                {!collapsed && <span className="font-medium">{sub.label}</span>}
                                <Ripple />
                            </NavLink>
                        ) : (
                            // Item sin ruta y sin hijos
                            <div className="px-3 py-1 text-700">
                                <i className={`${sub.icon} mr-2`} />
                                {!collapsed && <span className="font-medium">{sub.label}</span>}
                            </div>
                        )}
                    </li>
                );
            })}
        </>
    );
}


function filtraPorPermisos(
    items: SideBarSubmodulo[],
    tienePermiso: (p?: string) => boolean
): SideBarSubmodulo[] {
    return items
        .map((item) => {
            const hijosVisibles = item.submodulos
                ? filtraPorPermisos(item.submodulos, tienePermiso)
                : [];

            const visiblePorPermisoPropio = !!item.permiso && tienePermiso(item.permiso);

            // El item es visible si tiene permiso propio o si tiene hijos visibles
            if (visiblePorPermisoPropio || hijosVisibles.length > 0) {
                return { ...item, submodulos: hijosVisibles };
            }

            return null;
        })
        .filter((x): x is Required<SideBarSubmodulo> => x !== null);
}

function SideBarModuloItem({ modulo, collapsed }: SideBarModuloItemProps) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLAnchorElement | null>(null);

    useEffect(() => {
        setOpen(false);
    }, [collapsed])

    if (collapsed) {
        const maxHeightAbierto = modulo.submodulos.length * 40 + 16;
        return (
            <li className="mb-3">
                <a
                    className="text-decoration-none p-ripple d-flex align-items-center justify-content-center cursor-pointer border-round hover:surface-100 transition-duration-150 transition-colors w-full"
                    style={{ height: 40, color: "rgb(118, 61, 190)" }}
                    onClick={() => setOpen(!open)}
                >
                    <i className={modulo.icon} />
                    <Ripple />
                </a>
                <div
                    className="mt-2 w-100"
                    style={{
                        maxHeight: open ? maxHeightAbierto : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease',
                    }}
                >
                    <SubmoduloList items={modulo.submodulos} collapsed={collapsed} />
                </div>

            </li>
        );
    }


    return (
        <li className="mb-2">
            <StyleClass
                nodeRef={btnRef as any}
                selector="@next"
                enterFromClassName="hidden"
                enterActiveClassName="slidedown"
                leaveToClassName="hidden"
                leaveActiveClassName="slideup"
            >
                <a
                    ref={btnRef}
                    className={
                        "text-decoration-none p-ripple flex align-items-center cursor-pointer px-3 py-1 border-round text-700 hover:surface-100 transition-duration-150 transition-colors w-full" +
                        (collapsed ? 'justify-content-center px-0' : 'px-3')
                    }
                    onClick={() => setOpen(!open)}
                >
                    <i className={modulo.icon + (collapsed ? '' : ' mr-2')} />
                    {!collapsed && <span className="font-medium">{modulo.label}</span>}
                    {!collapsed && (
                        <i className={`pi ml-3 ${open ? 'pi-chevron-down' : 'pi-chevron-up'}`} />
                    )}
                </a>
            </StyleClass>
            <ul className="list-none pr-0 m-0 hidden overflow-y-hidden">
                <SubmoduloList items={modulo.submodulos} collapsed={collapsed} />
            </ul>
        </li>
    );
}

export default function ElementosSideBar({ collapsed = false }: ElementosSideBarProps) {
    const { user } = useAuth();
    const { tieneSubModulo } = usePermiso();

    // if (!user) {
    //     return null
    // }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userName = user ? (user as any).Nombre ?? (user as any).Nombre : 'NO SE LOGRO RECUPERAR DATOS';


    const modulosVisibles: SideBarModulo[] = SideBar_Modulos
        .map((mod) => {
            const subMVisible = filtraPorPermisos(mod.submodulos, (p) => tieneSubModulo(p));

            // El módulo es visible si tiene permiso propio o submódulos visibles
            if (subMVisible.length === 0 && !tieneSubModulo(mod.permiso)) {
                return null;
            }
            return { ...mod, submodulos: subMVisible };
        })
        .filter((m): m is SideBarModulo => m !== null);

    return (
        <ul className="list-none p-3 m-0">
            {/* Header del menu */}
            <li className="nav-header mb-3 d-flex flex-column align-items-center">
                <div className="dropdown profile-element">
                    <img
                        className="img-circle"
                        src='/sidebar-bb.jpg'
                        width={collapsed ? 40 : 120}
                        height={collapsed ? 40 : 120}
                        alt="BanBajio" />
                </div>
                {!collapsed && (
                    <>
                        <NavLink to="/" className="nav-link sidebar-linkMain fw-bold" style={{ fontSize: "18px", color: "rgb(118, 61, 190)" }}>Mailer - Inversionistas</NavLink>
                        {/*Nombre usuario */}
                        <span className="nombre-usuario mt-2 fw-bold text-center" title={userName} style={{ fontSize: "14px", color: "rgb(118, 61, 190)" }}>
                            {userName}
                        </span>
                    </>
                )}
            </li>
            {modulosVisibles.map((modulo) => (
                <SideBarModuloItem key={modulo.id} modulo={modulo} collapsed={collapsed} />
            ))}
        </ul>
    )
}

type ElementosSideBarProps = {
    collapsed?: boolean;
}

type SideBarModuloItemProps = {
    modulo: SideBarModulo;
    collapsed: boolean;
}