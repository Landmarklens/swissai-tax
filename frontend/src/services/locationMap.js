export const geocodeWithNominatim = async (locationName) => {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
    )

    if (!response.ok) {
        throw new Error("Failed to fetch location data")
    }

    const data = await response.json()

    if (data && data.length > 0) {
        return {
            lat: Number.parseFloat(data[0].lat),
            lng: Number.parseFloat(data[0].lon),
            formatted_address: data[0].display_name,
        }
    } else {
        throw new Error("Location not found")
    }
}

export const geocodeWithGoogle = async (locationName, apiKey) => {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&key=${apiKey}`,
    )

    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0]
        return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formatted_address: result.formatted_address,
        }
    } else {
        throw new Error(`Geocoding failed: ${data.status}`)
    }
}

export const geocodeWithMapbox = async (locationName, accessToken) => {
    const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${accessToken}&limit=1`,
    )

    const data = await response.json()

    if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        return {
            lat: feature.center[1],
            lng: feature.center[0],
            formatted_address: feature.place_name,
        }
    } else {
        throw new Error("Location not found")
    }
}

export const geocodeMultipleLocations = async (locationNames) => {
    const results = []

    for (const locationName of locationNames) {
        try {
            const result = await geocodeWithNominatim(locationName)
            results.push({
                name: locationName,
                ...result,
                success: true,
            })
        } catch (error) {
            results.push({
                name: locationName,
                error: error.message,
                success: false,
            })
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return results
}