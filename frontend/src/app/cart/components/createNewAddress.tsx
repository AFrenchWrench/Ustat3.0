"use client"


import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Styles from '@/allStyles/CreateNewAddress.module.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';
import citys from "../../../../public/c.json";
import States from "../../../../public/p.json";
import { SingleValue, StylesConfig } from 'react-select';
import Cookies from 'js-cookie';

const isPersianString = (str: string): boolean => /^[\u0600-\u06FF\s]+$/.test(str);
const isValidAddress = (address: string): boolean => /^[\u0600-\u06FF0-9\s,]+$/.test(address);

const SelectStyles: StylesConfig<StateOption, false> = {
    input: (styles) => ({ ...styles, color: "white", fontSize: "12px", whiteSpace: "nowrap", direction: "rtl" }),
    placeholder: (styles) => ({ ...styles, color: "#757575", fontSize: "12px", whiteSpace: "nowrap" }),
    control: (styles) => ({ ...styles, background: "#212121", border: "none" }),
    option: (styles) => ({ ...styles, background: "#212121", border: "none", direction: "rtl", fontSize: "13px" }),
    singleValue: (base) => ({ ...base, color: 'white', fontSize: "13px", direction: "rtl" }),
    valueContainer: (base) => ({
        ...base,
        background: "#212121",
        color: 'white',
        width: '100%',
        minWidth: '90px'
    }),
    menuList: (base) => ({
        ...base,
        "::-webkit-scrollbar": {
            width: "4px",
            height: "0px",
        },
        "::-webkit-scrollbar-track": {
            background: "#212121"
        },
        "::-webkit-scrollbar-thumb": {
            background: "#888"
        },
        "::-webkit-scrollbar-thumb:hover": {
            background: "#555"
        }
    }),
};

const createAddressSchema = z.object({
    title: z.string()
        .min(1, "عنوان آدرس الزامی است")
        .refine(isPersianString, { message: "عنوان آدرس باید فارسی باشد" }),
    province: z.string()
        .min(1, "استان الزامی است"),
    city: z.string()
        .min(1, "شهر الزامی است"),
    address: z.string()
        .min(1, "آدرس الزامی است")
        .refine(isValidAddress, { message: "در آدرس تنها از حروف فارسی، اعداد انگلیسی، ویرگول و یا قاصله استفاده کنید" }),
    postalCode: z.string()
        .min(1, "کد پستی الزامی است")
        .refine(postalCode => postalCode.length === 10 && /^\d+$/.test(postalCode), { message: "کد پستی معتبر نمیباشد" }),
});

type CreateAddressForm = z.infer<typeof createAddressSchema>;

interface StateOption {
    value: string;
    label: string;
}

interface CityOption {
    value: string;
    label: string;
}

interface IfilterCitys {
    name: string;
    province_id: number;
}

interface Address {
    id: string;
    title: string;
    address: string;
    postalCode: string;
}

interface CreateNewAddressProps {
    onClose: (address: Address) => void; // Update to use Address type
}

const CreateNewAddress: React.FC<CreateNewAddressProps> = ({ onClose }) => {
    const [filteredCities, setFilteredCities] = useState<IfilterCitys[]>([]);
    const { register, control, handleSubmit, formState: { errors }, setValue } = useForm<CreateAddressForm>({
        resolver: zodResolver(createAddressSchema),
    });

    const onSubmit = async (data: CreateAddressForm) => {
        const Authorization = Cookies.get("Authorization")

        try {
            const response = await fetch('/api/users/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': Authorization ? Authorization : '',
                },
                body: JSON.stringify({
                    query: `
                        mutation CreateAddress($input: AddressInput!) {
                            createAddress(input: $input) {
                                success
                                errors
                                address {
                                    id
                                    title
                                    address
                                    postalCode
                                }
                            }
                        }
                    `,
                    variables: {
                        input: {
                            title: data.title,
                            province: data.province,
                            city: data.city,
                            address: data.address,
                            postalCode: data.postalCode,
                        }
                    }
                }),
            });

            const result = await response.json();

            if (result.data.createAddress.success) {

                const { id, title, address, postalCode } = result.data.createAddress.address;
                onClose({ id, title, address, postalCode }); // Pass the complete Address object
            } else {
                console.error('Error creating address:', result.data.createAddress.errors);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleStateChange = (selectedOption: SingleValue<StateOption>) => {
        if (selectedOption) {
            setValue("province", selectedOption.label); // Save the province ID
            const filterCity = citys.filter(city => city.province_id.toString() === selectedOption.value);
            setFilteredCities(filterCity);
            setValue("city", ""); // Reset city to an empty string
        }
    };

    const handleCityChange = (selectedOption: SingleValue<CityOption>) => {
        if (selectedOption) {
            setValue("city", selectedOption.value); // Set the selected city name
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)} className={Styles.formContainer}>
                <h3 className={Styles.h3}>ساخت آدرس جدید</h3>
                <div className={Styles.formGroup}>
                    <label htmlFor="title">عنوان آدرس</label>
                    <input
                        id="title"
                        {...register('title')}
                        className={Styles.formControl}
                        style={errors.title ? { borderColor: "red" } : {}}
                    />
                    {errors.title && <p className={Styles.error}>{errors.title.message}</p>}
                </div>
                <div className={Styles.formGroup}>
                    <label htmlFor="address">آدرس</label>
                    <textarea
                        id="address"
                        {...register('address')}
                        className={Styles.formControl}
                        style={errors.address ? { borderColor: "red" } : {}}
                    />
                    {errors.address && <p className={Styles.error}>{errors.address.message}</p>}
                </div>
                <div className={Styles.formGroup}>
                    <label htmlFor="postalCode">کد پستی*</label>
                    <input
                        type='number'
                        id="postalCode"
                        {...register('postalCode')}
                        className={Styles.formControl}
                        style={errors.postalCode ? { borderColor: "red" } : {}}
                    />
                    {errors.postalCode && <p className={Styles.error}>{errors.postalCode.message}</p>}
                </div>
                <div className={Styles.twoHolder}>
                    <span>
                        <p>استان :</p>
                        <Select
                            id='state-select'
                            onChange={handleStateChange}
                            placeholder="انتخاب کنید..."
                            styles={SelectStyles}
                            options={States.map((state) => ({
                                value: state.id.toString(),
                                label: state.name
                            }))}
                        />
                        {errors.province && <p className={Styles.error}>{errors.province.message}</p>}
                    </span>
                    <span>
                        <p>شهر :</p>
                        <Controller
                            control={control}
                            name='city'
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    id='city-select'
                                    placeholder="انتخاب کنید..."
                                    styles={SelectStyles}
                                    options={filteredCities.map((city) => ({
                                        value: city.name, // Use city name as value
                                        label: city.name
                                    }))}
                                    onChange={(option) => {
                                        onChange(option?.value);
                                        handleCityChange(option);
                                    }}
                                    value={filteredCities.find(city => city.name === value) ? { value, label: value } : null}
                                />
                            )}
                        />
                        {errors.city && <p className={Styles.errorMessage}>{errors.city.message}</p>}
                    </span>
                </div>
                {errors.root && <p>{errors.root.message}</p>}
                <div className={Styles.acButtons}>
                    <button type='submit' className={Styles.submitButton}>ثبت</button>
                    <button
                        type='button'
                        onClick={() => onClose({ id: '', title: '', address: '', postalCode: '' })}
                        className={Styles.cButton}
                    >
                        لغو
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateNewAddress;
