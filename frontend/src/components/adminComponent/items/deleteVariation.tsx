import React from 'react';
import Cookies from 'js-cookie';

import styles from "@/allStyles/addItemStyles.module.css";



// Define the type for the component's props
type AddDisplayItemProps = {
    onClose: () => void;
    id: string;
};

const DeleteVariation: React.FC<AddDisplayItemProps> = ({ onClose, id }) => {



    const onSubmit = async (confirme: boolean) => {

        if (!confirme) {
            onClose();
            return;
        }
        const Authorization = Cookies.get("Authorization");
        const query = `
                mutation DeleteItemVariant {
                    deleteItemVariant(input: { id: "${id}" }) {
                        success
                        errors
                        messages
                    }
                }
        `;

        try {
            const response = await fetch('/api/admin_dash/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': Authorization ? Authorization : '',
                },
                body: JSON.stringify({ query }),
            });


            const result = await response.json();
            console.log(result);


            // Reset form and close the popup on success
            if (result.data.deleteItemVariant.success) {
                onClose();
            }

        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <section className={styles.addDisplayItemFormSection}>

            <button type='button' onClick={() => onSubmit(true)}>بله</button>
            <button type='button' onClick={onClose}>خیر</button>
        </section>
    );
};

export default DeleteVariation;
