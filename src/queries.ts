
export function indexInstitutions(): Promise<IndexReport> {
    // Super sketch way of making this Promise chain return the result from
    // indexers.index() but it works
    let indexReport: IndexReport | null = null;

    // First find all of our institutions
    const indexers = findIndexers();
    const institutions = indexers.map(indexer => indexer.institution);

    // Then add all of them to the database
    return upsertInstitutions(institutions)
    .then(function() {
        // Then index all of the course equivalencies
        return index();
    }).then(function(result) {
        indexReport = result;
        // Then add those equivalencies to the database
        return bulkUpsert(result.equivalencyContexts);
    }).then(function() {
        return upsertMetadata();
    }).then(function() {
        return indexReport;
    });
}

