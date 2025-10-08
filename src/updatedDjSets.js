function updatedDjSets() {
    const FOLDER_ID = '1A0tKQ2DBXI1Bt9h--olFwnBNne3am-rL'; // Google Drive folder ID to monitor
    const SNAPSHOT_PROPERTY_NAME = 'newCsvDjSetsSnapshot'; //Unique Snapshot Property Name
    const REPO_OWNER = 'kaianolevine'; //GitHub Repo Owner
    const REPO_NAME = 'combined-tools-sandbox'; //Github Repo Name
    const EVENT_TYPE = 'new_csv_dj_sets'; //event_type for GitHub 'repository_dispatch'
    const EXCLUDED_FILES = [ // List of files to exclude (can be by name or by ID)
        "1DPAfsNqOBGw6pFNCt_Y5rVAv3WGv0vzmrxw1Cw9AdHg"   // DJ Set Collection
    ];
    monitorDriveFolderAndTriggerGitHub(FOLDER_ID, EXCLUDED_FILES, true, SNAPSHOT_PROPERTY_NAME, REPO_OWNER, REPO_NAME, EVENT_TYPE);
}