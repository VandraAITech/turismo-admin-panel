'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 
  'Tierra del Fuego', 'Tucumán'
]

export default function EditarHotel() {
  const router = useRouter()
  const params = useParams()
  const idHotel = params.id 

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    provincia: '',
    ciudad: '',
    descuento: '',
    web_url: '',
    activo: true,
    logo_url: '' 
  })
  
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null)

  useEffect(() => {
    async function obtenerHotel() {
      const { data, error } = await supabase
        .from('hoteles')
        .select('*')
        .eq('id', idHotel)
        .single()

      if (error) {
        alert('Error al cargar hotel')
        router.push('/dashboard')
      } else {
        setFormData({
          nombre: data.nombre,
          provincia: data.provincia,
          ciudad: data.ciudad || '',
          descuento: data.descuento.replace(/[^0-9]/g, ''),
          web_url: data.web_url || '',
          activo: data.activo,
          logo_url: data.logo_url
        })
      }
      setLoading(false)
    }
    if (idHotel) obtenerHotel()
  }, [idHotel, router])


  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)

    try {
      let webFinal = formData.web_url.trim()
      if (webFinal && !webFinal.match(/^https?:\/\//)) {
        webFinal = `https://${webFinal}`
      }

      let nueva_logo_url = formData.logo_url
      if (archivoImagen) {
        const nombreArchivo = `${Date.now()}-${archivoImagen.name}`
        const { error: uploadError } = await supabase.storage.from('logos').upload(nombreArchivo, archivoImagen)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(nombreArchivo)
        nueva_logo_url = publicUrl
      }

      // UPDATE SIN DIRECCION
      const { error: dbError } = await supabase
        .from('hoteles')
        .update({
          nombre: formData.nombre,
          provincia: formData.provincia,
          ciudad: formData.ciudad,
          descuento: formData.descuento,
          web_url: webFinal,
          activo: formData.activo,
          logo_url: nueva_logo_url 
        })
        .eq('id', idHotel)

      if (dbError) throw dbError
      alert('✅ Hotel actualizado correctamente')
      router.push('/dashboard')
    } catch (error) {
      console.error(error)
      alert('❌ Error al actualizar.')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <div className="p-10 text-center">Cargando datos del hotel...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Editar Hotel #{idHotel}</h1>
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">Cancelar</button>
        </div>

        <form onSubmit={handleActualizar} className="p-8 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Hotel</label>
            <input required type="text" className="w-full p-2 border border-gray-300 rounded text-black" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <select className="w-full p-2 border border-gray-300 rounded text-black" value={formData.provincia} onChange={e => setFormData({...formData, provincia: e.target.value})}>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input required type="text" className="w-full p-2 border border-gray-300 rounded text-black" value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descuento</label>
              <input required type="text" className="w-full p-2 border border-gray-300 rounded text-black pr-8" value={formData.descuento} 
                onChange={e => {
                    let valor = e.target.value.replace(/[^0-9]/g, '')
                    if (valor.length > 2) valor = valor.slice(0, 2)
                    setFormData({...formData, descuento: valor})
                  }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded text-black" value={formData.web_url} onChange={e => setFormData({...formData, web_url: e.target.value})} />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <label className="block text-sm font-medium text-gray-700 mb-3">Logo del Hotel</label>
             <div className="flex items-center gap-6">
                {formData.logo_url && !archivoImagen && (
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Actual</p>
                    <img src={formData.logo_url} alt="Logo" className="h-20 w-20 object-cover rounded-full border bg-white" />
                  </div>
                )}
                <div className="flex-grow">
                   <input type="file" accept="image/*" onChange={e => setArchivoImagen(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                   <p className="text-xs text-gray-400 mt-2">Si no subes nada, se mantiene la foto anterior.</p>
                </div>
             </div>
          </div>

          <button type="submit" disabled={guardando} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition-all disabled:opacity-50">
            {guardando ? 'Guardando cambios...' : 'Actualizar Hotel'}
          </button>
        </form>
      </div>
    </div>
  )
}