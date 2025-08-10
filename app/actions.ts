"use server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { defautlSessionData, SessionData, sessionOptions } from "./lib";

export const getSession = async () => {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) {
        session.isLoggedIn = defautlSessionData.isLoggedIn;
    }
    return session;
};


export const logoutFunc = async () => {


    const session = await getSession();
    session.destroy();
    redirect("/");
};