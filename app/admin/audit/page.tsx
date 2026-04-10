'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download, Filter, ShieldAlert, ArrowLeft, Loader2, Search } from 'lucide-react'

// Componente / UI Principal: Sky Contability (Enterprise Sec)
export default function AuditDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  
  // Filtros em State Local
  const [filterAction, setFilterAction] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    // Basic route shield (poderia ser reforçado no layout.tsx com validação "isAdmin")
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // Como a rota de auditoria exige auth real na header ou validação admin
      // Aqui passaríamos o token de Auth obtido através do helper supabase do client
      // Vamos simular os params.
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      queryParams.append('limit', '50')
      if (filterAction) queryParams.append('action', filterAction)
      if (filterStatus) queryParams.append('status', filterStatus)

      // Dummy fix - we need actual session token inside production
      const res = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`, {
        headers: {
          'Authorization': 'Bearer ADMIN_SIMULADO_OU_SESSAO_FRONT' // em prod usar supabase.auth.getSession()
        }
      })
      const respJSON = await res.json()

      if (res.ok) {
        setLogs(respJSON.data || [])
      } else {
        alert(respJSON.error || 'Erro ao carregar logs via API.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Hook que refetcha sempre que filters / paginação muda
  useEffect(() => {
    if (user) {
      fetchLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterAction, filterStatus, user])

  // Download do CSV utilitário
  const exportToCSV = () => {
    if (logs.length === 0) return alert('Nenhum dado para exportar')
    
    const headers = ['Data', 'Email do Usuário', 'Entidade', 'Ação', 'Resultado', 'IP', 'Target ID']
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR').replace(',', ''),
        // Mapearia user email vindo do auth.users se habilitado query extra ou foreign key:
        log.user_id,
        log.resource,
        log.action,
        log.status,
        log.ip_address || 'ND',
        log.resource_id || 'ND'
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_sky_${new Date().getTime()}.csv`
    link.click()
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Carregando Modulo SecOps...</div>

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabecalho Administracao */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700 transition">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <ShieldAlert className="text-emerald-500" size={28} />
                Painel de Auditoria & Logs SEC
              </h1>
              <p className="text-slate-400 mt-1">Supervisão Global de Integridade, Dispositivos e Fluxos Críticos.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition">
                <Download size={16} /> Exportar Relatório Diário (.CSV)
             </button>
          </div>
        </div>

        {/* Toolbar Filtros */}
        <div className="flex flex-col md:flex-row gap-4 py-4 px-6 bg-slate-900 border border-slate-800 rounded-xl">
           <div className="flex-1 items-center flex relative">
              <Search className="absolute left-3 text-slate-500" size={18} />
              <input 
                 type="text" 
                 placeholder="Buscar UUID de usuário ou Action ID" 
                 className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-500 transition" />
           </div>

           <select 
              value={filterAction} 
              onChange={e => setFilterAction(e.target.value)} 
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-500">
             <option value="">Todas as Ações</option>
             <option value="INSERT">Data Insert (Criação)</option>
             <option value="UPDATE">Data Update (Modificação)</option>
             <option value="DELETE">Data Delete (Supressão)</option>
             <option value="LOGIN_ATTEMPT">Tentativa Login</option>
             <option value="REPORT_EXPORT">Emissão de Relatório</option>
           </select>

           <select 
             value={filterStatus}
             onChange={e => setFilterStatus(e.target.value)}
             className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-500">
             <option value="">Status Geral</option>
             <option value="success">Completado & Válido</option>
             <option value="failed">Interrompido/Falho</option>
             <option value="warning">Aviso / Suspeito</option>
           </select>

           <button 
             onClick={() => fetchLogs()}
             className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 text-sm rounded-lg flex items-center gap-2 justify-center transition">
             <Filter size={16} />
             Aplicar Filtro
           </button>
        </div>

        {/* Tabela de Logging / Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                     <th className="py-4 px-6 font-semibold">Horário / Date</th>
                     <th className="py-4 px-6 font-semibold">User (UUID) / Client</th>
                     <th className="py-4 px-6 font-semibold">Contexto / Entidade</th>
                     <th className="py-4 px-6 font-semibold">Action</th>
                     <th className="py-4 px-6 font-semibold">Status Auth</th>
                     <th className="py-4 px-6 font-semibold w-12">Detalhes (JSON)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-500">
                        <Loader2 size={32} className="animate-spin mx-auto mb-4 text-emerald-500/50" />
                        Averiguando integridade e buscando Logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                     <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-500">
                        Nenhum registro de auditoria correspondente aos filtros.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="py-3 px-6 whitespace-nowrap text-sm text-slate-300">
                          {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium'})}
                        </td>
                        <td className="py-3 px-6 text-sm text-slate-400 truncate max-w-[150px]">
                           <div className="truncate font-mono text-xs">{log.user_id || 'Serviço Sistêmico'}</div>
                           <div className="text-[10px] text-slate-600 truncate mt-0.5">{log.ip_address || log.user_agent}</div>
                        </td>
                        <td className="py-3 px-6 text-sm">
                           <span className="bg-slate-800 border-slate-700 border text-slate-300 px-2 py-1 rounded text-xs font-mono">
                             {log.resource}
                           </span>
                           {log.resource_id && <span className="text-slate-500 text-xs ml-2">ID: {log.resource_id.substring(0,6)}...</span>}
                        </td>
                        <td className="py-3 px-6 text-sm font-semibold">
                          <span className={`${
                            log.action === 'DELETE' ? 'text-red-400' :
                            log.action === 'INSERT' ? 'text-emerald-400' :
                            log.action === 'UPDATE' ? 'text-amber-400' :
                            'text-indigo-400'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-sm">
                          {log.status === 'success' ? (
                             <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs bg-emerald-400/10 px-2 py-1 rounded-full w-max">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Permitido
                             </span>
                          ) : log.status === 'warning' ? (
                             <span className="flex items-center gap-1.5 text-amber-400 font-medium text-xs bg-amber-400/10 px-2 py-1 rounded-full w-max">
                               <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> Sinalizado
                             </span>
                          ) : (
                             <span className="flex items-center gap-1.5 text-red-400 font-medium text-xs bg-red-400/10 px-2 py-1 rounded-full w-max">
                               <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div> Recusado
                             </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-sm text-right">
                          <button 
                            title={JSON.stringify({old: log.old_value, new: log.new_value})}
                            className="text-slate-500 hover:text-brand-400 bg-slate-800 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap border border-slate-700 text-xs">
                             Ver JSON
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
          </div>
          
          <div className="flex border-t border-slate-800 bg-slate-900 px-6 py-4 justify-between items-center text-sm text-slate-400">
             <span>Página {page} de Últimos 50 limitados.</span>
             <div className="flex gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 rounded-lg">Anterior</button>
                <button 
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg">Próxima Pagina</button>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}
