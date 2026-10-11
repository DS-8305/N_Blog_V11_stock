import {access} from 'node:fs/promises';
import {join} from 'node:path';
export function fontFamily():string{return process.env.NBLOG_FONT_FAMILY??(process.platform==='win32'?'Malgun Gothic':'Noto Sans CJK KR');}
export async function assertKoreanFont():Promise<void>{
 const file=process.env.NBLOG_FONT_FILE??(process.platform==='win32'?join(process.env.WINDIR??'C:\\Windows','Fonts','malgun.ttf'):'/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');
 if(process.env.NBLOG_FONT_FILE&&!process.env.NBLOG_FONT_FAMILY)throw Error('needs_user:font_family_required');
 try{await access(file);}catch{throw Error('needs_user:korean_font_required');}
}
