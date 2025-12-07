#!/usr/bin/env python3
"""
Script para quitar el fondo de un GIF animado.
Procesa cada frame del GIF y remueve el fondo usando técnicas de procesamiento de imágenes.
"""

from PIL import Image, ImageSequence
import sys
import os

def remove_background_from_frame(frame, tolerance=30):
    """
    Remueve el fondo de un frame individual.
    Usa la esquina superior izquierda como color de fondo de referencia.
    """
    # Convertir a RGBA si no lo está
    if frame.mode != 'RGBA':
        frame = frame.convert('RGBA')
    
    # Obtener el color de fondo de la esquina superior izquierda
    bg_color = frame.getpixel((0, 0))
    
    # Crear una nueva imagen con transparencia
    new_frame = Image.new('RGBA', frame.size, (0, 0, 0, 0))
    pixels = frame.load()
    new_pixels = new_frame.load()
    
    # Procesar cada pixel
    for y in range(frame.height):
        for x in range(frame.width):
            pixel = pixels[x, y]
            
            # Calcular la diferencia de color con el fondo
            if len(pixel) == 4:  # RGBA
                r, g, b, a = pixel
            else:  # RGB
                r, g, b = pixel
                a = 255
            
            # Calcular distancia de color
            color_diff = (
                abs(r - bg_color[0]) +
                abs(g - bg_color[1]) +
                abs(b - bg_color[2])
            )
            
            # Si el pixel es similar al fondo, hacerlo transparente
            if color_diff < tolerance:
                new_pixels[x, y] = (0, 0, 0, 0)
            else:
                new_pixels[x, y] = (r, g, b, a)
    
    return new_frame

def remove_gif_background(input_path, output_path, tolerance=30):
    """
    Remueve el fondo de un GIF animado procesando cada frame.
    """
    try:
        # Abrir el GIF
        gif = Image.open(input_path)
        
        # Obtener información del GIF
        frames = []
        durations = []
        
        # Procesar cada frame
        for frame in ImageSequence.Iterator(gif):
            # Remover fondo del frame
            processed_frame = remove_background_from_frame(frame.copy(), tolerance)
            frames.append(processed_frame)
            
            # Obtener duración del frame (si está disponible)
            duration = frame.info.get('duration', 100)  # Default 100ms
            durations.append(duration)
        
        # Guardar el nuevo GIF con transparencia
        if len(frames) > 0:
            frames[0].save(
                output_path,
                save_all=True,
                append_images=frames[1:],
                duration=durations,
                loop=gif.info.get('loop', 0),
                transparency=0,
                disposal=2  # Clear to background
            )
            print(f"✅ GIF procesado exitosamente: {output_path}")
            return True
        else:
            print("❌ No se encontraron frames en el GIF")
            return False
            
    except Exception as e:
        print(f"❌ Error al procesar el GIF: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python remove_gif_background.py <archivo_gif> [tolerancia] [archivo_salida]")
        print("\nEjemplo:")
        print("  python remove_gif_background.py snoopy.gif")
        print("  python remove_gif_background.py snoopy.gif 30 snoopy_sin_fondo.gif")
        sys.exit(1)
    
    input_file = sys.argv[1]
    tolerance = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    output_file = sys.argv[3] if len(sys.argv) > 3 else input_file.replace('.gif', '_sin_fondo.gif')
    
    if not os.path.exists(input_file):
        print(f"❌ El archivo {input_file} no existe")
        sys.exit(1)
    
    print(f"🔄 Procesando {input_file}...")
    print(f"   Tolerancia: {tolerance}")
    print(f"   Archivo de salida: {output_file}")
    
    remove_gif_background(input_file, output_file, tolerance)

