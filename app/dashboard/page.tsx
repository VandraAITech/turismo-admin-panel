'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Hotel = {
  id: number
  nombre: string
  provincia: string
  ciudad: string
  descuento: string
  activo: boolean
}

export default function Dashboard() {
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
      } else {
        cargarHoteles()
      }
    }
    checkUser()
  }, [])

  async function cargarHoteles() {
    try {
      const { data, error } = await supabase
        .from('hoteles')
        .select('*')
        .order('id', { ascending: false })

      if (error) throw error
      if (data) setHoteles(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- NUEVA FUNCIÓN PARA BORRAR ---
  async function borrarHotel(id: number, nombre: string) {
    // 1. Preguntar por seguridad
    const confirmado = window.confirm(`¿Estás seguro de borrar el hotel "${nombre}"? Esta acción no se puede deshacer.`)
    
    if (!confirmado) return // Si dice cancelar, no hacemos nada.

    try {
      // 2. Borrar de Supabase
      const { error } = await supabase
        .from('hoteles')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 3. Actualizar la pantalla (quitamos el hotel borrado de la lista visible)
      setHoteles(hoteles.filter(hotel => hotel.id !== id))
      alert('🗑️ Hotel eliminado correctamente.')

    } catch (error) {
      console.error(error)
      alert('Error al intentar borrar.')
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando sistema...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado Superior */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Panel de Control 🏨</h1>
            <p className="text-gray-500 text-sm mt-1">Gestiona los beneficios y hoteles</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-full shadow-sm border border-gray-200 px-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-600 text-sm font-medium">Admin Conectado</span>
              <button 
                onClick={cerrarSesion}
                className="text-xs text-red-500 hover:text-red-700 font-semibold border-l border-gray-200 pl-4 ml-2"
              >
                Salir
              </button>
          </div>
        </div>

        {/* --- TARJETA PRINCIPAL --- */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          
          {/* Barra de Herramientas */}
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:w-96">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar hotel por nombre..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-700"
              />
            </div>

            <button 
              onClick={() => router.push('/dashboard/crear')} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium flex items-center gap-2"
            >
              <span>+</span> Añadir Hotel
            </button>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-5">Nombre</th>
                  <th className="p-5">Ubicación</th>
                  <th className="p-5">Descuento</th>
                  <th className="p-5">Estado</th>
                  <th className="p-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hoteles.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-gray-50 transition-colors text-gray-700">
                    <td className="p-5 font-medium text-gray-900">{hotel.nombre}</td>
                    
                    <td className="p-5 text-gray-500">
                        <div className="font-medium text-gray-700">{hotel.provincia}</div>
                        <div className="text-xs text-gray-400">{hotel.ciudad || 'Capital'}</div>
                    </td>

                    <td className="p-5">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                        {hotel.descuento}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${hotel.activo ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {hotel.activo ? 'Publicado' : 'Oculto'}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-2">
                      <button 
  onClick={() => router.push(`/dashboard/editar/${hotel.id}`)}
  className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
>
  Editar
</button>
                      
                      {/* BOTÓN BORRAR CONECTADO */}
                      <button 
                        onClick={() => borrarHotel(hotel.id, hotel.nombre)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}

                {hoteles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400 flex flex-col items-center">
                      <span className="text-4xl mb-2">📭</span>
                      No hay hoteles cargados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
            <span>Mostrando {hoteles.length} resultados</span>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 border rounded bg-white text-gray-300">Anterior</button>
              <button disabled className="px-3 py-1 border rounded bg-white text-gray-300">Siguiente</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}