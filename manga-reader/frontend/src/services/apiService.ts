// Use environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const HUB_JSON_URL = import.meta.env.VITE_HUB_JSON_URL;

if (!API_BASE_URL || !HUB_JSON_URL) {
    throw new Error("VITE_API_BASE_URL or VITE_HUB_JSON_URL is not defined. Please check your .env file.");
}

const fetchDataViaProxy = async (targetUrl: string) => {
    if (!targetUrl) {
        throw new Error("Target URL for proxy is undefined.");
    }
    const encodedUrl = btoa(targetUrl);
    const proxyEndpoint = `${API_BASE_URL}/proxy/?url=${encodedUrl}`;

    try {
        const response = await fetch(proxyEndpoint);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Request failed with status ${response.status}`);
        }
        // O proxy agora sempre retorna o conteúdo bruto, então tentamos analisar como JSON aqui.
        return response.json();
    } catch (error) {
        console.error(`Proxy call for ${targetUrl} failed:`, error);
        throw error;
    }
};

export const apiService = {
    /**
     * Fetches the main hub data from the local backend endpoint.
     */
    getHubData: async () => {
        return fetchDataViaProxy(HUB_JSON_URL);
    },

    /**
     * Fetches data for a specific series from a local backend endpoint.
     * @param seriesUrl The URL of the series JSON.
     */
    getSeriesData: async (seriesUrl: string) => {
        return fetchDataViaProxy(seriesUrl);
    },

    /**
     * Constructs the URL for the image proxy.
     * @param imageUrl The original URL of the image.
     * @returns The proxied image URL.
     */
    getImageProxyUrl: (imageUrl: string | undefined) => {
        if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
            return 'https://placehold.co/400x600/1f2937/4b5563?text=Invalid+URL';
        }
        try {
            const encodedUrl = btoa(imageUrl);
            return `${API_BASE_URL}/proxy/?url=${encodedUrl}`;
        } catch (error) {
            console.error('Error encoding URL for proxy:', imageUrl, error);
            return 'https://placehold.co/400x600/1f2937/4b5563?text=Encoding+Error';
        }
    }
};
