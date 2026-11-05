import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { gerarPlanoComIA } from './api/gerar-plano.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'api-gerar-plano-plugin',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/gerar-plano') && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const dados = parsed.dados_do_paciente || parsed.dadosDoPaciente;
                if (!dados) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'dados_do_paciente é obrigatório' }));
                  return;
                }
                const result = await gerarPlanoComIA(dados);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error:
                      'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
                    details: err.message || String(err),
                  })
                );
              }
            });
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/neon-auth': {
        target: 'https://ep-bitter-base-b6bng2wi.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/neon-auth/, ''),
      },
    },
  },
})
