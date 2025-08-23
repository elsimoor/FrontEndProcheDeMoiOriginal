
import { NextResponse } from "next/server";
import { getSession } from "@/app/actions";

export async function POST(request: Request) {
  console.log("Login route");

  try {
    // Parse the incoming JSON payload
    const { email, password } = await request.json();
    const session = await getSession();

    // Send the GraphQL mutation to your backend
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/procheDeMoi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
            query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              token
              user {
                id
                firstName
                lastName
                email
                role
                businessType
                businessId
                isActive
                # Request the list of additional services so that the session
                # can expose dashboard switchers after login.  Each entry
                # contains the identifier of the business and its type.
                services {
                  businessId
                  businessType
                }
              }
            }
          }
        `,
        variables: {
          input: {
            email: email,
            password: password,
          },
        },
      }),
    });

    // Parse the response from your backend
    const result = await backendResponse.json();

    console.log('result', result)

    // If login is successful, store session data
    if (result?.data?.login?.token) {
      const token = result.data.login.token;
      // Create a new NextResponse to attach session cookies
      const response = NextResponse.json(result, { status: 200 });

      // Get the session using iron-session/next
      // const session = await getIronSession(
      //   request,
      //   response,
      //   sessionOptions
      // );

      session.isLoggedIn = true;
      session.token = token;
      // Persist the user object as returned from the backend.  This object
      // contains identifiers and type information about the business the
      // account manages as well as any additional services.
      session.user = result.data.login.user;
      // Copy the business identifiers into top‑level session fields for easy
      // access throughout the app.  The backend returns businessType and
      // businessId on the user object.  We also populate the services
      // array so navigation components can render switchers.
      session.businessType = result.data.login.user.businessType;
      session.businessId = result.data.login.user.businessId;
      // Copy the activity status so middleware can protect inactive users.
      if (session.user) {
        session.user.isActive = result.data.login.user.isActive;
      }
      // Persist additional services if provided.  Some accounts may
      // initially have no services property on the user object.  In
      // that case default to an empty array.
      session.services = (result.data.login.user as any).services || [];

      await session.save();
      // session.user = {
      //   token,
      //   ...result.data.login.user,
      // };
      // await session.save();

      return response;
    }

    // If login fails, return an error response
    return NextResponse.json({ error: result?.errors[0]?.message }, { status: 401 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}