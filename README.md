# ⚽ Wenye Jerseys — Catálogo de Camisas

Sistema completo de catálogo de produtos para loja de camisas de futebol.

---

## 🚀 Como rodar (modo fácil)

### Windows — Dê duplo clique em:
```
start.bat
```

Isso instala tudo e abre o site automaticamente.

---

## 🛠 Como rodar manualmente

### Pré-requisito: Node.js 18+
Baixe em: https://nodejs.org

---

### 1. Backend (API)

```bash
cd backend
npm install
node server.js
```

O servidor sobe em: http://localhost:3001

---

### 2. Frontend (em outro terminal)

```bash
cd frontend
npm install
npm run dev
```

O site abre em: http://localhost:5173

---

## ⚙️ Configuração do caminho dos dados

### Opção 1 — Editar diretamente no código
Abra `backend/server.js` e altere a linha 14:

```js
const DATA_ROOT = 'C:\\Users\\gbres\\Documents\\Wenye Jerseys';
```

### Opção 2 — Variável de ambiente
```bash
# Windows CMD
set DATA_PATH=C:\Users\gbres\Documents\Wenye Jerseys
node server.js

# Windows PowerShell
$env:DATA_PATH="C:\Users\gbres\Documents\Wenye Jerseys"
node server.js
```

---

## 📁 Estrutura esperada dos dados

```
Wenye Jerseys/
├── Brasil/
│   ├── Produto A/
│   │   └── album.txt
│   └── Produto B/
│       └── album.txt
├── Europa/
│   ├── Premier League/       ← subcategoria
│   │   ├── Manchester City/
│   │   │   └── album.txt
│   │   └── Arsenal/
│   │       └── album.txt
│   └── La Liga/              ← subcategoria
│       └── Real Madrid/
│           └── album.txt
```

### Formato do arquivo .txt

```
Álbum: Nome do Produto
Link: https://fornecedor.com/link-original   ← ignorado pelo sistema

https://imagem1.jpg
https://imagem2.jpg
https://imagem3.jpg
```

- A **primeira URL** de imagem vira a capa do produto
- O campo `Link:` do fornecedor **não é exposto** ao frontend

---

## 🌐 Rotas do site

| URL | Página |
|-----|--------|
| `/` | Home — todas as categorias |
| `/:categoria` | Página da categoria |
| `/:categoria/:subcategoria` | Página da subcategoria |
| `/:categoria/:produto` | Página do produto (direto) |
| `/:categoria/:subcategoria/:produto` | Página do produto (dentro de subcategoria) |

---

## 🔌 API disponível

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/categories` | Lista todas as categorias |
| `GET /api/categories/:slug` | Detalhes de uma categoria |
| `GET /api/categories/:cat/:sub` via `/subcategories/:sub` | Subcategoria |
| `GET /api/search?q=termo` | Busca por nome de produto |
| `GET /api/health` | Status do servidor |

---

## 🎨 Tecnologias utilizadas

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Fontes**: Bebas Neue (display) + DM Sans (corpo)
- **Roteamento**: React Router v6

---

## 📞 Botão de WhatsApp

Na página do produto existe um botão "Consultar via WhatsApp".
Para apontá-lo para o seu número, edite o arquivo:

`frontend/src/pages/ProductPage.jsx`

Linha com `href`:
```js
href={`https://wa.me/5511999999999?text=...`}
//              ↑ Substitua pelo seu número com DDI
```
