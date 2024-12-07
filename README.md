This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.





Cleanup the project after installation:


- delete public
- delete app/favicon.ico
- head to global.css and delete the content and just keep the first three lines
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
- remove everything from app/page.tsx and just keep the following:
```tsx
import React from 'react'

export const Home = () => {
  return (
    <div>Home</div>
  )
}
export default Home; 
```


then head to .env file and paste 
```env
'mongodb://127.0.0.1:27017/learn-v1Auth'
```

then run the following command to install the required packages:
```bash 
npm i mongoose
```
head to libs/db.ts and paste the following to connect to the database:
```ts
import mongoose from 'mongoose';

const connectDB = async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI!); 
        console.log(`MongoDB Connected🚀: ${conn.connection.host}`);
    }
    catch(error: any){
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;
```





shadcn  and ui components:
```bash
installation
npx --legacy-peer-deps shadcn@latest init


npx --legacy-peer-deps shadcn@latest add button card input table dropdown-menu label


# icons
npm i @tabler/icons-react




installing authjs 
```bash
npm install next-auth@beta
```
then follow the instructions in the documentation to set up the auth system
[authjs doc](https://authjs.dev/getting-started/installation)


<!-- Registering the user- -->
make a server action to register the user
create actions/user.ts in the root directory.
This will get the user data from the registration form in localhost:3000/register and send it to the server side here.
- You should specify the form action to send data here in the user.ts file.
- You should also specify the method to be used in the form action.
```ts
"use server";

import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";

const login = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      redirect: false,
      callbackUrl: "/",
      email,
      password,
    });
  } catch (error) {
    const someError = error as CredentialsSignin;
    return someError.cause;
  }
  redirect("/");
};

const register = async (formData: FormData) => {
  const firstName = formData.get("firstname") as string;
  const lastName = formData.get("lastname") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log(firstName, lastName, email, password);

  if (!firstName || !lastName || !email || !password) {
    throw new Error("Please fill all fields");
  }

  await connectDB();

  // existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await hash(password, 12);

  await User.create({ firstName, lastName, email, password: hashedPassword });
//   console.log(User);
  redirect("/login");
};

const fetchAllUsers = async () => {
  await connectDB();
  const users = await User.find({});
  return users;
};

export { register, login, fetchAllUsers };
```

<!-- authorizing the user  -->


head to the documentation of authjs and follow the instructions to authorize the user.
[CREDENTIALS](https://authjs.dev/getting-started/authentication/credentials)


