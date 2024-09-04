import React, { useEffect } from 'react';

interface AlertProps {
    message: string;
    type: 'success' | 'failed';
    duration?: number;
    onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, type, duration = 3000, onClose }) => {
    const alertStyles: Record<'success' | 'failed', React.CSSProperties> = {
        success: {
            backgroundColor: '#d4edda',
            position: 'absolute' as 'absolute',
            bottom: '5%',
            right: '5%',
            color: '#155724',
            border: '1px solid #c3e6cb',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '10px',
            animation: 'slideInRight 0.5s ease-out',
            zIndex: '999'
        },
        failed: {
            backgroundColor: '#f8d7da',
            position: 'absolute' as 'absolute',
            bottom: '5%',
            right: '5%',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '10px',
            animation: 'slideInRight 0.5s ease-out',
            zIndex: '999'

        },
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <>
            <style>
                {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
            </style>
            <div style={alertStyles[type]}>
                {message}
            </div>
        </>
    );
};

export default Alert;
