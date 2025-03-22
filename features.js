export const showDeedFeature = (deedFeature) => {
    const deedName = deedFeature.get('name');
    const mayor = deedFeature.get('mayor');
    const xCoord = deedFeature.get('x');
    const yCoord = deedFeature.get('y');
    const lastActive = deedFeature.get('lastActive') || 'Last active: Unknown';
    const founded = deedFeature.get('created') || undefined;

    let foundedDateStr = 'Unknown';

    if (founded) {
        const foundedDate = new Date(founded);
        foundedDateStr = foundedDate.toLocaleDateString();
    }

    // Base information
    let detailsHTML = `
        <h4>🏡 ${deedName}</h4>
        <p><strong>Mayor:</strong> ${mayor}</p>
        <p><strong>Coordinates:</strong> (${xCoord}, ${yCoord})</p>
        <p><strong>Founded:</strong> ${foundedDateStr}</p>
        <p>${lastActive}</p>
    `;

    const detailsDiv = document.getElementById('details');
        detailsDiv.style.opacity = 0; // Fade out
        setTimeout(() => {
            detailsDiv.innerHTML = detailsHTML;
            detailsDiv.style.opacity = 1; // Fade in new content
        }, 50);
}

export const showTowerFeature = (towerFeature) => {
    const towerName = towerFeature.get('name');
    const creator = towerFeature.get('creator');
    const xCoord = towerFeature.get('x');
    const yCoord = towerFeature.get('y');

    // Base information
    let detailsHTML = `
        <h4>🗼 ${towerName}</h4>
        <p><strong>Created by:</strong> ${creator}</p>
        <p><strong>Coordinates:</strong> (${xCoord}, ${yCoord})</p>
    `;

    const detailsDiv = document.getElementById('details');
        detailsDiv.style.opacity = 0; // Fade out
        setTimeout(() => {
            detailsDiv.innerHTML = detailsHTML;
            detailsDiv.style.opacity = 1; // Fade in new content
        }, 50);
}