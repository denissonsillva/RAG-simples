// Primeiro item da tabulação: leva direto ao conteúdo, pulando o menu.
export function SkipLink() {
  return (
    <a
      href="#conteudo"
      className="sr-only rounded-lg bg-primary text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      Pular para o conteúdo
    </a>
  )
}
