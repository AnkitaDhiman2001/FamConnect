import Link from "next/link";

export default function Home() {
  return (
     <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-100 to-white text-center px-4 dark:from-gray-900 dark:to-black dark:text-white">
      <h1 className="text-5xl font-extrabold mb-4 text-blue-800 dark:text-blue-300">Welcome to FamConnect</h1>
      <p className="text-lg text-gray-600 mb-6 dark:text-gray-300">Secure real-time video conferencing with chat, screen sharing, and recording features.</p>
      <div className="flex space-x-4">
        <Link href="/login"><button className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow hover:bg-blue-700">Login</button></Link>
        <Link href="/signup"><button className="bg-gray-300 text-black px-6 py-2 rounded-xl shadow hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Sign Up</button></Link>
      </div>
    </div>
  );
}
