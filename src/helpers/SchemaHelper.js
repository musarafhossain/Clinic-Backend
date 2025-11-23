export const nullify = (schema) =>
    schema.optional().transform((val) => (val === undefined ? null : val));