import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Nota {
  id: number;
  mensaje: string;
  fecha: string;
  tiene_imagen: boolean;
  imagen_url?: string;
  color: string;
}

interface ColorInfo {
  nombre: string;
  color: string;
  hex: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // ⚠️ CAMBIA ESTA URL por la URL de tu backend
  apiUrl = 'https://back-fastapi-60rd.onrender.com';

  notas: Nota[] = [];
  cargando = false;
  
  // Dialog state
  mostrarDialog = false;
  nuevoMensaje = '';
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  colorSeleccionado = '#FFEBEE';
  
  // Imagen completa
  mostrarImagenCompleta = false;
  imagenCompletaUrl = '';

  coloresDisponibles: ColorInfo[] = [
    { nombre: 'Rosa', color: '#FFEBEE', hex: '#FFEBEE' },
    { nombre: 'Morado', color: '#F3E5F5', hex: '#F3E5F5' },
    { nombre: 'Azul', color: '#E3F2FD', hex: '#E3F2FD' },
    { nombre: 'Verde', color: '#E8F5E9', hex: '#E8F5E9' },
    { nombre: 'Amarillo', color: '#FFF9C4', hex: '#FFF9C4' },
    { nombre: 'Naranja', color: '#FFE0B2', hex: '#FFE0B2' },
    { nombre: 'Rojo', color: '#FFCDD2', hex: '#FFCDD2' },
    { nombre: 'Gris', color: '#F5F5F5', hex: '#F5F5F5' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarNotas();
  }

  obtenerSaludo(): string {
    const hora = new Date().getHours();
    if (hora >= 6 && hora < 12) {
      return '☀️ Buenos días, amor';
    } else if (hora >= 12 && hora < 20) {
      return '🌤️ Buenas tardes, amor';
    } else {
      return '🌙 Buenas noches, amor';
    }
  }

  cargarNotas(): void {
    this.cargando = true;
    console.log('🔵 [GET] Cargando notas desde:', `${this.apiUrl}/notas`);

    this.http.get<{ notas: Nota[] }>(`${this.apiUrl}/notas`).subscribe({
      next: (data) => {
        this.notas = data.notas;
        this.cargando = false;
        console.log('✅ [GET] Notas cargadas exitosamente:', this.notas.length, 'notas');
      },
      error: (error) => {
        this.cargando = false;
        console.error('❌ [GET] Error:', error);
        this.mostrarError('Error al cargar notas: ' + error.message);
      }
    });
  }

  async enviarNota(): Promise<void> {
    if (!this.nuevoMensaje && !this.imagenSeleccionada) {
      return;
    }

    const mensaje = this.nuevoMensaje || '📷';
    console.log('🔵 [POST] Enviando nota a:', `${this.apiUrl}/notas`);
    console.log('📤 [POST] Mensaje:', mensaje);
    console.log('📤 [POST] Tiene imagen:', !!this.imagenSeleccionada);
    console.log('📤 [POST] Color:', this.colorSeleccionado);

    let imagenBase64: string | null = null;
    if (this.imagenSeleccionada) {
      imagenBase64 = await this.convertirImagenABase64(this.imagenSeleccionada);
    }

    const body = {
      mensaje,
      imagen_base64: imagenBase64,
      color: this.colorSeleccionado
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http.post(`${this.apiUrl}/notas`, body, { headers }).subscribe({
      next: (response) => {
        console.log('✅ [POST] Nota enviada exitosamente');
        this.cerrarDialog();
        this.cargarNotas();
      },
      error: (error) => {
        console.error('❌ [POST] Error:', error);
        this.mostrarError('Error al enviar nota: ' + error.message);
      }
    });
  }

  eliminarNota(id: number): void {
    console.log('🔵 [DELETE] Eliminando nota ID:', id);

    this.http.delete(`${this.apiUrl}/notas/${id}`).subscribe({
      next: (response) => {
        console.log('✅ [DELETE] Nota eliminada exitosamente');
        this.cargarNotas();
      },
      error: (error) => {
        console.error('❌ [DELETE] Error:', error);
        this.mostrarError('Error al eliminar nota: ' + error.message);
      }
    });
  }

  abrirDialogoNuevaNota(): void {
    this.mostrarDialog = true;
    this.nuevoMensaje = '';
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.colorSeleccionado = '#FFEBEE';
  }

  cerrarDialog(): void {
    this.mostrarDialog = false;
    this.nuevoMensaje = '';
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.imagenSeleccionada = file;
      console.log('📸 Imagen seleccionada:', file.name);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  quitarImagen(): void {
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
  }

  seleccionarColor(hex: string): void {
    this.colorSeleccionado = hex;
  }

  abrirImagenCompleta(imageUrl: string): void {
    this.imagenCompletaUrl = `${this.apiUrl}${imageUrl}`;
    this.mostrarImagenCompleta = true;
    console.log('🖼️ Abriendo imagen:', this.imagenCompletaUrl);
  }

  cerrarImagenCompleta(): void {
    this.mostrarImagenCompleta = false;
  }

  private convertirImagenABase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private mostrarError(mensaje: string): void {
    alert(mensaje); // Puedes usar un servicio de snackbar más elegante
  }
}