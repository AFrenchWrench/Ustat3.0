"use client";

import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { IoMdAddCircle } from "react-icons/io";

import styles from "@/allStyles/addItemStyles.module.css";

import Cookies from 'js-cookie';

const maxFileSize = 3 * 1024 * 1024;

const fileSchema = z.instanceof(File).refine(file => file.size <= maxFileSize, {
    message: 'File size must be less than 3MB',
}).refine(file => file.type.startsWith('image/'), {
    message: 'Only image files are allowed'
});

const schema = z.object({
    type: z.string().min(1, 'Type is required'),
    name: z.string().min(1, 'Name is required'),
    dimensions: z.object({
        height: z.string().min(1, "Height is required"),
        width: z.string().min(1, "Width is required"),
        depth: z.string().min(1, "Depth is required")
    }),
    price: z.number().min(0, 'Price must be a positive number').or(z.string().min(1, 'Price is required')),
    description: z.string().min(1, 'Description is required'),
    thumbnail: fileSchema,
    slider1: fileSchema,
    slider2: fileSchema,
    slider3: fileSchema,
});

type FieldNames = 'thumbnail' | 'slider1' | 'slider2' | 'slider3';
type FormValues = z.infer<typeof schema>;

const CreateDisplayItem = () => {
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
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        const Authorization = Cookies.get("Authorization");

        // Prepare dimensions
        const dimensions = {
            height: data.dimensions.height,
            width: data.dimensions.width,
            depth: data.dimensions.depth,
        };
        const dimensionsString = JSON.stringify(dimensions);

        // Escape strings
        const escapeString = (str: string) => str.replace(/"/g, '\\"');
        const query = `
          mutation CreateDisplayItem {
            createDisplayItem(
              input: { 
                type: "${escapeString(data.type)}", 
                name: "${escapeString(data.name)}", 
                dimensions: "${escapeString(dimensionsString)}", 
                price: ${data.price}, 
                description: "${escapeString(data.description)}"
              }
            ) {
              success
              displayItem {
                id
              }
            }
          }
        `;

        try {
            const response = await fetch('/api/sales/graphql/', {
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

            if (result.data.createDisplayItem.success) {
                setMessage('Item created successfully!');
                const itemId = result.data.createDisplayItem.displayItem.id;

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
                const uploadResponse = await fetch(`http://localhost/api/sales/display-item/${itemId}/upload-images/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': Authorization ? Authorization : '',
                    },
                    body: formData,
                });

                const uploadResult = await uploadResponse.json();

                if (uploadResponse.ok) {
                    setMessage('Images uploaded successfully!');
                    reset();

                    (['thumbnail', 'slider1', 'slider2', 'slider3'] as const).forEach(key => {
                        previews[key] = "";
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
            setValue(fieldName, file); // Pass the file directly
        }
    };

    return (
        <section className={styles.profileContainer}>
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
                        <label htmlFor="type">نوع محصول :</label>

                        <select id='type' {...register("type")}>
                            <option value="s">مبل</option>
                            <option value="b">سرویس خواب</option>
                            <option value="m">میز و صندلی</option>
                            <option value="j">جلومبلی و عسلی</option>
                            <option value="c">آینه کنسول</option>
                        </select>


                        {errors.type && (<p className={styles.errorMessage}>{errors.type.message}</p>)}
                    </span>
                </div>

                <div className={styles.twoContainer}>
                    <span>
                        <label htmlFor="width">طول :</label>
                        <input dir='ltr' type="text" id='width' {...register("dimensions.width")} />
                        {errors.dimensions?.width && (<p className={styles.errorMessage}>{errors.dimensions.width.message}</p>)}
                    </span>

                    <span>
                        <label htmlFor="height">عرض :</label>
                        <input dir='ltr' type="text" id='height' {...register("dimensions.height")} />
                        {errors.dimensions?.height && (<p className={styles.errorMessage}>{errors.dimensions.height.message}</p>)}
                    </span>

                    <span>
                        <label htmlFor="depth">ارتفاع :</label>
                        <input dir='ltr' type="text" id='depth' {...register("dimensions.depth")} />
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

                <div className={styles.formDetails}>
                    <label htmlFor="description">توضیحات :</label>
                    <textarea dir='ltr' id='description' {...register("description")} />
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

                <button type="submit" className={styles.submitButton}>ارسال</button>
                {message && <p className={styles.message}>{message}</p>}
            </form>
        </section>
    );
};

export default CreateDisplayItem;
