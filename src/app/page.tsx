import { redirect } from 'next/navigation';

export default function Home() {
  // Redireciona para o dashboard que está dentro do grupo (main)
  redirect('/dashboard');
}
