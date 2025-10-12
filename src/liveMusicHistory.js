function vdjMusicHistory() {
    const FOLDER_ID = '1FzuuO3xmL2n-8pZ_B-FyrvGWaLxLED3o'; // Google Drive folder ID to monitor
    const SNAPSHOT_PROPERTY_NAME = 'vdjHistorySnapshot'; //Unique Snapshot Property Name
    const REPO_OWNER = 'kaianolevine'; //GitHub Repo Owner
    const REPO_NAME = 'combined-tools-sandbox'; //Github Repo Name
    const EVENT_TYPE = 'vdj_history'; //event_type for GitHub 'repository_dispatch'
    const EXCLUDED_FILES = [ // List of files to exclude (can be by name or by ID)
        ""
    ];
    monitorDriveFolderAndTriggerGitHub(FOLDER_ID, EXCLUDED_FILES, false, SNAPSHOT_PROPERTY_NAME, REPO_OWNER, REPO_NAME, EVENT_TYPE);
}