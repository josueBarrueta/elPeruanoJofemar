// Resize before upload; the API still stores the photo and exposes its own URL.
export async function prepareMenuPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
    throw new Error('Selecciona una foto JPG, PNG, WebP, GIF o AVIF.');
  }
  if (file.size > 20 * 1024 * 1024) throw new Error('La foto debe ocupar menos de 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { throw new Error('No se pudo leer esa foto. Prueba con un archivo JPG, PNG o WebP válido.'); }
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo preparar la foto. Prueba con otra imagen.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/webp', 0.82);
    if (!data.startsWith('data:image/webp;base64,') && !data.startsWith('data:image/png;base64,')) throw new Error('No se pudo convertir la foto. Prueba con otro navegador.');
    if (data.length > 6 * 1024 * 1024) throw new Error('La foto sigue siendo demasiado grande. Selecciona una de menor tamaño.');
    return data;
  } finally { URL.revokeObjectURL(url); }
}
