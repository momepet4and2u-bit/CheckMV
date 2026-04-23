import { Skeleton } from "primereact/skeleton";
import { useAuth } from "../Context/UserContext/AuthContext";

export default function Header({ onToggleSidebar }: HeaderProps) {

    const { user, loading } = useAuth();
    return (
        <header className="d-flex align-items-center px-4" style={{
            fontSize: "13px",
            height: "60px",
            backgroundColor: "#ffff",
            borderBottom: "1px solid #ddd"
        }}>
            <button type="button" className="btn btn-link" onClick={onToggleSidebar} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
                <i className='pi pi-bars' style={{ fontSize: "1.2rem", color: "rgb(118, 61, 190)" }} />
            </button>
            <div style={{ marginLeft: 16, flex: 1 }}>
                {loading ? (
                    <Skeleton width="60%" height="1rem" />
                ) : (

                    <span className="m-r-sm text-muted welcome-message ms-3">Bienvenido {user ? `${user.Nombre}` : ""} a
                        <span className="font-bold">  Mailer Inversionistas</span>
                    </span>
                )}
            </div>
            {/* <a href="#" className="ms-auto" style={{ textDecoration: "none", color: "rgb(118, 61, 190)" }}>
                Cerrar Sesión
            </a> */}
        </header>
    )
}

type HeaderProps = {
    onToggleSidebar: () => void;
}