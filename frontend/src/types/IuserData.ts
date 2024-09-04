interface IuserData {
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    landlineNumber: string;
    email: string;
    birthdate: string;
    business?: {
      name: string;
      ownerFirstName: string;
      ownerLastName: string;
      ownerPhoneNumber: string;
      address: string;
      isConfirmed:boolean;
    };
    password?: string;
    newPassword?: string;
    confirmNewPassword?: string;
    isBusinessSigninInput:boolean
  }

  
  export default IuserData