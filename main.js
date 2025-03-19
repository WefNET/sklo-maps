document.addEventListener("DOMContentLoaded", function () {
    const zoomLevels = [1024, 2048, 4096, 8192]; // Actual zoom levels used in URLs
    const tileSize = 256; // Each tile is 256x256 pixels
    const maxMapSize = 8192; // Largest zoom level (full map size)

    // Compute resolutions (pixels per tile) based on maxMapSize
    const resolutions = zoomLevels.map(z => maxMapSize / z);

    const tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        tileSize: tileSize, // 256x256 tiles
        extent: [0, 0, maxMapSize, maxMapSize], // Full map extent
        origin: [0, maxMapSize], // Top-left as origin
    });

    const map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    tileGrid: tileGrid,
                    wrapX: false, // Prevents wrapping
                    tilePixelRatio: 1, // Ensures correct scaling

                    // Custom tile URL function to replace {z} with correct zoom level
                    tileUrlFunction: function (tileCoord) {
                        let z = tileCoord[0]; // OpenLayers zoom index (0,1,2,3)
                        let x = tileCoord[1]; // Tile X
                        let y = tileCoord[2]; // Tile Y
                        
                        if (x < 0 || y < 0) return ""; // Prevent invalid tile requests
                        
                        let zoom = zoomLevels[z]; // Convert OL zoom to 1024, 2048, etc.
                        return `https://web.game.sklotopolis.com/unlimited/2/tiles-flat/tile_${zoom}_${x}_${y}.png`;
                    },
                }),
            }),
        ],
        view: new ol.View({
            center: [maxMapSize / 2, maxMapSize / 2], // Center of the map
            zoom: 0, // Start at lowest zoom level (1024)
            projection: 'EPSG:3857', // Adjust if needed
            resolutions: resolutions, // Use custom zoom levels
            constrainResolution: true, // Snap to predefined resolutions
        }),
    });
});
