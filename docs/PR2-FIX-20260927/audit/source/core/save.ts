// Audit harness type-only shim; not the repository's legacy save implementation.
export interface Storage {getItem(key:string):string|null;setItem(key:string,value:string):void}
