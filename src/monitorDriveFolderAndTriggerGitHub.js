function monitorDriveFolderAndTriggerGitHub(folderId, snapshotPropertyName, repoOwner, repoName, eventType) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const props = PropertiesService.getScriptProperties();
  const previousSnapshot = JSON.parse(props.getProperty(snapshotPropertyName) || '{}');
  const currentSnapshot = {};

  let changed = false;

  while (files.hasNext()) {
    const file = files.next();
    const id = file.getId();
    const modTime = file.getLastUpdated().getTime();
    const size = file.getSize();

    currentSnapshot[id] = { modTime, size };

    if (
      !previousSnapshot[id] ||
      previousSnapshot[id].modTime !== modTime ||
      previousSnapshot[id].size !== size
    ) {
      changed = true;
    }
  }

  // Check for removed files
  for (let id in previousSnapshot) {
    if (!currentSnapshot[id]) changed = true;
  }

  if (changed) {
    const folderName = folder.getName();
    Logger.log(`🟡 Change detected in folder "${folderName}" — triggering GitHub Action...`);
    triggerGitHubAction(repoOwner, repoName, eventType);
    props.setProperty(snapshotPropertyName, JSON.stringify(currentSnapshot));
  } else {
    Logger.log('✅ No changes.');
  }
}