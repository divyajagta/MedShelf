export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access_token");
}


export async function authFetch(
  url: string,
  options: RequestInit = {}
) {
  const token = getAccessToken();

  if (!token) {
    window.location.href = "/login";
    throw new Error("Authentication required");
  }

  const headers = new Headers(
    options.headers
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );

  const response = await fetch(
    url,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {
    localStorage.removeItem(
      "access_token"
    );

    window.location.href = "/login";

    throw new Error(
      "Session expired"
    );
  }

  return response;
}