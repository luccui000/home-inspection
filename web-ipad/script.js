// Reuse most of the web/script.js functionality
// Only need to modify layout-related code

// Update blueprint container size
function updateBlueprintSize() {
  const blueprintContainer = document.querySelector('.blueprint-container');
  const containerWidth = blueprintContainer.clientWidth;
  const containerHeight = blueprintContainer.clientHeight;
  
  // Set blueprint image size
  const blueprintImage = document.getElementById('blueprint-image');
  blueprintImage.style.maxWidth = `${containerWidth}px`;
  blueprintImage.style.maxHeight = `${containerHeight}px`;
  
  // Update zoom controls position
  const zoomControls = document.querySelector('.zoom-controls');
  zoomControls.style.top = '16px';
  zoomControls.style.right = '16px';
}

// Update on window resize
window.addEventListener('resize', updateBlueprintSize);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Call original initialization code from web/script.js
  loadChecklist();
  setupShapeButtons();
  setupShapeButtonEvents();
  initDirection();
  setupPartFilters();
  updateDetailFilters();
  setupDirectionButtons();
  setupBlueprintInteractions();
  setupCameraButton();
  addPhotoHistoryButton();
  updateProgress();
  
  // Update layout for iPad
  updateBlueprintSize();
  
  // Adjust checklist height
  const checklistContainer = document.querySelector('.checklist-container');
  const progressContainer = document.querySelector('.progress-container');
  const checklistHeight = window.innerHeight - progressContainer.offsetHeight - 48;
  checklistContainer.style.height = `${checklistHeight}px`;
});

// Keep all other functions from web/script.js unchanged
