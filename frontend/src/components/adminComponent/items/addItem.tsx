"use client";

import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { IoMdAddCircle } from "react-icons/io";

import styles from "@/allStyles/addItemStyles.module.css";

import Cookies from 'js-cookie';

const maxFileSize = 3 * 1024 * 1024;

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
type FieldNamesError =
    | "name"
    | "fabric"
    | "color"
    | "woodColor"
    | "price"
    | "description"
    | "dimensions"
    | "showInFirstPage"
    | "isForBusiness"

interface ErrorMapping {
    [key: string]: FieldNamesError;
}

const fileSchema = z.instanceof(File).refine(file => file.size <= maxFileSize, {
    message: 'File size must be less than 3MB',
}).refine(file => file.type.startsWith('image/'), {
    message: 'Only image files are allowed'
});

const dimensionsSchema = z.object({
    width: z.string().min(1, "Width is required"),
    height: z.string().min(1, "Height is required"),
    length: z.string().min(1, "Length is required"),
    mirror: z.object({
        width: z.string().min(1, "Width is required"),
        height: z.string().min(1, "Height is required"),
        length: z.string().min(1, "Length is required"),
    }).optional(),
    "night stand": z.object({
        width: z.string().min(1, "Width is required"),
        height: z.string().min(1, "Height is required"),
        length: z.string().min(1, "Length is required"),
        quantity: z.string().min(1, "Quantity is required"),
    }).optional(),
    "makeup table": z.object({
        width: z.string().min(1, "Width is required"),
        height: z.string().min(1, "Height is required"),
        length: z.string().min(1, "Length is required"),
    }).optional(),
    chair: z.object({
        quantity: z.string().min(1, "Quantity is required"),
        height: z.string().min(1, "Height is required"),
        width: z.string().min(1, "Width is required"),
        length: z.string().min(1, "Depth is required"),
    }).optional(),
    "side table": z.object({
        quantity: z.string().min(1, "Quantity is required"),
        height: z.string().min(1, "Height is required"),
        width: z.string().min(1, "Width is required"),
        length: z.string().min(1, "Depth is required"),
    }).optional(),
    "single seat": z.object({
        height: z.string().min(1, "Height is required"),
        width: z.string().min(1, "Width is required"),
        length: z.string().min(1, "Depth is required"),
    }).optional(),
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
    thumbnail: fileSchema,
    slider1: fileSchema,
    slider2: fileSchema,
    slider3: fileSchema,
});

type FieldNames = 'thumbnail' | 'slider1' | 'slider2' | 'slider3';
type FormValues = z.infer<typeof schema>;

type AddDisplayItemProps = {
    onClose: () => void;
    id: string;
    type: string;
};

const CreateDisplayItem: React.FC<AddDisplayItemProps> = ({ onClose, id, type }) => {
    console.log(type);

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
        setError,
        reset
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            isForBusiness: false,
            showInFirstPage: false
        },
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        const Authorization = Cookies.get("Authorization");

        // Prepare dimensions
        const dimensions: Dimensions = {
            height: Number(data.dimensions.height),
            width: Number(data.dimensions.width),
            length: Number(data.dimensions.length)
        };

        if (data.dimensions.chair !== undefined) {
            dimensions.chair = {
                quantity: Number(data.dimensions.chair.quantity),
                height: Number(data.dimensions.chair.height),
                width: Number(data.dimensions.chair.width),
                length: Number(data.dimensions.chair.length)
            };
        }
        if (data.dimensions.mirror !== undefined) {
            dimensions.mirror = {
                height: Number(data.dimensions.mirror.height),
                width: Number(data.dimensions.mirror.width),
                length: Number(data.dimensions.mirror.length)
            };
        }
        if (data.dimensions['night stand'] !== undefined) {
            dimensions['night stand'] = {
                height: Number(data.dimensions['night stand'].height),
                width: Number(data.dimensions['night stand'].width),
                length: Number(data.dimensions['night stand'].length),
                quantity: Number(data.dimensions['night stand'].quantity)
            };
        }
        if (data.dimensions['makeup table'] !== undefined) {
            dimensions['makeup table'] = {
                height: Number(data.dimensions['makeup table'].height),
                width: Number(data.dimensions['makeup table'].width),
                length: Number(data.dimensions['makeup table'].length)
            };
        }
        if (data.dimensions['side table'] !== undefined) {
            dimensions['side table'] = {
                height: Number(data.dimensions['side table'].height),
                width: Number(data.dimensions['side table'].width),
                length: Number(data.dimensions['side table'].length),
                quantity: Number(data.dimensions['side table'].quantity),
            };
        }
        if (data.dimensions['single seat'] !== undefined) {
            dimensions['single seat'] = {
                height: Number(data.dimensions['single seat'].height),
                width: Number(data.dimensions['single seat'].width),
                length: Number(data.dimensions['single seat'].length),
            };
        }
        const dimensionsString = JSON.stringify(dimensions);

        const escapeString = (str: string) => str.replace(/"/g, '\\"');
        const query = `
                    mutation CreateItemVariant {
                        createItemVariant(
                            input: {
                                displayItem: "${id}"
                                name: "${data.name}"
                                dimensions: "${escapeString(dimensionsString)}"
                                price: ${data.price}
                                description: "${data.description}"
                                fabric: "${data.fabric}"
                                color: "${data.color}"
                                woodColor: "${data.woodColor}"
                                showInFirstPage: ${data.showInFirstPage}
                                isForBusiness: ${data.isForBusiness}
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
            const result = await response.json();

            console.log(query);
            console.log(result);
            if (result.data.errors) {
                setMessage(result.data.errors)
            }

            if (result.data.createItemVariant.errors) {
                const errorsObject = JSON.parse(result.data.createItemVariant.errors);

                // Convert the object to a readable string format for display
                const formattedErrors = JSON.stringify(errorsObject, null, 2); // The "2" adds indentation

                // Set the formatted string as the message
                setMessage(formattedErrors);
            }

            if (result.data.createItemVariant.success) {
                setMessage('محصول با موفقیت ساخته شد');
                const itemId = result.data.createItemVariant.itemVariant.id;

                // Prepare images for upload
                const formData = new FormData();

                // Append the main thumbnail
                const thumbnailFile = data.thumbnail; // Directly use data.thumbnail as File
                if (thumbnailFile) {
                    formData.append('thumbnail', thumbnailFile);
                }

                // Append slider images
                const sliderFiles = [data.slider1, data.slider2, data.slider3]; // Directly use data.slider1, data.slider2, data.slider3 as File
                sliderFiles.forEach((file, index) => {
                    if (file) {
                        formData.append(`slider${index + 1}`, file);
                    }
                });

                // Second request: Upload images
                const uploadResponse = await fetch(`http://localhost/api/sales/display-item-variant/${itemId}/upload-images/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': Authorization ? Authorization : '',
                    },
                    body: formData,
                });

                const uploadResult = await uploadResponse.json();

                if (uploadResponse.ok) {
                    setMessage('عکس با موفقیت بارگذاری شد');
                    reset();

                    (['thumbnail', 'slider1', 'slider2', 'slider3'] as const).forEach(key => {
                        previews[key] = "";
                    });

                    setTimeout(() => {
                        setMessage("");
                    }, 2000);

                } else {
                    setMessage('بارگذاری عکس با مشکل مواجه شد');
                    console.error('Upload Error:', uploadResult);
                }
            }
            if (result.data.createItemVariant.errors) {
                const errors = JSON.parse(result.data.createItemVariant.errors)
                const errorMapping: ErrorMapping = {
                    name: "name",
                    fabric: "fabric",
                    color: "color",
                    woodColor: "woodColor",
                    price: "price",
                    description: "description",
                    dimensions: "dimensions",
                    showInFirstPage: "showInFirstPage",
                    isForBusiness: "isForBusiness",
                };

                Object.keys(errors).forEach((key) => {
                    if (errorMapping[key]) {
                        setError(errorMapping[key], {
                            type: "server",
                            message: errors[key]
                        });
                        console.log(errors[key]);

                    }
                });

                return;

            }

            else if (result.data.errors) {
                setMessage(result.data.errors[0]);
            }
            else {
                setMessage("محصول جدید اضافه شد");
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('مشکلی پیش آمده');
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
            setValue(fieldName, file); // Pass the file directly
        }
    };

    return (
        <section className={styles.addDisplayItemFormSection + " !items-start"}>
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>

                <div className={styles.formDetails}>
                    <label htmlFor="thumbnail" className={styles.thumbnail} style={{ backgroundImage: `url(${previews.thumbnail || ''})` }}>
                        {!previews.thumbnail && <IoMdAddCircle />}
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
                    {errors.thumbnail && (<p className={styles.errorMessage}>{errors.thumbnail.message}</p>)}
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
                    {errors.dimensions && (<p className={styles.errorMessage}>{errors.dimensions.message}</p>)}
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
                        <label htmlFor="slider1" className={styles.slide} style={{ backgroundImage: `url(${previews.slider1 || ''})` }}>
                            {!previews.slider1 && <IoMdAddCircle />}
                        </label>
                        <input dir='ltr' className='hidden' type='file' accept='image/*' id='slider1' {...register("slider1")} onChange={(e) => handleImageChange(e, "slider1")} />
                        {errors.slider1 && (<p className={styles.errorMessage}>{errors.slider1.message as string}</p>)}
                    </span>
                    <span>
                        <label htmlFor="slider2" className={styles.slide} style={{ backgroundImage: `url(${previews.slider2 || ''})` }}>
                            {!previews.slider2 && <IoMdAddCircle />}
                        </label>
                        <input dir='ltr' className='hidden' type='file' accept='image/*' id='slider2' {...register("slider2")} onChange={(e) => handleImageChange(e, "slider2")} />
                        {errors.slider2 && (<p className={styles.errorMessage}>{errors.slider2.message as string}</p>)}
                    </span>
                    <span>
                        <label htmlFor="slider3" className={styles.slide} style={{ backgroundImage: `url(${previews.slider3 || ''})` }}>
                            {!previews.slider3 && <IoMdAddCircle />}
                        </label>
                        <input dir='ltr' className='hidden' type='file' accept='image/*' id='slider3' {...register("slider3")} onChange={(e) => handleImageChange(e, "slider3")} />
                        {errors.slider3 && (<p className={styles.errorMessage}>{errors.slider3.message as string}</p>)}
                    </span>
                </div>
                <div>
                    <button type="submit" className={styles.submitButton}>ارسال</button>
                    <button type='button' onClick={onClose}>بستن</button>
                </div>
                {message && <p className={styles.message}>{message}</p>}
            </form>
        </section>
    );
};

export default CreateDisplayItem;


