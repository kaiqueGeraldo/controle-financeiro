import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPRING_BOOT_URL = (
  process.env.BACKEND_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

export async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } },
) {
  try {
    const resolvedParams = await context.params;
    const path = resolvedParams.path.join("/");
    const backendUrl = `${SPRING_BOOT_URL}/${path}${request.nextUrl.search}`;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers = new Headers();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const incomingContentType = request.headers.get("content-type");
    if (incomingContentType) {
      headers.set("Content-Type", incomingContentType);
    }

    const incomingAccept = request.headers.get("accept");
    if (incomingAccept) {
      headers.set("Accept", incomingAccept);
    }

    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined;

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: body,
    });

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Content-Type":
            response.headers.get("Content-Type") || "application/json",
        },
      });
    }

    const data = await response.blob();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error: any) {
    console.error("❌ ERRO NO BFF (Proxy):", error);

    if (
      error.code === "ECONNREFUSED" ||
      error.message?.includes("fetch failed")
    ) {
      return NextResponse.json(
        {
          message:
            "Servidor em manutenção ou a reiniciar. Aguarde um instante.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Erro interno no proxy (BFF)." },
      { status: 500 },
    );
  }
}

export {
  proxyRequest as GET,
  proxyRequest as POST,
  proxyRequest as PUT,
  proxyRequest as PATCH,
  proxyRequest as DELETE,
};