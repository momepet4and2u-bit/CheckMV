import { Skeleton } from "primereact/skeleton";
import { SideBar_Modulos } from "../../../Constantes/SideBarConfig";

export function SideBarSkeleton({ collapsed }: SideBarSkeletonProps){
    return(
        <ul className="list-none p-3 m-0">
            {/*Header */}
            <li className="mb-3">
                <div className="nav-header mb-3 d-flex flex-column align-items-center">
                    <div className="dropdown profile-element">
                        <div className="d-flex justify-content-center mb-2">
                            <img
                        className="img-circle"
                        src='/sidebar-bb.jpg'
                        width={collapsed ? 40 : 120}
                        height={collapsed ? 40 :120}
                        alt="BanBajio" />
                        </div>
                        {!collapsed && (
                            <>
                            <span className="nav-link sidebar-linkWith-bold text-center" style={{ fontSize: "18px", color: "rgb(118, 61, 190)"}}>
                                Mailer - Inversionistas
                            </span>
                            <Skeleton
                            width="70%"
                            height="1rem"
                            className="mt-2 mx-auto" />
                            </>
                        )}
                    </div>
                </div>
            </li>
            {SideBar_Modulos.map((mod) => (
                <li key={mod.id} className="mb-3">
                    <div
                    className={
                        'd-flex align-items-center mb-1' +
                        (collapsed ? 'justify-content-center' : '')
                    }
                    >
                        <Skeleton
                        shape="circle"
                        width="24px"
                        height="24px"
                        className={collapsed ? '' : 'mr-2'}
                        />
                        {!collapsed && <Skeleton width="60%" height="1rem" />}
                    </div>
                    {!collapsed && (
                        <div className="pl-4">
                            {mod.submodulos.map((sub) => (
                                <div
                                key={sub.id}
                                className="d-flex align-items-center mb-1"
                                >
                                    <Skeleton
                                    shape="circle"
                                    width="18px"
                                    height="18px"
                                    className="mr-2"
                                    />
                                    <Skeleton width="50%" height="0.9rem" />
                                </div>
                            ))}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    )
}


type SideBarSkeletonProps = {
    collapsed?: boolean;
}