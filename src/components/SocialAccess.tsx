import {useState} from 'react';
import {useNavigate} from '@tanstack/react-router';
import {LoaderCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {socialAuth as lovable} from '@/lib/backend/social-auth';
import {supabase} from '@/lib/backend/client';

export function SocialAccess(){
 const navigate=useNavigate();
 const [pending,setPending]=useState<'google'|'apple'|null>(null);
 const [error,setError]=useState('');
 async function signIn(provider:'google'|'apple'){
  setError('');setPending(provider);
  try{
   const result=await lovable.auth.signInWithOAuth(provider,{redirect_uri:window.location.origin+'/auth'});
   if(result.error){setError('No pudimos entrar. Inténtalo otra vez o usa tu correo.');return;}
   if(result.redirected)return;
   const {data,error:sessionError}=await supabase.auth.getUser();
   if(sessionError||!data.user){setError('No se completó el acceso. Inténtalo otra vez.');return;}
   sessionStorage.setItem('capta-data-mode','real');
   await navigate({to:'/fuentes',replace:true});
  }catch{setError('No pudimos abrir el acceso. Inténtalo otra vez o usa tu correo.');}
  finally{setPending(null);}
 }
 return <div className="mt-7 space-y-3">
  <Button variant="outline" size="lg" className="w-full" disabled={pending!==null} onClick={()=>void signIn('google')}>
   {pending==='google'?<LoaderCircle className="animate-spin"/>:<span aria-hidden="true" className="text-lg font-bold">G</span>}Continuar con Google
  </Button>
  <Button variant="outline" size="lg" className="w-full" disabled={pending!==null} onClick={()=>void signIn('apple')}>
   {pending==='apple'?<LoaderCircle className="animate-spin"/>:<svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current"><path d="M17.1 12.3c0-2 1.6-3 1.7-3.1-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-3 .9-3.8 2.2-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.6 2.3 2.8 2.2 1.1 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.7-2.2c.9-1.2 1.2-2.4 1.2-2.5-.1 0-2.6-1-2.6-4ZM14.9 6.2c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2-.5 2.7-1.3Z"/></svg>}Continuar con Apple
  </Button>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  <div className="flex items-center gap-3 pt-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>o con tu correo<span className="h-px flex-1 bg-border"/></div>
 </div>;
}