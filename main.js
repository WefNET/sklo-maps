document.addEventListener("DOMContentLoaded", function () {
    const zoomLevels = [1024, 2048, 4096, 8192]; // Actual zoom levels used in URLs
    const tileSize = 256; // Each tile is 256x256 pixels
    const maxMapSize = 4096; // Largest zoom level (full map size)

    // Compute resolutions (pixels per tile) based on maxMapSize
    const resolutions = zoomLevels.map(z => maxMapSize / z);

    var mapExtent = [0.00000000, 4096.00000000, 4096.00000000, 0.00000000];

    var controls = [
        new ol.control.MousePosition({
            undefinedHTML: 'outside',
            coordinateFormat: function (coordinate) {
                const x = coordinate[0];
                const y = 4096 - coordinate[1];

                // return ol.coordinate.format(coordinate, '{x}, {y}', 0);
                return `(${x.toFixed(0)}, ${y.toFixed(0)})`;
            }
        }),
        new ol.control.Zoom(),
        new ol.control.FullScreen(),
    ];

    const tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        tileSize: tileSize, // 256x256 tiles
        extent: [0, 0, maxMapSize, maxMapSize], // Full map extent
    });


    const tileLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            tileGrid: tileGrid,
            wrapX: false,
            tilePixelRatio: 1,
            tileUrlFunction: function (tileCoord) {
                let z = tileCoord[0];
                let x = tileCoord[1];
                let y = tileCoord[2];

                if (x < 0 || y < 0) return "";

                let zoom = zoomLevels[z];
                return `https://web.game.sklotopolis.com/unlimited/2/tiles-flat/tile_${zoom}_${x}_${y}.png`;
            },
        }),
    });

    const vectorSource = new ol.source.Vector();

    // Vector Layer to display the deed markers
    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 2,
                fill: new ol.style.Fill({ color: 'red' }),
                stroke: new ol.style.Stroke({ color: 'white', width: 2 }),
            }),
        }),
    });

    const map = new ol.Map({
        target: 'map',
        controls: controls,
        layers: [
            tileLayer,
            vectorLayer,
        ],
        view: new ol.View({
            center: [maxMapSize / 2, maxMapSize / 2], // Center of the map
            zoom: 0, // Start at lowest zoom level (1024)
            resolutions: resolutions, // Use custom zoom levels
        }),
    });

    fetch('./deeds.json') // Local path to your deeds.json
    .then(response => response.text()) // Get response as text
    .then(text => {
        const jsonMatch = text.match(/\[.*\]/s); // Match everything inside square brackets
        if (!jsonMatch) throw new Error("Invalid JSON format");

        const jsonData = JSON.parse(jsonMatch[0]);

        jsonData.forEach(deed => {
            // Scale and flip the coordinates based on the map's extent
            const centerX = deed.x;
            const centerY = 4096 - deed.y; // Scale and flip y coordinate for 8192 size
        
            // Calculate the four corners of the deed box
            const topLeft = [centerX - deed.tilesWest, centerY + deed.tilesNorth];
            const topRight = [centerX + deed.tilesEast, centerY + deed.tilesNorth];
            const bottomRight = [centerX + deed.tilesEast, centerY - deed.tilesSouth];
            const bottomLeft = [centerX - deed.tilesWest, centerY - deed.tilesSouth];
        
            // Create a polygon feature using the corner coordinates
            const feature = new ol.Feature({
                geometry: new ol.geom.Polygon([[topLeft, topRight, bottomRight, bottomLeft, topLeft]]), // Close the box
                name: deed.name,
                mayor: deed.mayor,
                x: deed.x,
                y: deed.y,
            });
        
            // Apply a style to the polygon (red border, transparent fill)
            feature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(214, 226, 223, 0.4)'
                })
            }));
        
            vectorSource.addFeature(feature);
        });
        
    })
    .catch(error => console.error("Error loading deed data:", error));


        // Add a Select interaction to handle feature clicks
        const selectInteraction = new ol.interaction.Select({
            condition: ol.events.condition.click, // Trigger on click
        });
    
        // Add the select interaction to the map
        map.addInteraction(selectInteraction);
    
        // Listen to the 'select' event and display the feature details
        selectInteraction.on('select', function (event) {
            const selectedFeature = event.selected[0]; // Get the selected feature
            if (selectedFeature) {
                const deedName = selectedFeature.get('name');
                const mayor = selectedFeature.get('mayor');
                const xCoord = selectedFeature.get('x');
                const yCoord = selectedFeature.get('y');
    
                // Update the details in the HTML
                document.getElementById('deed-name').innerText = `Name: ${deedName}`;
                document.getElementById('deed-mayor').innerText = `Mayor: ${mayor}`;
                document.getElementById('deed-coordinates').innerText = `Coordinates: (${xCoord}, ${yCoord})`;
            }
        });
});