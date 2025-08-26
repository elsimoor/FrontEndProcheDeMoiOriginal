"use client";
import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

const projectId = "t0fm911f9d"




export default function UseMsClarity() {
    useEffect(() => {
        if (typeof window !== "undefined") {
            Clarity.init(projectId);
        }
      }, []);

    return null;
}