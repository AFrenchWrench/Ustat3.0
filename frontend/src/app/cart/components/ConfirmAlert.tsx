// ConfirmAlert.tsx
import React from 'react';

import Styles from "@/allStyles/orderStyles.module.css";

type TupdateType = "update" | "delete" | "updateDate" | "changeStatus" | "changeStatusC";


interface ConfirmAlertProps {
    type: TupdateType;
    addressId?: string;
    itemId: string;
    status?: string;
    onConfirm: (type: TupdateType, itemId: string, status?: string, addressId?: string) => void;
    onCancel: () => void;
}


const ConfirmAlert: React.FC<ConfirmAlertProps> = ({ type, itemId, status, onConfirm, onCancel, addressId }) => {
    console.log(addressId);

    const handleConfirm = () => {
        onConfirm(type, itemId, status, addressId);
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleMessage = (type: string, status?: string) => {
        if (type === 'update') {
            return "آیا برای ثبت سفارش مطمعن هستید؟"
        }
        else if (type === "delete") {
            return "آیا برای حذف این آیتم مطمعن هستید؟"
        }
        else if (type === 'updateDate') {
            return "آیا برای بروزرسانی زمان تحویل مطمعن هستید؟"
        }
        else if (type === 'changeStatus') {
            return "آیا برای ثبت سفارش مطمعن هستید؟"
        }
        else if (type === 'changeStatusC') {
            return "آیا برای لغو سفارش مطمعن هستید؟"
        }
    }

    return (
        <section className={Styles.confirmAlert}>
            <div className={Styles.confirmAlertContainer}>
                <p>{handleMessage(type, status)}</p>
                <div className={Styles.confirmButtons}>
                    <button className='bg-white text-black focus:bg-gray-500' onClick={handleConfirm}>بله</button>
                    <button className='hover:!border-white focus:bg-red-300' onClick={handleCancel}>خیر</button>
                </div>
            </div>
        </section>
    );
};

export default ConfirmAlert;
