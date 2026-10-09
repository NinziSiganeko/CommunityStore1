import { useEffect, useState } from "react";

import { useToast } from "../context/ToastContext.jsx";

/**
 * The toast itself. Rendered once by MainLayout.
 */
function Toast({ message }) {
    return (
        <div className="toast" role="status" aria-live="polite">
            {message}
        </div>
    );
}

function ToastHost() {
    const { toast } = useToast();

    if (!toast) {
        return null;
    }

    return <Toast message={toast.message} key={toast.key} />;
}

/**
 * Inline loading indicator.
 */
function Loader({ label = "Loading..." }) {
    return (
        <div className="loader" role="status" aria-live="polite">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-label">{label}</span>
        </div>
    );
}

/**
 * Empty / error state used by the newer screens.
 */
function StateMessage({
                          icon = "bi-box-seam",
                          title,
                          message,
                          actionLabel,
                          onAction,
                          tone = "neutral",
                          children,
                      }) {
    return (
        <div className={`state-message ${tone}`}>
            {icon && <i className={`bi ${icon}`} />}

            {title && <h2>{title}</h2>}

            {message && <p>{message}</p>}

            {children}

            {actionLabel && onAction && (
                <button
                    type="button"
                    className="primary-action"
                    onClick={onAction}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

/**
 * Informational banner (verification notices, warnings...).
 */
function Banner({ tone = "info", icon = "bi-info-circle", title, children }) {
    return (
        <div className={`banner ${tone}`}>
            <i className={`bi ${icon}`} />

            <div className="banner-body">
                {title && <strong>{title}</strong>}

                {children}
            </div>
        </div>
    );
}

/**
 * Two-step button for destructive actions.
 *
 * The first click asks for confirmation, the second one runs the
 * action. It disarms itself after a few seconds.
 */
function ConfirmButton({
                           label,
                           confirmLabel = "Tap again to confirm",
                           onConfirm,
                           className = "ghost-btn danger",
                           icon,
                           disabled = false,
                       }) {
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (!armed) {
            return undefined;
        }

        const timer = setTimeout(() => setArmed(false), 4000);

        return () => clearTimeout(timer);
    }, [armed]);

    async function handleClick(event) {
        event.stopPropagation();
        event.preventDefault();

        if (!armed) {
            setArmed(true);
            return;
        }

        setArmed(false);
        await onConfirm?.();
    }

    return (
        <button
            type="button"
            className={`${className} ${armed ? "armed" : ""}`}
            onClick={handleClick}
            disabled={disabled}
        >
            {icon && <i className={`bi ${icon}`} />}
            {armed ? confirmLabel : label}
        </button>
    );
}

export {
    Banner,
    ConfirmButton,
    Loader,
    StateMessage,
    Toast,
    ToastHost,
};