# MagaBeauty 🌿

> Sua jornada para uma pele saudável e radiante.

PWA de skincare — rotina diária, cronograma semanal (Retinol / Recuperação), biblioteca educativa sobre a ciência da pele e nutrição. 100% HTML/CSS/JS puro, sem frameworks, sem backend. Todos os dados ficam salvos no próprio aparelho via `localStorage`.

---

## 1. Estrutura do projeto

```
MagaBeauty/
├── index.html              → Dashboard (rotina do dia, anel de progresso, cronograma)
├── manifest.json           → Configuração do PWA (ícones, cores, nome)
├── sw.js                   → Service Worker (cache offline)
├── css/
│   └── styles.css          → Todo o design system (cores, tipografia, componentes)
├── js/
│   └── app.js               → Toda a lógica (estado, localStorage, renderização)
├── pages/
│   ├── produtos.html        → Função e benefícios de cada produto da rotina
│   ├── nutricao.html        → Nutrientes e alimentos para a pele
│   ├── biblioteca.html      → Artigos sobre ciência da pele
│   └── perfil.html          → Estatísticas e adesão à rotina
├── data/
│   ├── produtos.json        → Conteúdo dos produtos (editar aqui para mudar textos)
│   ├── nutricao.json        → Conteúdo de nutrição
│   └── artigos.json         → Conteúdo da biblioteca
└── assets/
    ├── logo.svg
    ├── icon-192.png
    └── icon-512.png
```

---

## 2. Como testar localmente

**Importante:** não abra `index.html` direto com duplo clique (`file://`). O app usa `fetch()` para carregar os arquivos `.json` de `data/`, e isso só funciona servido por um servidor local (HTTP), não pelo protocolo de arquivo.

Com Python instalado, na pasta do projeto:

```bash
python3 -m http.server 8000
```

Depois acesse: `http://localhost:8000`

Qualquer outro servidor local simples também funciona (ex: extensão "Live Server" do VS Code).

---

## 3. Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex: `magabeauty`).
2. Suba **todos** os arquivos e pastas deste projeto para a raiz do repositório — mantendo a estrutura de pastas exatamente como está.
3. ⚠️ Atenção a dois pontos que já causaram problemas em projetos anteriores:
   - O arquivo principal precisa se chamar exatamente `index.html` e estar na **raiz** do repositório (não dentro de uma subpasta).
   - Não deixe o GitHub criar um `README.md` "padrão" na hora de criar o repositório antes do upload — isso pode gerar conflito com o `README.md` deste projeto. Se acontecer, basta sobrescrever/substituir pelo deste projeto.
4. Vá em **Settings → Pages**.
5. Em "Source", selecione a branch `main` (ou `master`) e a pasta `/ (root)`.
6. Salve. Em alguns minutos o GitHub Pages vai gerar uma URL pública, algo como:
   `https://seu-usuario.github.io/magabeauty/`
7. Acesse essa URL — o app já estará no ar, instalável e funcionando offline.

---

## 4. Como instalar como aplicativo

- **Android (Chrome):** abra o link publicado → menu (⋮) → "Adicionar à tela inicial" ou vai aparecer um banner automático de instalação.
- **iPhone (Safari):** abra o link publicado → toque no ícone de compartilhar → "Adicionar à Tela de Início".
- **Desktop (Chrome/Edge):** ícone de instalação (⊕) na barra de endereço.

A instalação só fica disponível quando o site é servido via **HTTPS** — o GitHub Pages já entrega isso automaticamente. Em `localhost` durante testes, a instalação e o Service Worker também funcionam normalmente (navegadores tratam `localhost` como seguro).

---

## 5. Onde os dados ficam salvos

Tudo é salvo no `localStorage` do navegador, por aparelho/navegador:

- `mb_routine_AAAA-MM-DD` → checklist de cada dia.
- `mb_meta` → data do primeiro uso (usada para calcular % de adesão).

**Isso significa:**
- Não existe nuvem, login ou sincronização entre aparelhos — cada celular/navegador guarda seu próprio histórico.
- Limpar dados de navegação ou desinstalar o app apaga o histórico.
- Não há como "perder a conta" porque não existe conta — mas também não há backup automático.

Se no futuro você quiser sincronização entre aparelhos, isso exigiria adicionar um backend (ex: Supabase, como no Anvium) — propositalmente fora do escopo desta v1.0, que foi pensada para ser 100% estática e gratuita no GitHub Pages.

---

## 6. Como customizar

**Cores e fontes:** tudo centralizado no topo de `css/styles.css`, em `:root { ... }` (variáveis CSS). Trocar um valor ali reflete no app inteiro.

**Textos de produtos/nutrição/artigos:** editar diretamente os arquivos em `data/*.json` — não é necessário mexer no HTML ou JS para mudar textos, adicionar um produto novo ou um artigo novo (desde que siga o mesmo formato dos itens existentes).

**Itens do checklist (manhã/noite) e cronograma semanal:** ficam definidos em `js/app.js`, nas constantes `MANHA_ITEMS`, `NOITE_ITEMS` e `WEEKLY_MODE` — alterar esses itens exige também atualizar os ids correspondentes em `data/produtos.json`.

**Ícones do app (PWA):** `assets/icon-192.png` e `assets/icon-512.png`. Se quiser trocar o logo, gere novos PNGs nesses dois tamanhos e mantenha os mesmos nomes de arquivo (ou atualize os caminhos em `manifest.json`).

---

## 7. Próximos passos sugeridos (fora do escopo da v1.0)

- Galeria de fotos de evolução na página de Perfil (já tem a estrutura visual pronta, faltando upload/armazenamento local de imagens).
- Notificações locais lembrando da rotina (via `Notification` API + Service Worker).
- Exportar/importar backup dos dados em JSON, para trocar de aparelho sem perder histórico.

---

Feito com 🌿 para o MagaBeauty.
