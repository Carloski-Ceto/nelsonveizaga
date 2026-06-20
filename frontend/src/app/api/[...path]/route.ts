import { NextRequest, NextResponse } from 'next/server';

function upstreamBase(): string | null {
  const raw = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!raw || !String(raw).trim()) return null;
  return String(raw).replace(/\/$/, '');
}

async function proxy(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const base = upstreamBase();
  if (!base) {
    return NextResponse.json(
      { error: 'Falta INTERNAL_API_URL o NEXT_PUBLIC_API_URL en el entorno.' },
      { status: 503 }
    );
  }
  const path = pathSegments.join('/');
  const targetUrl = `${base}/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const name of ['authorization', 'content-type', 'accept', 'accept-language']) {
    const v = req.headers.get(name);
    if (v) headers.set(name, v);
  }
  const cookie = req.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  const init: RequestInit = {
    method: req.method,
    headers,
    // Seguir 301/302 en el servidor. Si reenviamos 301 al navegador, Axios sigue la
    // Location; con slash final Django ↔ Next (trailingSlash: false) se alterna la URL
    // y aparece net::ERR_TOO_MANY_REDIRECTS aunque /api/users llegue en 200.
    redirect: 'follow',
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) init.body = buf;
  }

  const res = await fetch(targetUrl, init);

  const outHeaders = new Headers();
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'transfer-encoding' || lower === 'connection') return;
    outHeaders.set(key, value);
  });

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: res.status,
    statusText: res.statusText,
    headers: outHeaders,
  });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteCtx = { params: { path: string[] } };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? []);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? []);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? []);
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? []);
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? []);
}

export async function HEAD(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? []);
}

export async function OPTIONS(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? []);
}
