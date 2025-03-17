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

let checklist = checklistItems;

// State
let selectedDirection = 'north';
let selectedShape = null;
let isDragging = false;
let dragIcon = null;
let selectedPart = '';
let selectedDetails = [];
let zoomLevel = 1;
let panOffset = { x: 0, y: 0 };
let pinnedIcons = [];
let longPressTimer;
let isDragStarted = false;
// Thêm vào phần đầu của file script.js với các biến trạng thái
let photoHistory = {
  north: [],
  east: [],
  south: [],
  west: [],
};
let selectedFilter = 'all';
// State variables

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
  loadChecklist();
  // Initialize
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.shape-button, .pinned-icon, .blueprint-container')) {
      e.preventDefault();
      return false;
    }
  });

  // Ngăn chặn việc cuộn trang khi đang kéo thả
  document.addEventListener(
    'touchmove',
    (e) => {
      if (isDragging) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Set default direction to north
  selectedDirection = 'north';

  // Update direction buttons UI
  updateDirectionButtons();
  setupDirectionButtons();

  // Setup part filters
  setupPartFiltersForDirection();

  // Update blueprint image
  updateBlueprintImage();

  // Initialize other components
  setupShapeButtons();
  setupShapeButtonEvents();
  updateChecklist();
  updateProgress();
  updatePhotoHistoryButton();

  setupDropdownPartFilter();
});

// Get unique details for a part and direction
function getDetailsForPart(part) {
  console.log(
    'Getting details for part:',
    part,
    'and direction:',
    selectedDirection
  );

  // Ensure checklist is loaded
  if (!checklist || checklist.length === 0) {
    console.error('Checklist is empty or not loaded yet');
    return [];
  }

  // Filter by current direction first
  const itemsInDirection = checklist.filter(
    (item) => item.direction === selectedDirection
  );
  console.log('Items in direction:', itemsInDirection);

  let details = [];

  if (part === 'all') {
    // If "all" parts selected, return all unique details for current direction
    details = [...new Set(itemsInDirection.map((item) => item.detail))];
  } else {
    // Return unique details for selected part and current direction
    details = [
      ...new Set(
        itemsInDirection
          .filter((item) => item.part === part)
          .map((item) => item.detail)
      ),
    ];
  }

  console.log('Details found:', details);
  return details;
}

// In setupPartFilters function
function setupPartFilters() {
  const filterButtons = document.querySelectorAll(
    '.part-filter-buttons .filter-button'
  );
  const detailDropdown = document.getElementById('detail-filter-dropdown');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Check if button has dropdown
      const hasDropdown = button.querySelector('.dropdown-icon');

      // Update active state
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Update selected part
      selectedPart = button.dataset.part;

      // Update detail filters
      updateDetailFilters();

      // Show detail filter dropdown if button has dropdown
      if (hasDropdown) {
        // Add sliding animation
        if (detailDropdown.classList.contains('open')) {
          // If already open, close and reopen with new content
          detailDropdown.classList.remove('open');
          setTimeout(() => {
            detailDropdown.classList.add('open');
          }, 10);
        } else {
          detailDropdown.classList.add('open');
        }
      } else {
        // Hide dropdown if no details
        detailDropdown.classList.remove('open');
      }

      // Update checklist
      updateChecklist();
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (
      !e.target.closest('.part-filter-buttons') &&
      !e.target.closest('.detail-filter-dropdown')
    ) {
      detailDropdown.classList.remove('open');
    }
  });
}

function setupDetailFilters() {
  const filterChips = document.querySelectorAll('.filter-chip');

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const detail = chip.dataset.detail;

      if (detail === 'all') {
        // If "all" is clicked, clear other selections
        selectedDetails = [];
        filterChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
      } else {
        // Remove 'all' selection if exists
        const allChip = document.querySelector(
          '.filter-chip[data-detail="all"]'
        );
        if (allChip) allChip.classList.remove('active');

        // Toggle selection
        const detailIndex = selectedDetails.indexOf(detail);
        if (detailIndex === -1) {
          // Add new detail
          selectedDetails.push(detail);
          chip.classList.add('active');
        } else {
          // Remove detail
          selectedDetails.splice(detailIndex, 1);
          chip.classList.remove('active');

          // If no details selected, activate 'all'
          if (selectedDetails.length === 0 && allChip) {
            allChip.classList.add('active');
          }
        }
      }

      // Update checklist with selected details
      updateChecklist();
    });
  });
}

// Update Detail Filters
function updateDetailFilters() {
  const detailFilters = document.getElementById('detail-filters');
  const detailDropdown = document.getElementById('detail-filter-dropdown');

  if (!detailFilters) return;

  // Get details for selected part & direction
  const details = getDetailsForPart(selectedPart);

  if (details.length === 0) {
    // If no details, hide dropdown
    detailDropdown.classList.remove('open');
    return;
  }

  // Create filter chips
  const filterChips = ` 
    ${details
      .map((detail) => {
        const detailInfo = DETAIL_TYPES.find((d) => d.id === detail) || {
          id: detail,
          name: detail,
          icon: 'circle',
        };
        return `
        <button class="filter-chip" data-detail="${detail}">
          <span class="material-icons">${detailInfo.icon}</span>
          <span>${detailInfo.name}</span>
        </button>
      `;
      })
      .join('')}
  `;

  // Update HTML
  detailFilters.innerHTML = filterChips;

  // Reset selected details
  selectedDetails = [];

  // Setup detail filter click handlers
  setupDetailFilters();
}

// Get unique parts for current direction
function getPartsForDirection() {
  return [
    ...new Set(
      checklist
        .filter((item) => item.direction === selectedDirection)
        .map((item) => item.part)
    ),
  ];
}

// Update vertical part filters for current direction
// Update vertical part filters for current direction
function setupPartFiltersForDirection() {
  const filterContainer = document.getElementById('part-filters');
  if (!filterContainer) {
    console.error('Part filters container not found');
    return;
  }

  // Get parts for current direction
  const availableParts = getPartsForDirection();

  // Always include "all" option
  const buttonHTML = ` 
    ${availableParts
      .map((part) => {
        const partInfo = HOUSE_PARTS.find((p) => p.id === part) || {
          id: part,
          name: part,
          icon: 'category',
        };

        // Check if this part has details
        const hasDetails = checklist.some(
          (item) => item.direction === selectedDirection && item.part === part
        );

        // Add dropdown icon if has details
        const dropdownIcon = hasDetails
          ? `<span class="material-icons dropdown-icon">expand_more</span>`
          : '';

        return `
          <button class="filter-button" data-part="${part}">
            <span>${partInfo.name}</span>
            ${dropdownIcon}
          </button>
        `;
      })
      .join('')}
  `;

  // Update HTML
  filterContainer.innerHTML = buttonHTML;

  // Reset selected part
  selectedPart = 'all';

  // Add event listeners to new buttons
  setupPartFilters();
}
// Get icon for detail type
function getDetailIcon(detail) {
  const icons = {
    paint: 'format_paint',
    material: 'layers',
    window: 'window',
    door: 'door_front',
    structure: 'architecture',
  };
  return icons[detail] || 'list';
}

// Get Japanese label for detail type
function getDetailLabel(detail) {
  const labels = {
    paint: '塗装',
    material: '材料',
    window: '窓',
    door: 'ドア',
    structure: '構造',
  };
  return labels[detail] || detail;
}

// Thêm hàm setup category filters
function setupCategoryFilters() {
  const filterChips = document.querySelectorAll('.filter-chip[data-category]');

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      // Remove active class from all chips
      filterChips.forEach((c) => c.classList.remove('active'));

      // Add active class to clicked chip
      chip.classList.add('active');

      // Update selected category
      selectedCategory = chip.dataset.category;

      // Update checklist
      updateChecklist();
    });
  });
}

function setupDropdownPartFilter() {
  const filterButtons = document.querySelectorAll('.filter-button');

  filterButtons.forEach((filterButton) => {
    filterButton.addEventListener('click', () => {
      // if has class active, remove it
      if (filterButton.classList.contains('active')) {
        filterButton.classList.remove('active');
        selectedPart = 'all';
      } else {
        // remove active class from all buttons
        filterButtons.forEach((btn) => btn.classList.remove('active'));
        // add active class to clicked button
        filterButton.classList.add('active');
        // update selected part
        selectedPart = button.dataset.part;
      }
    });

    updateChecklist();
  });
}

function initDirection() {
  const directionButtons = document.querySelectorAll('.direction-button');

  if (directionButtons.length > 0) {
    selectedDirection = directionButtons[0].dataset.direction;
    updateBlueprintImage();
    updateDirectionButtons();
    setupPartFiltersForDirection();
  }
}

function setupDirectionButtons() {
  const directionButtons = document.querySelectorAll('.direction-button');

  // Cập nhật nút lịch sử ảnh khi chuyển direction
  updatePhotoHistoryButton();

  directionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const newDirection = button.dataset.direction;

      // Nếu đã chọn direction này rồi thì không làm gì cả
      if (selectedDirection === newDirection) return;

      // Cập nhật selected direction
      selectedDirection = newDirection;

      // Cập nhật UI
      updateDirectionButtons();

      // Cập nhật blueprint image theo direction mới
      updateBlueprintImage();

      // Reset zoom và pan về trạng thái mặc định
      resetBlueprintView();

      // Cập nhật hiển thị icons trên blueprint
      updateBlueprintIcons();

      // Update part filters based on new direction
      setupPartFiltersForDirection();

      // Update detail filters based on selected part (all)
      updateDetailFilters();

      // Cập nhật checklist để hiển thị các mục phù hợp với direction mới
      updateChecklist();

      // Cập nhật nút lịch sử ảnh
      updatePhotoHistoryButton();

      console.log('Direction changed to:', selectedDirection);
    });
  });
}

// Thêm vào hàm khởi tạo hoặc cập nhật HTML để hiển thị 6 icon
function setupShapeButtons() {
  const shapeContainer = document.querySelector('.shapes-container');
  if (!shapeContainer) return;

  // Xóa nội dung hiện có
  shapeContainer.innerHTML = '';

  // Định nghĩa 6 icon theo yêu cầu
  const shapes = [
    { shape: 'circle', color: '#ef4444', name: '赤丸' }, // Tròn đỏ
    { shape: 'circle', color: '#3b82f6', name: '青丸' }, // Tròn xanh dương
    { shape: 'square', color: '#ef4444', name: '赤四角' }, // Vuông đỏ
    { shape: 'square', color: '#3b82f6', name: '青四角' }, // Vuông xanh dương
    { shape: 'triangle', color: '#ef4444', name: '赤三角' }, // Tam giác đỏ
    { shape: 'triangle', color: '#3b82f6', name: '青三角' }, // Tam giác xanh dương
  ];

  // Tạo button cho mỗi shape
  shapes.forEach((item) => {
    const button = document.createElement('div');
    button.className = 'shape-button';
    button.dataset.shape = item.shape;
    button.dataset.color = item.color;

    // Tạo HTML cho shape
    let shapeHTML = '';
    switch (item.shape) {
      case 'circle':
        shapeHTML = `<div class="circle-shape" style="background-color: ${item.color};"></div>`;
        break;
      case 'square':
        shapeHTML = `<div class="square-shape" style="background-color: ${item.color};"></div>`;
        break;
      case 'triangle':
        shapeHTML = `<div class="triangle-shape" style="border-bottom-color: ${item.color};"></div>`;
        break;
    }

    // Thêm nhãn cho shape
    button.innerHTML = `
      <div class="shape-icon-container">
        ${shapeHTML}
      </div>
    `;

    shapeContainer.appendChild(button);
  });
}

function setupShapeButtonEvents() {
  const shapeButtons = document.querySelectorAll('.shape-button');

  shapeButtons.forEach((button) => {
    // Xử lý mousedown cho desktop
    button.addEventListener('mousedown', (e) => {
      e.preventDefault();

      selectedShape = {
        shape: button.dataset.shape,
        color: button.dataset.color,
      };

      // Đánh dấu rằng đang bắt đầu kéo
      button.classList.add('drag-active');

      // Sau một khoảng thời gian, nếu vẫn giữ chuột, bắt đầu kéo
      longPressTimer = setTimeout(() => {
        isDragStarted = true;
        button.classList.add('dragging');
        const blueprintHelpText = document.getElementById(
          'blueprint-help-text'
        );
        if (blueprintHelpText) {
          blueprintHelpText.style.opacity = '1';
          blueprintHelpText.textContent = 'ここにドラッグしてマークを配置';
        }

        startDrag(e);
        const blueprintImageContainer = document.querySelector(
          '.blueprint-image-container'
        );
        if (blueprintImageContainer) {
          blueprintImageContainer.classList.add('dropzone-active');
        }
      }, 300);
    });

    // Xử lý touchstart cho thiết bị di động
    button.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();

        selectedShape = {
          shape: button.dataset.shape,
          color: button.dataset.color,
        };

        button.classList.add('drag-active');

        longPressTimer = setTimeout(() => {
          isDragStarted = true;
          button.classList.add('dragging');
          const blueprintHelpText = document.getElementById(
            'blueprint-help-text'
          );
          if (blueprintHelpText) {
            blueprintHelpText.style.opacity = '1';
            blueprintHelpText.textContent = 'ここにドラッグしてマークを配置';
          }

          startDrag(e);
          const blueprintImageContainer = document.querySelector(
            '.blueprint-image-container'
          );
          if (blueprintImageContainer) {
            blueprintImageContainer.classList.add('dropzone-active');
          }
        }, 300);
      },
      { passive: false }
    );

    // Xử lý mouseup
    button.addEventListener('mouseup', () => {
      clearTimeout(longPressTimer);
      button.classList.remove('drag-active');
      if (!isDragStarted) {
        selectShape(button.dataset.shape, button.dataset.color);
      }
      isDragStarted = false;
    });

    // Xử lý touchend
    button.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        clearTimeout(longPressTimer);
        button.classList.remove('drag-active');
        if (!isDragStarted) {
          selectShape(button.dataset.shape, button.dataset.color);
        }
        isDragStarted = false;
      },
      { passive: false }
    );

    // Xử lý touchmove
    button.addEventListener(
      'touchmove',
      () => {
        if (!isDragStarted) {
          clearTimeout(longPressTimer);
          button.classList.remove('drag-active');
        }
      },
      { passive: false }
    );

    // Tắt menu ngữ cảnh
    button.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  });
}

function setupBlueprintInteractions() {
  const zoomInButton = document.getElementById('zoom-in');
  const zoomOutButton = document.getElementById('zoom-out');
  const shapeButtons = document.querySelectorAll('.shape-button');
  const blueprintImageContainer = document.querySelector(
    '.blueprint-image-container'
  );
  const blueprintHelpText = document.getElementById('blueprint-help-text');

  // Thêm trạng thái hiển thị khu vực thả
  let showDropZone = false;

  // Setup shape buttons
  shapeButtons.forEach((button) => {
    // Sử dụng mousedown để bắt đầu kéo
    button.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Ngăn chặn hành vi mặc định

      selectedShape = {
        shape: button.dataset.shape,
        color: button.dataset.color,
      };

      button.classList.add('drag-active');

      longPressTimer = setTimeout(() => {
        isDragStarted = true;
        button.classList.add('dragging');
        blueprintHelpText.style.opacity = '1';
        blueprintHelpText.textContent = 'ここにドラッグしてマークを配置';

        startDrag(e);
        showDropZone = true;
        blueprintImageContainer.classList.add('dropzone-active');
      }, 300);

      // Hiển thị hướng dẫn khi bắt đầu kéo
      blueprintHelpText.style.opacity = '1';
      blueprintHelpText.textContent = 'ここにドラッグしてマークを配置';

      startDrag(e);
      showDropZone = true;

      // Highlight khu vực blueprint khi đang kéo
      blueprintImageContainer.classList.add('dropzone-active');
    });

    button.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault(); // Quan trọng: ngăn chặn menu ngữ cảnh

        selectedShape = {
          shape: button.dataset.shape,
          color: button.dataset.color,
        };

        // Bắt đầu kéo sau một khoảng thời gian ngắn để tránh xung đột
        // với các sự kiện khác như tap
        let touchTimeout = setTimeout(() => {
          blueprintHelpText.style.opacity = '1';
          blueprintHelpText.textContent = 'ここにドラッグしてマークを配置';

          startDrag(e);
          showDropZone = true;
          blueprintImageContainer.classList.add('dropzone-active');
        }, 100);

        // Nếu người dùng thả ra quá nhanh, hủy timeout
        button.addEventListener(
          'touchend',
          () => {
            clearTimeout(longPressTimer);
            button.classList.remove('drag-active');
            if (!isDragStarted) {
              // Nếu chỉ là nhấn bình thường (không phải kéo), thì xử lý click
              selectShape(button.dataset.shape, button.dataset.color);
            }
            isDragStarted = false;
          },
          { passive: false }
        );
      },
      { passive: false }
    );

    button.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    button.addEventListener(
      'touchmove',
      () => {
        if (!isDragStarted) {
          clearTimeout(longPressTimer);
          button.classList.remove('drag-active');
        }
      },
      { passive: false }
    );
  });

  // Handle mouse move for dragging - Cập nhật để có phản hồi tốt hơn
  document.addEventListener('mouseup', (e) => {
    if (isDragging) {
      const rect = blueprintImageContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Kiểm tra xem điểm thả có nằm trong khu vực blueprint không
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        console.log('Drop successful in blueprint area');
        // Truyền đối tượng sự kiện e vào hàm endDrag
        endDrag(e);

        // Tìm mục checklist phù hợp
        const matchingItem = checklist.find((item) => {
          const iconConfig = getItemIconConfig(item.part, item.detail);
          return (
            iconConfig.shape === selectedShape.shape &&
            iconConfig.color === selectedShape.color
          );
        });

        if (matchingItem) {
          // Hiển thị modal vấn đề cho mục được chọn
          openIssueModal(matchingItem);
        }
      } else {
        console.log('Drop outside blueprint area, cancelling');
        // Hủy kéo thả nếu ở ngoài blueprint
        isDragging = false;
        if (dragIcon) {
          dragIcon.remove();
          dragIcon = null;
        }
      }

      // Reset trạng thái UI
      blueprintImageContainer.classList.remove('dropzone-active');
      blueprintImageContainer.classList.remove('drop-highlight');
      blueprintHelpText.style.opacity = '0';
      showDropZone = false;
    }
  });

  // Cải thiện xử lý khi thả chuột
  document.addEventListener('mousemove', (e) => {
    handleDrag(e);
  });

  document.addEventListener(
    'touchmove',
    (e) => {
      if (isDragging) {
        e.preventDefault(); // Ngăn chặn cuộn trang khi đang kéo
        handleDrag(e);

        if (showDropZone) {
          const touch = e.touches[0];
          const rect = blueprintImageContainer.getBoundingClientRect();
          if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
          ) {
            blueprintImageContainer.classList.add('drop-highlight');
          } else {
            blueprintImageContainer.classList.remove('drop-highlight');
          }
        }
      }
    },
    { passive: false }
  );

  // Thêm xử lý touchend
  document.addEventListener('touchend', (e) => {
    if (isDragging) {
      if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const rect = blueprintImageContainer.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          console.log('Touch drop successful in blueprint area');
          // Truyền đối tượng sự kiện e vào hàm endDrag
          endDrag(e);

          // Tìm mục checklist phù hợp
          const matchingItem = checklist.find((item) => {
            const iconConfig = getItemIconConfig(item.part, item.detail);
            return (
              iconConfig.shape === selectedShape.shape &&
              iconConfig.color === selectedShape.color
            );
          });

          if (matchingItem) {
            openIssueModal(matchingItem);
          }
        } else {
          console.log('Touch drop outside blueprint area, cancelling');
          isDragging = false;
          if (dragIcon) {
            dragIcon.remove();
            dragIcon = null;
          }
        }
      } else {
        // Nếu không có touch data, hủy kéo thả
        isDragging = false;
        if (dragIcon) {
          dragIcon.remove();
          dragIcon = null;
        }
      }

      // Reset trạng thái UI
      blueprintImageContainer.classList.remove('dropzone-active');
      blueprintImageContainer.classList.remove('drop-highlight');
      blueprintHelpText.style.opacity = '0';
      showDropZone = false;
    }
  });

  // Cải thiện xử lý khi nhấp chuột trên blueprint
  blueprintImageContainer.addEventListener('click', (e) => {
    // Chỉ xử lý nếu đang không kéo và có hình được chọn
    if (isDragging && selectedShape) {
      // Xử lý click trực tiếp trên blueprint
      const rect = blueprintImageContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      handleBlueprintClick(e, x, y);
    }
  });

  // Các xử lý zoom không thay đổi
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
}

function updateBlueprintImage() {
  // Thay đổi hình ảnh blueprint theo direction mới
  blueprintImage.src = `assets/images/${selectedDirection}-blueprint.jpg`;

  // Nếu hình ảnh không tồn tại, sử dụng hình ảnh mặc định
  blueprintImage.onerror = function () {
    blueprintImage.src = 'assets/images/default-blueprint.jpg';
    console.log(
      `Blueprint image for ${selectedDirection} not found, using default`
    );
  };
}

function updateBlueprintTransform() {
  const imageContainer = document.querySelector('.blueprint-image-container');
  imageContainer.style.transform = `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`;
}

function startDrag(e) {
  // Đảm bảo e không bị undefined hoặc null
  if (!e) {
    console.log('Event không hợp lệ trong startDrag');
    return;
  }

  // Xóa icon đang kéo cũ nếu có
  const existingDragIcon = document.querySelector('.dragged-icon');
  if (existingDragIcon) {
    existingDragIcon.remove();
  }

  // Lấy tọa độ touch/mouse
  const touch = e.touches ? e.touches[0] : e;
  const startX = touch.clientX;
  const startY = touch.clientY;

  // Tạo phần tử icon được kéo
  dragIcon = document.createElement('div');
  dragIcon.className = 'dragged-icon';
  dragIcon.style.position = 'fixed';
  dragIcon.style.zIndex = '9999';
  dragIcon.style.pointerEvents = 'none';
  dragIcon.style.transform = 'translate(-50%, -50%) scale(1.2)';
  dragIcon.style.left = `${startX}px`;
  dragIcon.style.top = `${startY}px`;

  // Tạo icon dựa trên hình dạng được chọn
  let iconHTML = '';
  switch (selectedShape.shape) {
    case 'circle':
      iconHTML = `<div class="circle-shape" style="background-color: ${selectedShape.color}; width: 24px; height: 24px; border: 2px solid white;"></div>`;
      break;
    case 'triangle':
      iconHTML = `
      <div class="triangle-container" style="width: 24px; height: 24px;">
        <div class="triangle-shape" style="border-bottom-color: ${selectedShape.color}; border-bottom-width: 24px; border-left-width: 12px; border-right-width: 12px; border: 2px solid white;"></div>
      </div>`;
      break;
    case 'square':
      iconHTML = `<div class="square-shape" style="background-color: ${selectedShape.color}; width: 24px; height: 24px; border: 2px solid white;"></div>`;
      break;
  }

  dragIcon.innerHTML = iconHTML;
  document.body.appendChild(dragIcon);

  isDragging = true;
  console.log('Start dragging', selectedShape);
}

// Thay đổi từ let selectShape = null thành:
function selectShape(shape, color) {
  // Cập nhật selectedShape
  selectedShape = {
    shape: shape,
    color: color,
  };

  // Cập nhật giao diện hiển thị
  updateShapeButtons();

  console.log('Shape selected:', selectedShape);
}

// Thêm hàm để cập nhật trạng thái của các nút
function updateShapeButtons() {
  const shapeButtons = document.querySelectorAll('.shape-button');

  shapeButtons.forEach((button) => {
    const buttonShape = button.dataset.shape;
    const buttonColor = button.dataset.color;

    // Kiểm tra nếu đây là nút đã được chọn
    if (
      selectedShape &&
      selectedShape.shape === buttonShape &&
      selectedShape.color === buttonColor
    ) {
      button.classList.add('selected-shape');
    } else {
      button.classList.remove('selected-shape');
    }
  });
}

function handleDrag(e) {
  if (!isDragging || !dragIcon) return;

  // Kiểm tra e có tồn tại không
  if (!e) {
    console.log('Event không hợp lệ trong handleDrag');
    return;
  }

  // Lấy tọa độ touch/mouse
  const touch = e.touches ? e.touches[0] : e;
  const clientX = touch.clientX;
  const clientY = touch.clientY;

  // Cập nhật vị trí icon
  dragIcon.style.left = `${clientX}px`;
  dragIcon.style.top = `${clientY}px`;
}

function endDrag(e) {
  if (!isDragging) return;

  isDragging = false;

  // Xóa icon đang kéo
  if (dragIcon) {
    dragIcon.remove();
    dragIcon = null;
  }

  // Kiểm tra xem e có tồn tại không
  if (!e || (!e.clientX && !e.touches)) {
    console.log('Event không hợp lệ trong endDrag');
    return;
  }

  // Lấy tọa độ touch/mouse
  const touch = e.changedTouches ? e.changedTouches[0] : e;
  const clientX = touch.clientX;
  const clientY = touch.clientY;

  // Lấy kích thước và vị trí của blueprint image container
  const blueprintImageContainer = document.querySelector(
    '.blueprint-image-container'
  );
  const rect = blueprintImageContainer.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Kiểm tra xem điểm thả có nằm trong khu vực blueprint image container không
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    console.log('Thả ra ngoài khu vực blueprint, hủy icon');
    return;
  }

  // Tính toán tọa độ tương đối so với blueprint
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  // Tính toán vị trí tương đối so với trung tâm, có tính đến tỷ lệ zoom và vị trí pan
  const adjustedX = (x - centerX - panOffset.x) / zoomLevel + centerX;
  const adjustedY = (y - centerY - panOffset.y) / zoomLevel + centerY;

  console.log('Placing icon at adjusted coordinates:', adjustedX, adjustedY);

  // Thêm icon vào danh sách
  const newIcon = {
    id: Date.now().toString(),
    shape: selectedShape.shape,
    color: selectedShape.color,
    x: adjustedX,
    y: adjustedY,
    direction: selectedDirection,
  };

  pinnedIcons.push(newIcon);

  // Cập nhật hiển thị
  updateBlueprintIcons();

  const matchingItems = checklist.filter((item) => {
    if (item.direction !== selectedDirection) return false;
    const iconConfig = getItemIconConfig(item.part, item.detail);
    return (
      iconConfig.shape === selectedShape.shape &&
      iconConfig.color === selectedShape.color
    );
  });

  if (matchingItems.length > 0) {
    const selectedItem = matchingItems[0];
    if (!selectedItem.pinnedIcons) {
      selectedItem.pinnedIcons = [];
    }
    selectedItem.pinnedIcons.push(newIcon.id);
    openIssueModal(selectedItem);
  } else {
    console.log('Không tìm thấy checklist item phù hợp với icon này');
    showToast('このマーカーに合致する項目が見つかりません');
  }
}

function updateBlueprintIcons() {
  const iconsContainer = document.querySelector('.pinned-icons-container');
  iconsContainer.innerHTML = pinnedIcons
    .filter((icon) => icon.direction === selectedDirection)
    .map((icon) => {
      // Tính toán vị trí hiển thị
      const centerX = blueprintContainer.clientWidth / 2;
      const centerY = blueprintContainer.clientHeight / 2;
      const displayX = (icon.x - centerX) * zoomLevel + centerX + panOffset.x;
      const displayY = (icon.y - centerY) * zoomLevel + centerY + panOffset.y;

      // Tạo HTML cho icon
      let iconHtml = '';
      switch (icon.shape) {
        case 'circle':
          iconHtml = `<div class="pinned-circle" style="background-color: ${icon.color};"></div>`;
          break;
        case 'triangle':
          iconHtml = `
            <div class="triangle-container">
              <div class="pinned-triangle" style="border-bottom-color: ${icon.color};"></div>
            </div>`;
          break;
        case 'square':
          iconHtml = `<div class="pinned-square" style="background-color: ${icon.color};"></div>`;
          break;
        case 'diamond':
          iconHtml = `
            <div class="diamond-container">
              <div class="pinned-diamond" style="background-color: ${icon.color};"></div>
            </div>`;
          break;
      }

      return `
        <div class="pinned-icon" 
             style="left: ${displayX}px; top: ${displayY}px;"
             data-id="${icon.id}">
          ${iconHtml}
        </div>`;
    })
    .join('');

  // Thêm event listener cho các icon đã ghim
  document.querySelectorAll('.pinned-icon').forEach((iconElement) => {
    iconElement.addEventListener('click', () => {
      const iconId = iconElement.dataset.id;

      // Tìm item liên kết với icon này
      const linkedItem = checklist.find(
        (item) => item.pinnedIcons && item.pinnedIcons.includes(iconId)
      );

      if (linkedItem) {
        // Mở modal chỉnh sửa cho item
        openIssueModal(linkedItem);
      } else {
        // Không tìm thấy item liên kết, thông báo với người dùng
        showToast('このマーカーに関連する項目が見つかりませんでした');
      }
    });
  });
}

function handleBlueprintClick(event) {
  // Kiểm tra sự kiện
  if (!event) {
    console.log('Event không hợp lệ trong handleBlueprintClick');
    return;
  }

  if (isDragging) return;

  const rect = blueprintContainer.getBoundingClientRect();

  // Kiểm tra event.clientX và event.clientY có tồn tại không
  if (event.clientX === undefined || event.clientY === undefined) {
    console.log(
      'Event không có clientX hoặc clientY trong handleBlueprintClick'
    );
    return;
  }

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  console.log('Clicked at:', x, y);
}

function loadChecklist() {
  // Load checklist data  // This would typically come from an API
  checklist = checklistItems;
  updateChecklist();
}

function updateChecklist() {
  const filtered = checklist.filter((item) => {
    // Filter by direction first
    if (item.direction !== selectedDirection) return false;

    // Filter by part if selected
    if (selectedPart !== 'all' && item.part !== selectedPart) return false;

    // Filter by details if any selected
    if (selectedDetails.length > 0 && !selectedDetails.includes(item.detail)) {
      return false;
    }

    return true;
  });

  // Group items by detail type
  const groupedItems = filtered.reduce((groups, item) => {
    const detailType = item.detail;
    if (!groups[detailType]) {
      groups[detailType] = [];
    }
    groups[detailType].push(item);
    return groups;
  }, {});

  checklistContainer.innerHTML = Object.entries(groupedItems)
    .map(([detailType, items]) => {
      const completedCount = items.filter(
        (item) => item.status === 'completed'
      ).length;

      const detailInfo = DETAIL_TYPES.find((d) => d.id === detailType);

      return `
        <div class="checklist-group">
          <div class="checklist-subtitle-container">
            <span class="material-icons">${detailInfo?.icon || 'circle'}</span>
            <span class="checklist-subtitle">${
              detailInfo?.name || detailType
            }</span>
            <div class="completion-count-container">
              <span class="completion-count">${completedCount}/${
        items.length
      }</span>
            </div>
          </div>

          ${items
            .map(
              (item) => `
            <div class="checklist-item ${
              item.status === 'completed'
                ? 'completed-item'
                : item.status === 'issue'
                ? 'issue-item'
                : ''
            }" data-id="${item.id}">
              <div class="checklist-header">
                <div class="shape-icon">
                  ${getShapeHTML(getItemIconConfig(item.part, item.detail))}
                </div>
                <div class="checklist-text">${item.name}</div>
                ${
                  item.photos && item.photos.length > 0
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
                <button class="action-button ${
                  item.status === 'completed'
                    ? 'active-check-button'
                    : 'check-button'
                }">
                  <span class="material-icons">check</span>
                </button>
                ${
                  item.status === 'completed'
                    ? `
                  <button class="action-button photo-button">
                    <span class="material-icons">camera</span>
                  </button>
                `
                    : `
                  <button class="action-button issue-button">
                    <span class="material-icons">close</span>
                  </button>
                `
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    })
    .join('');

  document.querySelectorAll('.photo-indicator').forEach((indicator) => {
    indicator.addEventListener('click', (e) => {
      e.stopPropagation(); // Ngăn chặn sự kiện click của item
      const itemId = indicator.dataset.itemId;
      showItemPhotos(itemId);
    });
  });

  // Add event listeners to action buttons
  document.querySelectorAll('.action-button').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = button.closest('.checklist-item').dataset.id;
      let action = 'check';
      if (button.classList.contains('photo-button')) {
        action = 'photo';
      } else if (button.classList.contains('issue-button')) {
        action = 'issue';
      }
      handleItemAction(itemId, action);
    });
  });
}

function getShapeHTML(iconConfig) {
  switch (iconConfig.shape) {
    case 'circle':
      return `<div class="circle-shape" style="background-color: ${iconConfig.color};"></div>`;
    case 'triangle':
      return `<div class="triangle-shape" style="border-bottom-color: ${iconConfig.color};"></div>`;
    case 'square':
      return `<div class="square-shape" style="background-color: ${iconConfig.color};"></div>`;
    case 'diamond':
      return `<div class="diamond-shape" style="background-color: ${iconConfig.color};"></div>`;
    default:
      return `<div class="circle-shape" style="background-color: ${iconConfig.color};"></div>`;
  }
}

function getItemIconConfig(part, detail) {
  // Map combinations of part and detail to specific icons and colors
  if (part === 'roof') {
    if (detail === 'structure') return { shape: 'triangle', color: '#ef4444' }; // Tam giác đỏ
    if (detail === 'material') return { shape: 'triangle', color: '#3b82f6' }; // Tam giác xanh dương
    return { shape: 'circle', color: '#ef4444' }; // Mặc định: tròn đỏ
  }

  if (part === 'walls') {
    if (detail === 'paint') return { shape: 'circle', color: '#ef4444' }; // Tròn đỏ
    if (detail === 'structure') return { shape: 'triangle', color: '#ef4444' }; // Tam giác đỏ
    if (detail === 'window') return { shape: 'square', color: '#3b82f6' }; // Vuông xanh dương
    if (detail === 'door') return { shape: 'square', color: '#ef4444' }; // Vuông đỏ
    return { shape: 'circle', color: '#3b82f6' }; // Mặc định: tròn xanh dương
  }

  if (part === 'foundation') {
    if (detail === 'structure') return { shape: 'square', color: '#ef4444' }; // Vuông đỏ
    return { shape: 'square', color: '#3b82f6' }; // Mặc định: vuông xanh dương
  }

  // Default icon for any other combination
  return { shape: 'circle', color: '#3b82f6' }; // Mặc định: tròn xanh dương
}

// Cập nhật phần photo trong handleItemAction
async function handleItemAction(itemId, action) {
  const item = checklist.find((i) => i.id === Number(itemId));
  if (!item) return;

  switch (action) {
    case 'check':
      // Nếu đánh dấu item đã hoàn thành nhưng sau đó bỏ check, xóa các icon đã ghim
      if (
        item.status === 'completed' &&
        item.pinnedIcons &&
        item.pinnedIcons.length > 0
      ) {
        removeIconsByItemId(item.id);
        item.pinnedIcons = []; // Xóa tham chiếu đến icon
      }

      item.status = item.status === 'completed' ? 'pending' : 'completed';
      updateChecklist();
      updateProgress();
      break;

    case 'photo':
      try {
        // Tạo camera overlay
        const cameraOverlay = document.createElement('div');
        cameraOverlay.className = 'camera-overlay';
        cameraOverlay.innerHTML = `
            <div class="camera-container">
              <video id="camera-video-element" autoplay playsinline></video>
              <div class="camera-controls">
                <button id="capture-photo-button" class="capture-button">
                  <span class="material-icons">camera_alt</span>
                </button>
                <button id="cancel-photo-button" class="cancel-button">
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>
          `;
        document.body.appendChild(cameraOverlay);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        const video = document.getElementById('camera-video-element');
        video.srcObject = stream;

        // Xử lý chụp ảnh
        document
          .getElementById('capture-photo-button')
          .addEventListener('click', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            const photoUrl = canvas.toDataURL('image/jpeg');

            // Thêm ảnh vào item
            if (!item.photos) item.photos = [];
            item.photos.push({
              id: Date.now(),
              url: photoUrl,
              timestamp: new Date().toISOString(),
            });

            // Thêm ảnh vào photoHistory
            if (!photoHistory[selectedDirection]) {
              photoHistory[selectedDirection] = [];
            }
            photoHistory[selectedDirection].push({
              id: Date.now(),
              url: photoUrl,
              timestamp: new Date().toISOString(),
            });

            // Đóng camera
            stream.getTracks().forEach((track) => track.stop());
            cameraOverlay.remove();

            // Cập nhật UI
            updateChecklist();

            updatePhotoHistoryButton(); // Cập nhật nút history
            showToast('写真が追加されました');
          });

        // Xử lý hủy
        document
          .getElementById('cancel-photo-button')
          .addEventListener('click', () => {
            stream.getTracks().forEach((track) => track.stop());
            cameraOverlay.remove();
          });
      } catch (error) {
        console.error('Camera error:', error);
        alert('カメラへのアクセスができませんでした。');

        // Fallback sử dụng input file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';

        input.onchange = (e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
              const photoUrl = event.target.result;

              // Thêm ảnh vào item
              if (!item.photos) item.photos = [];
              item.photos.push({
                id: Date.now(),
                url: photoUrl,
                timestamp: new Date().toISOString(),
              });

              // Thêm ảnh vào photoHistory
              if (!photoHistory[selectedDirection]) {
                photoHistory[selectedDirection] = [];
              }
              photoHistory[selectedDirection].push({
                id: Date.now(),
                url: photoUrl,
                timestamp: new Date().toISOString(),
              });

              // Cập nhật UI
              updateChecklist();
              updatePhotoHistoryButton(); // Cập nhật nút history
              showToast('写真が追加されました');
            };

            reader.readAsDataURL(file);
          }
        };

        input.click();
      }
      break;

    case 'issue':
      // Open issue modal
      openIssueModal(item);
      break;
  }
}

function openIssueModal(item) {
  const modal = document.getElementById('issue-modal-overlay');
  const title = document.getElementById('modal-item-title');
  const noteInput = document.getElementById('note-input');
  const photoList = document.getElementById('issue-photo-list');
  const cameraPreview = document.getElementById('camera-preview');

  // Hide camera preview if it's showing
  cameraPreview.style.display = 'none';

  // Đánh dấu item hiện tại để sử dụng trong các hàm xử lý
  modal.dataset.itemId = item.id;

  // Set modal content
  title.textContent = item.name;
  noteInput.value = item.note || '';

  // Hiển thị thông tin về các icon đã ghim (nếu có)
  const pinnedIconsInfo = document.getElementById('pinned-icons-info');
  if (pinnedIconsInfo) {
    if (item.pinnedIcons && item.pinnedIcons.length > 0) {
      pinnedIconsInfo.textContent = `このアイテムには${item.pinnedIcons.length}個のマーカーがマップ上に設置されています`;
      pinnedIconsInfo.style.display = 'block';
    } else {
      pinnedIconsInfo.style.display = 'none';
    }
  }

  // Update photo list
  const updatePhotoList = () => {
    photoList.innerHTML = '';

    if (item.photos && item.photos.length > 0) {
      item.photos.forEach((photo, index) => {
        const photoUrl = typeof photo === 'string' ? photo : photo.url;

        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
          <img src="${photoUrl}" alt="Issue photo ${index + 1}">
          <button class="delete-photo-button" data-index="${index}">
            <span class="material-icons">close</span>
          </button>
        `;

        photoList.appendChild(photoItem);

        // Add event listener to view photo
        photoItem.querySelector('img').addEventListener('click', () => {
          if (typeof photo === 'string') {
            showFullSizePhoto(photo);
          } else {
            showFullSizePhoto(photo.url);
          }
        });

        // Add event listener to delete photo
        photoItem
          .querySelector('.delete-photo-button')
          .addEventListener('click', () => {
            if (confirm('この写真を削除してもよろしいですか？')) {
              item.photos.splice(index, 1);
              updatePhotoList();
            }
          });
      });
    } else {
      photoList.innerHTML = '<p class="no-photos">写真はまだありません</p>';
    }
  };

  updatePhotoList();

  // Handle camera button
  const takePictureButton = document.getElementById('take-picture-button');
  takePictureButton.onclick = async () => {
    try {
      // Tạo camera overlay trước
      const cameraOverlay = document.createElement('div');
      cameraOverlay.className = 'camera-overlay';
      cameraOverlay.innerHTML = `
        <div class="camera-container">
          <video id="camera-video-element" autoplay playsinline></video>
          <div class="camera-controls">
            <button id="capture-photo-button" class="capture-button">
              <span class="material-icons">camera_alt</span>
            </button>
            <button id="cancel-photo-button" class="cancel-button">
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(cameraOverlay);
      // Kiểm tra xem thiết bị có hỗ trợ camera không
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      // Yêu cầu quyền truy cập camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Ưu tiên camera sau
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const video = cameraOverlay.querySelector('#camera-video-element');
      video.srcObject = stream;
      await video.play();

      // Xử lý chụp ảnh
      cameraOverlay.querySelector('#capture-photo-button').onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const photoUrl = canvas.toDataURL('image/jpeg', 0.8);

        if (!item.photos) item.photos = [];
        item.photos.push({
          id: Date.now(),
          url: photoUrl,
          timestamp: new Date().toISOString(),
        });

        stream.getTracks().forEach((track) => track.stop());
        cameraOverlay.remove();
        updatePhotoList();
        showToast('写真が追加されました');
      };

      // Xử lý hủy bỏ
      cameraOverlay.querySelector('#cancel-photo-button').onclick = () => {
        stream.getTracks().forEach((track) => track.stop());
        cameraOverlay.remove();
      };
    } catch (error) {
      console.error('Camera error:', error);
      alert('カメラにアクセスできません。権限を確認してください。');
    }
  };

  // Handle save
  const saveButton = modal.querySelector('.save-button');
  saveButton.onclick = () => {
    // Lưu ghi chú
    item.note = noteInput.value;

    // Đánh dấu item là đã được kiểm tra
    if (item.note || item.photos?.length > 0) {
      item.status = 'issue';
    }

    // Đóng modal
    modal.classList.remove('active');

    // Cập nhật giao diện
    updateChecklist();
    updateProgress();
  };

  // Handle close
  modal.querySelector('.close-modal').onclick = () => {
    modal.classList.remove('active');
  };

  // Show modal
  modal.classList.add('active');
}

function deleteIssuePhoto(itemId, photoIndex) {
  const item = checklist.find((i) => i.id === itemId);
  if (item && item.photos[photoIndex]) {
    if (confirm('この写真を削除してもよろしいですか？')) {
      item.photos.splice(photoIndex, 1);
      openIssueModal(item); // Refresh modal
    }
  }
}

function removeIconsByItemId(itemId) {
  const item = checklist.find((i) => i.id === itemId);
  if (!item || !item.pinnedIcons || item.pinnedIcons.length === 0) return;

  // Lọc ra danh sách các icon cần giữ lại
  pinnedIcons = pinnedIcons.filter(
    (icon) => !item.pinnedIcons.includes(icon.id)
  );

  // Cập nhật hiển thị
  updateBlueprintIcons();
}

function openPhotoGallery(photos, startIndex = 0) {
  // Remove existing gallery if any
  const existingGallery = document.querySelector('.photo-gallery');
  if (existingGallery) {
    existingGallery.remove();
  }

  const gallery = document.createElement('div');
  gallery.className = 'photo-gallery';

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'close-gallery-button';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => gallery.remove();
  gallery.appendChild(closeButton);

  // Add photo list
  const photoList = document.createElement('div');
  photoList.className = 'photo-list';

  photos.forEach((photo, index) => {
    const photoContainer = document.createElement('div');
    photoContainer.className = 'photo-container';
    photoContainer.style.transform = `translateX(${
      (index - startIndex) * 100
    }%)`;

    const img = document.createElement('img');
    img.src = photo;
    img.onerror = () => {
      img.src = 'assets/images/placeholder.jpg';
    };

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-photo-button';
    deleteButton.innerHTML = '&times;';
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      if (confirm('この写真を削除してもよろしいですか？')) {
        photos.splice(index, 1);
        updateChecklist();
        updateProgress();
        gallery.remove();
        if (photos.length > 0) {
          openPhotoGallery(photos);
        }
      }
    };

    photoContainer.appendChild(img);
    photoContainer.appendChild(deleteButton);
    photoList.appendChild(photoContainer);
  });

  gallery.appendChild(photoList);

  // Add overlay
  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';
  overlay.onclick = () => gallery.remove();

  document.body.appendChild(overlay);
  document.body.appendChild(gallery);
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

function resetBlueprintView() {
  // Reset zoom về mức mặc định
  zoomLevel = 1;

  // Reset pan offset về vị trí ban đầu
  panOffset = { x: 0, y: 0 };

  // Cập nhật transform của blueprint
  updateBlueprintTransform();
}

function updateChecklistItems() {
  // Lọc và hiển thị các mục checklist phù hợp với direction hiện tại
  renderChecklist();
}
function renderChecklist() {
  // Sử dụng lại code như trong hàm updateChecklist()
  const filtered = checklist.filter(
    (item) =>
      item.direction === selectedDirection &&
      (!selectedPart || item.part === selectedPart) &&
      (selectedDetails.length === 0 || selectedDetails.includes(item.detail))
  );

  // Group items by detail type
  const groupedItems = filtered.reduce((groups, item) => {
    const detailType = item.detail;
    if (!groups[detailType]) {
      groups[detailType] = [];
    }
    groups[detailType].push(item);
    return groups;
  }, {});

  checklistContainer.innerHTML = Object.entries(groupedItems)
    .map(([detailType, items]) => {
      const completedCount = items.filter((item) => item.status !== '').length;

      const detailInfo = DETAIL_TYPES.find((d) => d.id === detailType);

      return `
        <div class="checklist-group">
          <div class="checklist-subtitle-container">
            <span class="material-icons">${detailInfo?.icon || 'circle'}</span>
            <span class="checklist-subtitle">${
              detailInfo?.name || detailType
            }</span>
            <div class="completion-count-container">
              <span class="completion-count">${completedCount}/${
        items.length
      }</span>
            </div>
          </div>

          ${items
            .map(
              (item) => `
            <div class="checklist-item ${
              item.status === 'completed'
                ? 'completed-item'
                : item.status === 'issue'
                ? 'issue-item'
                : ''
            }" data-id="${item.id}">
              <div class="checklist-header">
                <div class="shape-icon">
                  ${getShapeHTML(getItemIconConfig(item.part, item.detail))}
                </div>
                <div class="checklist-text">${item.name}</div>
                ${
                  item.photos.length > 0
                    ? `
                  <div class="photo-indicator" onclick="openPhotoGallery(${JSON.stringify(
                    item.photos
                  )})">
                    <span class="material-icons">images</span>
                    <span class="photo-count">${item.photos.length}</span>
                  </div>
                `
                    : ''
                }
              </div>
              <div class="checklist-actions">
                <button class="action-button ${
                  item.status === 'completed'
                    ? 'active-check-button'
                    : 'check-button'
                }">
                  <span class="material-icons">check</span>
                </button>
                ${
                  item.status === 'completed'
                    ? `
                  <button class="action-button photo-button">
                    <span class="material-icons">camera</span>
                  </button>
                `
                    : `
                  <button class="action-button issue-button">
                    <span class="material-icons">close</span>
                  </button>
                `
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    })
    .join('');

  // Add event listeners to action buttons
  document.querySelectorAll('.action-button').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = button.closest('.checklist-item').dataset.id;
      let action = 'check';
      if (button.classList.contains('photo-button')) {
        action = 'photo';
      } else if (button.classList.contains('issue-button')) {
        action = 'issue';
      }
      handleItemAction(itemId, action);
    });
  });

  // Add click event to checklist items for opening issue modal
  document.querySelectorAll('.checklist-item').forEach((item) => {
    item.addEventListener('click', () => {
      const itemId = parseInt(item.dataset.id);
      const selectedItem = checklist.find((i) => i.id === itemId);
      if (selectedItem) {
        openIssueModal(selectedItem);
      }
    });
  });
}

// Thêm vào cuối file script.js
function setupCameraButton() {
  const cameraButton = document.getElementById('camera-button');
  if (!cameraButton) return;

  cameraButton.addEventListener('click', async () => {
    try {
      // Kiểm tra xem thiết bị có hỗ trợ camera không
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Đối với thiết bị di động, mở camera trực tiếp
        await openCamera();
      } else {
        // Đối với máy tính, sử dụng input file
        openFilePicker();
      }
    } catch (error) {
      console.error('Lỗi khi truy cập camera:', error);
      // Fallback to file picker if camera access fails
      openFilePicker();
    }

    // Cập nhật nút photo history
    updatePhotoHistoryButton();
  });
}

async function openCamera() {
  try {
    // Tạo modal camera
    const cameraModal = document.createElement('div');
    cameraModal.className = 'camera-modal';
    cameraModal.innerHTML = `
      <div class="camera-container">
        <video id="camera-video-preview" autoplay playsinline></video>
        <div class="camera-controls">
          <button id="take-snapshot" class="camera-button">
            <span class="material-icons">camera</span>
          </button>
          <button id="close-camera" class="camera-button">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(cameraModal);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });

    const video = document.getElementById('camera-video-preview');
    video.srcObject = stream;
    await video.play();

    // Xử lý khi chụp ảnh
    document.getElementById('take-snapshot').addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      // Lưu ảnh vào lịch sử
      const photoData = canvas.toDataURL('image/jpeg');
      if (!photoHistory[selectedDirection]) {
        photoHistory[selectedDirection] = [];
      }
      photoHistory[selectedDirection].push({
        id: Date.now(),
        url: photoData,
        timestamp: new Date().toISOString(),
      });

      // Đóng camera
      stream.getTracks().forEach((track) => track.stop());
      cameraModal.remove();

      // Đánh dấu tất cả mục checklist là hoàn thành
      markAllItemsComplete();

      // Hiển thị thông báo thành công
      showToast('すべての項目が完了としてマークされました');

      // Mở lịch sử ảnh
      showPhotoHistory();
    });

    // Nút đóng camera
    document.getElementById('close-camera').addEventListener('click', () => {
      stream.getTracks().forEach((track) => track.stop());
      cameraModal.remove();
    });
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('カメラへのアクセスに失敗しました。設定で許可してください。');
    openFilePicker();
  }
}

function openFilePicker() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment'; // Gợi ý sử dụng camera sau

  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Lưu ảnh vào lịch sử
        photoHistory[selectedDirection].push({
          id: Date.now(),
          url: e.target.result,
          timestamp: new Date().toISOString(),
        });

        // Đánh dấu tất cả mục checklist là hoàn thành
        markAllItemsComplete();

        // Hiển thị thông báo thành công
        showToast('すべての項目が完了としてマークされました');

        // Mở lịch sử ảnh
        showPhotoHistory();
      };
      reader.readAsDataURL(file);
    }
  };

  input.click();
}

function showToast(message) {
  // Tạo và hiển thị thông báo toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }, 100);
}

function markAllItemsComplete() {
  // Đánh dấu tất cả các mục checklist trong hướng hiện tại là hoàn thành
  checklist.forEach((item) => {
    if (item.direction === selectedDirection) {
      item.status = 'completed';
    }
  });

  // Cập nhật giao diện
  updateChecklist();
  updateProgress();
}

function showPhotoHistory() {
  const photos = photoHistory[selectedDirection];

  // Tạo modal hiển thị lịch sử ảnh
  const historyModal = document.createElement('div');
  historyModal.className = 'photo-history-modal';

  historyModal.innerHTML = `
    <div class="photo-history-content">
      <div class="photo-history-header">
        <h3>撮影履歴 - ${
          DIRECTIONS.find((d) => d.id === selectedDirection)?.name ||
          selectedDirection
        }</h3>
        <button class="close-history">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="photo-history-body">
        ${
          photos.length > 0
            ? photos
                .map(
                  (photo, index) => `
            <div class="history-photo-item" data-index="${index}">
              <img src="${photo.url}" alt="Photo ${index + 1}">
              <div class="history-photo-actions">
                <button class="view-photo-button" data-index="${index}">
                  <span class="material-icons">visibility</span>
                </button>
                <button class="delete-photo-button" data-index="${index}">
                  <span class="material-icons">delete</span>
                </button>
              </div>
              <div class="history-photo-time">
                ${new Date(photo.timestamp).toLocaleString('ja-JP')}
              </div>
            </div>
          `
                )
                .join('')
            : '<p class="no-photos">写真はまだありません</p>'
        }
      </div>
    </div>
  `;

  document.body.appendChild(historyModal);

  // Animation để hiển thị modal từ dưới lên
  setTimeout(() => {
    historyModal.classList.add('show');
  }, 10);

  // Thêm sự kiện cho các nút
  historyModal.querySelector('.close-history').addEventListener('click', () => {
    historyModal.classList.remove('show');
    setTimeout(() => {
      historyModal.remove();
    }, 300);
  });

  // Thêm sự kiện cho các nút xem ảnh
  const viewButtons = historyModal.querySelectorAll('.view-photo-button');
  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = parseInt(button.dataset.index);
      showFullPhoto(photos[index].url);
    });
  });

  // Thêm sự kiện cho các nút xoá ảnh
  const deleteButtons = historyModal.querySelectorAll('.delete-photo-button');
  deleteButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = parseInt(button.dataset.index);
      if (confirm('この写真を削除してもよろしいですか？')) {
        // Xoá ảnh khỏi lịch sử
        photoHistory[selectedDirection].splice(index, 1);

        // Cập nhật nút lịch sử ảnh
        updatePhotoHistoryButton();
        // Cập nhật giao diện
        showPhotoHistory(); // Mở lại modal với danh sách đã cập nhật
      }
    });
  });
}

function showFullPhoto(url) {
  const fullscreenModal = document.createElement('div');
  fullscreenModal.className = 'fullscreen-modal';
  fullscreenModal.innerHTML = `
    <div class="fullscreen-photo-container">
      <img src="${url}" alt="Full photo">
      <button class="close-fullscreen">
        <span class="material-icons">close</span>
      </button>
    </div>
  `;

  document.body.appendChild(fullscreenModal);

  // Hiển thị modal với animation
  setTimeout(() => {
    fullscreenModal.classList.add('show');
  }, 10);

  // Đóng khi nhấn nút đóng
  fullscreenModal
    .querySelector('.close-fullscreen')
    .addEventListener('click', () => {
      fullscreenModal.classList.remove('show');
      setTimeout(() => {
        fullscreenModal.remove();
      }, 300);
    });

  // Đóng khi nhấn vào nền
  fullscreenModal.addEventListener('click', (e) => {
    if (e.target === fullscreenModal) {
      fullscreenModal.classList.remove('show');
      setTimeout(() => {
        fullscreenModal.remove();
      }, 300);
    }
  });
}

// Thêm nút để hiển thị lịch sử ảnh bên trái nút camera
// Thêm nút để hiển thị lịch sử ảnh bên trái nút camera
function addPhotoHistoryButton() {
  const cameraButton = document.getElementById('camera-button');
  if (!cameraButton) return;

  // Xóa nút cũ nếu tồn tại
  const existingHistoryButton = document.getElementById('photo-history-button');
  if (existingHistoryButton) {
    existingHistoryButton.remove();
  }

  // Chỉ tạo nút mới nếu có lịch sử ảnh cho hướng hiện tại
  if (
    photoHistory[selectedDirection] &&
    photoHistory[selectedDirection].length > 0
  ) {
    const historyButton = document.createElement('button');
    historyButton.id = 'photo-history-button';
    historyButton.className = 'photo-history-button';
    historyButton.innerHTML = `
      <span class="material-icons">collections</span>
      <span class="photo-count">${photoHistory[selectedDirection].length}</span>
    `;

    // Thêm vào trước nút camera
    cameraButton.parentNode.insertBefore(historyButton, cameraButton);

    // Thêm sự kiện click
    historyButton.addEventListener('click', () => {
      showPhotoHistory();
    });
  }
}

// Hàm để cập nhật số lượng ảnh hiển thị trên nút lịch sử
function updatePhotoHistoryButton() {
  const historyButton = document.getElementById('photo-history-button');
  const cameraButton = document.getElementById('camera-button');

  if (!cameraButton) return;

  // Kiểm tra xem có ảnh nào không
  const photos = photoHistory[selectedDirection] || [];
  const hasPhotos = photos.length > 0;

  if (!historyButton) {
    // Tạo mới nút nếu chưa tồn tại
    const newHistoryButton = document.createElement('button');
    newHistoryButton.id = 'photo-history-button';
    newHistoryButton.className = 'photo-history-button';
    newHistoryButton.innerHTML = `
      <span class="material-icons">collections</span>
      <span class="photo-count">${photos.length}</span>
    `;

    newHistoryButton.addEventListener('click', () => {
      showPhotoHistory();
    });
  } else {
    // Cập nhật số lượng nếu nút đã tồn tại
    const countElement = historyButton.querySelector('.photo-count');
    if (countElement) {
      countElement.textContent = photos.length;
    }
  }

  // Nếu có ảnh
  if (hasPhotos) {
    cameraButton.parentNode.insertBefore(newHistoryButton, cameraButton);
  } else {
    if (historyButton) {
      historyButton.remove();
    }
  }
}

function showItemPhotos(itemId) {
  const item = checklist.find((i) => i.id === parseInt(itemId));
  if (!item || !item.photos || item.photos.length === 0) {
    showToast('写真がありません');
    return;
  }

  // Tạo modal gallery
  const galleryModal = document.createElement('div');
  galleryModal.className = 'photo-gallery-modal';

  let photoHTML = '';
  item.photos.forEach((photo, index) => {
    // Xác định URL ảnh dựa trên định dạng dữ liệu
    // (có thể là string hoặc object với thuộc tính url)
    const photoUrl = typeof photo === 'string' ? photo : photo.url;
    const timestamp = photo.timestamp
      ? new Date(photo.timestamp).toLocaleString('ja-JP')
      : '';

    photoHTML += `
      <div class="gallery-photo-item">
        <img src="${photoUrl}" alt="Photo ${index + 1}" data-index="${index}">
        <div class="photo-actions">
          <button class="delete-gallery-photo" data-index="${index}">
            <span class="material-icons">delete</span>
          </button>
        </div>
        ${timestamp ? `<div class="photo-timestamp">${timestamp}</div>` : ''}
      </div>
    `;
  });

  galleryModal.innerHTML = `
    <div class="gallery-content">
      <div class="gallery-header">
        <h3>${item.name} の写真</h3>
        <button class="close-modal">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="gallery-body">
        ${photoHTML}
      </div>
      <div class="gallery-footer">
        <button class="add-photo-button">
          <span class="material-icons">add_a_photo</span>
          <span>写真を追加</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(galleryModal);

  requestAnimationFrame(() => {
    galleryModal.classList.add('show');
  });

  // Xử lý đóng gallery
  galleryModal.querySelector('.close-modal').addEventListener('click', () => {
    galleryModal.classList.remove('show');
    setTimeout(() => galleryModal.remove(), 300);
  });

  let startY = 0;
  let currentY = 0;
  const content = galleryModal.querySelector('.gallery-content');

  content.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  });

  content.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0) {
      // Chỉ cho phép vuốt xuống
      content.style.transform = `translateY(${diff}px)`;
    }
  });

  content.addEventListener('touchend', () => {
    const diff = currentY - startY;
    if (diff > 100) {
      // Nếu vuốt đủ xa
      galleryModal.classList.remove('show');
      setTimeout(() => galleryModal.remove(), 300);
    } else {
      content.style.transform = '';
    }
  });

  // Xử lý nút thêm ảnh
  galleryModal
    .querySelector('.add-photo-button')
    .addEventListener('click', () => {
      galleryModal.remove();
      handleItemAction(itemId, 'photo');
    });

  // Xử lý click vào ảnh để xem fullsize
  galleryModal.querySelectorAll('.gallery-photo-item img').forEach((img) => {
    img.addEventListener('click', () => {
      const index = parseInt(img.dataset.index);
      const photo = item.photos[index];
      const photoUrl = typeof photo === 'string' ? photo : photo.url;
      showFullSizePhoto(photoUrl);
    });
  });

  // Xử lý nút xóa ảnh
  galleryModal.querySelectorAll('.delete-gallery-photo').forEach((button) => {
    button.addEventListener('click', () => {
      const photoIndex = parseInt(button.dataset.index);

      if (confirm('この写真を削除しますか？')) {
        item.photos.splice(photoIndex, 1);
        updateChecklist();

        galleryModal.remove();
        if (item.photos.length > 0) {
          showItemPhotos(itemId);
        } else {
          showToast('すべての写真が削除されました');
        }
      }
    });
  });
}

// Hàm hiển thị ảnh kích thước đầy đủ
function showFullSizePhoto(url) {
  const fullsizeModal = document.createElement('div');
  fullsizeModal.className = 'fullsize-photo-modal';
  fullsizeModal.innerHTML = `
    <div class="fullsize-photo-container">
      <img src="${url}" alt="Full size photo">
      <button class="close-fullsize">
        <span class="material-icons">close</span>
      </button>
    </div>
  `;

  document.body.appendChild(fullsizeModal);

  setTimeout(() => fullsizeModal.classList.add('show'), 10);

  fullsizeModal
    .querySelector('.close-fullsize')
    .addEventListener('click', () => {
      fullsizeModal.classList.remove('show');
      setTimeout(() => fullsizeModal.remove(), 300);
    });

  fullsizeModal.addEventListener('click', (e) => {
    if (e.target === fullsizeModal) {
      fullsizeModal.classList.remove('show');
      setTimeout(() => fullsizeModal.remove(), 300);
    }
  });
}
