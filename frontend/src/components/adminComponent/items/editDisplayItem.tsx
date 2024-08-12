import React from 'react';
import Cookies from 'js-cookie';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import styles from "@/allStyles/addItemStyles.module.css";

// Define the Zod schema
const createDisplayItemSchema = z.object({
    name: z.string().optional(),
    type: z.string().optional(),
});

// Infer the TypeScript type from the Zod schema
type TcreateDisplayItemSchema = z.infer<typeof createDisplayItemSchema>;

// Define the type for the component's props
type AddDisplayItemProps = {
    onClose: () => void;
    type: string;
    name: string;
    id: string;
};

const EditDisplayItem: React.FC<AddDisplayItemProps> = ({ onClose, type, name, id }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<TcreateDisplayItemSchema>({
        resolver: zodResolver(createDisplayItemSchema),
        defaultValues: {
            name: name,
            type: type.toLowerCase(),
        },
    });


    const onSubmit = async (data: TcreateDisplayItemSchema) => {

        if (data.name === name && data.type === type && data.name === "" && data.type === "") {
            onClose();
            return;
        }


        const Authorization = Cookies.get("Authorization");
        const query = `
            mutation UpdateDisplayItem {
                updateDisplayItem(input: {
                    id: "${id}",
                    ${data.type && data.type !== type ? `type: "${data.type}"` : ""},
                    ${data.name && data.name !== name ? `name: "${data.name}"` : ""}})
                {
                    success
                    errors
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
            console.log(query);


            const result = await response.json();
            console.log(result);

            // Reset form and close the popup on success
            if (result.data.updateDisplayItem.success) {
                reset();
                onClose();
            }

        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <section className={styles.addDisplayItemFormSection}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label htmlFor="name">نام محصول:</label>
                    <input id='name' {...register("name")} type="text" />
                    {errors.name && <p>{errors.name.message}</p>}
                </div>

                <div>
                    <label htmlFor="type">نوع محصول :</label>
                    <select id='type' {...register("type")}>
                        <option value="s">مبل</option>
                        <option value="b">سرویس خواب</option>
                        <option value="m">میز و صندلی</option>
                        <option value="j">جلومبلی و عسلی</option>
                        <option value="c">آینه کنسول</option>
                    </select>
                    {errors.type && <p>{errors.type.message}</p>}
                </div>

                <div>
                    <button type='submit'>ویرایش</button>
                    <button type='button' onClick={onClose}>بستن</button>
                </div>
            </form>
        </section>
    );
};

export default EditDisplayItem;
