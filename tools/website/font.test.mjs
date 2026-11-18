import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('self-hosted headline font actually supports bold variable weights',()=>{
 const font=readFileSync(new URL('../../public/fonts/nunito-variable.ttf',import.meta.url));
 assert.equal(font.readUInt32BE(0),0x00010000,'Expected genuine TrueType, not a mislabeled response');
 let variableOffset;
 for(let i=0;i<font.readUInt16BE(4);i++) {
  const table=12+i*16;
  if(font.toString('ascii',table,table+4)==='fvar')variableOffset=font.readUInt32BE(table+8);
 }
 assert.ok(variableOffset,'A static regular font must not be declared as variable400–900');
 const axesOffset=font.readUInt16BE(variableOffset+4),count=font.readUInt16BE(variableOffset+8),size=font.readUInt16BE(variableOffset+10);
 let weight;
 for(let i=0;i<count;i++) {
  const axis=variableOffset+axesOffset+i*size;
  if(font.toString('ascii',axis,axis+4)==='wght')weight={min:font.readInt32BE(axis+4)/65536,max:font.readInt32BE(axis+12)/65536};
 }
 assert.ok(weight&&weight.min<=400&&weight.max>=900,'Headline900 and body400 must both be supported');
});
