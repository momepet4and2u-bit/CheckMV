
import ElementosSideBar from "./ElementosSideBar";
import { useAuth } from '../../../Context/UserContext/AuthContext';
import { SideBar_Collapsed_Width, SideBar_Width } from '../../../Constantes/Layout';
import { SideBarSkeleton } from './SideBarSkeleton';

export default function SideBar({ collapsed }: SideBarProps) {
    const { user, loading } = useAuth();
    
    const width = collapsed ? SideBar_Collapsed_Width : SideBar_Width;

    return (
        <aside
            style={{
                width: `${width}px`,
                transition: 'width 0.2s ease',
                borderRight: '1px solid #763dbe',
                background: '#fff',
                minHeight: '100vh',
                overflow: 'hidden'
            }}
        >
            <nav role="navigation"
                style={{
                    width: "100%",
                    height: "100%"
                }}>
                <div className='sidebar-collapse' style={{ color: "#763dbe" }}>
                    {loading ? (
                        <SideBarSkeleton collapsed={collapsed} />
                    ) : user? (
                        <ElementosSideBar collapsed={collapsed} />   
                    ) : <ElementosSideBar collapsed={collapsed} />}
                </div>
            </nav>
        </aside>

    )
}

type SideBarProps = {
    collapsed: boolean;
}