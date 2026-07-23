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

export function eliminarArchivo(path: string, file: string, mensaje: string){
    try {
        fs.unlinkSync(path+file);                // Eliminar archivo original
        console.log(`${mensaje}: ${file}`);
    } catch (error) {
        console.error(`Error al eliminar el archivo "${file}":`, error);
    }
}

export function formatFilenameSolped(originalName: string) {
    // Regex para separar: numeroPrincipal - posicion .extension
    const regex = /^(\d+)-([a-zA-Z0-9\s]+)-([a-zA-Z0-9\s]+)(\.\w+)$/;
    const match = originalName.match(regex);

    if (!match) {
        // Si no cumple el formato esperado, devolvemos el original
        return {
            error: true,
            originalName: originalName
        }
    }
    const [, numeroPrincipal, random, nombre, extension] = match;
    // Completa con ceros a la izquierda hasta 10 dígitos
    // Reconstruir el nombre
    return {
        error: false,
        numeroDoc: numeroPrincipal!,
        random: random!,
        nombre: nombre!,
        extension: extension!
    }
}

export function formatFilename(originalName: string) {
    // Regex para separar: numeroPrincipal - posicion .extension
    try {
    const regex = /^(\d+)-([a-zA-Z0-9\s_]+)(\.\w+)$/;
    const match = originalName.match(regex);
        if (!match) {
            // Si no cumple el formato esperado, devolvemos el original
            return {
                error: true,
                originalName: originalName
            }
        }
        const [, numeroPrincipal, nombre, extension] = match;
        // Completa con ceros a la izquierda hasta 10 dígitos
        let numeroDoc = numeroPrincipal.padStart(10, '0')
        //let nombreArchivo = (nombre || '').padStart(15, '_')
        // Reconstruir el nombre
        return {
            error: false,
            numeroDoc: numeroDoc,
            nombreArchivo: nombre,
            extension: extension!
        }
    }
    catch (error) {
        console.log(`Error al formatear el nombre del archivo "${originalName}":`, error);
        return {
            error: error,
            originalName: originalName
        }
    }
}