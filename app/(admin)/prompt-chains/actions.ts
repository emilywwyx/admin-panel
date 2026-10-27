"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/auth";
import { withParams } from "@/lib/params";

export async function updateMix(formData: FormData) {
  const { db } = await getDb();
  const chainId = Number(formData.get("chain_id"));
  const weight = Number(formData.get("weight"));

  if (!Number.isInteger(chainId) || chainId <= 0) {
    redirect(withParams("/prompt-chains/mix", { error: "Invalid chain." }));
  }

  if (!Number.isInteger(weight) || weight < 0 || weight > 1000) {
    redirect(withParams("/prompt-chains/mix", { error: "Weight must be a whole number from 0 to 1000." }));
  }

  const { error } = await db.from("prompt_chain_mix").upsert({
    chain_id: chainId,
    weight,
    is_active: formData.has("is_active"),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(withParams("/prompt-chains/mix", { error: `Could not update the mix: ${error.message}` }));
  }

  revalidatePath("/prompt-chains", "layout");
  redirect(withParams("/prompt-chains/mix", { notice: "Mix updated." }));
}
