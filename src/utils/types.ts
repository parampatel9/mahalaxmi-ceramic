export interface LoginData {
    email?: string;
    password?: string;
}

export interface ForgotPassword {
    email: string;
}

export interface ResetPwd {
    password?: string;
    confirmPassword?: string;
    token?: string;
}

export interface AuthState {
    data: any | null;
    loading: boolean;
    error: string | null;
    signupLoading: boolean;
    forgotPassLoading: boolean;
}
