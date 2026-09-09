import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SPRING_BOOT_URL = (
  process.env.BACKEND_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

const configuredTimeout = Number(process.env.BFF_TIMEOUT_MS ?? "10000");
const BFF_TIMEOUT_MS =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 10000;

type RouteContext = {
  params: Promise<{ path: string[] }> | { path: string[] };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isConnectionFailure(error: unknown): boolean {
  if (!isRecord(error)) return false;
  const message = typeof error.message === "string" ? error.message : "";
  const code = typeof error.code === "string" ? error.code : "";
  return (
    error instanceof TypeError ||
    code === "ECONNREFUSED" ||
    message.toLowerCase().includes("fetch failed")
  );
}

function forwardedResponseHeaders(response: Response): Headers {
  const headers = new Headers();
  for (const name of ["content-type", "content-disposition", "cache-control"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export async function proxyRequest(request: NextRequest, context: RouteContext) {
  if (request.signal.aborted) {
    return new NextResponse(null, { status: 499 });
  }
  const timeoutController = new AbortController();
  let timedOut = false;
  const onClientAbort = () => timeoutController.abort(request.signal.reason);
  request.signal.addEventListener("abort", onClientAbort, { once: true });
  const timeoutId = setTimeout(() => {
    timedOut = true;
    timeoutController.abort(new DOMException("BFF upstream timeout", "TimeoutError"));
  }, BFF_TIMEOUT_MS);

  try {
    const resolvedParams = await context.params;
    const path = resolvedParams.path.join("/");
    const backendUrl = `${SPRING_BOOT_URL}/${path}${request.nextUrl.search}`;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const headers = new Headers();

    if (token) headers.set("authorization", `Bearer ${token}`);

    for (const name of ["content-type", "accept"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : undefined;

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: timeoutController.signal,
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers: forwardedResponseHeaders(response),
    });
  } catch (error: unknown) {
    if (request.signal.aborted) {
      return new NextResponse(null, { status: 499 });
    }

    if (timedOut) {
      return NextResponse.json(
        { message: "A API demorou além do limite. Tente novamente." },
        { status: 504 },
      );
    }

    if (isConnectionFailure(error)) {
      return NextResponse.json(
        { message: "Servidor em manutenção ou a reiniciar. Aguarde um instante." },
        { status: 503 },
      );
    }

    console.error("Erro inesperado no BFF ao acessar a API.", error);
    return NextResponse.json(
      { message: "Erro interno no proxy (BFF)." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
    request.signal.removeEventListener("abort", onClientAbort);
  }
}

export {
  proxyRequest as DELETE,
  proxyRequest as GET,
  proxyRequest as PATCH,
  proxyRequest as POST,
  proxyRequest as PUT,
};
