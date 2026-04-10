'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/supabase/auth-context'
import { createClient } from '@/lib/supabase/client' // Cliente SSR Supabase atualizado

export type Company = {
  id: string
  name: string
  role: 'admin' | 'manager' | 'employee'
  plan: string
}

interface CompanyContextType {
  activeCompany: Company | null
  userCompanies: Company[]
  switchCompany: (companyId: string) => void
  loading: boolean
}

const CompanyContext = createContext<CompanyContextType>({} as any)

/**
 * Provedor de Inquilinos (Multi-Tenant Hub)
 * Envolva este Provider ao redor dos componentes pós-login no Layout protegido.
 */
export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [userCompanies, setUserCompanies] = useState<Company[]>([])
  const [activeCompany, setActiveCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setUserCompanies([])
      setActiveCompany(null)
      setLoading(false)
      return
    }

    const loadCompanies = async () => {
      const supabase = createClient()
      
      // Busca Empresas onde o usuário é listado via Cross-Table `company_users`
      const { data, error } = await supabase
        .from('company_users')
        .select(`
          role,
          companies (id, name, plan)
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao listar empresas do Tenant:', error.message)
      }

      if (data && data.length > 0) {
        // Flatten da API Join do PostgREST
        const formattedCompanies: Company[] = data.map((cu: any) => ({
          id: cu.companies.id,
          name: cu.companies.name,
          plan: cu.companies.plan,
          role: cu.role,
        }))

        setUserCompanies(formattedCompanies)
        
        // Mantém a empresa anterior ou seta a primeira como ativa via fallback
        const savedCompanyId = localStorage.getItem('sky_active_tenant')
        const target = formattedCompanies.find(c => c.id === savedCompanyId) || formattedCompanies[0]
        setActiveCompany(target)
      } else {
        // Fluxo Novo User: Pode renderizar um Modal para "Criar sua Empresa" na UI
        setUserCompanies([])
      }
      setLoading(false)
    }

    loadCompanies()
  }, [user, authLoading])

  const switchCompany = (companyId: string) => {
    const target = userCompanies.find(c => c.id === companyId)
    if (target) {
      setActiveCompany(target)
      localStorage.setItem('sky_active_tenant', target.id)
      // Pode opcionalmente fazer um window.location.reload() para recriar sessões/Caches.
    }
  }

  return (
    <CompanyContext.Provider value={{ activeCompany, userCompanies, switchCompany, loading }}>
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompany = () => useContext(CompanyContext)
