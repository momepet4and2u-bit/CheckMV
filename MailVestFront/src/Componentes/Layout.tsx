import { Outlet } from "react-router";
import Footer from "./Footer";
import Header from "./Header";
import SideBar from "./Shared/SideBar/SideBar";
import { useState } from "react";

export default function Layout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

    // const currentSideBarWidth = sidebarCollapsed ? SideBar_Collapsed_Width : SideBar_Width;

    return (
        <div style={{ minHeight: "100vh", display: "flex" }}>
            {/*SIDEBAR*/}
            <SideBar collapsed={sidebarCollapsed} />
            {/*HEADER*/}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                }}
            >
                <Header
                    onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                <main
                    style={{
                        flex: 1,
                        padding: '20px',
                        overflow: 'auto',
                    }}>
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    )
}