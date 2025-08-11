
export interface AuthFormProps {
    mode: 'login' | 'signup';
    headerText: string;
    buttonText: string;
}

export interface User {
    id?: string | number;
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

export interface AuthProviderProps {
    children: React.ReactNode;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface AuthAction {
    type: 'LOGIN' | 'LOGOUT' | 'SIGNUP' | 'ERROR' | 'LOADING';
    payload?: User | string;
}
