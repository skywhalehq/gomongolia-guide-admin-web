// lib/httpHelper.ts

export interface BaseResponse<T> {
  message: string;
  data: T | null;
}

export async function httpGet<T>(url: string): Promise<T | null> {

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    let msg = `HTTP error! status: ${res.status}`;
    try {
      const errData = await res.json();
      msg = errData.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const json: BaseResponse<T> = await res.json();
  return json.data;  // return only the data
}
