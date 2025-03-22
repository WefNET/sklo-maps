import { showDeedFeature, showTowerFeature } from "./features.js";

document.addEventListener("DOMContentLoaded", function () {
    const apiUrls = [
        'https://web.game.sklotopolis.com/unlimited/2/deeds.json',
        'https://web.game.sklotopolis.com/unlimited/2/towers.json',
        'https://web.game.sklotopolis.com/unlimited/2/highways.json',
        'https://web.game.sklotopolis.com/unlimited/2/poi.json'
    ];

    // Wait for all scripts to load before running initializeApp
    Promise.all(apiUrls.map(loadScript))
        .then(() => {
            console.log("All APIs loaded successfully!");
            initailizeMap();
        })
        .catch(error => console.error("Error loading scripts:", error));
});

const initailizeMap = () => {
    console.log("Deeds:", deeds);
    console.log("Towers:", guard_towers);
    console.log("Highways:", highways);
    console.log("POIs:", poi);

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

    deeds.forEach(deed => {
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
            type: 'deed',
            name: deed.name,
            mayor: deed.mayor,
            founder: deed.founderName,
            guards: deed.guards,
            motto: deed.motto,
            citizens: deed.amountOfCitizens,
            alliance: deed.allianceName,
            isSpawnPoint: deed.isSpawnPoint,
            created: deed.creationDate,
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
            type: 'deed',
            name: deed.name,
            mayor: deed.mayor,
            founder: deed.founderName,
            guards: deed.guards,
            motto: deed.motto,
            citizens: deed.amountOfCitizens,
            alliance: deed.allianceName,
            isSpawnPoint: deed.isSpawnPoint,
            created: deed.creationDate,
            x: deed.x,
            y: deed.y,
            lastActive: deed.lastActive,
        });

        perimeterFeature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(255, 0, 0, 0.44)',
                width: 1, // Width of stroke
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0, 0, 0, 0)' // Fully transparent fill
            })
        }));

        // store for toggle
        deedFeatures.push(deedFeature);
        perimeterFeatures.push(perimeterFeature);

        // Add both features to the vector source
        vectorSource.addFeature(deedFeature);
        vectorSource.addFeature(perimeterFeature);
    });

    guard_towers.forEach(tower => {
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

    highways.forEach(highway => {
        const startX = highway.startX;
        const startY = 4096 - highway.startY;
        const endX = highway.endX;
        const endY = 4096 - highway.endY;

        const highwayFeature = new ol.Feature({
            geometry: new ol.geom.LineString([[startX, startY], [endX, endY]]),
            type: 'highway',
        });

        highway.type

        highwayFeature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: getHighwayColor(highway.type),
                width: 3
            })
        }));

        highwayFeatures.push(highwayFeature);

        vectorSource.addFeature(highwayFeature);
    });


    // Add a Select interaction to handle feature clicks
    const selectInteraction = new ol.interaction.Select({
        condition: ol.events.condition.click, // Trigger on click
    });

    // Add the select interaction to the map
    map.addInteraction(selectInteraction);

    // Listen to the 'select' event and display the feature details
    selectInteraction.on('select', function (event) {
        const selectedFeature = event.selected[0]; // Get the selected feature
        // console.log(selectedFeature);

        const type = selectedFeature.get('type');

        if (type === 'deed') {
            showDeedFeature(selectedFeature);
        } else if (type === 'tower') {
            showTowerFeature(selectedFeature);
        } else {
            console.log("Unknown feature type:", type);
        }
    });

    document.getElementById('toggleDeeds').addEventListener('click', () =>
        toggleFeatures(deedFeatures, deedFeaturesVisible)
    );

    document.getElementById('togglePerimeters').addEventListener('click', () =>
        toggleFeatures(perimeterFeatures, perimeterFeaturesVisible)
    );

    document.getElementById('toggleTowers').addEventListener('click', () =>
        toggleFeatures(towerFeatures, towerFeaturesVisible)
    );

    document.getElementById('toggleHighways').addEventListener('click', () =>
        toggleFeatures(highwayFeatures, highwayFeaturesVisible)
    );
}

const loadScript = (url) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            console.log(`Loaded: ${url}`);
            resolve(); // Resolve the promise when the script loads
        };

        script.onerror = () => reject(`Failed to load ${url}`);
        document.body.appendChild(script);
    });
}

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

const getHighwayColor = (type) =>{
    switch (type) {
        case '0': return 'rgba(0, 0, 0, 0.8)'; // bridge 0
        case '1': return 'rgba(255, 0, 0, 0.8)'; // tunnel 1
        case '2': return 'rgba(184, 184, 184, 0.8)'; // regular road 2
        case '3': return 'rgba(0, 0, 255, 0.8)';  // tunnel boat canal 3
        default: return 'rgba(255, 255, 255, 0.8)';
    }
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

let deedFeatures = [];
let perimeterFeatures = [];
let towerFeatures = [];
let highwayFeatures = [];

let deedFeaturesVisible = { value: true };
let perimeterFeaturesVisible = { value: true };
let towerFeaturesVisible = { value: true };
let highwayFeaturesVisible = { value: true };

const updateButtonState = (button, state) => {
    if (state.value) {
        button.classList.add("active");
        button.classList.remove("inactive");
    } else {
        button.classList.add("inactive");
        button.classList.remove("active");
    }
}

const toggleFeatures = (featureArray, isVisible) => {
    if (isVisible.value) {
        featureArray.forEach(feature => vectorSource.removeFeature(feature));
    } else {
        featureArray.forEach(feature => vectorSource.addFeature(feature));
    }
    isVisible.value = !isVisible.value;
}