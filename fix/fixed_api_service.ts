// Use environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const HUB_JSON_URL = import.meta.env.VITE_HUB_JSON_URL;

if (!API_BASE_URL || !HUB_JSON_URL) {
    throw new Error("VITE_API_BASE_URL or VITE_HUB_JSON_URL is not defined. Please check your .env file.");
}

const fetchDataViaProxy = async (targetUrl: string) => {
    const encodedUrl = btoa(targetUrl);
    const proxyEndpoint = `${API_BASE_URL}/proxy/?url=${encodedUrl}`;

    try {
        const response = await fetch(proxyEndpoint);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Proxy call for ${targetUrl} failed:`, error);
        throw error;
    }
};

export const apiService = {
    /**
     * Fetches the main hub data from the URL specified in the .env file.
     */
    getHubData: async () => {
        return fetchDataViaProxy(HUB_JSON_URL);
    },

    /**
     * Fetches data for a specific series from a given URL.
     * @param seriesUrl The full URL to the series JSON.
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
        // Add validation to prevent undefined URLs
        if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
            console.warn('getImageProxyUrl called with invalid URL:', imageUrl);
            // Return a placeholder image URL that doesn't need proxying
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