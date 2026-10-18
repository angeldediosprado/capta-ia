import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({oauth:vi.fn(),getUser:vi.fn(),navigate:vi.fn()}));
vi.mock('@tanstack/react-router',()=>({useNavigate:()=>mocks.navigate}));
vi.mock('@/lib/backend/social-auth',()=>({socialAuth:{auth:{signInWithOAuth:mocks.oauth}}}));
vi.mock('@/lib/backend/client',()=>({supabase:{auth:{getUser:mocks.getUser}}}));
import {SocialAccess} from '@/components/SocialAccess';
afterEach(()=>{cleanup();vi.resetAllMocks();sessionStorage.clear();});
describe('social account access',()=>{
 it.each(['Google','Apple'] as const)('uses a public callback and verifies the session for %s',async label=>{
  mocks.oauth.mockResolvedValue({});mocks.getUser.mockResolvedValue({data:{user:{id:'account'}},error:null});
  render(<SocialAccess/>);fireEvent.click(screen.getByRole('button',{name:`Continuar con ${label}`}));
  await waitFor(()=>expect(mocks.navigate).toHaveBeenCalledWith({to:'/fuentes',replace:true}));
  expect(mocks.oauth).toHaveBeenCalledWith(label.toLowerCase(),{redirect_uri:window.location.origin+'/auth'});
  expect(sessionStorage.getItem('capta-data-mode')).toBe('real');
 });
 it('does not enter a private workspace when the provider rejects login',async()=>{
  mocks.oauth.mockResolvedValue({error:new Error('provider disabled')});render(<SocialAccess/>);
  fireEvent.click(screen.getByRole('button',{name:'Continuar con Google'}));
  await screen.findByRole('alert');expect(mocks.navigate).not.toHaveBeenCalled();expect(mocks.getUser).not.toHaveBeenCalled();
 });
 it('waits for the public callback on a full-page redirect',async()=>{
  mocks.oauth.mockResolvedValue({redirected:true});render(<SocialAccess/>);
  fireEvent.click(screen.getByRole('button',{name:'Continuar con Apple'}));
  await waitFor(()=>expect(mocks.oauth).toHaveBeenCalled());expect(mocks.navigate).not.toHaveBeenCalled();
 });
});