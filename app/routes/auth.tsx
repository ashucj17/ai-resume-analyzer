import { usePuterStore } from "~/lib/puter";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export const meta = () => ([
    { title: 'CareerForge | Auth' },
    { name: 'description', content: 'Log into your account' },
]);

const Auth = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const navigate = useNavigate();
    
    const next = new URLSearchParams(location.search).get('next') || '/';

    useEffect(() => {
        if (auth.isAuthenticated && next) {
            navigate(next);
        }
    }, [auth.isAuthenticated, next, navigate]);

    const getButtonContent = () => {
        if (isLoading) {
            return { text: 'Signing you in...', onClick: undefined, className: 'animate-pulse' };
        }
        if (auth.isAuthenticated) {
            return { text: 'Log Out', onClick: auth.signOut, className: '' };
        }
        return { text: 'Log In', onClick: auth.signIn, className: '' };
    };

    const buttonConfig = getButtonContent();

    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        <h2>Log In to Continue Your Job Journey</h2>
                    </div>
                    <button 
                        className={`auth-button ${buttonConfig.className}`}
                        onClick={buttonConfig.onClick}
                        disabled={isLoading}
                    >
                        <p>{buttonConfig.text}</p>
                    </button>
                </section>
            </div>
        </main>
    );
};

export default Auth;