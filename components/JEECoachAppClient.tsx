"use client";

import dynamic from "next/dynamic";

const JEECoachAppClient = dynamic(() => import("@/components/JEECoachApp"), {
    ssr: false,
});

export default JEECoachAppClient;
