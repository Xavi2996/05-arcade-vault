import { NextRequest, NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactPayload {
  name?: string;
  email?: string;
  message?: string;
  company?: string;
}

export async function POST(request: NextRequest) {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida." },
      { status: 400 }
    );
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const company = body.company?.trim() ?? "";

  // Honeypot: los bots suelen rellenar este campo oculto. Se responde como si
  // hubiera tenido éxito para no delatar la protección, sin enviar el correo.
  if (company !== "") {
    return NextResponse.json({ ok: true });
  }

  if (!name || !message || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Revisa el nombre, el correo y el mensaje." },
      { status: 400 }
    );
  }

  const to = process.env.CONTACT_TO_EMAIL;
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "El servidor no tiene configurado el correo de destino." },
      { status: 500 }
    );
  }

  let resend;
  try {
    resend = getResendClient();
  } catch {
    return NextResponse.json(
      { ok: false, error: "El servidor no tiene configurado el envío de correo." },
      { status: 500 }
    );
  }

  try {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      replyTo: email,
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${message}`,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "No se pudo enviar el mensaje. Inténtalo de nuevo." },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo enviar el mensaje. Inténtalo de nuevo." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
