'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
                throw new Error('Configuração do Supabase não encontrada')
            }

            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                alert('Verifique seu e-mail para confirmar o cadastro!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                router.push('/')
            }
        } catch (err: any) {
            console.error('Erro:', err)
            setError(err.message)
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
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
            {/* IMAGEM BACKGROUND GRANDE */}
            <img
                src="/sky-contability.png"
                alt="Sky Contability"
                className="absolute left-1/2 top-1/2 
                           -translate-x-1/2 -translate-y-1/2 
                           w-[1200px] max-w-none 
                           object-contain pointer-events-none opacity-50"
            />

            {/* LOGIN */}
            <div className="relative z-10 w-full max-w-[420px] bg-zinc-900/95 p-8 sm:p-10 rounded-2xl shadow-2xl border border-white/5 mx-4">
                <form onSubmit={handleAuth}>
                    <h1 className="text-3xl text-white font-bold text-center">
                        {isSignUp ? 'Criar Conta' : 'Acesse sua conta'}
                    </h1>

                    <p className="text-gray-400 text-center mb-6">
                        {isSignUp ? 'Junte-se ao Sky Contability' : 'Bem-vindo de volta!'}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-white text-sm">E-mail</label>
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full p-3 mb-4 mt-1 bg-zinc-800 rounded-lg text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-white text-sm">Senha</label>
                            <input
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full p-3 mb-6 mt-1 bg-zinc-800 rounded-lg text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg text-white font-bold transition-all disabled:opacity-50"
                    >
                        {loading ? 'Carregando...' : isSignUp ? 'Registrar' : 'Entrar'}
                    </button>

                    <div className="text-center text-gray-500 mt-6 text-sm">
                        ou continue com
                    </div>

                    <button
                        type="button"
                        onClick={handleModoTeste}
                        className="w-full mt-4 border border-gray-600 p-3 rounded-lg text-white hover:bg-zinc-800 transition-all font-medium"
                    >
                        Modo Teste (Offline)
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-center text-blue-400 mt-6 text-sm w-full hover:underline transition-all block"
                    >
                        {isSignUp ? 'Já possui conta? Acessar' : 'Acesse ou crie sua conta aqui'}
                    </button>
                </form>
            </div>
        </div>
    )
}
