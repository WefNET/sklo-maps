document.addEventListener("DOMContentLoaded", function () {
    const zoomLevels = [1024, 2048, 4096, 8192]; // Actual zoom levels used in URLs
    const tileSize = 256; // Each tile is 256x256 pixels
    const maxMapSize = 4096; // Largest zoom level (full map size)

    // Compute resolutions (pixels per tile) based on maxMapSize
    const resolutions = zoomLevels.map(z => maxMapSize / z);

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

    // Vector Layer to display the deed markers
    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
    });

    const map = new ol.Map({
        target: 'map',
        controls: getControls(),
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

            // Create the inner polygon feature (original deed)
            const deedFeature = new ol.Feature({
                geometry: new ol.geom.Polygon([[topLeft, topRight, bottomRight, bottomLeft, topLeft]]),
                name: deed.name,
                mayor: deed.mayor,
                x: deed.x,
                y: deed.y,
                lastActive: deed.lastActive,
            });

            const fillColor = deed.isSpawnPoint ? 'rgba(2, 224, 253, 0.64)' : 'rgba(214, 226, 223, 0.3)';

            deedFeature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: fillColor
                })
            }));

            // Generate expanded outer polygon
            const outerCoords = expandBoundingBox([[topLeft, topRight, bottomRight, bottomLeft]], deed.tilesPerimeter);

            // Create the outer polygon feature (stroke-only)
            const perimeterFeature = new ol.Feature({
                geometry: new ol.geom.Polygon(outerCoords),
                name: deed.name,
                mayor: deed.mayor,
                x: deed.x,
                y: deed.y,
                lastActive: deed.lastActive,
            });

            perimeterFeature.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 72, 0, 0.8)',
                    width: 2, // Width of stroke
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0)' // Fully transparent fill
                })
            }));

            // store for toggle
            perimeterFeatures.push(perimeterFeature);

            // Add both features to the vector source
            vectorSource.addFeature(deedFeature);
            vectorSource.addFeature(perimeterFeature);
        });

    })
    .catch(error => console.error("Error loading deed data:", error));

    fetch('./towers.json')
    .then(response => response.text())
    .then(text => {
        const jsonMatch = text.match(/\[.*\]/s);
        if (!jsonMatch) throw new Error("Invalid JSON format");

        const jsonData = JSON.parse(jsonMatch[0]);

        jsonData.forEach(tower => {
            const centerX = tower.x;
            const centerY = 4096 - tower.y;

            // Create a circular feature with a radius of 25
            const towerFeature = new ol.Feature({
                geometry: new ol.geom.Circle([centerX, centerY], 25),
                type: 'tower',
                creator: tower.creatorName,
                name: tower.towerName,
                x: tower.x,
                y: tower.y,
                guards: tower.maxGuards,
            });

            towerFeature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(238, 255, 0, 0.3)'
                }),
                // stroke: new ol.style.Stroke({
                //     color: 'rgba(255, 0, 0, 0.8)',
                //     width: 1
                // })
            }));

            towerFeatures.push(towerFeature);

            vectorSource.addFeature(towerFeature);
        });
    })
    .catch(error => console.error("Error loading tower data:", error));


        // Add a Select interaction to handle feature clicks
        const selectInteraction = new ol.interaction.Select({
            condition: ol.events.condition.click, // Trigger on click
        });

        // Add the select interaction to the map
        map.addInteraction(selectInteraction);

        // Listen to the 'select' event and display the feature details
        selectInteraction.on('select', function (event) {
            const selectedFeature = event.selected[0]; // Get the selected feature
            console.log(selectedFeature);

            if (selectedFeature) {
                const deedName = selectedFeature.get('name');
                const mayor = selectedFeature.get('mayor');
                const xCoord = selectedFeature.get('x');
                const yCoord = selectedFeature.get('y');
                const lastActive = selectedFeature.get('lastActive');

                // Update the details in the HTML
                document.getElementById('deed-name').innerText = `Name: ${deedName}`;
                document.getElementById('deed-mayor').innerText = `Mayor: ${mayor}`;
                document.getElementById('deed-coordinates').innerText = `Coordinates: (${xCoord}, ${yCoord})`;
                document.getElementById('deed-lastActive').innerText = lastActive ? `Last Active: ${lastActive}` : 'Last Active: Unknown';
            }
        });
});

const getControls = () => {
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
    ];

    return controls;
}

function expandBoundingBox(coords, padding) {
    return coords.map(coord => [
        [coord[0][0] - padding, coord[0][1] + padding], // Expand top-left UP & LEFT
        [coord[1][0] + padding, coord[1][1] + padding], // Expand top-right UP & RIGHT
        [coord[2][0] + padding, coord[2][1] - padding], // Expand bottom-right DOWN & RIGHT
        [coord[3][0] - padding, coord[3][1] - padding], // Expand bottom-left DOWN & LEFT
        [coord[0][0] - padding, coord[0][1] + padding]  // Close the polygon
    ]);
}

let vectorSource = new ol.source.Vector();

let perimeterFeatures = [];
let towerFeatures = [];

let perimeterFeaturesVisible = { value: true };
let towerFeaturesVisible = { value: true };

function toggleFeatures(featureArray, isVisible) {
    if (isVisible.value) {
        featureArray.forEach(feature => vectorSource.removeFeature(feature));
    } else {
        featureArray.forEach(feature => vectorSource.addFeature(feature));
    }
    isVisible.value = !isVisible.value;
}

document.getElementById('togglePerimeters').addEventListener('click', () => 
    toggleFeatures(perimeterFeatures, perimeterFeaturesVisible)
);

document.getElementById('toggleTowers').addEventListener('click', () => 
    toggleFeatures(towerFeatures, towerFeaturesVisible)
);