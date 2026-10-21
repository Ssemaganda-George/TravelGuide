export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Simple keyword-based responses for travel queries
    const messageLower = message.toLowerCase();

    const responses: Record<string, string> = {
      gorilla: "Gorilla trekking in Bwindi and Mgahinga is a once-in-a-lifetime experience. Permits cost $700 (foreign non-residents), $600 (foreign residents), UGX 250,000 (East African citizens). Book through UWA or a tour operator 6-12 months in advance. Best months: June-Sept and Dec-Feb.",
      bwind: "Bwindi Impenetrable Forest has 4 trekking sectors: Buhoma, Ruhija, Rushaga, and Nkuringo. Buhoma is the most accessible with the most accommodation options.",
      mgahinga: "Mgahinga Gorilla National Park offers gorilla trekking plus golden monkey tracking and volcano hikes. It's smaller and less crowded than Bwindi.",
      jinja: "Jinja is the adventure capital - white water rafting on the Nile, bungee jumping, kayaking, and quad biking. The Source of the Nile is a must-see.",
      murchison: "Murchison Falls National Park has the world's most powerful waterfall, game drives with lions/elephants, and boat safaris to the base of the falls.",
      queen: "Queen Elizabeth National Park is famous for tree-climbing lions in Ishasha, boat safaris on Kazinga Channel, and chimpanzee tracking in Kyambura Gorge.",
      kibale: "Kibale Forest is the primate capital of the world with 13 primate species. Chimpanzee tracking is the main activity here.",
      kidepo: "Kidepo Valley is remote but spectacular with vast savannah, lions, cheetahs, and unique Karamojong culture.",
      sipi: "Sipi Falls has 3 stunning waterfalls on Mount Elgon. Great for hiking, coffee tours, and abseiling.",
      permit: "Gorilla permits cost $700 for foreign non-residents. Book through UWA 6-12 months in advance. Only 8 permits per gorilla family per day.",
      visa: "Uganda offers e-visas ($50 single entry, $100 multiple entry). Apply online at visas.immigration.go.ug at least 2 weeks before travel.",
      vaccine: "Yellow fever vaccination is mandatory. Also recommended: typhoid, hepatitis A/B, malaria prophylaxis. Check with a travel clinic 4-6 weeks before travel.",
      best: "Best time to visit: Dry seasons (Dec-Feb, Jun-Sep) for gorilla trekking and game drives. Wet seasons (Mar-May, Oct-Nov) are greener with fewer tourists.",
      currency: "Ugandan Shilling (UGX) is the currency. USD widely accepted in tourist areas. Credit cards accepted at major hotels. ATMs in major towns.",
      language: "English and Swahili are official languages. English widely spoken in tourist areas. Local languages include Luganda, Runyankore, etc.",
      safety: "Uganda is generally safe for tourists. Standard precautions: avoid walking alone at night, use reputable tour operators, keep valuables secure.",
      transport: "Domestic flights connect major parks. Road travel in 4x4 recommended. Domestic airlines: Aerolink, Bar Aviation, Eagle Air.",
    };

    // Find matching response
    let response = "I can help you plan your Uganda trip! Ask about gorilla trekking, safaris, permits, visas, best time to visit, or specific parks like Bwindi, Murchison Falls, Queen Elizabeth, Jinja, etc.";

    for (const [keyword, response_text] of Object.entries(responses)) {
      if (messageLower.includes(keyword)) {
        return Response.json({ response: response_text });
      }
    }

    // If no specific keyword matched, provide a general helpful response
    return Response.json({
      response: "I'm here to help plan your Uganda adventure! You can ask me about: gorilla trekking permits, specific parks (Bwindi, Murchison Falls, Queen Elizabeth, etc.), best time to visit, visa requirements, vaccinations, or any other travel questions."
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}