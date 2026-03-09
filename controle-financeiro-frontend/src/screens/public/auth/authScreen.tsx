"use client";

import { useAuth } from "@/hooks/useAuth";
import { redefinirSenha, solicitarToken } from "@/services/authService";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye, EyeOff, KeyRound,
  Loader2,
  Lock,
  Mail,
  User
} from "lucide-react";
import React, { useState } from "react";

export default function AuthScreen() {
  const { 
    isLogin, 
    toggleMode, 
    formData, 
    handleChange, 
    handleSubmit, 
    isLoading, 
    errors, 
    apiError 
  } = useAuth();

  // Estados de UI do Login
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados da Recuperação de Senha
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverError, setRecoverError] = useState<string | null>(null);
  
  // Dados do formulário de redefinição
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // PASSO 1: Solicitar o código por e-mail
  const handleRequestToken = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setRecoverError("Digite seu e-mail para recuperar a senha.");
      return;
    }

    setIsRecovering(true);
    setRecoverError(null);

    try {
      await solicitarToken(formData.email);
      setEmailSent(true);
    } catch (error: any) {
      setRecoverError(error.message || "Erro ao solicitar recuperação.");
    } finally {
      setIsRecovering(false);
    }
  };

  // PASSO 2: Enviar o código e a nova senha
  const handleResetPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setRecoverError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsRecovering(true);
    setRecoverError(null);

    try {
      await redefinirSenha(formData.email, resetToken, newPassword);
      
      // Sucesso! Volta pro login e avisa o usuário
      setForgotPasswordMode(false);
      setEmailSent(false);
      setResetToken("");
      setNewPassword("");
      setSuccessMessage("Senha redefinida com sucesso! Faça seu login.");
      
      // Remove a mensagem de sucesso depois de 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      setRecoverError(error.message || "Código inválido ou expirado.");
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* BACKGROUND ANIMADO */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      {/* CARD CENTRAL */}
      <div className="w-full max-w-md bg-bg-surface/80 backdrop-blur-xl border border-border-divider rounded-3xl shadow-2xl relative z-10 overflow-hidden">
        
        {/* CABEÇALHO DO CARD */}
        <div className="p-8 pb-0 text-center">
          <div className="w-16 h-16 bg-linear-to-tr from-emerald-500 to-emerald-300 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
            <span className="text-zinc-900 font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main mb-2">
            {forgotPasswordMode ? "Recuperar Acesso" : (isLogin ? "Bem-vindo de volta" : "Crie sua conta")}
          </h1>
          <p className="text-text-muted text-sm">
            {forgotPasswordMode 
              ? (emailSent ? "Insira o código recebido no e-mail" : "Enviaremos um código para o seu e-mail") 
              : (isLogin ? "Insira suas credenciais para acessar" : "Comece a controlar suas finanças hoje")}
          </p>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <div className="p-8 pt-6">
          
          <AnimatePresence mode="wait">
            
            {/* MODO RECUPERAÇÃO DE SENHA */}
            {forgotPasswordMode ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Alerta de erro da recuperação */}
                {recoverError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-400 font-medium">{recoverError}</p>
                  </div>
                )}

                {!emailSent ? (
                  /* TELA 1: PEDIR E-MAIL */
                  <form onSubmit={handleRequestToken} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase ml-1">E-mail Cadastrado</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="seu@email.com"
                          className="w-full bg-bg-base border border-border-divider text-text-main rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-text-muted"
                          required
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isRecovering}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isRecovering ? <Loader2 className="w-5 h-5 animate-spin" /> : "Receber Código"}
                    </button>
                  </form>
                ) : (
                  /* TELA 2: INSERIR TOKEN E NOVA SENHA */
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-emerald-400 font-bold text-sm">Código Enviado!</p>
                      <p className="text-text-muted text-xs mt-1">Enviamos para <strong>{formData.email}</strong></p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase ml-1">Código de 6 dígitos</label>
                      <div className="relative group">
                        <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text" 
                          maxLength={6}
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value.toUpperCase())}
                          placeholder="Ex: A1B2C3"
                          className="w-full bg-bg-base border border-border-divider text-text-main rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all uppercase tracking-widest font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase ml-1">Criar Nova Senha</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-bg-base border border-border-divider text-text-main rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-text-muted"
                          required
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3.5 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isRecovering}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isRecovering ? <Loader2 className="w-5 h-5 animate-spin" /> : "Redefinir Senha"}
                    </button>
                  </form>
                )}
                
                <button 
                  type="button"
                  onClick={() => { setForgotPasswordMode(false); setEmailSent(false); setRecoverError(null); }}
                  className="w-full text-text-muted hover:text-text-main text-sm py-4 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} /> Voltar para o Login
                </button>
              </motion.div>
            ) : (

            /* MODO LOGIN / CADASTRO */
              <motion.form 
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                {/* Mensagem de sucesso ao redefinir a senha */}
                {successMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-400 font-medium">{successMessage}</p>
                  </div>
                )}

                {/* Campo Nome (Só no Cadastro) */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label className="text-xs font-bold text-text-muted uppercase ml-1">Nome Completo</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          name="nome"
                          type="text" 
                          placeholder="Seu nome"
                          value={formData.nome}
                          onChange={handleChange}
                          className={`w-full bg-bg-base border ${errors.nome ? 'border-rose-500' : 'border-border-divider'} text-text-main rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-text-muted`}
                        />
                      </div>
                      {errors.nome && <span className="text-xs text-rose-500 ml-1">{errors.nome}</span>}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Campo Email */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase ml-1">E-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      name="email"
                      type="email" 
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full bg-bg-base border ${errors.email ? 'border-rose-500' : 'border-border-divider'} text-text-main rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-text-muted`}
                    />
                  </div>
                  {errors.email && <span className="text-xs text-rose-500 ml-1">{errors.email}</span>}
                </div>

                {/* Campo Senha */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-text-muted uppercase">Senha</label>
                    {isLogin && (
                      <button 
                        type="button"
                        onClick={() => {
                          setForgotPasswordMode(true);
                          setRecoverError(null);
                        }}
                        className="text-xs text-emerald-500 hover:text-emerald-400 font-medium cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      name="senha"
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={formData.senha}
                      onChange={handleChange}
                      className={`w-full bg-bg-base border ${errors.senha ? 'border-rose-500' : 'border-border-divider'} text-text-main rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-text-muted`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.senha && <span className="text-xs text-rose-500 ml-1">{errors.senha}</span>}
                </div>

                 {/* Campo Confirmar Senha (Só no Cadastro) */}
                 <AnimatePresence>
                  {!isLogin && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label className="text-xs font-bold text-text-muted uppercase ml-1">Confirmar Senha</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          name="confirmarSenha"
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          value={formData.confirmarSenha}
                          onChange={handleChange}
                          className={`w-full bg-bg-base border ${errors.confirmarSenha ? 'border-rose-500' : 'border-border-divider'} text-text-main rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-text-muted`}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-3.5 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                       {errors.confirmarSenha && <span className="text-xs text-rose-500 ml-1">{errors.confirmarSenha}</span>}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Erro Geral da API */}
                {apiError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-sm text-rose-400">{apiError}</p>
                  </div>
                )}

                {/* Botão Principal */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Entrar" : "Criar Conta"}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER DO CARD (Toggle) */}
        {!forgotPasswordMode && (
          <div className="bg-bg-base/50 p-6 border-t border-border-divider text-center">
            <p className="text-text-muted text-sm">
              {isLogin ? "Ainda não tem uma conta?" : "Já possui cadastro?"}
              <button 
                onClick={toggleMode}
                className="ml-2 text-emerald-400 font-bold hover:underline cursor-pointer transition-colors"
              >
                {isLogin ? "Cadastre-se" : "Faça Login"}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}