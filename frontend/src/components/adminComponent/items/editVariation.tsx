"use client";

import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';

import { IoMdAddCircle } from "react-icons/io";

import styles from "@/allStyles/addItemStyles.module.css";

import Cookies from 'js-cookie';

const maxFileSize = 3 * 1024 * 1024;

const schema = z.object({
    isForBusiness: z.boolean(),
    showInFirstPage: z.boolean(),
    name: z.string().min(1, 'Name is required'),
    dimensions: z.object({
        height: z.string().min(1, "Height is required"),
        width: z.string().min(1, "Width is required"),
        depth: z.string().min(1, "Depth is required")
    }),
    fabric: z.string().optional(),
    color: z.string().optional(),
    woodColor: z.string().optional(),
    price: z.number().min(0, 'Price must be a positive number').or(z.string().min(1, 'Price is required')),
    description: z.string().min(1, 'Description is required'),
    thumbnail: z.any().optional()
        .refine(file => file.length == 1 ? file.type.startsWith('image/') ? true : false : true, 'Invalid file. choose either JPEG or PNG image')
        .refine(file => file.length == 1 ? file[0]?.size <= maxFileSize ? true : false : true, 'Invalid file: must be an image less than 3MB')
    , // Make thumbnail optional
    slider1: z.any().optional()
        .refine(file => file.length == 1 ? file.type.startsWith('image/') ? true : false : true, 'Invalid file. choose either JPEG or PNG image')
        .refine(file => file.length == 1 ? file[0]?.size <= maxFileSize ? true : false : true, 'Invalid file: must be an image less than 3MB'), // Make slider1 optional
    slider2: z.any().optional()
        .refine(file => file.length == 1 ? file.type.startsWith('image/') ? true : false : true, 'Invalid file. choose either JPEG or PNG image')
        .refine(file => file.length == 1 ? file[0]?.size <= maxFileSize ? true : false : true, 'Invalid file: must be an image less than 3MB'), // Make slider2 optional
    slider3: z.any().optional()
        .refine(file => file.length == 1 ? file.type.startsWith('image/') ? true : false : true, 'Invalid file. choose either JPEG or PNG image')
        .refine(file => file.length == 1 ? file[0]?.size <= maxFileSize ? true : false : true, 'Invalid file: must be an image less than 3MB'),
});

type FieldNames = 'thumbnail' | 'slider1' | 'slider2' | 'slider3';
type FormValues = z.infer<typeof schema>;

interface Ivariations {
    id: string,
    name: string,
    dimensions: string,
    description: string,
    price: number,
    fabric: string,
    color: string,
    woodColor: string,
    showInFirstPage: boolean,
    isForBusiness: boolean,
    thumbnail: string,
    slider1: string,
    slider2: string,
    slider3: string,
}

type AddDisplayItemProps = {
    onClose: () => void;
    data: Ivariations | null;
};

const EditVariation: React.FC<AddDisplayItemProps> = ({ onClose, data }) => {
    const [message, setMessage] = useState('');
    const [previews, setPreviews] = useState<{ [key in FieldNames]: string | null }>({
        thumbnail: null,
        slider1: null,
        slider2: null,
        slider3: null,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            isForBusiness: data?.isForBusiness === true || false,
            showInFirstPage: data?.showInFirstPage === true || false,
            name: data?.name || '',
            dimensions: {
                height: data ? JSON.parse(data.dimensions).height.toString() : '',
                width: data ? JSON.parse(data.dimensions).width.toString() : '',
                depth: data ? JSON.parse(data.dimensions).length.toString() : ''
            },
            fabric: data?.fabric || '',
            color: data?.color || '',
            woodColor: data?.woodColor || '',
            price: data?.price || '',
            description: data?.description || '',
        },
    });

    useEffect(() => {
        if (data) {
            setValue('isForBusiness', data.isForBusiness === true);
            setValue('showInFirstPage', data.showInFirstPage === true);
            setValue('name', data.name);
            setValue('dimensions.height', JSON.parse(data.dimensions).height.toString());
            setValue('dimensions.width', JSON.parse(data.dimensions).width.toString());
            setValue('dimensions.depth', JSON.parse(data.dimensions).length.toString());
            setValue('fabric', data.fabric);
            setValue('color', data.color);
            setValue('woodColor', data.woodColor);
            setValue('price', data.price);
            setValue('description', data.description);
        }
    }, [data, setValue]);

    const onSubmit: SubmitHandler<FormValues> = async (formData) => {
        const Authorization = Cookies.get("Authorization");

        const isFormUnchanged = (
            formData.name === data?.name && // Check name equality
            // Dimensions check with whitespace removal using regular expression
            JSON.stringify({
                width: Number(formData.dimensions.width),
                height: Number(formData.dimensions.height),
                length: Number(formData.dimensions.depth),
            }) === data.dimensions.replace(/\s+/g, '') &&
            formData.price === data?.price && // Check price equality
            formData.description === data?.description && // Check description equality
            formData.fabric === data?.fabric && // Check fabric equality (typo fixed)
            formData.color === data?.color && // Check color equality
            formData.woodColor === data?.woodColor && // Check woodColor equality
            formData.showInFirstPage === data?.showInFirstPage && // Check showInFirstPage equality
            formData.isForBusiness === data?.isForBusiness// Check isForBusiness equality
        );

        const isImageUnchanged = (
            formData.thumbnail?.length === 0 &&
            formData.slider1?.length === 0 &&
            formData.slider2?.length === 0 &&
            formData.slider3?.length === 0
        );

        // If form data didn't change, close the modal and return early
        if (isFormUnchanged && isImageUnchanged) {
            onClose();
            return;
        }

        if (!isImageUnchanged && isFormUnchanged) {
            const uploadData = new FormData();

            // Append the main thumbnail
            if (formData.thumbnail) {
                uploadData.append('thumbnail', formData.thumbnail);
            }

            // Append slider images
            const sliders = ['slider1', 'slider2', 'slider3'] as const;
            sliders.forEach(slider => {
                if (formData[slider]) {
                    uploadData.append(slider, formData[slider]);
                }
            });

            // Second request: Upload images
            const uploadResponse = await fetch(`http://localhost/api/sales/display-item-variant/${data?.id}/upload-images/`, {
                method: 'POST',
                headers: {
                    'Authorization': Authorization ? Authorization : '',
                },
                body: uploadData,
            });

            const uploadResult = await uploadResponse.json();
            console.log(uploadResult);


            if (uploadResponse.ok) {
                console.log("success");


                // Clear previews after successful upload
                setPreviews({
                    thumbnail: null,
                    slider1: null,
                    slider2: null,
                    slider3: null,
                });

                setTimeout(() => {
                    setMessage("");
                }, 2000);
                return

            } else {
                console.log("falid");
                return
            }
        }

        // Prepare dimensions
        const dimensions = {
            width: Number(formData.dimensions.width),
            height: Number(formData.dimensions.height),
            length: Number(formData.dimensions.depth),
        };
        const dimensionsString = JSON.stringify(dimensions);

        const escapeString = (str: string) => str.replace(/"/g, '\\"');
        const query = `
                    mutation UpdateItemVariant {
                        updateItemVariant(
                            input: {
                                id: ${data?.id}
                                ${formData.name && formData.name !== data?.name ? `name: "${formData.name}",` : ""}
                                ${formData.dimensions && dimensionsString !== data?.dimensions.replace(/\s+/g, '') ? `dimensions: "${escapeString(dimensionsString)}",` : ""}
                                ${formData.price && formData.price !== data?.price ? `price: "${formData.price}",` : ""}
                                ${formData.description && formData.description !== data?.description ? `description: "${formData.description}",` : ""}
                                ${formData.fabric && formData.fabric !== data?.fabric ? `fabric: "${formData.fabric}",` : ""}
                                ${formData.color && formData.color !== data?.color ? `color: "${formData.color}",` : ""}
                                ${formData.woodColor && formData.woodColor !== data?.woodColor ? `woodColor: "${formData.woodColor}",` : ""}
                                ${formData.showInFirstPage && formData.showInFirstPage !== data?.showInFirstPage ? `showInFirstPage: "${formData.showInFirstPage}",` : ""}
                                ${formData.isForBusiness && formData.isForBusiness !== data?.isForBusiness ? `isForBusiness: "${formData.isForBusiness}",` : ""}
                            }
                        ) {
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

            if (result.data.updateItemVariant.success) {
                setMessage('Item created successfully!');
                const itemId = result.data.updateItemVariant.itemVariant.id;

                // Prepare images for upload
                const uploadData = new FormData();

                // Append the main thumbnail
                if (formData.thumbnail) {
                    uploadData.append('thumbnail', formData.thumbnail);
                }

                // Append slider images
                const sliders = ['slider1', 'slider2', 'slider3'] as const;
                sliders.forEach(slider => {
                    if (formData[slider]) {
                        uploadData.append(slider, formData[slider]);
                    }
                });

                // Second request: Upload images
                const uploadResponse = await fetch(`http://localhost/api/sales/display-item-variant/${itemId}/upload-images/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': Authorization ? Authorization : '',
                    },
                    body: uploadData,
                });

                const uploadResult = await uploadResponse.json();

                if (uploadResponse.ok) {
                    setMessage('Images uploaded successfully!');
                    reset();

                    // Clear previews after successful upload
                    setPreviews({
                        thumbnail: null,
                        slider1: null,
                        slider2: null,
                        slider3: null,
                    });

                    setTimeout(() => {
                        setMessage("");
                    }, 2000);

                } else {
                    setMessage('Failed to upload images.');
                    console.error('Upload Error:', uploadResult);
                }
            } else {
                setMessage('Failed to create item.');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('An error occurred.');
        }
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: FieldNames) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setPreviews(prev => ({ ...prev, [fieldName]: reader.result }));
                }
            };
            reader.readAsDataURL(file);
            setValue(fieldName, file); // Only set value if a file is selected
        } else {
            // Clear the field value and preview if the file selection is cleared
            setValue(fieldName, undefined);
            setPreviews(prev => ({ ...prev, [fieldName]: null }));
        }
    };


    return (
        <section className={styles.addDisplayItemFormSection + " !items-start"}>
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.formDetails}>
                    <label htmlFor="thumbnail" className={styles.thumbnail} style={{ backgroundImage: `url(${previews.thumbnail ? previews.thumbnail : `/media/${data?.thumbnail}`})` }}>
                        {!previews.thumbnail && !data?.thumbnail && <IoMdAddCircle />}
                    </label>
                    <input
                        dir='ltr'
                        className='hidden'
                        type='file'
                        accept='image/*'
                        id='thumbnail'
                        {...register("thumbnail")}
                        onChange={(e) => handleImageChange(e, 'thumbnail')}
                    />
                    {errors.thumbnail && (<p className={styles.errorMessage}>{errors.thumbnail?.message?.toString()}</p>)}
                </div>

                <div className={styles.twoContainer}>
                    <span>
                        <label htmlFor="name">نام محصول :</label>
                        <input type="text" id='name' {...register("name")} />
                        {errors.name && (<p className={styles.errorMessage}>{errors.name.message}</p>)}
                    </span>

                    <span>
                        <label htmlFor="fabric">پارچه :</label>
                        <input type="text" id='fabric' {...register("fabric")} />
                        {errors.fabric && (<p className={styles.errorMessage}>{errors.fabric.message}</p>)}
                    </span>
                </div>

                <div className={styles.twoContainer}>
                    <span>
                        <label htmlFor="width">طول :</label>
                        <input dir='ltr' type="number" id='width' {...register("dimensions.width")} />
                        {errors.dimensions?.width && (<p className={styles.errorMessage}>{errors.dimensions.width.message}</p>)}
                    </span>

                    <span>
                        <label htmlFor="height">عرض :</label>
                        <input dir='ltr' type="number" id='height' {...register("dimensions.height")} />
                        {errors.dimensions?.height && (<p className={styles.errorMessage}>{errors.dimensions.height.message}</p>)}
                    </span>

                    <span>
                        <label htmlFor="depth">ارتفاع :</label>
                        <input dir='ltr' type="number" id='depth' {...register("dimensions.depth")} />
                        {errors.dimensions?.depth && (<p className={styles.errorMessage}>{errors.dimensions.depth.message}</p>)}
                    </span>
                </div>

                <div className={styles.twoContainer}>
                    <span className='w-[90%]'>
                        <label htmlFor="price">قیمت :</label>
                        <input dir='ltr' className='!w-[80%]' type="number" id='price' {...register("price")} />
                        {errors.price && (<p className={styles.errorMessage}>{errors.price.message}</p>)}
                    </span>
                </div>

                <div className={styles.twoContainer}>
                    <span>
                        <label htmlFor="color">رنگ :</label>
                        <input type="text" id='color' {...register("color")} />
                        {errors.color && (<p className={styles.errorMessage}>{errors.color.message}</p>)}
                    </span>

                    <span>
                        <label htmlFor="woodColor">رنگ چوب :</label>
                        <input type="text" id='woodColor' {...register("woodColor")} />
                        {errors.woodColor && (<p className={styles.errorMessage}>{errors.woodColor.message}</p>)}
                    </span>
                </div>

                <div className={styles.twoContainer}>
                    <span>
                        <label htmlFor="isForBusiness">برای بیزنس ؟</label>
                        <input className={styles.isForBusiness} id='isForBusiness' type="checkbox" {...register("isForBusiness")} />
                        {errors.isForBusiness && (<p className={styles.errorMessage}>{errors.isForBusiness.message}</p>)}
                    </span>

                    <span>
                        <label htmlFor="showInFirstPage">نمایش در صفحه محصولات ؟</label>
                        <input className={styles.isForBusiness} id='showInFirstPage' type="checkbox" {...register("showInFirstPage")} />
                        {errors.showInFirstPage && (<p className={styles.errorMessage}>{errors.showInFirstPage.message}</p>)}
                    </span>
                </div>

                <div className={styles.formDetails}>
                    <label htmlFor="description">توضیحات :</label>
                    <textarea id='description' {...register("description")} />
                    {errors.description && (<p className={styles.errorMessage}>{errors.description.message}</p>)}
                </div>

                <div className={styles.sliderContainer}>
                    <span>
                        <label htmlFor="slider1" className={styles.slide} style={{ backgroundImage: `url(${previews.slider1 ? previews.slider1 : `/media/${data?.slider1}`})` }}>
                            {!previews.thumbnail && !data?.slider1 && <IoMdAddCircle />}
                        </label>
                        <input dir='ltr' className='hidden' type='file' accept='image/*' id='slider1' {...register("slider1")} onChange={(e) => handleImageChange(e, "slider1")} />
                        {errors.slider1 && (<p className={styles.errorMessage}>{errors.slider1.message as string}</p>)}
                    </span>
                    <span>
                        <label htmlFor="slider2" className={styles.slide} style={{ backgroundImage: `url(${previews.slider2 ? previews.slider2 : `/media/${data?.slider2}`})` }}>
                            {!previews.thumbnail && !data?.slider2 && <IoMdAddCircle />}
                        </label>
                        <input dir='ltr' className='hidden' type='file' accept='image/*' id='slider2' {...register("slider2")} onChange={(e) => handleImageChange(e, "slider2")} />
                        {errors.slider2 && (<p className={styles.errorMessage}>{errors.slider2.message as string}</p>)}
                    </span>
                    <span>
                        <label htmlFor="slider3" className={styles.slide} style={{ backgroundImage: `url(${previews.slider3 ? previews.slider3 : `/media/${data?.slider3}`})` }}>
                            {!previews.thumbnail && !data?.slider3 && <IoMdAddCircle />}
                        </label>
                        <input dir='ltr' className='hidden' type='file' accept='image/*' id='slider3' {...register("slider3")} onChange={(e) => handleImageChange(e, "slider3")} />
                        {errors.slider3 && (<p className={styles.errorMessage}>{errors.slider3.message as string}</p>)}
                    </span>
                </div>

                <div>
                    <button type="submit" className={styles.submitButton}>ارسال</button>
                    <button type='button' onClick={onClose}>بستن</button>
                </div>
                {message && (<p className={styles.message}>{message}</p>)}
            </form>
        </section>
    );
};

export default EditVariation;
