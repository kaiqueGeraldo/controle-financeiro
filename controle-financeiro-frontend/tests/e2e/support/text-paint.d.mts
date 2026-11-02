export type PaintBox = {x:number;y:number;width:number;height:number};
export type PaintReference = {alpha:number[];color:number[];width:number;height:number;error?:string};
export type PaintState = {
 reference:PaintReference;
 state():string;
 mask():boolean;
 restore():void;
 restored():boolean;
};
export type PaintResult = {
 stable:boolean;dimensions:boolean;unstablePixels?:number;changedPixels:number;glyphPixels:number[];
 outsideMaskPixels:number;wrongDirectionPixels:number;unmatchedCorePixels:number;
};
export function prepareTextPaint(element:Element,clip:PaintBox):PaintState;
export function verifyTextPaint(input:{images:number[][];clip:PaintBox;glyphs:Array<{rects:PaintBox[]}>;reference:PaintReference}):Promise<PaintResult>;
