const $ = (query) => document.getElementById(query);
const $$ = (query) => document.querySelector(query);

// Global state management
const state = {
  selectedDirection: 'north',
  selectedFilters: new Set(),
  selectedDetails: new Set(),
  checklist: [],
  activeChecklistItem: null,
  isDragging: false,
  dragIcon: null,
  longPressTimer: null,
  isDragStarted: false,
  panOffset: { x: 0, y: 0 },
  zoomLevel: 1,
  pinnedIcons: [],
  selectedShape: null,
  dragStartedInTools: false,
};

// Direction mapping
const DIRECTIONS = {
  north: { icon: 'arrow_upward', text: '前面' },
  east: { icon: 'arrow_forward', text: '右側' },
  south: { icon: 'arrow_downward', text: '後面' },
  west: { icon: 'arrow_back', text: '左側' },
};

document.addEventListener('DOMContentLoaded', () => {
  setupDirectionNav();
  setupFilterButtons();
  initializeChecklist();
  updateProgress();

  // Set north as active direction in UI
  const northButton = document.querySelector(
    '.direction-button[data-direction="north"]'
  );
  if (northButton) {
    northButton.classList.add('active');
  }

  // Load filter buttons for north direction
  loadFilterButtons(state.selectedDirection);

  // Update blueprint image for north
  updateBlueprintImage(state.selectedDirection);

  // Update pinned icons visibility
  updateBlueprintIcons();

  // Update checklist based on north direction
  updateChecklist();

  setupShapeButtonEvents();
  setupBlueprintZoom();
});

function getShapeStyle(detail) {
  const color = getShapeColor(detail);
  const shape = getShapeIcon(detail);

  switch (shape) {
    case 'triangle':
      return `border-left: 12px solid transparent; 
              border-right: 12px solid transparent; 
              border-bottom: 24px solid ${color};
              background-color: transparent;`;
    case 'circle':
      return `background-color: ${color};
              border-radius: 50%;`;
    case 'square':
      return `background-color: ${color};
              border-radius: 4px;`;
    default:
      return `background-color: ${color};
              border-radius: 50%;`;
  }
}

function getPartIcon(part) {
  const icons = {
    wall: 'format_paint',
    window: 'window',
    drain: 'water_drop',
  };
  return icons[part] || 'circle';
}

function getPartName(part) {
  const names = {
    wall: '外壁',
    window: '窓',
    drain: '排水',
  };
  return names[part] || part;
}

function getShapeIcon(detail) {
  const shapes = {
    crack: 'circle',
    paint: 'square',
    seal: 'triangle',
  };
  return shapes[detail] || 'circle';
}

function getShapeColor(detail) {
  const colors = {
    crack: 'red',
    paint: '#3b82f6',
    seal: '#84cc16',
  };
  return colors[detail] || '#3b82f6';
}

function initializeChecklist() {
  // Initial checklist data
  state.checklist = checklistItems;
  updateProgress();
}

// Direction Navigation Handler
function setupDirectionNav() {
  const directionButtons = document.querySelectorAll('.direction-button');

  directionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons first
      directionButtons.forEach((button) => {
        button.classList.remove('active');
      });

      // Add active class to clicked button
      btn.classList.add('active');

      // Update selected direction
      const direction = btn.dataset.direction;
      state.selectedDirection = direction;

      updateBlueprintImage(direction);

      // Update filter buttons for new direction
      loadFilterButtons(direction);

      // Update pinned icons visibility
      updateBlueprintIcons();

      // Update checklist items
      updateChecklist();
    });
  });
}

function updateBlueprintImage(direction) {
  const blueprintImage = document.querySelector('#blueprint-image');
  // Update blueprint image based on direction
  blueprintImage.src = `./assets/images/${direction}-blueprint.jpg`;
}

function getFilterButtonsByDirection(direction) {
  // Define filter options for each direction
  const filterMap = {
    north: [
      { id: 'wall', icon: 'format_paint', name: '外壁' },
      { id: 'window', icon: 'window', name: '窓' },
      { id: 'drain', icon: 'water_drop', name: '排水' },
    ],
    east: [
      { id: 'wall', icon: 'format_paint', name: '外壁' },
      { id: 'window', icon: 'window', name: '窓' },
    ],
    south: [
      { id: 'wall', icon: 'format_paint', name: '外壁' },
      { id: 'window', icon: 'window', name: '窓' },
      { id: 'drain', icon: 'water_drop', name: '排水' },
    ],
    west: [
      { id: 'wall', icon: 'format_paint', name: '外壁' },
      { id: 'window', icon: 'window', name: '窓' },
    ],
  };

  const filters = filterMap[direction] || [];

  return filters
    .map(
      (filter) => `
    <button class="filter-button" data-filter="${filter.id}">
      <span>${filter.name}</span>
      <span class="material-icons dropdown-icon">chevron_right</span>
    </button>
  `
    )
    .join('');
}

// Helper function to update single item UI
function updateChecklistItemUI(itemElement, itemData) {
  const checkButton = itemElement.querySelector('.check-button');
  const secondButton = itemElement.querySelector(
    '.close-button, .photo-button'
  );

  // Update check button
  checkButton.classList.toggle('active', itemData.status === 'completed');

  // Update border based on status
  if (itemData.status === 'completed') {
    itemElement.style.borderLeft = '2px solid var(--success-color)';
  } else if (itemData.status === 'issue') {
    itemElement.style.borderLeft = '2px solid var(--error-color)';
  } else {
    itemElement.style.borderLeft = '1px solid var(--border-color)';
  }

  // Update second button
  if (itemData.status === 'completed') {
    secondButton.className = 'action-button photo-button';
    secondButton.innerHTML = '<span class="material-icons">photo_camera</span>';
  } else {
    secondButton.className = 'action-button close-button';
    secondButton.innerHTML = '<span class="material-icons">close</span>';

    // Add active class for issue status
    if (itemData.status === 'issue') {
      secondButton.classList.add('active');
    }
  }
}

// Load filter buttons based on direction
function loadFilterButtons(direction) {
  const filterHTML = getFilterButtonsByDirection(direction);
  const filterNav = document.querySelector('.filter-nav');

  if (!filterNav) return;

  // Reset filter state
  state.selectedDetails.clear();
  state.selectedDetails.add('all');

  // Update filter buttons
  filterNav.innerHTML = filterHTML;

  // Setup filter button handlers
  setupFilterButtons();

  // Close any open dropdown
  const filterDropdown = document.getElementById('filter-dropdown');
  if (filterDropdown) {
    filterDropdown.classList.remove('show');
  }
}

// 2. Fix recursive loop in checklist update
function setupChecklistItemHandlers() {
  document.querySelectorAll('.checklist-item').forEach((item) => {
    const checkButton = item.querySelector('.check-button');
    const secondButton = item.querySelector('.close-button, .photo-button');
    const itemId = parseInt(item.dataset.id);

    // Remove existing listeners to prevent duplicates
    checkButton?.replaceWith(checkButton.cloneNode(true));
    secondButton?.replaceWith(secondButton.cloneNode(true));

    // Get fresh references after replacement
    const newCheckButton = item.querySelector('.check-button');
    const newSecondButton = item.querySelector('.close-button, .photo-button');

    // Add new listeners
    newCheckButton?.addEventListener('click', () => {
      const checklistItem = state.checklist.find((i) => i.id === itemId);
      if (!checklistItem) return;

      checklistItem.status =
        checklistItem.status === 'completed' ? 'pending' : 'completed';

      // Update UI without triggering full checklist update
      updateChecklistItemUI(item, checklistItem);
      updateProgress();
    });

    newSecondButton?.addEventListener('click', () => {
      if (newSecondButton.classList.contains('photo-button')) {
        openCamera(itemId);
      } else {
        item.style.borderLeft = '2px solid var(--error-color)';
        newSecondButton.classList.add('active');
        openIssueModal(itemId);
      }
    });
  });
}

// Handle item completion
function toggleItemComplete(itemId, item, button) {
  const checklistItem = state.checklist.find((i) => i.id === itemId);

  if (!checklistItem) return;

  checklistItem.status =
    checklistItem.status === 'completed' ? 'pending' : 'completed';
  button.classList.toggle('active');
  item.classList.toggle('completed');

  if (checklistItem.status === 'completed') {
    item.style.borderLeft = '4px solid var(--success-color)';
  } else {
    item.style.borderLeft = 'none';
  }

  updateProgress();
}

function updateProgress() {
  const total = state.checklist.length;
  const completed = state.checklist.filter(
    (item) => item.status === 'completed' || item.status === 'issue'
  ).length;
  const completedCount = state.checklist.filter(
    (item) => item.status === 'completed'
  ).length;
  const issues = state.checklist.filter(
    (item) => item.status === 'issue'
  ).length;

  // Update counts
  document.getElementById('total-items').textContent = total;
  document.getElementById('completed-items').textContent = completed;
  document.getElementById('completed-count').textContent = completedCount;
  document.getElementById('issue-count').textContent = issues;

  // Update progress bar
  const percentage = Math.round(((completed + issues) / total) * 100);
  document.getElementById('progress-percentage').textContent = `${percentage}%`;
  document.getElementById('progress-bar').style.width = `${percentage}%`;
}

function openCamera(itemId) {
  // Request camera access
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      const modal = createCameraModal(stream, itemId);
      document.body.appendChild(modal);
    })
    .catch((err) => console.error('Camera access denied:', err));
}

function openIssueModal(itemId) {
  const item = state.checklist.find((i) => i.id === itemId);
  if (!item) return;

  const modal = document.createElement('div');
  modal.className = 'modal issue-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${item.name}</h3>
        <button class="close-modal-button">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="issue-form">
          <textarea 
            placeholder="問題の詳細を入力してください"
            class="issue-description"
          ></textarea>
        </div>

        <div class="issue-photos-section">
          <div class="photos-header">
            <h4>写真一覧</h4>
          </div>
          
          <div class="issue-photos">
            ${
              item.photos?.length
                ? item.photos
                    .map(
                      (photo) => `
                <div class="photo-preview">
                  <img src="${photo.url}" alt="Issue photo">
                  <button class="remove-photo" onclick="removePhoto(${itemId}, '${photo.id}')">
                    <span class="material-icons">close</span>
                  </button>
                </div>
              `
                    )
                    .join('')
                : `<div class="empty-photos" onclick="openCamera(${itemId})">
                <span class="material-icons camera-icon">photo_camera</span>
                <p>写真を追加する</p>
              </div>`
            }
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="cancel-button">キャンセル</button>
        <button class="save-button">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setupIssueModalHandlers(modal, itemId);
  modal.style.display = 'flex';
}

function openPhotoHistory(itemId) {
  const item = state.checklist.find((i) => i.id === itemId);
  if (!item?.photos?.length) return;

  const modal = document.createElement('div');
  modal.className = 'modal photo-history-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>写真履歴</h3>
      <div class="photo-grid">
        ${item.photos
          .map(
            (photo) => `
          <div class="photo-item">
            <img src="${photo.url}" alt="Inspection photo">
            <span class="photo-date">${formatDate(photo.timestamp)}</span>
          </div>
        `
          )
          .join('')}
      </div>
      <button class="close-button">閉じる</button>
    </div>
  `;

  document.body.appendChild(modal);
  setupPhotoHistoryModalHandlers(modal);
}

function getItemIconConfig(part, detail) {
  // Define mapping of part and detail to shape and color
  const iconConfigs = {
    wall: {
      crack: { shape: 'circle', color: '#ef4444' },
      paint: { shape: 'square', color: '#f97316' },
      stain: { shape: 'triangle', color: '#84cc16' },
    },
    window: {
      glass: { shape: 'circle', color: '#3b82f6' },
      frame: { shape: 'square', color: '#8b5cf6' },
      seal: { shape: 'triangle', color: '#84cc16' },
    },
    drain: {
      gutter: { shape: 'circle', color: '#06b6d4' },
      pipe: { shape: 'square', color: '#14b8a6' },
      drain: { shape: 'triangle', color: '#10b981' },
    },
  };

  // Return configuration or default
  return (
    (iconConfigs[part] && iconConfigs[part][detail]) || {
      shape: 'circle',
      color: '#64748b',
    }
  );
}
// Add this after the setupFilterButtons function
function getFilterChips(filter) {
  // Define filter options for each category
  const filterOptions = {
    all: [{ id: 'all', icon: 'grid_view', name: 'すべて' }],
    wall: [
      { id: 'crack', icon: 'dashboard', name: 'ひび割れ' },
      { id: 'paint', icon: 'format_paint', name: '塗装剥がれ' },
      { id: 'stain', icon: 'opacity', name: '汚れ' },
    ],
    window: [
      { id: 'glass', icon: 'window', name: 'ガラス' },
      { id: 'frame', icon: 'crop_square', name: '枠' },
      { id: 'seal', icon: 'border_style', name: 'シール' },
    ],
    drain: [
      { id: 'gutter', icon: 'water_drop', name: '雨どい' },
      { id: 'pipe', icon: 'timeline', name: '配管' },
      { id: 'drain', icon: 'stream', name: '排水口' },
    ],
  };

  const options = filterOptions[filter] || [];

  return options
    .map(
      (option) => `
    <button class="filter-chip" data-detail="${option.id}">
      <span class="material-icons">${option.icon}</span>
      <span>${option.name}</span>
    </button>
  `
    )
    .join('');
}

function setupFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const detail = chip.dataset.detail;

      // Handle multi-selection
      if (detail === 'all') {
        chips.forEach((c) => c.classList.remove('active'));
        state.selectedDetails.clear();
        state.selectedDetails.add('all');
      } else {
        const allChip = document.querySelector(
          '.filter-chip[data-detail="all"]'
        );
        if (allChip) allChip.classList.remove('active');
        state.selectedDetails.delete('all');

        chip.classList.toggle('active');
        if (chip.classList.contains('active')) {
          state.selectedDetails.add(detail);
        } else {
          state.selectedDetails.delete(detail);
        }
      }

      updateChecklist();
    });
  });
}

function updateFilteredItems(selectedDetails) {
  // Filter items based on selected details
  const filteredItems = checklist.filter((item) => {
    if (selectedDetails.includes('all')) return true;
    return selectedDetails.includes(item.detail);
  });

  // Update display
  updateChecklist(filteredItems);
}

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-button');
  const filterDropdown = document.getElementById('filter-dropdown');

  let activeButton = null;

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;

      if (activeButton === button) {
        // Close dropdown if clicking active button
        closeDropdown();
      } else {
        // Open dropdown for new button
        openDropdown(button, filter);
      }
    });
  });

  function openDropdown(button, filter) {
    // Update active states
    if (activeButton) {
      activeButton.classList.remove('active');
    }
    button.classList.add('active');
    activeButton = button;

    // Get filter chips based on selected filter
    const chips = getFilterChips(filter);

    // Update dropdown content
    const container = filterDropdown.querySelector('.filter-chips-container');
    container.innerHTML = chips;

    // Show dropdown
    filterDropdown.classList.add('show');

    // Position dropdown next to active button
    const buttonRect = button.getBoundingClientRect();
    filterDropdown.style.top = `${buttonRect.top}px`;
    filterDropdown.style.left = `${buttonRect.right + 8}px`;

    // Add chip click handlers
    setupFilterChips();
  }

  function closeDropdown() {
    if (activeButton) {
      activeButton.classList.remove('active');
      activeButton = null;
    }
    filterDropdown.classList.remove('show');
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (
      !e.target.closest('.filter-button') &&
      !e.target.closest('.filter-dropdown')
    ) {
      closeDropdown();
    }
  });
}

function renderChecklist(container, filteredItems = null) {
  // Get items to display
  const itemsToDisplay =
    filteredItems ||
    state.checklist.filter((item) => {
      if (item.direction !== state.selectedDirection) return false;
      if (state.selectedDetails.size > 0) {
        if (state.selectedDetails.has('all')) return true;
        return state.selectedDetails.has(item.detail);
      }
      return true;
    });

  // Group items by part
  const groupedByPart = itemsToDisplay.reduce((groups, item) => {
    if (!groups[item.part]) {
      groups[item.part] = [];
    }
    groups[item.part].push(item);
    return groups;
  }, {});

  // Render grouped items
  container.innerHTML = Object.entries(groupedByPart)
    .map(([part, items]) => renderChecklistGroup(part, items))
    .join('');
}

// 3. Optimize state updates
function updateChecklist(filteredItems = null) {
  const container = document.querySelector('.checklist');
  if (!container) return;

  // Render checklist without setting up handlers
  renderChecklist(container, filteredItems);

  // Set up handlers once after rendering
  setupChecklistItemHandlers();

  // Update progress once
  updateProgress();
}

// Helper function to render checklist group
function renderChecklistGroup(part, items) {
  return `
    <div class="checklist-group">
      <div class="checklist-subtitle-container">
        <span class="material-icons">${getPartIcon(part)}</span>
        <span class="checklist-subtitle">${getPartName(part)}</span>
        <div class="completion-count-container">
          <span class="completion-count">
            ${items.filter((item) => item.status === 'completed').length}/${
    items.length
  }
          </span>
        </div>
      </div>
      ${items.map((item) => renderChecklistItem(item)).join('')}
    </div>
  `;
}

// Helper function to render checklist item
function renderChecklistItem(item) {
  return `
    <div class="checklist-item ${item.status}" data-id="${item.id}">
      <div class="checklist-header">
        <div class="shape-icon ${getShapeIcon(item.detail)}" 
             style="${getShapeStyle(item.detail)}">
        </div>
        <div class="checklist-text">${item.name}</div>
        ${
          item.photos.length
            ? `
          <div class="photo-indicator" data-item-id="${item.id}">
            <span class="material-icons">images</span>
            <span class="photo-count">${item.photos.length}</span>
          </div>
        `
            : ''
        }
      </div>
      <div class="checklist-actions">
        <button class="action-button check-button ${
          item.status === 'completed' ? 'active' : ''
        }">
          <span class="material-icons">check</span>
        </button>
        <button class="action-button ${
          item.status === 'completed' ? 'photo-button' : 'close-button'
        }">
          <span class="material-icons">${
            item.status === 'completed' ? 'photo_camera' : 'close'
          }</span>
        </button>
      </div>
    </div>
  `;
}

function createCameraModal(stream, itemId) {
  const modal = document.createElement('div');
  modal.className = 'modal camera-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="camera-container">
        <video id="camera-preview" autoplay playsinline></video>
        <canvas id="photo-canvas" style="display: none;"></canvas>
        
        <div class="camera-controls">
          <button class="close-button">
            <span class="material-icons">close</span>
          </button>
          
          <button class="capture-button">
            <span class="material-icons">photo_camera</span>
          </button>
          
          <button class="retake-button" style="display: none;">
            <span class="material-icons">replay</span>
          </button>
          
          <button class="save-button" style="display: none;">
            <span class="material-icons">check</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const video = modal.querySelector('#camera-preview');
  const canvas = modal.querySelector('#photo-canvas');
  const captureBtn = modal.querySelector('.capture-button');
  const retakeBtn = modal.querySelector('.retake-button');
  const saveBtn = modal.querySelector('.save-button');
  const closeBtn = modal.querySelector('.close-button');

  // Set up video stream
  video.srcObject = stream;

  // Handle capture
  captureBtn.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    // Show preview
    video.style.display = 'none';
    canvas.style.display = 'block';

    // Update controls
    captureBtn.style.display = 'none';
    retakeBtn.style.display = 'block';
    saveBtn.style.display = 'block';
  });

  // Handle retake
  retakeBtn.addEventListener('click', () => {
    video.style.display = 'block';
    canvas.style.display = 'none';

    captureBtn.style.display = 'block';
    retakeBtn.style.display = 'none';
    saveBtn.style.display = 'none';
  });

  // Handle save
  saveBtn.addEventListener('click', () => {
    canvas.toBlob(
      (blob) => {
        const photoUrl = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString();

        // Find and update checklist item
        const item = state.checklist.find((i) => i.id === parseInt(itemId));
        if (item) {
          item.photos.push({
            url: photoUrl,
            timestamp: timestamp,
            blob: blob,
          });
        }

        // Close modal and cleanup
        closeModal();
        updateChecklist();
      },
      'image/jpeg',
      0.8
    );
  });

  // Handle close
  closeBtn.addEventListener('click', closeModal);

  function closeModal() {
    stream.getTracks().forEach((track) => track.stop());
    modal.remove();
  }

  return modal;
}

function setupShapeButtonEvents() {
  const shapeButtons = document.querySelectorAll('.shape-button');
  const shapeTools = document.querySelector('.shape-tools');
  const blueprint = document.querySelector('.blueprint-image-container');

  let isDragging = false;

  shapeButtons.forEach((button) => {
    // Add mouse/touch events for dragging
    let isDragging = false;
    let startX, startY;

    // Handle touch start
    button.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;

        const toolsRect = shapeTools.getBoundingClientRect();
        state.dragStartedInTools =
          touch.clientX >= toolsRect.left &&
          touch.clientX <= toolsRect.right &&
          touch.clientY >= toolsRect.top &&
          touch.clientY <= toolsRect.bottom;

        // Start drag after long press
        state.longPressTimer = setTimeout(() => {
          isDragging = true;
          state.selectedShape = {
            shape: button.dataset.shape,
            color: button.dataset.color,
          };
          startDrag(e);
        }, 200);
      },
      { passive: false }
    );

    // Handle touch move
    button.addEventListener(
      'touchmove',
      (e) => {
        if (!isDragging) {
          // Cancel long press if moved before timer
          clearTimeout(state.longPressTimer);
          return;
        }
        e.preventDefault();
        handleDrag(e);
      },
      { passive: false }
    );

    // Handle touch end
    button.addEventListener('touchend', (e) => {
      clearTimeout(state.longPressTimer);
      if (isDragging) {
        endDrag(e);
        isDragging = false;
      } else {
        // Handle as normal click if not dragging
        const touch = e.changedTouches[0];
        const moveX = Math.abs(touch.clientX - startX);
        const moveY = Math.abs(touch.clientY - startY);

        // Only trigger click if minimal movement
        if (moveX < 5 && moveY < 5) {
          selectShape(button.dataset.shape, button.dataset.color);
        }
      }
    });

    // Cancel drag on touch cancel
    button.addEventListener('touchcancel', () => {
      clearTimeout(state.longPressTimer);
      if (isDragging) {
        cleanup();
        isDragging = false;
      }
    });
  });
}

function startDrag(e) {
  const touch = e.touches[0];

  // Create drag icon
  state.dragIcon = document.createElement('div');
  state.dragIcon.className = 'dragged-icon';

  // Set initial position
  state.dragIcon.style.cssText = `
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    left: ${touch.clientX}px;
    top: ${touch.clientY}px;
  `;

  // Add shape content
  state.dragIcon.innerHTML = createShapeHTML(state.selectedShape);
  document.body.appendChild(state.dragIcon);

  state.isDragging = true;
}

function handleDrag(e) {
  if (!state.isDragging || !state.dragIcon) return;

  const touch = e.touches[0];

  // Update drag icon position
  state.dragIcon.style.left = `${touch.clientX}px`;
  state.dragIcon.style.top = `${touch.clientY}px`;

  // Check drop zone
  const blueprintContainer = document.querySelector(
    '.blueprint-image-container'
  );
  const rect = blueprintContainer.getBoundingClientRect();

  if (isOverDropZone(touch, rect)) {
    blueprintContainer.classList.add('drop-highlight');
  } else {
    blueprintContainer.classList.remove('drop-highlight');
  }
}

function endDrag(e) {
  if (!state.isDragging) return;

  const touch = e.changedTouches[0];
  const blueprintContainer = document.querySelector(
    '.blueprint-image-container'
  );

  const rect = blueprintContainer.getBoundingClientRect();

  if (isOverDropZone(touch, rect)) {
    // Calculate drop position relative to container
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Add icon at drop position
    addPinnedIcon(x, y);
  }

  cleanup();
}

// Thay đổi từ let selectShape = null thành:
function selectShape(shape, color) {
  // Update selected shape in state
  if (
    state.selectedShape &&
    state.selectedShape.shape === shape &&
    state.selectedShape.color === color
  ) {
    // If clicking the same shape, deselect it
    state.selectedShape = null;
  } else {
    // Select new shape
    state.selectedShape = { shape, color };
  }

  // Update UI
  updateShapeButtons();
}

function cleanup() {
  state.isDragging = false;
  if (state.dragIcon) {
    state.dragIcon.remove();
    state.dragIcon = null;
  }

  const blueprintContainer = document.querySelector(
    '.blueprint-image-container'
  );
  blueprintContainer.classList.remove('drop-highlight');
}

function addPinnedIcon(x, y) {
  // Create new icon with hasIssue flag
  const blueprint = document.querySelector('#blueprint-image');
  const blueprintRect = blueprint.getBoundingClientRect();
  const centerX = blueprintRect.width / 2;
  const centerY = blueprintRect.height / 2;
  const currentScale = state.zoomLevel || 1;

  // Store unscaled coordinates
  const originalX = centerX + (x - centerX) / currentScale;
  const originalY = centerY + (y - centerY) / currentScale;

  // Create new icon with selected shape
  const newIcon = {
    id: Date.now().toString(),
    shape: state.selectedShape.shape,
    color: state.selectedShape.color,
    x: originalX,
    y: originalY,
    direction: state.selectedDirection,
    hasIssue: false,
  };

  // Add to pinned icons list
  state.pinnedIcons.push(newIcon);

  // Find matching checklist item for this shape and color
  const matchingItem = state.checklist.find((item) => {
    const iconConfig = getItemIconConfig(item.part, item.detail);
    return (
      iconConfig.shape === state.selectedShape.shape &&
      iconConfig.color === state.selectedShape.color
    );
  });

  // If we found a matching item
  if (matchingItem) {
    console.log('Found matching item:', matchingItem);

    // Initialize pinnedIcons array if needed
    if (!matchingItem.pinnedIcons) {
      matchingItem.pinnedIcons = [];
    }

    // Link icon to checklist item
    matchingItem.pinnedIcons.push(newIcon.id);

    // Mark icon as having issue
    newIcon.hasIssue = true;

    // Update the UI to show the issue indicator
    updateBlueprintIcons();

    // Ensure modal opens with a slight delay to allow UI to update
    setTimeout(() => {
      console.log('Opening modal for item ID:', matchingItem.id);
      openIssueModal(matchingItem.id);
    }, 100);
  } else {
    console.log('No matching item found for shape:', state.selectedShape);
    updateBlueprintIcons();
  }
}

function createShapeHTML({ shape, color }) {
  switch (shape) {
    case 'circle':
      return `<div class="circle-shape" style="background-color: ${color}; width: 24px; height: 24px;"></div>`;
    case 'triangle':
      return `<div class="triangle-shape" style="border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 24px solid ${color};"></div>`;
    case 'square':
      return `<div class="square-shape" style="background-color: ${color}; width: 24px; height: 24px;"></div>`;
    default:
      return '';
  }
}

function isOverDropZone(touch, rect) {
  return (
    touch.clientX >= rect.left &&
    touch.clientX <= rect.right &&
    touch.clientY >= rect.top &&
    touch.clientY <= rect.bottom
  );
}

function setupBlueprintZoom() {
  const container = document.querySelector('.blueprint-container');
  const blueprint = document.querySelector('#blueprint-image');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');

  if (!container || !blueprint || !zoomInBtn || !zoomOutBtn) return;

  const ZOOM_STEP = 0.2;
  const MAX_ZOOM = 3;
  const MIN_ZOOM = 1;

  let currentScale = 1;

  function updateZoom(newScale) {
    currentScale = newScale;
    state.zoomLevel = currentScale;

    // Update blueprint scale
    blueprint.style.transform = `scale(${currentScale})`;

    // Update pinned icons positions
    const icons = document.querySelectorAll('.pinned-icon');
    const containerRect = container.getBoundingClientRect();
    const blueprintRect = blueprint.getBoundingClientRect();

    icons.forEach((icon) => {
      const originalX = parseFloat(icon.dataset.originalX);
      const originalY = parseFloat(icon.dataset.originalY);

      // Calculate position relative to blueprint center
      const centerX = blueprintRect.width / 2;
      const centerY = blueprintRect.height / 2;

      // Apply scale from center
      const scaledX = centerX + (originalX - centerX) * currentScale;
      const scaledY = centerY + (originalY - centerY) * currentScale;

      icon.style.transform = `translate(${scaledX}px, ${scaledY}px) scale(${currentScale})`;
    });

    // Update button states
    zoomInBtn.disabled = currentScale >= MAX_ZOOM;
    zoomOutBtn.disabled = currentScale <= MIN_ZOOM;
  }

  // Zoom button handlers
  zoomInBtn.addEventListener('click', () => {
    const newScale = Math.min(currentScale + ZOOM_STEP, MAX_ZOOM);
    if (newScale !== currentScale) {
      updateZoom(newScale);
    }
  });

  zoomOutBtn.addEventListener('click', () => {
    const newScale = Math.max(currentScale - ZOOM_STEP, MIN_ZOOM);
    if (newScale !== currentScale) {
      updateZoom(newScale);
    }
  });
}

// 1. Remove duplicate updateBlueprintIcons and consolidate into one function
function updateBlueprintIcons() {
  const container = document.querySelector('.pinned-icons-container');
  if (!container) return;

  const blueprintImage = document.querySelector('#blueprint-image');
  const currentScale = parseFloat(
    blueprintImage.style.transform?.match(/scale\((.*?)\)/)?.[1] || 1
  );
  const blueprintRect = blueprintImage.getBoundingClientRect();
  const centerX = blueprintRect.width / 2;
  const centerY = blueprintRect.height / 2;

  const visibleIcons = state.pinnedIcons.filter(
    (icon) => icon.direction === state.selectedDirection
  );

  container.innerHTML = visibleIcons
    .map(
      (icon) => `
    <div class="pinned-icon ${icon.hasIssue ? 'has-issue' : ''}" 
         data-id="${icon.id}"
         data-original-x="${icon.x}"
         data-original-y="${icon.y}"
         style="position: absolute;
                transform: translate(${
                  centerX + (icon.x - centerX) * currentScale
                }px, 
                                  ${
                                    centerY + (icon.y - centerY) * currentScale
                                  }px) 
                         scale(${currentScale});">
      <div class="icon-shape ${icon.shape}-shape"
           style="${getShapeCSSByType(icon)}">
      </div>
      ${
        icon.hasIssue
          ? `
        <span class="issue-indicator">
          <span class="material-icons">error</span>
        </span>
      `
          : ''
      }
    </div>
  `
    )
    .join('');

  setupPinnedIconEvents();
}

// Helper function to calculate distance between two touch points
function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getShapeCSSByType(icon) {
  switch (icon.shape) {
    case 'circle':
      return `background-color: ${icon.color}; 
              border-radius: 50%;`;
    case 'triangle':
      return `border-left: 12px solid transparent;
              border-right: 12px solid transparent;
              border-bottom: 24px solid ${icon.color};
              background-color: transparent;`;
    case 'square':
      return `background-color: ${icon.color};`;
    default:
      return '';
  }
}

function setupPinnedIconEvents() {
  const pinnedIcons = document.querySelectorAll('.pinned-icon');

  pinnedIcons.forEach((icon) => {
    // Long press to delete
    let longPressTimer;

    icon.addEventListener('touchstart', () => {
      longPressTimer = setTimeout(() => {
        showDeleteConfirm(icon);
      }, 800);
    });

    icon.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
    });

    // Click to show issue/details
    icon.addEventListener('click', () => {
      const iconId = icon.dataset.id;
      const iconData = state.pinnedIcons.find((i) => i.id === iconId);
      if (iconData) {
        showIconDetails(iconData);
      }
    });
  });
}

function showDeleteConfirm(icon) {
  const iconId = icon.dataset.id;

  const confirm = document.createElement('div');
  confirm.className = 'delete-confirm';
  confirm.innerHTML = `
    <p>このマーカーを削除しますか？</p>
    <div class="confirm-actions">
      <button class="cancel-button">キャンセル</button>
      <button class="delete-button">削除</button>
    </div>
  `;

  confirm.querySelector('.cancel-button').onclick = () => confirm.remove();
  confirm.querySelector('.delete-button').onclick = () => {
    // Remove from state
    state.pinnedIcons = state.pinnedIcons.filter((i) => i.id !== iconId);

    // Remove from checklist items
    state.checklist.forEach((item) => {
      if (item.pinnedIcons) {
        item.pinnedIcons = item.pinnedIcons.filter((i) => i !== iconId);
      }
    });

    // Update display
    updateBlueprintIcons();
    confirm.remove();
  };

  document.body.appendChild(confirm);
}

function showIconDetails(iconData) {
  // Find associated checklist item
  const item = state.checklist.find(
    (i) => i.pinnedIcons && i.pinnedIcons.includes(iconData.id)
  );

  if (item) {
    openIssueModal(item);
  }
}

function updateShapeButtons() {
  const shapeButtons = document.querySelectorAll('.shape-button');

  shapeButtons.forEach((button) => {
    // Reset all buttons
    button.classList.remove('active');

    // Check if this button matches selected shape
    if (
      state.selectedShape &&
      button.dataset.shape === state.selectedShape.shape &&
      button.dataset.color === state.selectedShape.color
    ) {
      button.classList.add('active');
    }
  });

  // Update cursor on blueprint container
  const blueprintContainer = document.querySelector(
    '.blueprint-image-container'
  );
  if (state.selectedShape) {
    blueprintContainer.classList.add('shape-selected');
    blueprintContainer.style.cursor = 'crosshair';
  } else {
    blueprintContainer.classList.remove('shape-selected');
    blueprintContainer.style.cursor = 'default';
  }
}

function setupIssueModalHandlers(modal, itemId) {
  const item = state.checklist.find((i) => i.id === parseInt(itemId));
  if (!item) return;

  // Store original values to handle cancel
  const originalDescription = item.description || '';
  item.status = 'issue';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${item.name}</h3>
        <button class="close-modal-button">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="issue-form">
          <textarea 
            placeholder="問題の詳細を入力してください"
            class="issue-description"
          >${originalDescription}</textarea>
        </div>

        <div class="issue-photos-section">
          <div class="photos-header">
            <h4>写真一覧</h4>
          </div>
          
          <div class="issue-photos">
            ${
              item.photos?.length
                ? item.photos
                    .map(
                      (photo) => `
                <div class="photo-preview">
                  <img src="${photo.url}" alt="Issue photo">
                  <button class="remove-photo" onclick="removePhoto(${itemId}, '${photo.id}')">
                    <span class="material-icons">close</span>
                  </button>
                </div>
              `
                    )
                    .join('')
                : `<div class="empty-photos" onclick="showCameraConfirm(${itemId})">
                <span class="material-icons camera-icon">photo_camera</span>
                <p>写真を追加する</p>
              </div>`
            }
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="cancel-button">キャンセル</button>
        <button class="save-button">保存</button>
      </div>
    </div>
  `;

  const textarea = modal.querySelector('.issue-description');
  const cancelButton = modal.querySelector('.cancel-button');
  const saveButton = modal.querySelector('.save-button');
  const closeButton = modal.querySelector('.close-modal-button');

  // Handle cancel - restore original values
  cancelButton.onclick = () => {
    item.description = originalDescription;

    // Update UI with original state
    updateChecklistItemUI(
      document.querySelector(`[data-id="${itemId}"]`),
      item
    );

    modal.remove();
  };

  // Handle close button same as cancel
  closeButton.onclick = cancelButton.onclick;

  // Handle save - update with new values
  saveButton.onclick = () => {
    const newDescription = textarea.value.trim();

    item.description = newDescription;
    item.status = 'issue';

    // Update UI with new state
    const checklistItem = document.querySelector(`[data-id="${itemId}"]`);
    if (checklistItem) {
      updateChecklistItemUI(checklistItem, item);
      updateProgress();
    }

    modal.remove();
  };

  document.body.appendChild(modal);
  modal.style.display = 'flex';

  // Focus textarea
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function showCameraConfirm(itemId) {
  const confirm = document.createElement('div');
  confirm.className = 'modal camera-confirm-modal';

  confirm.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>カメラへのアクセス</h3>
      </div>
      <div class="modal-body">
        <p>写真を撮影するためにカメラを使用します。</p>
        <p>カメラの使用を許可してください。</p>
      </div>
      <div class="modal-actions">
        <button class="cancel-button">キャンセル</button>
        <button class="confirm-button">OK</button>
      </div>
    </div>
  `;

  // Handle cancel
  confirm.querySelector('.cancel-button').onclick = () => {
    confirm.remove();
  };

  // Handle confirm
  confirm.querySelector('.confirm-button').onclick = () => {
    confirm.remove();
    openCamera(itemId);
  };

  document.body.appendChild(confirm);
  confirm.style.display = 'flex';
}

// Update openCamera function
function openCamera(itemId) {
  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: 'environment', // Use back camera
      },
    })
    .then((stream) => {
      const modal = createCameraModal(stream, itemId);
      document.body.appendChild(modal);
    })
    .catch((err) => {
      console.error('Camera access denied:', err);
      showCameraError();
    });
}

// Add error handling
function showCameraError() {
  const error = document.createElement('div');
  error.className = 'modal camera-error-modal';

  error.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>エラー</h3>
      </div>
      <div class="modal-body">
        <p>カメラにアクセスできません。</p>
        <p>カメラの許可設定を確認してください。</p>
      </div>
      <div class="modal-actions">
        <button class="close-button">閉じる</button>
      </div>
    </div>
  `;

  error.querySelector('.close-button').onclick = () => {
    error.remove();
  };

  document.body.appendChild(error);
  error.style.display = 'flex';
}
