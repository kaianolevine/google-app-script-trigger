function newCsvDjSets() {
    const FOLDER_ID = '1t4d_8lMC3ZJfSyainbpwInoDta7n69hC'; // Google Drive folder ID to monitor
    const SNAPSHOT_PROPERTY_NAME = 'newCsvDjSetsSnapshot'; //Unique Snapshot Property Name
    const REPO_OWNER = 'kaianolevine'; //GitHub Repo Owner
    const REPO_NAME = 'combined-tools-sandbox'; //Github Repo Name
    const EVENT_TYPE = 'new_csv_dj_sets'; //event_type for GitHub 'repository_dispatch'
    const EXCLUDED_FILES = [ // List of files to exclude (can be by name or by ID)
        ""
    ];

    try {
        monitorDriveFolderAndTriggerGitHub(FOLDER_ID, EXCLUDED_FILES, true, SNAPSHOT_PROPERTY_NAME, REPO_OWNER, REPO_NAME, EVENT_TYPE);
    } catch (e) {
        if (e.message.includes("We're sorry")) {
            console.warn("Transient Drive error, skipping this run:", e.message);
            return;
        }
        throw e; // rethrow unexpected errors
    }
}