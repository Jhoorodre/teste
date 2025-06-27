// Basic types based on hub.json structure

/**
 * Represents the structure of cover art information.
 */
export interface Cover {
  url: string;
  alt: string;
  type: string;
}

/**
 * Represents author information.
 */
export interface Author {
  name: string;
  originalName: string;
  nationality: string;
}

/**
 * Represents the location of detailed series data.
 */
export interface SeriesDataInfo {
  url: string;
  format: string;
  size: string;
}

/**
 * Represents a single chapter's data as found in the detailed series JSON.
 * The key for this chapter (e.g., "001") is the chapter number.
 */
export interface Chapter {
  title: string;
  volume: string;
  last_updated: string;
  groups: {
    // Key is the scanlation group name, value is an array of page image URLs.
    [groupName: string]: string[];
  };
}

/**
 * Represents a single series as listed in the main hub.json.
 * It contains metadata and a link to the detailed data.
 */
export interface Series {
  id: string;
  title: string;
  slug: string;
  author: Author;
  cover: Cover;
  description: string;
  data: SeriesDataInfo;
  // The chapters object is optional here because it only exists in the detailed view.
  chapters?: {
    [chapterNumber: string]: Chapter;
  };
}

/**
 * Represents the main "hub" object within the hub.json.
 */
export interface Hub {
  id: string;
  title: string;
  subtitle: string;
  description: string;
}

/**
 * Represents the entire structure of the main hub.json file.
 */
export interface HubData {
  hub: Hub;
  series: Series[];
}
