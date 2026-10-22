/* Tiny offline .xlsx writer (no libraries). Stored zip, inline strings. */
(function(){
const enc=new TextEncoder();
const T=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
function zip(files){
  const parts=[],cd=[];let off=0;
  const u16=n=>[n&255,(n>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  for(const [name,str] of files){
    const nb=enc.encode(name),d=enc.encode(str),c=crc(d);
    const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(nb.length),...u16(0)]);
    parts.push(lh,nb,d);
    cd.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);
    off+=lh.length+nb.length+d.length;
  }
  let cds=0;cd.forEach(x=>cds+=x.length);
  const end=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cds),...u32(off),0,0]);
  return new Blob([...parts,...cd,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const col=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
/* cell: string | number | {v,s}. styles: 0 plain,1 header,2 text,3 money,4 total text,5 total money,6 title,7 percent,8 bold,9 note */
function sheetXml(sh){
  const rows=sh.rows,nr=rows.length,nc=Math.max(...rows.map(r=>r.length),1);
  let x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>';
  x+='<dimension ref="A1:'+col(nc-1)+nr+'"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"'+(sh.tab?' tabSelected="1"':'')+'>';
  if(sh.freeze)x+='<pane ySplit="'+sh.freeze+'" topLeftCell="A'+(sh.freeze+1)+'" activePane="bottomLeft" state="frozen"/>';
  x+='</sheetView></sheetViews><sheetFormatPr defaultRowHeight="16"/><cols>'+sh.widths.map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols><sheetData>';
  rows.forEach((r,ri)=>{
    x+='<row r="'+(ri+1)+'"'+(sh.heights&&sh.heights[ri]?' ht="'+sh.heights[ri]+'" customHeight="1"':'')+'>';
    r.forEach((c,ci)=>{
      if(c===null||c===undefined||c==='')return;
      const o=typeof c==='object'?c:{v:c,s:typeof c==='number'?3:2};
      const ref=col(ci)+(ri+1);
      if(typeof o.v==='number')x+='<c r="'+ref+'" s="'+o.s+'"><v>'+o.v+'</v></c>';
      else if(o.f)x+='<c r="'+ref+'" s="'+o.s+'"><f>'+esc(o.f)+'</f><v>'+(o.cv||0)+'</v></c>';
      else x+='<c r="'+ref+'" s="'+o.s+'" t="inlineStr"><is><t xml:space="preserve">'+esc(o.v)+'</t></is></c>';
    });
    x+='</row>';
  });
  x+='</sheetData>';
  if(sh.filter)x+='<autoFilter ref="'+sh.filter+'"/>';
  if(sh.merges&&sh.merges.length)x+='<mergeCells count="'+sh.merges.length+'">'+sh.merges.map(m=>'<mergeCell ref="'+m+'"/>').join('')+'</mergeCells>';
  x+='<printOptions horizontalCentered="1"/><pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="'+(sh.landscape?'landscape':'portrait')+'" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;L'+esc(sh.footer||'DayLeft')+'&amp;RPage &amp;P of &amp;N</oddFooter></headerFooter></worksheet>';
  return x;
}
const STYLES='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;₹&quot;#,##0"/></numFmts>'
+'<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF0F766E"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF667770"/><name val="Calibri"/></font></fonts>'
+'<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE6F2F0"/><bgColor indexed="64"/></patternFill></fill></fills>'
+'<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD5DDD9"/></left><right style="thin"><color rgb="FFD5DDD9"/></right><top style="thin"><color rgb="FFD5DDD9"/></top><bottom style="thin"><color rgb="FFD5DDD9"/></bottom><diagonal/></border></borders>'
+'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="10">'
+'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
+'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
+'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'
+'<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>'
+'<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>'
+'<xf numFmtId="164" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>'
+'<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
+'<xf numFmtId="9" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>'
+'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
+'<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
+'</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
window.makeXlsx=function(sheets){
  const f=[];
  f.push(['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>']);
  f.push(['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>']);
  let dn='';sheets.forEach((s,i)=>{if(s.titleRow)dn+='<definedName name="_xlnm.Print_Titles" localSheetId="'+i+'">\''+esc(s.name)+'\'!$'+s.titleRow+':$'+s.titleRow+'</definedName>'});
  f.push(['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>'<sheet name="'+esc(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets>'+(dn?'<definedNames>'+dn+'</definedNames>':'')+'</workbook>']);
  f.push(['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>']);
  f.push(['xl/styles.xml',STYLES]);
  sheets.forEach((s,i)=>f.push(['xl/worksheets/sheet'+(i+1)+'.xml',sheetXml(Object.assign({tab:i==0},s))]));
  return zip(f);
};
})();
