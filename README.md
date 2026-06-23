# MagaBeauty 🌿

> Sua jornada para uma pele saudável e radiante.

PWA de skincare com rotina diária personalizada, diário da pele, cronograma semanal (Retinol / Recuperação) e biblioteca de dicas sobre skincare, nutrição, sono, hábitos e envelhecimento. 100% HTML/CSS/JS puro, sem frameworks, sem backend. Todos os dados ficam salvos no próprio aparelho via `localStorage`.

---

## 1. Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Rotina diária** | Checklist de manhã e noite gerado automaticamente a partir dos produtos cadastrados |
| **Anel de progresso** | Percentual do dia concluído, atualizado em tempo real |
| **Cronograma semanal** | Modo Retinol (Seg/Qua/Sex) e Recuperação (Dom/Ter/Qui/Sáb) automático |
| **Produtos personalizáveis** | Adicionar, editar e excluir produtos sem alterar código |
| **Diário da Pele** | Registros diários com data, sensibilidade, hidratação, acne, manchas e observações |
| **Biblioteca de Dicas** | 5 seções com acordeões: Skincare, Nutrição, Sono, Hábitos, Envelhecimento |
| **Perfil e métricas** | Streak, checklists concluídos, aplicações de retinol e % de adesão |
| **Offline** | Service Worker com cache do App Shell para uso sem internet |
| **Instalável** | Manifesto PWA para instalação no Android e iOS |

---

## 2. Estrutura do projeto

```
MagaBeauty/
├── index.html               → Dashboard principal
├── manifest.json            → Configuração do PWA
├── sw.js                    → Service Worker (cache offline)
├── README.md
│
├── css/
│   └── styles.css           → Design system completo
│
├── js/
│   └── app.js               → Toda a lógica da aplicação
│
├── pages/
│   ├── produtos.html        → CRUD de produtos da rotina
│   ├── diario.html          → Diário da Pele (novo)
│   ├── biblioteca.html      → Biblioteca de Dicas (5 seções)
│   ├── nutricao.html        → Guia completo de nutrição para a pele
│   └── perfil.html          → Estatísticas e registros recentes
│
└── assets/
    ├── logo.svg             → Símbolo vetorial (perfil feminino)
    ├── icon-192.png         → Ícone PWA 192×192
    └── icon-512.png         → Ícone PWA 512×512
```

> **Sem a pasta `data/`:** os produtos e registros do diário ficam no `localStorage`.
> Não há mais arquivos `.json` servidos pela rede.

---

## 3. Regra do dia — começa às 05:00

O "dia de skincare" começa às **05:00**, não à meia-noite.
Qualquer atividade registrada entre **00:00 e 04:59** pertence ao dia anterior.

Isso significa que se você fizer sua rotina noturna depois da meia-noite (ex: 01:30), ela ainda será contabilizada no dia de ontem — comportamento correto para quem dorme tarde.

---

## 4. Como testar localmente

**Não abra `index.html` direto com duplo clique (`file://`).** O Service Worker e algumas APIs do navegador não funcionam com o protocolo de arquivo.

Use um servidor local. Com Python instalado, dentro da pasta do projeto:

```bash
python3 -m http.server 8000
```

Acesse: `http://localhost:8000`

Alternativas: extensão **Live Server** do VS Code, ou qualquer outro servidor HTTP simples.

---

## 5. Como publicar no GitHub Pages

### Criando o repositório

1. Acesse [github.com](https://github.com) → **New repository**
2. Defina o nome (ex: `magabeauty`) → **Public** → **Create repository**
3. ⚠️ **Não** marque "Add a README file" — você já tem o seu

### Subindo os arquivos da raiz

Na página do repositório vazio, clique em **"uploading an existing file"**.

Abra a pasta `MagaBeauty` no seu computador, selecione **todo o conteúdo de dentro** dela (os arquivos soltos + as pastas) e arraste para a área de upload.

> ⚠️ **Atenção:** arraste o **conteúdo** da pasta `MagaBeauty`, não a pasta `MagaBeauty` inteira. Se a pasta entrar, os arquivos ficam em `magabeauty/MagaBeauty/index.html` e o GitHub Pages não encontra o `index.html` na raiz.

Após o arrastar, confirme com **Commit changes**.

### Se as pastas não subirem junto

Se o arrastar não criar as subpastas automaticamente, suba cada pasta pelo endereço direto. Na barra do navegador, acesse:

```
github.com/SEU-USUARIO/magabeauty/upload/main/css
github.com/SEU-USUARIO/magabeauty/upload/main/js
github.com/SEU-USUARIO/magabeauty/upload/main/pages
github.com/SEU-USUARIO/magabeauty/upload/main/assets
```

Em cada URL, selecione os arquivos **de dentro** da respectiva pasta e faça commit.

### Ativando o GitHub Pages

1. No repositório → **Settings** → **Pages**
2. Em "Source", selecione a branch `main` e a pasta `/ (root)`
3. Clique em **Save**

Em alguns minutos o app estará disponível em:
```
https://SEU-USUARIO.github.io/magabeauty/
```

---

## 6. Como instalar como aplicativo

| Plataforma | Como instalar |
|---|---|
| **Android (Chrome)** | Abra o link → menu ⋮ → "Adicionar à tela inicial" |
| **iPhone (Safari)** | Abra o link → ícone compartilhar → "Adicionar à Tela de Início" |
| **Desktop (Chrome/Edge)** | Ícone de instalação ⊕ na barra de endereço |

> A instalação e o Service Worker só funcionam plenamente via **HTTPS**. O GitHub Pages já entrega HTTPS automaticamente. Em `localhost`, o Chrome também trata como seguro.

---

## 7. Onde os dados ficam salvos

Tudo no `localStorage` do navegador, por aparelho:

| Chave | Conteúdo |
|---|---|
| `mb_routine_AAAA-MM-DD` | Estado do checklist de cada dia (manhã e noite) |
| `mb_meta` | Data do primeiro uso (para cálculo de adesão) |
| `mb_products` | Lista de produtos cadastrados (array JSON) |
| `mb_diary` | Registros do Diário da Pele (array JSON) |

**Importante:**
- Não há nuvem, login ou sincronização entre aparelhos
- Cada celular/navegador guarda seu próprio histórico de forma independente
- Limpar dados de navegação apaga tudo
- Desinstalar e reinstalar o app **não** apaga os dados (ficam no navegador)

---

## 8. Como personalizar

### Produtos da rotina

Acesse a aba **Produtos** no app e use os botões **Adicionar**, **Editar** e **Excluir**. Não é necessário alterar nenhum arquivo. Os campos disponíveis são:

- **Categoria** — ex: Retinol, Vitamina C, Hidratante
- **Marca** — ex: Principia, Adcos, La Roche-Posay
- **Nome comercial** — ex: RN-0,3 (obrigatório)
- **Descrição** — função, concentração, modo de uso (opcional)
- **Período na rotina** — Manhã / Noite / Manhã e Noite

> O checklist do dashboard é gerado automaticamente a partir dos produtos cadastrados. Produtos com categoria **Retinol** só aparecem nas noites do cronograma de retinol (Seg/Qua/Sex).

### Cores e tipografia

Todas as cores e fontes estão como variáveis CSS no topo de `css/styles.css`, dentro de `:root { ... }`. Alterar um valor reflete em todo o app.

### Conteúdo da Biblioteca

Os textos das dicas estão diretamente em `pages/biblioteca.html` e `pages/nutricao.html`, em formato HTML com acordeões. Para editar um texto ou adicionar uma nova dica, basta editar o arquivo correspondente seguindo o padrão dos blocos `<button class="expand-trigger">` + `<div class="expand-body">` existentes.

### Cronograma semanal

O padrão de retinol/recuperação está definido em `js/app.js`, na constante `WEEKLY_MODE`. Altere os valores `'retinol'` e `'recuperacao'` para cada dia da semana (0 = domingo, 6 = sábado) conforme sua prescrição.

---

## 9. Atualizando o app no GitHub

Após modificar qualquer arquivo localmente, suba apenas o arquivo alterado pelo endereço:

```
github.com/SEU-USUARIO/magabeauty/upload/main
```

Para subpastas:
```
github.com/SEU-USUARIO/magabeauty/upload/main/css
github.com/SEU-USUARIO/magabeauty/upload/main/js
```

O GitHub substitui o arquivo automaticamente. O Service Worker (`sw.js`) detecta a mudança de versão e atualiza o cache na próxima abertura do app.

---

## 10. Próximos passos sugeridos

- **Galeria de evolução** — upload e armazenamento local de fotos da pele (estrutura visual já presente no Perfil)
- **Notificações locais** — lembretes da rotina via Notification API + Service Worker
- **Exportar/importar dados** — backup em JSON para trocar de aparelho sem perder o histórico
- **Gráficos do Diário** — evolução das métricas (hidratação, acne, manchas) ao longo do tempo

---

Feito com 🌿 para o MagaBeauty.
