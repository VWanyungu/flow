import { toast } from "sonner"

interface HttpRequestOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

interface ReturnData {
    status: "success" | "fail";
    data: any;
    error: any;
}

export const useRequest = () => {
    const httpRequest = async (
        url: string,
        options: HttpRequestOptions = {}
    ): Promise<ReturnData> => {
        const { skipAuthRedirect, ...fetchOptions } = options;

        try {
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    ...fetchOptions.headers,
                },
                ...fetchOptions,
            });

            if (response.status === 401) {
                toast.error("Session expired. Please log in again.");
                throw new Error("Unauthorized");
            }

            if (response.status === 500) {
                toast.error("Something went wrong on our end. Please try again.");
                throw new Error("Internal Server Error");
            }

            if (!response.ok) {
                // catch-all for other error codes (400, 403, 404, etc.)
                const errorBody = await response.json().catch(() => null);
                const message = errorBody?.message || `Request failed (${response.status})`;
                toast.error(message);
                throw new Error(message);
            }

            // handle empty responses (e.g. 204 No Content)
            const contentType = response.headers.get("content-type");
            if (!contentType?.includes("application/json")) {
                return {
                    status: "success",
                    data: null,
                    error: "Empty response"
                };
            }

            const returnRes = await response.json()

            return {
                    status: "success",
                    data: returnRes,
                    error: null
                };

        } catch (error) {
            // network errors (fetch throws before getting a response)
            if (error instanceof TypeError) {
                toast.error("Network error. Check your connection.");
            }
            return {
                status: "fail",
                data: null,
                error: "Network error. Check your connection"
            }
        }
    }

    return ({
        httpRequest
    })
}