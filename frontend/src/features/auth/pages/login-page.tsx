import { motion } from 'framer-motion';
import { LoginForm } from '../components/login-form';
import { env } from '@/config/env';

export function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Imagen de fondo: Cámara de Senadores */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/1w.png')" }}
        aria-hidden="true"
      />

      {/* Overlay oscuro para mejorar contraste del formulario */}
      <div
        className="from-black/250 absolute inset-0 z-0 bg-gradient-to-r via-black/40 to-black/60"
        aria-hidden="true"
      />

      {/* Formulario flotante */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex w-full justify-center px-6 lg:justify-start lg:pl-24"
      >
        <div className="w-full max-w-md">
          {/* Card con efecto glass sobre el fondo */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
            {/* Encabezado */}
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 flex justify-center">
                <img src="/22rrhh.png" className="h-32 w-auto max-w-[280px] object-contain" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{env.appName}</h1>
              <p className="mt-1 text-sm text-white/70">
                Cámara de Senadores · Estado Plurinacional de Bolivia
              </p>
            </div>

            {/* Formulario */}
            <LoginForm />

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-white/50">
              © {new Date().getFullYear()} Senado de Bolivia · v{env.appVersion}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
