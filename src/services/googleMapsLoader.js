/**
 * Singleton service to manage Google Maps API loading
 * Prevents multiple loads of the Google Maps script
 */

class GoogleMapsLoader {
  constructor() {
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
    this.loadCallbacks = [];
  }

  async load(apiKey, libraries = ['places']) {
    // If already loaded, return immediately
    if (this.isLoaded && window.google?.maps) {
      return { isLoaded: true, loadError: null };
    }

    // If currently loading, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.loadPromise = new Promise((resolve) => {
      // Check if Google Maps is already loaded by another component
      if (window.google?.maps?.places) {
        this.isLoaded = true;
        resolve({ isLoaded: true, loadError: null });
        return;
      }

      // Create a unique callback name
      const callbackName = `initGoogleMaps_${Date.now()}`;
      
      // Define the callback
      window[callbackName] = () => {
        this.isLoaded = true;
        this.isLoading = false;
        delete window[callbackName];
        resolve({ isLoaded: true, loadError: null });
      };

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for existing script to load
        if (window.google?.maps) {
          this.isLoaded = true;
          resolve({ isLoaded: true, loadError: null });
        } else {
          // Set up a listener for when it loads
          const checkInterval = setInterval(() => {
            if (window.google?.maps) {
              clearInterval(checkInterval);
              this.isLoaded = true;
              resolve({ isLoaded: true, loadError: null });
            }
          }, 100);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve({ isLoaded: false, loadError: new Error('Google Maps loading timeout') });
          }, 10000);
        }
        return;
      }

      // Create and append the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=${callbackName}&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        this.isLoading = false;
        delete window[callbackName];
        const error = new Error('Failed to load Google Maps');
        resolve({ isLoaded: false, loadError: error });
      };

      document.head.appendChild(script);
      this.isLoading = true;
    });

    const result = await this.loadPromise;
    
    // Clear the promise after completion
    if (result.isLoaded || result.loadError) {
      this.loadPromise = null;
    }
    
    return result;
  }

  reset() {
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
  }
}

// Export singleton instance
export default new GoogleMapsLoader();