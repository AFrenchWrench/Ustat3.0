import React from 'react'

const page = ({params}:{
    params:{username:string}
}) => {
  return (
    <div>
      user:{params.username}
    </div>
  )
}

export default page
