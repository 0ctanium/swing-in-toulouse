import { NextResponse } from "next/server";

import { getAgendaFilterOptions } from "@/lib/events/agenda-filter-options";

export async function GET() {
  const filters = await getAgendaFilterOptions();

  return NextResponse.json(filters);
}
