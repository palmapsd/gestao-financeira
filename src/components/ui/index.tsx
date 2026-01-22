/* 
 * Componentes UI Reutilizáveis - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 20:53
 * @version 1.1.0
 */

import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { X, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';

// === INPUT ===
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                    {props.required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
                </label>
            )}
            <input
                id={inputId}
                className={`input-field ${error ? 'border-red-500' : ''} ${className}`}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : undefined}
                {...props}
            />
            {error && (
                <p id={`${inputId}-error`} className="mt-1 text-sm text-red-400" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

// === SELECT ===
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', id, ...props }: SelectProps) {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={selectId} className="input-label">
                    {label}
                    {props.required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
                </label>
            )}
            <select
                id={selectId}
                className={`input-field select-field ${error ? 'border-red-500' : ''} ${className}`}
                aria-invalid={!!error}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && (
                <p className="mt-1 text-sm text-red-400" role="alert">{error}</p>
            )}
        </div>
    );
}

// === TEXTAREA ===
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={textareaId} className="input-label">{label}</label>
            )}
            <textarea
                id={textareaId}
                className={`input-field min-h-[100px] resize-y ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-400" role="alert">{error}</p>
            )}
        </div>
    );
}

// === BUTTON ===
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    loading?: boolean;
    icon?: ReactNode;
}

export function Button({
    children,
    variant = 'primary',
    loading = false,
    icon,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const variantClass = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        danger: 'btn-danger'
    }[variant];

    return (
        <button
            className={`btn ${variantClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : icon ? (
                <span aria-hidden="true">{icon}</span>
            ) : null}
            {children}
        </button>
    );
}

// === CARD ===
interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function Card({ children, className = '', title, subtitle, actions }: CardProps) {
    return (
        <div className={`glass-card p-6 ${className}`}>
            {(title || actions) && (
                <div className="flex items-start justify-between mb-4">
                    <div>
                        {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
                        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

// === MODAL ===
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="modal-content animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <h3 id="modal-title" className="text-xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                        aria-label="Fechar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="mb-6">{children}</div>
                {footer && <div className="flex gap-3 justify-end">{footer}</div>}
            </div>
        </div>
    );
}

// === ALERT ===
interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    onClose?: () => void;
}

export function Alert({ type, title, message, onClose }: AlertProps) {
    const styles = {
        success: 'bg-green-500/10 border-green-500/30 text-green-400',
        error: 'bg-red-500/10 border-red-500/30 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertTriangle className="w-5 h-5" />,
        warning: <AlertTriangle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />
    };

    return (
        <div
            className={`p-4 rounded-xl border ${styles[type]} animate-slide-up`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                {icons[type]}
                <div className="flex-1">
                    {title && <p className="font-semibold mb-1">{title}</p>}
                    <p className="text-sm opacity-90">{message}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        aria-label="Fechar alerta"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// === BADGE ===
interface BadgeProps {
    status: 'Aberto' | 'Fechado';
}

export function StatusBadge({ status }: BadgeProps) {
    return (
        <span 
            className={`badge ${status === 'Aberto' ? 'badge-open' : 'badge-closed'}`}
            role="status"
            aria-label={`Status: ${status}`}
        >
            {status}
        </span>
    );
}

// === LOADING SPINNER ===
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClass = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    }[size];

    return (
        <div className="flex items-center justify-center p-8" role="status" aria-label="Carregando">
            <Loader2 className={`${sizeClass} animate-spin text-primary-500`} />
        </div>
    );
}

// === EMPTY STATE ===
interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {icon && <div className="text-slate-500 mb-4">{icon}</div>}
            <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
            {description && <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>}
            {action}
        </div>
    );
}

// === PAGE HEADER ===
interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <header className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white" id="page-title">{title}</h1>
                    {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex gap-3">{actions}</div>}
            </div>
        </header>
    );
}

// === SKIP LINK (Acessibilidade) ===
export function SkipLink() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:outline-none"
        >
            Pular para o conteúdo principal
        </a>
    );
}

// === VISUALLY HIDDEN (Acessibilidade) ===
interface VisuallyHiddenProps {
    children: ReactNode;
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
    return <span className="sr-only">{children}</span>;
}
