import * as fs from 'fs';

/**
 * 
 * @returns retorna una cadena de texto alfanumerico de 4 caracteres
 */
export function generarSufijoArchivo(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < 4; i++) {
        const indice = Math.floor(Math.random() * caracteres.length);
        resultado += caracteres[indice];
    }
    return resultado;
}

export function moverArchivo(filename: string, origen: string, destino: string, mensaje: string) {

    const rutaOrigen = origen! + filename;
    const rutaDestino = destino! + filename;

    try {
        fs.copyFileSync(rutaOrigen, rutaDestino); // Copiar archivo
        fs.unlinkSync(rutaOrigen);                // Eliminar archivo original
        console.log(`${mensaje}: ${filename}`);
    } catch (error) {
        console.error(`Error al mover el archivo "${filename}":`, error);
    }
}