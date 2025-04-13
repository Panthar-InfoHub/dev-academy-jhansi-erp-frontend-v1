"use server";

import { BACKEND_SERVER_URL } from "@/env";
import { parseServerResponse } from "@/lib/utils";
import { PaymentsInfoResponse } from "@/types/analytics";
import { getCache, setCache } from "@/lib/cache";

export async function getPayments(
  start_date: Date,
  end_date: Date,
  page: number = 1,
  limit: number = 10,
  ascending: boolean = false
) {
  console.log(
    "Fetching payments for date range: ",
    start_date,
    end_date,
    "page: ",
    page,
    "limit: ",
    limit,
    "ascending: ",
    ascending
  );

  // Construct a unique cache key based on parameters
  const cacheKey = `payments-${start_date.toISOString()}-${end_date.toISOString()}-${page}-${limit}-${ascending}`;
  const cachedResponse = getCache<ReturnType<typeof parseServerResponse>>(cacheKey);
  if (cachedResponse) {
    console.debug("Returning cached payments data for key:", cacheKey);
    return cachedResponse;
  }

  try {
    const url = new URL(`${BACKEND_SERVER_URL}/v1/analytics/payments-info`);
    url.searchParams.append("start_date", start_date.toISOString());
    url.searchParams.append("end_date", end_date.toISOString());
    url.searchParams.append("page", String(page));
    url.searchParams.append("limit", String(limit));
    // If ascending is needed on the backend, you might want to pass it as well:
    url.searchParams.append("ascending", String(ascending));

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Fetch error:", { status: response.status, body: errorBody });
      return parseServerResponse<null>({
        status: "ERROR",
        message: errorBody.error || "Failed to fetch payments",
        data: null,
      });
    }

    const data: PaymentsInfoResponse = await response.json();
    console.debug("Response from getPayments: ", JSON.stringify(data));

    const parsedResponse = parseServerResponse<PaymentsInfoResponse>({
      status: "SUCCESS",
      message: "Successfully fetched payments",
      data: data,
    });

    // Cache the parsed response for 30 seconds
    setCache(cacheKey, parsedResponse, 30);
    return parsedResponse;
  } catch (e: any) {
    console.error("Failed to fetch payments", e);
    return parseServerResponse<null>({
      status: "ERROR",
      message: "An unexpected error occurred",
      data: null,
    });
  }
}