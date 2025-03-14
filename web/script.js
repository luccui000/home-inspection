// Constants
const DIRECTIONS = [
  { id: 'north', name: '北', icon: 'arrow_upward' },
  { id: 'east', name: '東', icon: 'arrow_forward' },
  { id: 'south', name: '南', icon: 'arrow_downward' },
  { id: 'west', name: '西', icon: 'arrow_back' }
];

const HOUSE_PARTS = [
  { id: 'roof', name: '屋根', icon: 'roofing' },
  { id: 'walls', name: '壁', icon: 'wall' },
  { id: 'foundation', name: '基礎', icon: 'foundation' }
];

const DETAIL_TYPES = [
  { id: 'paint', name: '塗装', icon: 'format_paint' },
  { id: 'material', name: '材料', icon: 'construction' },
  { id: 'structure', name: '構造', icon: 'architecture' },
  { id: 'window', name: '窓', icon: 'window' },
  { id: 'door', name: 'ドア', icon: 'door_front' }
];

// State
let selectedDirection = 'north';
let selectedPart = '';
let selectedDetails = [];
let checklist = [];
let zoomLevel = 1;
let panOffset = { x: 0, y: 0 };
let pinnedIcons = [];

// DOM Elements
const blueprintImage = document.getElementById('blueprint-image');
const blueprintContainer = document.querySelector('.blueprint-container');
const checklistContainer = document.getElementById('checklist');
const progressBar = document.getElementById('progress-bar');
const completedItemsEl = document.getElementById('completed-items');
const totalItemsEl = document.getElementById('total-items');
const progressPercentageEl = document.getElementById('progress-percentage');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize
  loadChecklist();
  setupDirectionButtons();
  setupBlueprintInteractions();
  updateProgress();
});

function setupDirectionButtons() {
  const directionButtons = document.querySelectorAll('.direction-button');
  directionButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectedDirection = button.dataset.direction;
      updateBlueprintImage();
      updateDirectionButtons();
      updateChecklist();
    });
  });
}

function setupBlueprintInteractions() {
  const zoomInButton = document.getElementById('zoom-in');
  const zoomOutButton = document.getElementById('zoom-out');
  
  zoomInButton.addEventListener('click', () => {
    if (zoomLevel < 3) {
      zoomLevel += 0.25;
      updateBlueprintTransform();
    }
  });

  zoomOutButton.addEventListener('click', () => {
    if (zoomLevel > 1) {
      zoomLevel -= 0.25;
      updateBlueprintTransform();
    }
  });

  blueprintContainer.addEventListener('click', handleBlueprintClick);
}

function updateBlueprintImage() {
  blueprintImage.src = `assets/images/${selectedDirection}-blueprint.jpg`;
}

function updateBlueprintTransform() {
  const imageContainer = document.querySelector('.blueprint-image-container');
  imageContainer.style.transform = `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`;
}

function handleBlueprintClick(event) {
  const rect = blueprintContainer.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Add icon logic here
  console.log('Clicked at:', x, y);
}

function loadChecklist() {
  // Load checklist data
  // This would typically come from an API
  checklist = []; // Initialize with your checklist data
  updateChecklist();
}

function updateChecklist() {
  const filtered = checklist.filter(item => 
    item.direction === selectedDirection &&
    (!selectedPart || item.part === selectedPart) &&
    (selectedDetails.length === 0 || selectedDetails.includes(item.detail))
  );

  checklistContainer.innerHTML = filtered.map(item => `
    <div class="checklist-item">
      <div class="checklist-header">
        <div class="shape-icon"></div>
        <div class="checklist-text">${item.name}</div>
      </div>
      <div class="checklist-actions">
        <button class="action-button check-button">
          <span class="material-icons">check</span>
        </button>
      </div>
    </div>
  `).join('');
}

function updateProgress() {
  const completed = checklist.filter(item => 
    item.status === 'completed' || item.status === 'issue'
  ).length;
  const total = checklist.length;
  const percentage = Math.round((completed / total) * 100);

  completedItemsEl.textContent = completed;
  totalItemsEl.textContent = total;
  progressPercentageEl.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
}

function updateDirectionButtons() {
  const directionButtons = document.querySelectorAll('.direction-button');
  directionButtons.forEach(button => {
    if (button.dataset.direction === selectedDirection) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}
