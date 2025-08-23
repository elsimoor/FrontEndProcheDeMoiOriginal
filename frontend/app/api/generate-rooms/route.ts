import { NextRequest, NextResponse } from "next/server"

/**
 * API route to generate room data based on a natural language description.
 * This endpoint accepts a POST request with a JSON body containing a
 * `description` string.  It returns a list of room objects with
 * reasonable defaults inferred from the description.  This can be
 * integrated with the OpenAI API by replacing the simple heuristics
 * used below.  For now it uses a basic parser to create one room per
 * sentence in the description.  To use a real OpenAI API, you could
 * fetch from `https://api.openai.com/v1/chat/completions` with your
 * secret key and transform the result accordingly.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Accept either a list of messages or a plain description.  Messages
    // should be an array of objects with `role` and `content` fields.
    let userMessages: { role: string; content: string }[] = []
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      userMessages = body.messages.map((m: any) => ({ role: m.role, content: m.content }))
    } else if (typeof body.description === "string" && body.description.trim().length > 0) {
      userMessages = [{ role: "user", content: body.description.trim() }]
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Build the system prompt instructing the assistant to gather
    // information and eventually produce a JSON array of rooms.  The
    // assistant should prefix the JSON with a special token `__rooms__` to
    // allow the caller to detect when the AI is finished.  When
    // information is missing the assistant should ask follow‑up questions.
    const systemPrompt = `You are a helpful assistant that creates hotel room objects based on user descriptions.\nAsk follow‑up questions to gather any missing details such as room type, capacity, bed type, number of beds, number of bathrooms, price, floor, and amenities.\nDo not produce the final JSON until the user explicitly indicates they are finished providing information (for example, by saying 'done', 'generate rooms', or 'finish'). Until then, keep asking clarifying questions.\nOnce the user indicates that all information has been provided, respond with \"__rooms__\" followed by a JSON array.  Each object in the JSON array must include the fields: number, type, floor, capacity, price, status (always \"available\"), amenities (an array of strings), images (an empty array), bedType (an array of strings), numberOfBeds, numberOfBathrooms, and description.  Do not include any additional fields.  If the user requests multiple rooms or mentions multiple room descriptions, create an object for each.  Do not wrap the JSON in markdown or any other text.`

    // Compose the messages including the system prompt
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...userMessages,
    ]

    // Ensure the OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in the environment")
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Call the OpenAI chat completion API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: chatMessages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("OpenAI API error", response.status, error)
      return NextResponse.json({ error: "OpenAI API error", details: error }, { status: 500 })
    }

    const completion = await response.json()
    const aiMessage: string = completion?.choices?.[0]?.message?.content?.trim() || ""

    let rooms: any[] | null = null
    // Detect the special prefix indicating that the assistant is done.
    // The assistant may include explanatory text before the __rooms__ token,
    // so we look for the token anywhere in the message.  Once found we
    // extract the JSON array starting at the first '[' after the token.
    if (aiMessage.includes("__rooms__")) {
      const prefixIndex = aiMessage.indexOf("__rooms__")
      // Extract the substring after the token to search for a fenced code block or raw JSON
      const afterPrefix = aiMessage.slice(prefixIndex + "__rooms__".length)
      // First, attempt to find a fenced code block (```json ... ``` or ``` ... ```)
      const fenced = afterPrefix.match(/```(?:json)?\s*([\s\S]+?)```/i)
      if (fenced) {
        const jsonString = fenced[1]
        try {
          rooms = JSON.parse(jsonString.trim())
        } catch (e) {
          console.error("Failed to parse rooms JSON from fenced code after prefix", e)
        }
      } else {
        // Otherwise, attempt to parse the raw JSON array following the prefix.  We
        // locate the first '[' after the prefix and then attempt to find the
        // matching closing ']'.  Because there may be trailing text (such as
        // markdown backticks), we incrementally search for a closing bracket
        // that results in valid JSON.
        const jsonStart = afterPrefix.indexOf("[")
        if (jsonStart !== -1) {
          const slice = afterPrefix.slice(jsonStart)
          // Attempt to parse progressively longer substrings ending at each ']' character
          for (let i = 0; i < slice.length; i++) {
            if (slice[i] === "]") {
              const candidate = slice.slice(0, i + 1)
              try {
                const parsed = JSON.parse(candidate)
                rooms = parsed
                break
              } catch (e) {
                // ignore and continue searching for the correct closing bracket
              }
            }
          }
        }
      }
    } else {
      // If the AI responded with a JSON block wrapped in markdown or as a raw array,
      // attempt to extract and parse it.  This handles cases where the assistant
      // mistakenly formats the JSON without the __rooms__ prefix.  We look
      // for a fenced code block first, then fall back to plain JSON.
      const fenceMatch = aiMessage.match(/```json\s*([\s\S]+?)```/i)
      if (fenceMatch) {
        const jsonString = fenceMatch[1]
        try {
          rooms = JSON.parse(jsonString.trim())
        } catch (e) {
          console.error("Failed to parse fenced JSON rooms", e)
        }
      } else {
        // Try to parse if the message looks like a raw JSON array
        const trimmed = aiMessage.trim()
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            rooms = JSON.parse(trimmed)
          } catch (e) {
            // ignore parse error here
          }
        }
      }
    }

    return NextResponse.json({ message: aiMessage, rooms })
  } catch (err) {
    console.error("Error processing generate-rooms request", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}