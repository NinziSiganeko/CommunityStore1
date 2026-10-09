import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

const ToastContext = createContext(null);

const DEFAULT_DURATION = 2400;

/**
 * Small app-wide toast.
 *
 * Pages call useToast().showToast("...") instead of threading an
 * onToast prop through every route.
 */
function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const timer = useRef(null);

    const showToast = useCallback((message, duration = DEFAULT_DURATION) => {
        if (!message) {
            return;
        }

        if (timer.current) {
            clearTimeout(timer.current);
        }

        setToast({
            message,
            key: `${message}-${Date.now()}`,
        });

        timer.current = setTimeout(() => setToast(null), duration);
    }, []);

    useEffect(() => () => {
        if (timer.current) {
            clearTimeout(timer.current);
        }
    }, []);

    const value = useMemo(
        () => ({ showToast, toast }),
        [showToast, toast],
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
}

function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside a ToastProvider");
    }

    return context;
}

export { ToastProvider, useToast };