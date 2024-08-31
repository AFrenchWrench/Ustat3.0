"use client";

import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';

import { IoMdAddCircle } from "react-icons/io";

import styles from "@/allStyles/addItemStyles.module.css";

import Cookies from 'js-cookie';

const maxFileSize = 3 * 1024 * 1024;

const dimensionsSchema = z.object({
    width: z.string().optional(), // Making the width optional
    height: z.string().optional(), // Making the height optional
    length: z.string().optional(), // Making the length optional

    mirror: z.object({
        width: z.string().optional(),
        height: z.string().optional(),
        length: z.string().optional(),
    }).optional(), // Making the mirror object optional

    "night stand": z.object({
        width: z.string().optional(),
        height: z.string().optional(),
        length: z.string().optional(),
        quantity: z.string().optional(),
    }).optional(), // Making the night stand object optional

    "makeup table": z.object({
        width: z.string().optional(),
        height: z.string().optional(),
        length: z.string().optional(),
    }).optional(), // Making the makeup table object optional

    chair: z.object({
        quantity: z.string().optional(),
        height: z.string().optional(),
        width: z.string().optional(),
        length: z.string().optional(),
    }).optional(), // Making the chair object optional

    "side table": z.object({
        quantity: z.string().optional(),
        height: z.string().optional(),
        width: z.string().optional(),
        length: z.string().optional(),
    }).optional(), // Making the side table object optional

    "single seat": z.object({
        height: z.string().optional(),
        width: z.string().optional(),
        length: z.string().optional(),
    }).optional(), // Making the single seat object optional
});

const schema = z.object({
    isForBusiness: z.boolean(),
    showInFirstPage: z.boolean(),
    name: z.string().min(1, 'Name is required'),
    dimensions: dimensionsSchema,
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

interface Dimensions {
    height: number;
    width: number;
    length: number;
    chair?: ChairDimensions; // Optional property
    mirror?: ChairDimensions;
    "night stand"?: ChairDimensions
    "makeup table"?: ChairDimensions
    "side table"?: ChairDimensions
    "single seat"?: ChairDimensions
}

interface ChairDimensions {
    width?: number;
    height?: number;
    length?: number;
    quantity?: number;
}


type AddDisplayItemProps = {
    onClose: () => void;
    data: Ivariations | null;
    type: string;
};

const EditVariation: React.FC<AddDisplayItemProps> = ({ onClose, data, type }) => {

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
                length: data ? JSON.parse(data.dimensions).length.toString() : '',
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
            setValue('dimensions.length', JSON.parse(data.dimensions).length.toString());

            setValue('dimensions.chair.height', JSON.parse(data.dimensions).chair?.height.toString());
            setValue('dimensions.chair.length', JSON.parse(data.dimensions).chair?.length.toString());
            setValue('dimensions.chair.width', JSON.parse(data.dimensions).chair?.width.toString());
            setValue('dimensions.chair.quantity', JSON.parse(data.dimensions).chair?.quantity.toString());

            setValue('dimensions.night stand.height', JSON.parse(data.dimensions)["night stand"]?.height.toString());
            setValue('dimensions.night stand.length', JSON.parse(data.dimensions)["night stand"]?.length.toString());
            setValue('dimensions.night stand.width', JSON.parse(data.dimensions)["night stand"]?.width.toString());
            setValue('dimensions.night stand.quantity', JSON.parse(data.dimensions)["night stand"]?.quantity.toString());

            setValue('dimensions.side table.height', JSON.parse(data.dimensions)["side table"]?.height.toString());
            setValue('dimensions.side table.length', JSON.parse(data.dimensions)["side table"]?.length.toString());
            setValue('dimensions.side table.width', JSON.parse(data.dimensions)["side table"]?.width.toString());
            setValue('dimensions.side table.quantity', JSON.parse(data.dimensions)["side table"]?.quantity.toString());

            setValue('dimensions.makeup table.height', JSON.parse(data.dimensions)["makeup table"]?.height.toString());
            setValue('dimensions.makeup table.length', JSON.parse(data.dimensions)["makeup table"]?.length.toString());
            setValue('dimensions.makeup table.width', JSON.parse(data.dimensions)["makeup table"]?.width.toString());

            setValue('dimensions.single seat.height', JSON.parse(data.dimensions)["single seat"]?.height.toString());
            setValue('dimensions.single seat.length', JSON.parse(data.dimensions)["single seat"]?.length.toString());
            setValue('dimensions.single seat.width', JSON.parse(data.dimensions)["single seat"]?.width.toString());

            setValue('dimensions.mirror.height', JSON.parse(data.dimensions).mirror?.height.toString());
            setValue('dimensions.mirror.length', JSON.parse(data.dimensions).mirror?.length.toString());
            setValue('dimensions.mirror.width', JSON.parse(data.dimensions).mirror?.width.toString());


            setValue('fabric', data.fabric);
            setValue('color', data.color);
            setValue('woodColor', data.woodColor);
            setValue('price', data.price);
            setValue('description', data.description);
        }
    }, [data, setValue]);

    const onSubmit: SubmitHandler<FormValues> = async (formData) => {
        const Authorization = Cookies.get("Authorization");

        const escapeString = (str: string) => str.replace(/"/g, '\\"');

        const dimensions: Dimensions = {
            width: Number(formData.dimensions.width),
            height: Number(formData.dimensions.height),
            length: Number(formData.dimensions.length),
        };

        switch (type) {
            case "S":
                dimensions['single seat'] = formData.dimensions['single seat'] ? {
                    width: Number(formData.dimensions['single seat'].width),
                    height: Number(formData.dimensions['single seat'].height),
                    length: Number(formData.dimensions['single seat'].length),
                } : undefined;
                break;

            case "M":
                dimensions.chair = formData.dimensions.chair ? {
                    width: Number(formData.dimensions.chair.width),
                    height: Number(formData.dimensions.chair.height),
                    length: Number(formData.dimensions.chair.length),
                    quantity: Number(formData.dimensions.chair.quantity)
                } : undefined;
                break;

            case "B":
                if (formData.dimensions['makeup table']) {
                    dimensions["makeup table"] = {
                        width: Number(formData.dimensions['makeup table'].width),
                        height: Number(formData.dimensions['makeup table'].height),
                        length: Number(formData.dimensions['makeup table'].length),
                    };
                }
                if (formData.dimensions['night stand']) {
                    dimensions["night stand"] = {
                        width: Number(formData.dimensions['night stand'].width),
                        height: Number(formData.dimensions['night stand'].height),
                        length: Number(formData.dimensions['night stand'].length),
                        quantity: Number(formData.dimensions['night stand'].quantity),
                    };
                }
                if (formData.dimensions.mirror) {
                    dimensions.mirror = {
                        width: Number(formData.dimensions.mirror.width),
                        height: Number(formData.dimensions.mirror.height),
                        length: Number(formData.dimensions.mirror.length),
                    };
                }
                break;

            case "J":
                if (formData.dimensions['side table']) {
                    dimensions["side table"] = {
                        width: Number(formData.dimensions['side table'].width),
                        height: Number(formData.dimensions['side table'].height),
                        length: Number(formData.dimensions['side table'].length),
                        quantity: Number(formData.dimensions['side table'].quantity),
                    };
                }
                break;

            case "C":
                if (formData.dimensions.mirror) {
                    dimensions.mirror = {
                        width: Number(formData.dimensions.mirror.width),
                        height: Number(formData.dimensions.mirror.height),
                        length: Number(formData.dimensions.mirror.length),
                    };
                }
                break;

            default:
                break;
        }



        const isFormUnchanged = (
            formData.name === data?.name && // Check name equality
            formData.price === data?.price && // Check price equality
            dimensions === JSON.parse(data?.dimensions) &&
            formData.description === data?.description && // Check description equality
            formData.fabric === data?.fabric && // Check fabric equality (typo fixed)
            formData.color === data?.color && // Check color equality
            formData.woodColor === data?.woodColor && // Check woodColor equality
            formData.showInFirstPage === data?.showInFirstPage && // Check showInFirstPage equality
            formData.isForBusiness === data?.isForBusiness// Check isForBusiness equality
        );

        console.log(dimensions);
        if (data?.dimensions) {
            console.log(JSON.parse(data.dimensions));

        }


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



        // Convert cleaned dimensions object to JSON string
        const dimensionsString = JSON.stringify(dimensions);



        const query = `
                    mutation UpdateItemVariant {
                        updateItemVariant(
                            input: {
                                id: ${data?.id}
                                ${formData.name && formData.name !== data?.name ? `name: "${formData.name}",` : ""}
                                ${formData.dimensions && dimensionsString !== data?.dimensions.replace(/\s+/g, '') ? `dimensions: "${escapeString(dimensionsString)}",` : ""}
                                ${formData.price && formData.price !== data?.price ? `price: ${formData.price},` : ""}
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
                            itemVariant {
                                            id
                                        }
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
                if (uploadData.values.length > 0) {
                    const uploadResponse = await fetch(`http://localhost/api/sales/display-item-variant/${itemId}/upload-images/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': Authorization ? Authorization : '',
                        },
                        body: uploadData,
                    });
                    console.log(uploadData);


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

                        onClose()

                    } else {
                        setMessage('Failed to upload images.');
                        console.error('Upload Error:', uploadResult);
                    }
                }
                else {
                    onClose()
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
                        <input dir='ltr' type="number" id='depth' {...register("dimensions.length")} />
                        {errors.dimensions?.length && (<p className={styles.errorMessage}>{errors.dimensions.length.message}</p>)}
                    </span>
                </div>

                {
                    type === "M" && (
                        <div className={styles.twoContainer}>

                            <span>
                                <label htmlFor="quantity">تعداد صندلی :</label>
                                <input dir='ltr' type="number" id='quantity' {...register("dimensions.chair.quantity")} />
                                {errors.dimensions?.chair?.quantity && (<p className={styles.errorMessage}>{errors.dimensions.chair?.quantity.message}</p>)}
                            </span>
                            <span>
                                <label htmlFor="cwidth">عرض صندلی :</label>
                                <input dir='ltr' type="number" id='cwidth' {...register("dimensions.chair.width")} />
                                {errors.dimensions?.chair?.width && (<p className={styles.errorMessage}>{errors.dimensions.chair?.width.message}</p>)}
                            </span>
                            <span>
                                <label htmlFor="cheight">ارتفاع صندلی :</label>
                                <input dir='ltr' type="number" id='cheight' {...register("dimensions.chair.height")} />
                                {errors.dimensions?.chair?.height && (<p className={styles.errorMessage}>{errors.dimensions.chair?.height.message}</p>)}
                            </span>
                            <span>
                                <label htmlFor="cdepth">طول صندلی :</label>
                                <input dir='ltr' type="number" id='cdepth' {...register("dimensions.chair.length")} />
                                {errors.dimensions?.chair?.length && (<p className={styles.errorMessage}>{errors.dimensions.chair?.length.message}</p>)}
                            </span>
                        </div>

                    )
                }
                {
                    type === "B" && (

                        <>
                            {/* Mirror dimensions */}
                            <div className={styles.twoContainer}>
                                <span>
                                    <label htmlFor="mirrorWidth">عرض آینه :</label>
                                    <input dir='ltr' type="number" id='mirrorWidth' {...register("dimensions.mirror.width")} />
                                    {errors.dimensions?.mirror?.width && (<p className={styles.errorMessage}>{errors.dimensions.mirror?.width.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="mirrorHeight">ارتفاع آینه :</label>
                                    <input dir='ltr' type="number" id='mirrorHeight' {...register("dimensions.mirror.height")} />
                                    {errors.dimensions?.mirror?.height && (<p className={styles.errorMessage}>{errors.dimensions.mirror?.height.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="mirrorLength">طول آینه :</label>
                                    <input dir='ltr' type="number" id='mirrorLength' {...register("dimensions.mirror.length")} />
                                    {errors.dimensions?.mirror?.length && (<p className={styles.errorMessage}>{errors.dimensions.mirror?.length.message}</p>)}
                                </span>
                            </div>

                            {/* Night stand */}
                            <div className={styles.twoContainer}>
                                <span>
                                    <label htmlFor="nightStandQuantity">تعداد پاتختی :</label>
                                    <input dir='ltr' type="number" id='nightStandQuantity' {...register("dimensions.night stand.quantity")} />
                                    {errors.dimensions?.["night stand"]?.quantity && (<p className={styles.errorMessage}>{errors.dimensions["night stand"]?.quantity.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="nightStandWidth">عرض پاتختی :</label>
                                    <input dir='ltr' type="number" id='nightStandWidth' {...register("dimensions.night stand.width")} />
                                    {errors.dimensions?.["night stand"]?.width && (<p className={styles.errorMessage}>{errors.dimensions["night stand"]?.width.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="nightStandHeight">ارتفاع پاتختی :</label>
                                    <input dir='ltr' type="number" id='nightStandHeight' {...register("dimensions.night stand.height")} />
                                    {errors.dimensions?.["night stand"]?.height && (<p className={styles.errorMessage}>{errors.dimensions["night stand"]?.height.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="nightStandLength">طول پاتختی :</label>
                                    <input dir='ltr' type="number" id='nightStandLength' {...register("dimensions.night stand.length")} />
                                    {errors.dimensions?.["night stand"]?.length && (<p className={styles.errorMessage}>{errors.dimensions["night stand"]?.length.message}</p>)}
                                </span>
                            </div>

                            {/* Makeup table */}
                            <div className={styles.twoContainer}>
                                <span>
                                    <label htmlFor="makeupTableWidth">عرض میز آرایش :</label>
                                    <input dir='ltr' type="number" id='makeupTableWidth' {...register("dimensions.makeup table.width")} />
                                    {errors.dimensions?.["makeup table"]?.width && (<p className={styles.errorMessage}>{errors.dimensions["makeup table"]?.width.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="makeupTableHeight">ارتفاع میز آرایش :</label>
                                    <input dir='ltr' type="number" id='makeupTableHeight' {...register("dimensions.makeup table.height")} />
                                    {errors.dimensions?.["makeup table"]?.height && (<p className={styles.errorMessage}>{errors.dimensions["makeup table"]?.height.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="makeupTableLength">طول میز آرایش :</label>
                                    <input dir='ltr' type="number" id='makeupTableLength' {...register("dimensions.makeup table.length")} />
                                    {errors.dimensions?.["makeup table"]?.length && (<p className={styles.errorMessage}>{errors.dimensions["makeup table"]?.length.message}</p>)}
                                </span>
                            </div>
                        </>
                    )
                }
                {
                    type === "J" && (

                        <>
                            {/* Night stand */}
                            <div className={styles.twoContainer}>
                                <span>
                                    <label htmlFor="sidetableQuantity">تعداد میز :</label>
                                    <input dir='ltr' type="number" id='sidetableQuantity' {...register("dimensions.side table.quantity")} />
                                    {errors.dimensions?.["side table"]?.quantity && (<p className={styles.errorMessage}>{errors.dimensions["side table"]?.quantity.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="sidetableWidth">عرض میز :</label>
                                    <input dir='ltr' type="number" id='sidetableWidth' {...register("dimensions.side table.width")} />
                                    {errors.dimensions?.["side table"]?.width && (<p className={styles.errorMessage}>{errors.dimensions["side table"]?.width.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="sidetableHeight">ارتفاع میز :</label>
                                    <input dir='ltr' type="number" id='sidetableHeight' {...register("dimensions.side table.height")} />
                                    {errors.dimensions?.["side table"]?.height && (<p className={styles.errorMessage}>{errors.dimensions["side table"]?.height.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="sidetableLength">طول میز :</label>
                                    <input dir='ltr' type="number" id='sidetableLength' {...register("dimensions.side table.length")} />
                                    {errors.dimensions?.["side table"]?.length && (<p className={styles.errorMessage}>{errors.dimensions["side table"]?.length.message}</p>)}
                                </span>
                            </div>

                        </>
                    )
                }
                {
                    type === "C" && (

                        <>
                            {/* Night stand */}
                            <div className={styles.twoContainer}>
                                <span>
                                    <label htmlFor="mirrorWidth">عرض آینه :</label>
                                    <input dir='ltr' type="number" id='mirrorWidth' {...register("dimensions.mirror.width")} />
                                    {errors.dimensions?.mirror?.width && (<p className={styles.errorMessage}>{errors.dimensions.mirror?.width.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="mirrorHeight">ارتفاع آینه :</label>
                                    <input dir='ltr' type="number" id='mirrorHeight' {...register("dimensions.mirror.height")} />
                                    {errors.dimensions?.mirror?.height && (<p className={styles.errorMessage}>{errors.dimensions.mirror?.height.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="mirrorLength">طول آینه :</label>
                                    <input dir='ltr' type="number" id='mirrorLength' {...register("dimensions.mirror.length")} />
                                    {errors.dimensions?.mirror?.length && (<p className={styles.errorMessage}>{errors.dimensions.mirror?.length.message}</p>)}
                                </span>
                            </div>

                        </>
                    )
                }
                {
                    type === "S" && (

                        <>
                            {/* Night stand */}
                            <div className={styles.twoContainer}>
                                <span>
                                    <label htmlFor="singleWidth">عرض تک نفره :</label>
                                    <input dir='ltr' type="number" id='singleWidth' {...register("dimensions.single seat.width")} />
                                    {errors.dimensions?.["single seat"]?.width && (<p className={styles.errorMessage}>{errors.dimensions['single seat'].width.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="single seatHeight">ارتفاع تک نفره :</label>
                                    <input dir='ltr' type="number" id='single seatHeight' {...register("dimensions.single seat.height")} />
                                    {errors.dimensions?.["single seat"]?.height && (<p className={styles.errorMessage}>{errors.dimensions['single seat'].height.message}</p>)}
                                </span>
                                <span>
                                    <label htmlFor="single seatLength">طول تک نفره :</label>
                                    <input dir='ltr' type="number" id='single seatLength' {...register("dimensions.single seat.length")} />
                                    {errors.dimensions?.["single seat"]?.length && (<p className={styles.errorMessage}>{errors.dimensions['single seat'].length.message}</p>)}
                                </span>
                            </div>

                        </>
                    )
                }

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
