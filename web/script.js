// Constants
const DIRECTIONS = [
  { id: 'north', name: '北', icon: 'arrow_upward' },
  { id: 'east', name: '東', icon: 'arrow_forward' },
  { id: 'south', name: '南', icon: 'arrow_downward' },
  { id: 'west', name: '西', icon: 'arrow_back' },
];

const HOUSE_PARTS = [
  { id: 'roof', name: '屋根', icon: 'roofing' },
  { id: 'walls', name: '壁', icon: 'wall' },
  { id: 'foundation', name: '基礎', icon: 'foundation' },
];

const DETAIL_TYPES = [
  { id: 'paint', name: '塗装', icon: 'format_paint' },
  { id: 'material', name: '材料', icon: 'construction' },
  { id: 'structure', name: '構造', icon: 'architecture' },
  { id: 'window', name: '窓', icon: 'window' },
  { id: 'door', name: 'ドア', icon: 'door_front' },
];
let checklist = [];

// State
let selectedDirection = 'north';
let selectedPart = '';
let selectedDetails = [];
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
  directionButtons.forEach((button) => {
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
  checklist = [
    {
      id: 1,
      name: '北側壁面の塗装付着性の確認',
      part: 'walls',
      detail: 'paint',
      direction: 'north',
      status: 'pending',
      photos: [],
    },
    {
      id: 2,
      name: '壁のカビの兆候の確認',
      part: 'walls',
      detail: 'material',
      direction: 'north',
      status: 'pending',
      photos: [],
    },
    {
      id: 3,
      name: '北側窓の漏れの確認',
      part: 'walls',
      detail: 'window',
      direction: 'north',
      status: 'pending',
      photos: [],
    },
    {
      id: 4,
      name: '玄関ドアの密閉性の確認',
      part: 'walls',
      detail: 'door',
      direction: 'north',
      status: 'pending',
      photos: [],
    },
    {
      id: 5,
      name: '北側屋根の排水システムの確認',
      part: 'roof',
      detail: 'structure',
      direction: 'north',
      status: 'pending',
      photos: [],
    },
    {
      id: 6,
      name: '北側基礎の安定性の確認',
      part: 'foundation',
      detail: 'structure',
      direction: 'north',
      status: 'pending',
      photos: [],
    },
    {
      id: 7,
      name: '北側壁のひび割れの確認',
      part: 'walls',
      detail: 'structure',
      direction: 'north',
      status: 'pending',
      photos: [],
    },
    {
      id: 8,
      name: '北側壁の湿気レベルの確認',
      part: 'walls',
      detail: 'material',
      direction: 'north',
      status: 'pending',
      photos: [],
    },
    {
      id: 9,
      name: '北側屋根の瓦の状態確認',
      part: 'roof',
      detail: 'material',
      direction: 'north',
      status: 'pending',
      photos: [],
    },
    {
      id: 10,
      name: '北側の断熱システムの確認',
      part: 'walls',
      detail: 'structure',
      direction: 'north',
      status: 'pending',
      photos: [],
    },

    // EAST direction items (10 items)
    {
      id: 11,
      name: '東側の塗装の色褪せの確認',
      part: 'walls',
      detail: 'paint',
      direction: 'east',
      status: 'pending',
      photos: [],
    },
    {
      id: 12,
      name: '東側窓ガラスの確認',
      part: 'walls',
      detail: 'window',
      direction: 'east',
      status: 'pending',
      photos: [],
    },
    {
      id: 13,
      name: '東側ドアの耐久性の確認',
      part: 'walls',
      detail: 'door',
      direction: 'east',
      status: 'pending',
      photos: [],
    },
    {
      id: 14,
      name: '東側基礎のひび割れの確認',
      part: 'foundation',
      detail: 'structure',
      direction: 'east',
      status: 'pending',
      photos: [],
    },
    {
      id: 15,
      name: '東側庇の状態確認',
      part: 'roof',
      detail: 'structure',
      direction: 'east',
      status: 'pending',
      photos: [],
    },
    {
      id: 16,
      name: '雨どい排水管の確認',
      part: 'walls',
      detail: 'material',
      direction: 'east',
      status: 'pending',
      photos: [],
    },
    {
      id: 17,
      name: '東側屋根の瓦の状態確認',
      part: 'roof',
      detail: 'material',
      direction: 'east',
      status: 'pending',
      photos: [],
    },
    {
      id: 18,
      name: '東側壁の接合部の確認',
      part: 'walls',
      detail: 'structure',
      direction: 'east',
      status: 'pending',
      photos: [],
    },
    {
      id: 19,
      name: '東側壁の垂直性の確認',
      part: 'walls',
      detail: 'structure',
      direction: 'east',
      status: 'pending',
      photos: [],
    },
    {
      id: 20,
      name: '東側防水システムの確認',
      part: 'foundation',
      detail: 'material',
      direction: 'east',
      status: 'pending',
      photos: [],
    },

    // SOUTH direction items (10 items)
    {
      id: 21,
      name: '南側壁面の塗装剥がれの確認',
      part: 'walls',
      detail: 'paint',
      direction: 'south',
      status: 'pending',
      photos: [],
    },
    {
      id: 22,
      name: '窓の日よけシステムの確認',
      part: 'walls',
      detail: 'window',
      direction: 'south',
      status: 'pending',
      photos: [],
    },
    {
      id: 23,
      name: '南側ドアの断熱性の確認',
      part: 'walls',
      detail: 'door',
      direction: 'south',
      status: 'pending',
      photos: [],
    },
    {
      id: 24,
      name: '基礎の収縮現象の確認',
      part: 'foundation',
      detail: 'structure',
      direction: 'south',
      status: 'pending',
      photos: [],
    },
    {
      id: 25,
      name: '南側屋根の断熱性の確認',
      part: 'roof',
      detail: 'material',
      direction: 'south',
      status: 'pending',
      photos: [],
    },
    {
      id: 26,
      name: 'バルコニードアの状態確認',
      part: 'walls',
      detail: 'door',
      direction: 'south',
      status: 'pending',
      photos: [],
    },
    {
      id: 27,
      name: '壁タイルの品質確認',
      part: 'walls',
      detail: 'material',
      direction: 'south',
      status: 'pending',
      photos: [],
    },
    {
      id: 28,
      name: '屋根の排水能力の確認',
      part: 'roof',
      detail: 'structure',
      direction: 'south',
      status: 'pending',
      photos: [],
    },
    {
      id: 29,
      name: '南側基礎の沈下の確認',
      part: 'foundation',
      detail: 'structure',
      direction: 'south',
      status: 'pending',
      photos: [],
    },
    {
      id: 30,
      name: '基礎周りの水溜りの確認',
      part: 'foundation',
      detail: 'material',
      direction: 'south',
      status: 'pending',
      photos: [],
    },

    // WEST direction items (10 items)
    {
      id: 31,
      name: '西側塗装の耐熱性の確認',
      part: 'walls',
      detail: 'paint',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
    {
      id: 32,
      name: '雨に強い窓の密閉性確認',
      part: 'walls',
      detail: 'window',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
    {
      id: 33,
      name: '西側ドアのゴムパッキンの確認',
      part: 'walls',
      detail: 'door',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
    {
      id: 34,
      name: '西側基礎周りの排水確認',
      part: 'foundation',
      detail: 'structure',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
    {
      id: 35,
      name: '西側屋根材の耐久性確認',
      part: 'roof',
      detail: 'material',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
    {
      id: 36,
      name: '壁の防水性能の確認',
      part: 'walls',
      detail: 'material',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
    {
      id: 37,
      name: '西側屋根の排水システム確認',
      part: 'roof',
      detail: 'structure',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
    {
      id: 38,
      name: '基礎に影響する樹木の確認',
      part: 'foundation',
      detail: 'material',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
    {
      id: 39,
      name: '熱膨張によるひび割れの確認',
      part: 'walls',
      detail: 'structure',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
    {
      id: 40,
      name: '屋根の避雷システムの確認',
      part: 'roof',
      detail: 'structure',
      direction: 'west',
      status: 'pending',
      photos: [],
    },
  ];

  updateChecklist();
}

function updateChecklist() {
  const filtered = checklist.filter(
    (item) =>
      item.direction === selectedDirection &&
      (!selectedPart || item.part === selectedPart) &&
      (selectedDetails.length === 0 || selectedDetails.includes(item.detail))
  );

  checklistContainer.innerHTML = filtered
    .map(
      (item) => `
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
  `
    )
    .join('');
}

function updateProgress() {
  const completed = checklist.filter(
    (item) => item.status === 'completed' || item.status === 'issue'
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
  directionButtons.forEach((button) => {
    if (button.dataset.direction === selectedDirection) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}
