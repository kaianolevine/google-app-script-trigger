function monitorDriveFolderAndTriggerGitHub(folderId, excludedFiles, snapshotPropertyName, repoOwner, repoName, eventType) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const subfolders = folder.getFolders();
  const props = PropertiesService.getScriptProperties();
  const previousSnapshot = JSON.parse(props.getProperty(snapshotPropertyName) || '{}');
  const currentSnapshot = {};

  let changed = false;

  // Track files
  while (files.hasNext()) {
    const file = files.next();
    const id = file.getId();
    const name = file.getName();

    // Skip if file is in the exclusion list
    if (excludeFiles.includes(name) || excludeFiles.includes(id)) {
      continue;
    }

    const modTime = file.getLastUpdated().getTime();
    const size = file.getSize();

    currentSnapshot[id] = { type: 'file', name, modTime, size };

    if (
      !previousSnapshot[id] ||
      previousSnapshot[id].modTime !== modTime ||
      previousSnapshot[id].size !== size
    ) {
      changed = true;
    }
  }

  // Track subfolders
  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    const id = sub.getId();
    const name = sub.getName();

    currentSnapshot[id] = { type: 'folder', name };

    if (!previousSnapshot[id] || previousSnapshot[id].name !== name) {
      changed = true;
    }
  }

  // Check for removed items
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