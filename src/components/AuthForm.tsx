'use client'
import React, { use, useState } from 'react'
import { AuthFormProps, User } from '@/types/authTypes'
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import API from '@/utils/Api';
import useNewContext from '@/providers/userSessionProvider';
export default function AuthForm({mode, headerText, buttonText}: AuthFormProps) {
  const router = useRouter();
  const {setLoggedUser} = useNewContext();
  const [user, setUser] = useState<User>({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser((prevUser) => ({
            ...prevUser,
            [name]: value,
        }));
    }

    const handlePayload = async() => {
      if (mode === 'login') {
        if (user.email && user.password) {
            const url = "login"
            try {
              const response = await API.post(url, {
                email: user.email,
                password: user.password
              })
              if (response.data) {
                router.push('/call');
                setLoggedUser(response.data);
                sessionStorage.setItem('user', JSON.stringify(response.data));
              }
            }
            catch (error) {
              console.log(error, "error")
            }
        }
        else{
           alert('Please fill all fields');
        }
      } else if (mode === 'signup') {
        if (user.name && user.email && user.password && user.confirmPassword) {
           const url = "register"
            try {
              const response = await API.post(url, {
                name: user.name,
                email: user.email,
                password: user.password
              })
              if (response.data) {
                router.push('/call');
                setLoggedUser(response.data);
                sessionStorage.setItem('user', JSON.stringify(response.data));
              }

            }
            catch (error) {
              console.log(error, "error")
            }
        } else {
          alert('Please fill all fields');
        }
      }
    }

  return (
    <div>
    <div className="min-h-screen flex justify-center items-center bg-gray-100 px-4 dark:bg-gray-900">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md dark:bg-gray-800 dark:text-white">
        <h2 className="text-2xl font-semibold mb-6 text-center">{headerText}</h2>
        {mode === 'signup' && (
          <input type="text" name="name" placeholder="Full Name" autoComplete="off" className="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" onChange={handleChange}/>
        )}
        <input type="email" name="email" placeholder="Email" autoComplete="off" className="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" onChange={handleChange}/>
        <input type="password" name="password" placeholder="Password" autoComplete="off" className="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" onChange={handleChange}/>
        {mode === 'signup' && (
          <input type="password" name="confirmPassword" placeholder="Confirm Password" autoComplete="off" className="w-full mb-6 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" onChange={handleChange}/>
        )}
        <div className='flex flex-col space-y-4 justify-center items-center text-center'>
         <button onClick={() => handlePayload()} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{buttonText}</button>
         <Link href={mode === 'login' ? '/signup' : '/login'} className="w-full bg-white text-blue-600 py-2 rounded hover:text-blue-700">{mode === 'login' ? <span className='text-black'> Don't have an account ? </span> : <span className='text-black'>Already have an account?</span>} <span className='font-semibold'>{mode === 'login' ? 'Signup' : 'Login'}</span></Link>
        </div>
      </div>
    </div>
    </div>
  )
}
