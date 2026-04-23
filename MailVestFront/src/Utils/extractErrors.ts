import type { AxiosError } from "axios";

export function extractErrors (obj: AxiosError): string[]{

    const data = obj.response?.data as RespuestaError;

    const err = data.errors;
    let mensajeError: string[] = [];

    for(const campo in err){
        const mensajeConCampo = err[campo].map(mensajeError => `${campo}: ${mensajeError}`);
        mensajeError = mensajeError.concat(mensajeConCampo);
    }

    return mensajeError;
}

interface RespuestaError{
    errors: {
        [campo:string]: string[];
    }
}