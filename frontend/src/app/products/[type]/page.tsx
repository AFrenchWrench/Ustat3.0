import { ImageList, ImageListItem } from '@mui/material'
import React from 'react'
import Article from '../components/Article'

const page = () => {
    return (
        <section className='flex flex-col gap-5 items-center mt-10'>
            <ImageList gap={8} sx={{ width: "80%" }} cols={3}>
                <ImageListItem>
                    <Article />
                </ImageListItem>
                <ImageListItem>
                    <Article />
                </ImageListItem>
                <ImageListItem>
                    <Article />
                </ImageListItem>
                <ImageListItem>
                    <Article />
                </ImageListItem>
                <ImageListItem>
                    <Article />
                </ImageListItem>
                <ImageListItem>
                    <Article />
                </ImageListItem>
                <ImageListItem>
                    <Article />
                </ImageListItem>
                <ImageListItem>
                    <Article />
                </ImageListItem>
            </ImageList>

        </section>
    )
}

export default page
