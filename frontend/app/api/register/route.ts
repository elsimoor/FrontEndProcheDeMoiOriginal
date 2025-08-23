import { NextResponse } from "next/server";
import { getSession } from "@/app/actions";

export async function POST(request: Request) {
    try {
        // Parse the incoming JSON payload
        const formData = await request.json();
        const session = await getSession();

        // Send the GraphQL mutation to your backend
        const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/procheDeMoi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: `
                    mutation Register($input: RegisterInput!) {
                        register(input: $input) {
                            token
                            user {
                                id
                                firstName
                                lastName
                                businessType
                                email
                                role
                                businessType
                            }
                        }
                    }
                `,
                variables: {
                    input: {
                        email: formData.email,
                        password: formData.password,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        businessType: formData.businessType,
                    },
                },
            }),
        });

        // Parse the response from your backend
        const result = await backendResponse.json();


        // If registration is successful, store session data
        if (result?.data?.register?.token) {
                    console.log('result1', result);

            const token = result.data.register.token;
            const response = NextResponse.json(result, { status: 200 });

            // Persist the token and user on the session.  New
            // registrations are inactive by default until an admin
            // approves the associated business.  Copy the
            // businessType so middleware can protect routes.  At this
            // stage the user has no businessId yet; it will be set
            // after the business is created on the business setup page.
            session.isLoggedIn = true;
            session.token = token;
            session.user = result.data.register.user;
            // Set initial activity status to the value returned from
            // the backend (should be false for new accounts).
            if (session.user) {
                session.user.isActive = result.data.register.user.isActive;
            }
            // Copy the business type so the middleware can enforce
            // restrictions even before the business is created.
            session.businessType = result.data.register.user.businessType;
            // The user has no businessId yet; it will be set after the
            // business is created on the business setup page.  Default
            // the services array to an empty list for consistency with
            // the login handler.
            session.services = [];

            await session.save();

            return response;
        }

        // If registration fails, return an error response
        return NextResponse.json({ error: result?.errors?.[0]?.message }, { status: 401 });
    } catch (error) {
        console.log("Registration error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}
