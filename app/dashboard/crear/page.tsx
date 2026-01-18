'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 
  'Tierra del Fuego', 'Tucumán'
]

export default function CrearHotel() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Datos del formulario (Incluye CIUDAD)
  const [formData, setFormData] = useState({
    nombre: '',
    provincia: 'Buenos Aires',
    ciudad: '', 
    descuento: '',
    web_url: '',
    activo: true
  })
  
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null)

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Lógica de URL inteligente
      let webFinal = formData.web_url.trim()
      if (webFinal && !webFinal.match(/^https?:\/\//)) {
        webFinal = `https://${webFinal}`
      }

      let logo_url = null

      // Subida de imagen
      if (archivoImagen) {
        const nombreArchivo = `${Date.now()}-${archivoImagen.name}`
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(nombreArchivo, archivoImagen)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(nombreArchivo)
          
        logo_url = publicUrl
      }

      // Guardar en base de datos (Incluye CIUDAD)
      const { error: dbError } = await supabase
        .from('hoteles')
        .insert([{
          nombre: formData.nombre,
          provincia: formData.provincia,
          ciudad: formData.ciudad,
          descuento: formData.descuento,
          web_url: webFinal,
          activo: formData.activo,
          logo_url: logo_url 
        }])

      if (dbError) throw dbError

      alert('✅ Hotel creado correctamente')
      router.push('/dashboard')

    } catch (error) {
      console.error(error)
      alert('❌ Error al guardar el hotel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Nuevo Beneficio</h1>
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">
            Cancelar
          </button>
        </div>

        <form onSubmit={handleGuardar} className="p-8 space-y-6">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Hotel</label>
            <input 
              required
              type="text" 
              className="w-full p-2 border border-gray-300 rounded text-black"
              placeholder="Ej: Gran Hotel Turismo"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded text-black"
                value={formData.provincia}
                onChange={e => setFormData({...formData, provincia: e.target.value})}
              >
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* CIUDAD (Nuevo) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Localidad</label>
              <input 
                required
                type="text" 
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="Ej: Villa Gesell"
                value={formData.ciudad}
                onChange={e => setFormData({...formData, ciudad: e.target.value})}
              />
            </div>
          </div>

          {/* Descuento y Web */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descuento</label>
              <input 
                required
                type="text" 
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="Ej: 20% OFF"
                value={formData.descuento}
                onChange={e => setFormData({...formData, descuento: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web (Opcional)</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="https://..."
                value={formData.web_url}
                onChange={e => setFormData({...formData, web_url: e.target.value})}
              />
            </div>
          </div>

          {/* Subida de Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo del Hotel</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setArchivoImagen(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-50 file:text-green-700
                  hover:file:bg-green-100"
              />
              <p className="text-xs text-gray-400 mt-2">PNG, JPG hasta 2MB</p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg shadow transition-all disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Hotel'}
          </button>

        </form>
      </div>
    </div>
  )
}