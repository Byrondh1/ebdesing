/**
 * Lee una variable de entorno en tiempo de build.
 *
 * Vite expone las de los ficheros .env en `import.meta.env`, pero las que se pasan
 * sueltas en la línea de comandos solo llegan por `process.env`. Consultamos ambas
 * para que `SANITY_PROJECT_ID=... npm run build` funcione igual que un .env.
 */
export function leerEnv(nombre: string): string | undefined {
  const deVite = (import.meta.env as Record<string, string | undefined>)[nombre];
  if (deVite !== undefined && deVite !== '') return deVite;
  const deProceso = typeof process !== 'undefined' ? process.env?.[nombre] : undefined;
  return deProceso !== undefined && deProceso !== '' ? deProceso : undefined;
}
