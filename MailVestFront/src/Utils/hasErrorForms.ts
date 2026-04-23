/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FieldErrors, FieldValues, SubmitErrorHandler } from "react-hook-form";


function getBypath(obj: unknown, path: string): unknown {
    
    if(!obj) return undefined;

    const parts = path.split(".").filter(Boolean);
    let cur: any = obj;
    
    for(const key of parts){
        if(cur == null) return undefined;
        cur = cur[key];
    }
    return cur;
}

export function hasErrorAtPath<T extends FieldValues>(
    errors: FieldErrors<T>,
    path: string,
): boolean {
    const v = getBypath(errors, path);
    if(!v) return false;

    if(typeof v === "object") return true;
    return Boolean(v);
}

export function getErrorMessagePath<T extends FieldValues>(
    errors: FieldErrors<T>,
    path: string,
): string | undefined {
    const v: any = getBypath(errors, path);
    return typeof v?.message === "string" ? v.message : undefined;
}

export function firstKeyWithErrors<T extends FieldValues, K extends string>(
    errors: FieldErrors<T>,
    keyToPaths: Record<K, readonly string[]>,
    order?: readonly K[]
): K | null {
    const keys = (order ?? (Object.keys(keyToPaths) as K[])) as readonly K[];

    for (const k of keys){
        const paths = keyToPaths[k];
        if(paths.some((p) => hasErrorAtPath(errors, p))) return k;
    }
    return null;
}

export function maeOnInvalidSwitchKey<T extends FieldValues, K extends string>(args: {
    getCurrentKey: () =>  K;
    setKey: (k:K) => void;
    keyToPaths: Record<K, readonly string[]>;
    order?: readonly K[];
    onInvalid?: (errors: FieldErrors<T>, targetKey: K | null) => void;
}): SubmitErrorHandler<T> {

    return(errors) => {
        const current = args.getCurrentKey();
        const target = firstKeyWithErrors(errors, args.keyToPaths, args.order);

        if(target && target !== current){
            args.setKey(target);
            args.onInvalid?.(errors, target);
        }
    };
}