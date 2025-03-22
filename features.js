export const showDeedFeature = (deedFeature) => {
    // name: deed.name,
    // mayor: deed.mayor,
    // founder: deed.founderName,
    // guards: deed.guards,
    // motto: deed.motto,
    // citizens: deed.amountOfCitizens,
    // alliance: deed.allianceName,
    // isSpawnPoint: deed.isSpawnPoint,
    // created: deed.creationDate,
    // x: deed.x,
    // y: deed.y,
    // lastActive: deed.lastActive,

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