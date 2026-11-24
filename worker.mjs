const recipient = "lukas.themm@outlook.de";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/contact") return env.ASSETS.fetch(request);
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
    }
    if (request.headers.get("Origin") !== url.origin) {
      return new Response("Invalid origin", { status: 403 });
    }
    if (!request.headers.get("Content-Type")?.startsWith("application/x-www-form-urlencoded")) {
      return new Response("Unsupported form format", { status: 415 });
    }

    const body = await request.text();
    if (body.length > 70000) return new Response("Message too large", { status: 413 });
    const fields = new URLSearchParams(body);
    const name = fields.get("name")?.trim();
    const email = fields.get("email")?.trim();
    const message = fields.get("message")?.trim();
    if (fields.get("website")) return Response.redirect(new URL("/contact.html", url), 303);
    if (!name || name.length > 120 || !email || email.length > 254 ||
        !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) ||
        !message || message.length > 5000) {
      return new Response("Please go back and enter a valid name, email, and message.", { status: 400 });
    }

    try {
      await env.EMAIL.send({
        to: recipient,
        from: env.CONTACT_FROM,
        replyTo: email,
        subject: "New website contact message",
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      });
    } catch (error) {
      console.error("Contact delivery failed", error.code);
      return new Response("Your message could not be sent. Please try again later.", { status: 502 });
    }
    return new Response("Thank you. Your message was sent.", {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  },
};

