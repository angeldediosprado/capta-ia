import {supabase} from './client';
export const socialAuth={auth:{signInWithOAuth:async(provider:'google'|'apple',opts:{redirect_uri:string})=>{
 const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:opts.redirect_uri}});
 return error?{error,redirected:false}:{error:null,redirected:true};
}}};
