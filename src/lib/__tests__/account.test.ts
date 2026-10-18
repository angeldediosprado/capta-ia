import {describe,it,expect} from 'vitest';
import {profileSchema,credentialsSchema,validPhone} from '../account';
describe('account requirements',()=>{
 it('requires a phone country code and accepts formatted international numbers',()=>{expect(validPhone('+57 3001234567')).toBe(true);expect(validPhone('3001234567')).toBe(false);expect(validPhone('+0123456789')).toBe(false);});
 it('requires a name and company, trimming both',()=>{expect(profileSchema.parse({display_name:' Ana ',company:' Acme '})).toEqual({display_name:'Ana',company:'Acme'});expect(profileSchema.safeParse({display_name:'',company:'Acme'}).success).toBe(false);expect(profileSchema.safeParse({display_name:'Ana',company:''}).success).toBe(false);});
 it('bounds profile fields to their storage limits',()=>{expect(profileSchema.safeParse({display_name:'x'.repeat(101),company:'Acme'}).success).toBe(false);expect(profileSchema.safeParse({display_name:'Ana',company:'x'.repeat(161)}).success).toBe(false);});
 it('uses email credentials and a minimum eight-character password',()=>{expect(credentialsSchema.safeParse({email:'ana@example.org',password:'12345678'}).success).toBe(true);expect(credentialsSchema.safeParse({email:'ana',password:'12345678'}).success).toBe(false);expect(credentialsSchema.safeParse({email:'ana@example.org',password:'1234567'}).success).toBe(false);});
});