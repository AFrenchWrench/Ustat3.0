// ConfirmAlert.tsx
import React from 'react';

import Styles from "@/allStyles/orderStyles.module.css";

interface ConfirmAlertProps {
    type: 'delete' | 'update';
    itemId: string;
    onConfirm: (type: 'delete' | 'update', itemId: string) => void;
    onCancel: () => void;
}

const ConfirmAlert: React.FC<ConfirmAlertProps> = ({ type, itemId, onConfirm, onCancel }) => {
    const handleConfirm = () => {
        onConfirm(type, itemId);
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleMessage = (type: string) => {
        if (type === 'update') {
            return "آیا برای ثبت سفارش مطمعن هستید؟"
        }
        else if (type === "delete") {
            return "آیا برای حذف این آیتم مطمعن هستید؟"
        }
    }

    return (
        <section className={Styles.confirmAlert}>
            <div className={Styles.confirmAlertContainer}>
                <p>{handleMessage(type)}</p>
                <div className={Styles.confirmButtons}>
                    <button className='bg-white text-black focus:bg-gray-500' onClick={handleConfirm}>بله</button>
                    <button className='hover:!border-white focus:bg-red-300' onClick={handleCancel}>خیر</button>
                </div>
            </div>
        </section>
    );
};

export default ConfirmAlert;
