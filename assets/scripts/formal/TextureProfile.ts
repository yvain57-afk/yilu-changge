/** Optional build-supplied texture resolution. Gameplay coordinates stay in source pixels. */
type TextureProfile={sizes?:Record<string,[number,number]>;unusedSheets?:string[]};
function profile():TextureProfile|undefined{return (globalThis as any).__YILU_TEXTURE_PROFILE__;}
export function isTextureEnabled(sheet:string):boolean{return !profile()?.unusedSheets?.includes(sheet);}
export function textureSourceSize(sheet:string):[number,number]|undefined{return profile()?.sizes?.[sheet];}
