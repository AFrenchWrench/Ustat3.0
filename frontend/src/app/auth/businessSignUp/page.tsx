"use client"

import React, { useEffect } from 'react'
import styles from '@/app/users/style/profilePageStyles.module.css';

import Cookies from 'js-cookie';

import businessSchema from '@/types/TbusinessSignUp'
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';
import { useTitle } from '@/components/TitleContext';
import useDynamicTitle from '@/components/useDynamicTitle';

const userSchema = businessSchema
type TuserEditSchema = z.infer<typeof userSchema>;

type Titles = {
    [key: string]: string;
};

const titles: Titles = {
    en: 'Ustattecaret-Business signup',
    fa: 'اوستات تجارت-ثبت شرکت',
};

type FieldNames =
    | "businessName"
    | "ownerFirstName"
    | "ownerLastName"
    | "ownerPhoneNumber"

interface ErrorMapping {
    [key: string]: FieldNames;
}

const Page = () => {
    const { push } = useRouter()
    const { setTitle } = useTitle();


    useDynamicTitle(); // This will set the document title based on context

    useEffect(() => {
        const language = navigator.language || 'en';
        const langCode = language.split('-')[0];
        const pageTitle = titles[langCode] || titles['en'];
        setTitle(pageTitle);
        return () => setTitle('Ustat'); // Reset title on unmount if desired
    }, [setTitle]);


    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<TuserEditSchema>({
        resolver: zodResolver(userSchema),
        mode: "all"
    })

    const onSubmit = async (userInfo: TuserEditSchema) => {
        const token = Cookies.get("Authorization");
        try {
            const createBusinessQuery = `
                        mutation CreateBusiness {
                            createBusiness(
                                businessData: {
                                    ownerPhoneNumber: "${userInfo.ownerPhoneNumber}"
                                    ownerLastName: "${userInfo.ownerLastName}"
                                    ownerFirstName: "${userInfo.ownerFirstName}"
                                    name: "${userInfo.businessName}"
                                }
                            ) {
                                success
                                errors
                                redirectUrl
                            }
                        }
            `
            const response = await fetch('/api/users/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? token : '',
                },
                body: JSON.stringify({
                    query: createBusinessQuery,
                }),
            });
            console.log(createBusinessQuery);
            const result = await response.json();
            console.log("Mutation response:", result);

            if (result.data.createBusiness.success) {
                push(result.data.createBusiness.redirectUrl);
            } else {
                const errors = JSON.parse(result.data.createBusiness.errors);
                console.log(errors);

                const errorMapping: ErrorMapping = {
                    name: "businessName",
                    owner_first_name: "ownerFirstName",
                    owner_last_name: "ownerLastName",
                    owner_phone_number: "ownerPhoneNumber",
                };


                Object.keys(errors).forEach((key) => {
                    if (errorMapping[key]) {
                        setError(errorMapping[key], {
                            type: "server",
                            message: errors[key]
                        });
                    }
                });
            }

        } catch (error) {
            console.log("error catched : " + error);

        }

    }


    return (
        <section className={styles.profileContainer}>
            <div className={styles.profileDetails}>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.formDetails}>
                    <div className={styles.twoHolder}>
                        <span>
                            <label htmlFor="businessName-edit">نام شرکت :</label>
                            <input {...register("businessName")} type="text" id='businessName-edit' />
                            {errors.businessName && (<p className={styles.errorMessage}>{errors.businessName.message}</p>)}

                        </span>
                        <span>
                            <label htmlFor="ownerFirstName-edit">نام مالک شرکت:</label>
                            <input  {...register("ownerFirstName")} type="text" id='ownerFirstName-edit' />
                            {errors.ownerFirstName && (<p className={styles.errorMessage}>{errors.ownerFirstName.message}</p>)}

                        </span>
                    </div>

                    <div className={styles.twoHolder}>
                        <span>
                            <label htmlFor="ownerLastName-edit">نام خانوادگی مالک شرکت :</label>
                            <input {...register("ownerLastName")} type="text" id='ownerLastName-edit' />
                            {errors.ownerLastName && (<p className={styles.errorMessage}>{errors.ownerLastName.message}</p>)}

                        </span>
                        <span>
                            <label htmlFor="ownerPhoneNumber-edit">تلفن همراه مالک شرکت :</label>
                            <input dir='ltr' {...register("ownerPhoneNumber")} type="text" id='ownerPhoneNumber-edit' />
                            {errors.ownerPhoneNumber && (<p className={styles.errorMessage}>{errors.ownerPhoneNumber.message}</p>)}

                        </span>
                    </div>
                    <button>ثبت</button>
                </form>
            </div>

        </section>
    )
}

export default Page
