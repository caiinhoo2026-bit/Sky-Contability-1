'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/auth-context'

/**
 * Componente Real-Time do Client Next.js
 * Inserir na Navbar. Ele ficará escutando os Web-sockets de forma P2P.
 */
export function NotificationBell() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    // Query estática inicial ao renderizar DOM
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(({ count }) => {
        if (count !== null) setUnread(count)
      })

    // Montando a conexão Web-Socket Permanente PostGres -> Supabase -> React
    const channel = supabase.channel(`inbound_user_${user.id}`)
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          // Quando o backend ou os triggers inserem algo lá, essa função dispara instantaneamente no brownser!
          setUnread(prev => prev + 1)
          
          // Opcional: Adicionar um react-hot-toast para som + pop-up no canto inferior direito
          // toast.error(`Aviso: ${payload.new.title}`, { duration: 5000 })
        }
      )
      .subscribe()

    // Limpeza de cache de sockets
    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [user])

  return (
    <div className="relative p-2.5 cursor-pointer hover:bg-slate-800 rounded-full transition-all text-slate-300 ring-1 ring-slate-800 shadow-xl bg-slate-900 overflow-visible group">
      <Bell size={20} className="group-hover:text-emerald-400 transition-colors" />
      
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 ring-2 ring-slate-950 text-white flex items-center justify-center text-[10px] font-bold shadow-lg shadow-red-500/50 animate-bounce">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </div>
  )
}
