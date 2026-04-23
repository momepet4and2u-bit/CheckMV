import { createContext, useContext, useEffect, useState } from "react";

import API, { setAuthToken } from "../../API/ClientApi";
import { createHubConnection } from "../../Hooks/useSignalR";

interface UserInfo {
    Id: number,
    Nombre: string;
    Rol: string;
    SubModulos: string[];
    Permisos: string[];
    Usuario: string;
}

interface AuthResponse {
    token: string;
    user: UserInfo;
}

interface AuthContextType {
    user: UserInfo | null;
    loading: boolean;
    error: string | null;
    token: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
    token: null
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Función para cargar/recargar datos (reutilizable)
    const fetchUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await API.get<AuthResponse>('/auth/me', { withCredentials: true });
            setUser(response.data.user);
            setToken(response.data.token);
            setAuthToken(response.data.token);
        }
        catch (err) {
            console.error('Error obteniendo usuario Windows', err);
            setUser(null);
            setToken(null);
            setError("No se pudo obtener al usuario actual");
        } finally {
            setLoading(false);
        }
    };
    // 2. Carga inicial
    useEffect(() => { fetchUser(); }, []);

    useEffect(() => {
        if (!user?.Rol) return;

        let mounted = true;

        const conn = createHubConnection(() => token ?? "");

        const start = async () => {
            try {
                await conn.start();
                await conn.invoke("Join", user.Rol);

                conn.on("NotifyPermissionsChanged", (newData: UserInfo) => {
                    // Actualizas el estado directamente SIN llamar al servidor otra vez
                    if (!mounted) {
                        return;
                    }
                    setUser(prevUser => {
                        if (!prevUser) return null;
                        return {
                            ...prevUser,
                            Permisos: newData.Permisos,
                            SubModulos: newData.SubModulos
                        };
                    });
                });
            } catch (err) {
                console.error("SignalR error: ", err);
            }
        };

        start();

        return () => {
            mounted = false;
            conn.stop();
        }
    }, [token, user?.Rol]);

    return (
        <AuthContext.Provider value={{ user, loading, error, token }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);