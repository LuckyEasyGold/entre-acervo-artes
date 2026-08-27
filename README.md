# ENTRE — protótipo do acervo de artes

Protótipo estático inspirado na ideia de catálogo artístico + descoberta + portfólio.

## Como testar
Não abra `index.html` diretamente com `file://`, porque o navegador pode bloquear o `fetch()` dos JSON.
Use um servidor local, por exemplo:
- VS Code + Live Server
- ou Python: `python -m http.server 8000`
Depois abra http://localhost:8000

## Estrutura
- index.html — estrutura da página
- assets/style.css — identidade visual e animações
- assets/app.js — filtros, carregamento JSON e modo Inspiração
- data/arts.json — banco inicial de obras
- data/artists.json — banco inicial de artistas
- assets/*.svg — obras fictícias usadas apenas no protótipo

## HTMX
O HTMX já está incluído no index.html. Nesta primeira versão ele fica preparado para a próxima etapa, quando os formulários e endpoints do backend forem adicionados.
