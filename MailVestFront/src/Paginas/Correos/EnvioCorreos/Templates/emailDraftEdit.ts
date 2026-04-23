import * as yup from "yup";
export const schema = yup.object({
    templateId: yup.number().required("Selecciona una plantilla").typeError("Selecciona una plantilla"),

    icsStart: yup.date().required("El inicio del ICS es requerido").nullable(),
    icsEnd: yup
    .date()
    .required("El fin del ICS es requerido")
    .nullable()
    .test("after-start", "La fecha fin debe ser mayor a la fecha inicio", function (v) {
        const start = this.parent.icsStart as Date | null;
        if(!start || !v) return true;
        return v > start;
    }),

    icsFileNameES: yup.string().required("Nombre de archivo ICS (ES) requerido"),
    icsFileNameEN: yup.string().required("Nombre de archivo ICS (EN) requerido"),

    icsBodyES: yup.string().required("Cuerpo del ICS (ES) requerido"),
    icsBodyEN: yup.string().required("Cuerpo del ICS (EN) requerido"),
});