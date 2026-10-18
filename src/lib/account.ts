import { z } from 'zod';
export const profileSchema = z.object({
 display_name: z.string().trim().min(1,'Escribe tu nombre.').max(100),
 company: z.string().trim().min(1,'Escribe tu empresa.').max(160),
});
export const credentialsSchema = z.object({email:z.string().trim().email('Revisa tu correo.'),password:z.string().min(8,'Usa al menos 8 caracteres.').max(128)});
export function validPhone(value:string){return /^\+[1-9]\d{7,14}$/.test(value.replace(/\s/g,''));}
export function accountError(message:string){
 if(/invalid login credentials/i.test(message))return 'El correo o la contraseña no coinciden.';
 if(/email not confirmed/i.test(message))return 'Confirma tu correo antes de entrar.';
 if(/rate limit|too many/i.test(message))return 'Espera unos minutos antes de intentarlo otra vez.';
 if(/signups not allowed|provider.*not enabled|email.*disabled/i.test(message))return 'El acceso con correo todavía no está habilitado. Contacta al administrador.';
 return 'No pudimos completar la solicitud. Revisa los datos e inténtalo de nuevo.';
}