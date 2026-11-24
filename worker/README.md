# API de Advent11Ale (Cloudflare Worker + KV)

Guarda los regalos abiertos, los likes y los comentarios. Reemplaza a Supabase.

Sin desplegar el Worker, la app funciona igual en **modo local**: guarda todo
en el navegador (`localStorage`). En ese modo cada dispositivo tiene su propio estado.

## Desplegar (una sola vez)

```bash
cd worker
npm install
npx wrangler login                          # abre el navegador para entrar a Cloudflare
npx wrangler kv namespace create ADVENT_KV  # copia el "id" que devuelve
```

1. Pega ese `id` en `wrangler.toml` (donde dice `REEMPLAZAR_CON_ID_DEL_KV`).
2. (Recomendado) En `wrangler.toml`, cambia `ALLOWED_ORIGINS = "*"` por la URL de tu web,
   por ejemplo `"https://advent11ale.vercel.app"`.
3. Crea la clave para poder reiniciar los regalos:
   ```bash
   npx wrangler secret put RESET_TOKEN
   ```
4. Despliega:
   ```bash
   npm run deploy
   ```
   Te dará una URL como `https://advent11ale-api.<tu-usuario>.workers.dev`.

## Conectar la app

En Vercel → *Settings → Environment Variables*, agrega:

```
NEXT_PUBLIC_API_URL=https://advent11ale-api.<tu-usuario>.workers.dev
```

y vuelve a desplegar la app. Para probar en local, pon la misma línea en `.env.local`.

## Probar en local

```bash
cd worker
npm run dev        # http://localhost:8787 (KV simulado, no necesita cuenta)
```

y en otra terminal, en la raíz del proyecto:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8787 npm run dev
```

## Endpoints

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| GET | `/api/state` | — |
| POST | `/api/open` | `{ "giftId": 1 }` |
| POST | `/api/like` | `{ "giftId": 1 }` |
| POST | `/api/comments` | `{ "giftId": 1, "comment": "...", "authorName": "Ale" }` |
| DELETE | `/api/comments/:id` | — |
| POST | `/api/reset` | header `Authorization: Bearer <RESET_TOKEN>` |

Reiniciar desde la consola del navegador: `resetGifts("tu-token")`.
