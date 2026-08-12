"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GroveApp } from "@/components/app/GroveApp";
import { useGrove } from "@/lib/grove-store";

export function GroveScreen() {
  const params = useSearchParams();
  const { state, loadDemo, ready, setPlan } = useGrove();

  useEffect(() => {
    if (!ready) return;
    if (params.get("demo") === "1" && !state.people.length) {
      loadDemo(state.you.name || "Alex");
    }
    const upgraded = params.get("upgraded");
    if (upgraded === "plus" || upgraded === "family") setPlan(upgraded);
  }, [params, ready, state.people.length, state.you.name, loadDemo, setPlan]);

  return <GroveApp />;
}
