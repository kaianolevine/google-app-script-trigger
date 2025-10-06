function setupTriggers() {
  // Remove existing triggers for safety
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // Example: run `main` every 5 minutes
  ScriptApp.newTrigger("main")
    .timeBased()
    .everyMinutes(30)
    .create();
}

function main() {
  Logger.log("⏰ Trigger fired!");
}