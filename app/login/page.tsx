'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                throw new Error('Configuração do Supabase (URL/Key) não encontrada no .env.local')
            }

            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        
                    }
                })
                if (error) throw error
                alert('Verifique seu e-mail para confirmar o cadastro! (Ou tente entrar se já confirmou)')
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                router.push('/')
            }
        } catch (err: any) {
            console.error('Erro de autenticação:', err)
            setError(err.message === 'Failed to fetch'
                ? 'Erro de conexão: Não foi possível alcançar o servidor do Supabase. Verifique sua internet ou as chaves no .env.local.'
                : err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleModoTeste = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('shopee_modo_teste', 'true')
        }
        router.push('/')
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat bg-black -z-20 transition-all duration-1000"
                style={{ backgroundImage: 'url("/logo_login.png")' }}
            />
            <div className="absolute inset-0 bg-black/45 -z-10" />

            {/* Background Decorative Gradient */}
            <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-light/10 dark:bg-primary-dark/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-900/5 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.4)] rounded-[2rem] overflow-hidden bg-white dark:bg-[#121212] border border-white/20 dark:border-white/5 animate-in fade-in zoom-in-95 duration-500">
                {/* Formulário de Login Centralizado */}
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-black text-[#111] dark:text-white mb-2 tracking-tight">
                            {isSignUp ? 'Criar Conta' : 'Acesse sua conta'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            {isSignUp ? 'Junte-se ao Sky Contability' : 'Bem-vindo de volta!'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <Input
                            label="E-mail"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                        />
                        <Input
                            label="Senha"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                        />

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-red-500 text-xs font-bold text-center">{error}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl bg-primary-light hover:bg-primary-light/90 text-white shadow-lg shadow-primary-light/20 transition-all font-sans" disabled={loading}>
                                {loading ? 'Carregando...' : isSignUp ? 'Registrar' : 'Entrar'}
                            </Button>
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100 dark:border-white/5" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                <span className="bg-white dark:bg-[#121212] px-3 text-gray-400 font-bold">ou continue com</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all font-bold text-sm rounded-xl"
                            onClick={handleModoTeste}
                        >
                            Modo Teste (Offline)
                        </Button>

                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-primary-light dark:text-blue-400 text-center w-full mt-6 font-bold text-xs hover:underline transition-all"
                        >
                            {isSignUp ? 'Já possui conta? Acessar' : 'Acesse ou crie sua conta aqui'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
