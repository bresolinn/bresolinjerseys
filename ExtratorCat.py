import requests
from bs4 import BeautifulSoup
import time
import os
import re
import shutil

# --- CONFIGURAÇÃO ---
URL_PRINCIPAL = "https://wenye-jerseys.x.yupoo.com/categories/5167379"
BASE_URL = "https://wenye-jerseys.x.yupoo.com"
CAMINHO_BASE = r"C:\Users\gbres\Documents\Site Camisas\Wenye Jerseys"

headers = {
    "User-Agent": "Mozilla/5.0",
    "Referer": BASE_URL
}

# ---------------- NOME DE PASTA (SÓ TRATA FS WINDOWS) ----------------

def nome_pasta(nome):
    if not nome:
        return "Sem_Nome"

    # mantém acentos, só limpa o Windows
    nome = nome.replace("/", "-")
    nome = re.sub(r'[\\*?:"<>|]', "", nome)

    return nome.strip()


# ---------------- REQUEST ----------------

def get_soup(url):
    try:
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code == 200:
            return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"Erro: {e}")
    return None


# ---------------- IMAGENS ----------------

def extrair_fotos(url):
    soup = get_soup(url)
    if not soup:
        return []

    fotos = []
    id_capa = ""

    div = soup.find("div", class_="showalbumheader__gallerycover")

    if div:
        img = div.find("img")
        if img and img.get("src"):
            capa = img.get("src")
            if capa.startswith("//"):
                capa = "https:" + capa
            fotos.append(capa)

            partes = capa.split("/")
            if len(partes) > 4:
                id_capa = partes[4]

    for img in soup.find_all("img", attrs={"data-origin-src": True}):
        src = img.get("data-origin-src")

        if src:
            if src.startswith("//"):
                src = "https:" + src
            elif not src.startswith("http"):
                src = "https://photo.yupoo.com" + src

            if id_capa and f"/{id_capa}/" in src:
                continue

            fotos.append(src)

    return fotos


# ---------------- TXT ----------------

def atualizar_txt(path, nome, link, fotos):
    conteudo = f"Álbum: {nome}\nLink: {link}\n\n" + "\n".join(fotos)

    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            if f.read().strip() == conteudo.strip():
                return False

    with open(path, "w", encoding="utf-8") as f:
        f.write(conteudo)

    return True


# ---------------- SUBCATEGORIA ----------------

def processar_subcategoria(url, pasta_base, nome_sub):

    print(f"\n--- Sincronizando: {nome_sub} ---")

    pagina = 1
    albuns = []

    while True:
        sep = "&" if "?" in url else "?"
        url_p = f"{url}{sep}page={pagina}"

        soup = get_soup(url_p)
        if not soup:
            break

        itens = soup.select("a.album__main")
        if not itens:
            break

        for i in itens:
            href = i.get("href")
            if href:
                albuns.append({
                    "nome": i.get("title"),   # 👈 NOME EXATO DO YUPOO
                    "link": BASE_URL + href
                })

        pagina += 1
        time.sleep(0.5)

    albuns.reverse()

    # nomes reais do site (SEM normalizar acento)
    nomes_site = [a["nome"] for a in albuns]

    # deletados reais
    if os.path.exists(pasta_base):
        for pasta in os.listdir(pasta_base):
            full = os.path.join(pasta_base, pasta)

            if os.path.isdir(full):
                # compara direto com nomes reais do site
                if pasta not in [nome_pasta(a) for a in nomes_site] and not pasta.startswith("[DELETED]"):
                    print(f"🗑️ Removendo pasta deletada: {pasta}")
                    shutil.rmtree(full)

    total = len(albuns)

    for i, a in enumerate(albuns, 1):

        nome_real = a["nome"]  # 👈 SEM ALTERAÇÃO
        link = a["link"]

        pasta_nome = nome_pasta(nome_real)
        pasta_album = os.path.join(pasta_base, pasta_nome)

        os.makedirs(pasta_album, exist_ok=True)

        fotos = extrair_fotos(link)
        txt = os.path.join(pasta_album, f"{pasta_nome}.txt")

        if atualizar_txt(txt, nome_real, link, fotos):
            print(f"  [{i}/{total}] Atualizado: {nome_real}")
        else:
            print(f"  [{i}/{total}] OK: {nome_real}")

        time.sleep(1)


# ---------------- MAIN ----------------

def main():

    os.makedirs(CAMINHO_BASE, exist_ok=True)

    soup = get_soup(URL_PRINCIPAL)
    if not soup:
        return

    nome_cat = soup.title.string.split("|")[0].strip()

    pasta_cat = nome_pasta(nome_cat)
    pasta_cat_path = os.path.join(CAMINHO_BASE, pasta_cat)

    os.makedirs(pasta_cat_path, exist_ok=True)

    itens = soup.select("a.categories__box-right-category-item")

    if itens:

        subcats = []

        for i in itens:
            nome = i.get("title") or i.get_text(strip=True)
            link = i.get("href")

            if link:
                if not link.startswith("http"):
                    link = BASE_URL + link

                subcats.append({"nome": nome, "link": link})

        for s in subcats:

            pasta_sub = nome_pasta(s["nome"])
            pasta_sub_path = os.path.join(pasta_cat_path, pasta_sub)

            os.makedirs(pasta_sub_path, exist_ok=True)

            processar_subcategoria(s["link"], pasta_sub_path, s["nome"])

    else:
        processar_subcategoria(URL_PRINCIPAL, pasta_cat_path, nome_cat)


if __name__ == "__main__":
    main()