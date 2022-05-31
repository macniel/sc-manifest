import { json } from "body-parser";

type T = {
    [key: string]: any;
}

const lookupTable: T = { }

export function cacheResult(query: string|string[], fn: Function) {
    const lookupKey = JSON.stringify(query);
    if (!lookupTable[lookupKey]) {
        lookupTable[lookupKey] = fn();
    }
    return lookupTable[lookupKey]
}