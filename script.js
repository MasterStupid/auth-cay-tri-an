// API Configuration
const API_BASE = '/api';

class GratitudeTree {
    constructor() {
        this.leaves = [];
        this.uniqueStudents = new Set();
        this.uniqueTeachers = new Set();
        this.isOnline = false;
        this.init();
    }

    async init() {
        this.showLoading(true);
        await this.checkDatabaseConnection();
        await this.loadLeaves();
        this.showLoading(false);
    }

    // Kiểm tra kết nối database
    async checkDatabaseConnection() {
        try {
            const response = await fetch(`${API_BASE}/get-leaves`);
            const result = await response.json();
            
            this.isOnline = result.success;
            this.updateDatabaseStatus();
            
            if (this.isOnline) {
                console.log('✅ Connected to database');
            } else {
                console.log('❌ Database connection failed, using localStorage');
            }
        } catch (error) {
            console.log('❌ Network error, using localStorage');
            this.isOnline = false;
            this.updateDatabaseStatus();
        }
    }

    // Load leaves từ database hoặc localStorage
    async loadLeaves() {
        if (this.isOnline) {
            await this.loadFromDatabase();
        } else {
            this.loadFromLocalStorage();
        }
        this.updateStats();
        this.renderLeaves();
    }

    // Load từ database
    async loadFromDatabase() {
        try {
            const response = await fetch(`${API_BASE}/get-leaves`);
            const result = await response.json();
            
            if (result.success) {
                this.leaves = result.data;
                this.updateUniqueSets();
                console.log(`✅ Loaded ${this.leaves.length} leaves from database`);
            }
        } catch (error) {
            console.error('Failed to load from database:', error);
            this.loadFromLocalStorage();
        }
    }

    // Load từ localStorage (fallback)
    loadFromLocalStorage() {
        const saved = localStorage.getItem('gratitudeLeaves');
        if (saved) {
            this.leaves = JSON.parse(saved);
            this.updateUniqueSets();
            console.log(`📦 Loaded ${this.leaves.length} leaves from localStorage`);
        } else {
            console.log('💫 No data found, starting with empty tree');
        }
    }

    // Thêm leaf mới
    async addLeaf(name, teacher, message) {
        const newLeafData = {
            name: name,
            teacher: teacher,
            message: message,
            x: Math.floor(Math.random() * 450 + 75),
            y: Math.floor(Math.random() * 550 + 100),
            type: this.getRandomLeafType(),
            gradient: this.getRandomGradient()
        };

        if (this.isOnline) {
            return await this.addLeafToDatabase(newLeafData);
        } else {
            return this.addLeafToLocalStorage(newLeafData);
        }
    }

    // Thêm vào database
    async addLeafToDatabase(leafData) {
        try {
            const response = await fetch(`${API_BASE}/add-leaf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leafData)
            });

            const result = await response.json();

            if (result.success) {
                const savedLeaf = result.data;
                this.leaves.unshift(savedLeaf);
                this.updateUniqueSets();
                this.saveToLocalStorage();
                this.updateStats();
                this.renderLeaves();
                
                return savedLeaf;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to save to database:', error);
            return this.addLeafToLocalStorage(leafData);
        }
    }

    // Thêm vào localStorage (fallback)
    addLeafToLocalStorage(leafData) {
        const newLeaf = {
            ...leafData,
            id: Date.now(),
            created_at: new Date().toISOString()
        };

        this.leaves.unshift(newLeaf);
        this.updateUniqueSets();
        this.saveToLocalStorage();
        this.updateStats();
        this.renderLeaves();
        
        return newLeaf;
    }

    // Helper functions
    updateUniqueSets() {
        this.uniqueStudents.clear();
        this.uniqueTeachers.clear();
        
        this.leaves.forEach(leaf => {
            this.uniqueStudents.add(leaf.name);
            this.uniqueTeachers.add(leaf.teacher);
        });
    }

    saveToLocalStorage() {
        localStorage.setItem('gratitudeLeaves', JSON.stringify(this.leaves));
    }

    getRandomLeafType() {
        const types = ['heart', 'maple', 'willow', 'clover'];
        return types[Math.floor(Math.random() * types.length)];
    }

    getRandomGradient() {
        const gradients = ['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4'];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }

    updateStats() {
        document.getElementById('leaf-count').textContent = this.leaves.length;
        document.getElementById('student-count').textContent = this.uniqueStudents.size;
        document.getElementById('teacher-count').textContent = this.uniqueTeachers.size;
    }

    updateDatabaseStatus() {
        const statusElement = document.getElementById('db-status');
        if (statusElement) {
            if (this.isOnline) {
                statusElement.innerHTML = '🟢 Đã kết nối database';
                statusElement.style.color = '#2e7d32';
            } else {
                statusElement.innerHTML = '🟡 Đang dùng localStorage (offline)';
                statusElement.style.color = '#ff9800';
            }
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    getAllLeaves() {
        return this.leaves;
    }

    getLeafById(id) {
        return this.leaves.find(leaf => leaf.id === id);
    }
}

// Khởi tạo
const gratitudeTree = new GratitudeTree();

// Hàm thay thế hình cây nếu lỗi
function replaceTreeImage() {
    const treeContainer = document.querySelector('.tree-container');
    const treeImage = document.querySelector('.tree-image');
    
    if (treeImage) {
        treeImage.style.display = 'none';
    }
    
    const defaultTree = document.createElement('div');
    defaultTree.className = 'default-tree';
    defaultTree.innerHTML = `
        <div style="text-align: center; color: #666; padding: 50px;">
            <div style="font-size: 4em; margin-bottom: 20px;">🌳</div>
            <h3>Cây Tri Ân</h3>
            <p>Hình cây đang được tải...</p>
        </div>
    `;
    
    treeContainer.appendChild(defaultTree);
}

// Hiển thị tất cả lá
function renderLeaves() {
    const container = document.getElementById('leaves-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const leaves = gratitudeTree.getAllLeaves();
    
    leaves.forEach((leaf, index) => {
        const leafElement = createLeafElement(leaf, index);
        container.appendChild(leafElement);
    });
}

// Tạo element lá
function createLeafElement(leaf, index) {
    const leafElement = document.createElement('div');
    leafElement.className = `leaf ${leaf.type} ${leaf.gradient}`;
    
    leafElement.setAttribute('data-leaf-id', leaf.id);
    
    leafElement.style.left = leaf.x + 'px';
    leafElement.style.top = leaf.y + 'px';
    leafElement.style.animationDelay = (index * 0.1) + 's';
    
    const randomRotate = Math.random() * 360;
    leafElement.style.transform = `rotate(${randomRotate}deg)`;
    
    leafElement.innerHTML = `
        <div class="leaf-content">
            <strong>${leaf.name}</strong><br>
            <small>→ ${leaf.teacher}</small>
        </div>
    `;
    
    leafElement.title = `Click để xem lời tri ân từ ${leaf.name}`;
    
    return leafElement;
}

// Hiển thị chi tiết lá
function showLeafDetail(leaf) {
    if (!leaf) return;
    
    const time = new Date(leaf.created_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const message = `💌 Lời tri ân:\n"${leaf.message}"\n\n👤 ${leaf.name}\n🎓 Gửi ${leaf.teacher}\n📅 ${time}`;
    
    showSuccessMessage(message, false, 8000);
}

// Hiển thị thông báo
function showSuccessMessage(message, isError = false, duration = 4000) {
    const oldMsg = document.querySelector('.success-message');
    if (oldMsg) oldMsg.remove();
    
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = message.replace(/\n/g, '<br>');
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    closeBtn.onclick = function() {
        successMsg.remove();
    };
    
    successMsg.appendChild(closeBtn);
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.style.animation = 'messageDisappear 0.3s ease';
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            }, 300);
        }
    }, duration);
}

// Xử lý sự kiện click trên lá
function setupLeafClickHandlers() {
    const leavesContainer = document.getElementById('leaves-container');
    if (!leavesContainer) return;
    
    leavesContainer.addEventListener('click', function(event) {
        const leafElement = event.target.closest('.leaf');
        if (leafElement) {
            const leafId = parseInt(leafElement.getAttribute('data-leaf-id'));
            if (leafId) {
                const leaf = gratitudeTree.getLeafById(leafId);
                if (leaf) {
                    showLeafDetail(leaf);
                }
            }
        }
    });
}

// Modal functions
function openForm() {
    document.getElementById('formModal').style.display = 'block';
}

function closeForm() {
    document.getElementById('formModal').style.display = 'none';
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    renderLeaves();
    setupLeafClickHandlers();
    
    const addButton = document.getElementById('addLeafButton');
    const closeButton = document.getElementById('closeModal');
    const form = document.getElementById('gratitudeForm');
    
    if (addButton) {
        addButton.addEventListener('click', openForm);
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeForm);
    }
    
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const studentName = document.getElementById('studentName').value.trim();
            const teacherName = document.getElementById('teacherName').value.trim();
            const message = document.getElementById('message').value.trim();
            
            if (studentName && teacherName && message) {
                const newLeaf = await gratitudeTree.addLeaf(studentName, teacherName, message);
                
                closeForm();
                document.getElementById('studentName').value = '';
                document.getElementById('teacherName').value = '';
                document.getElementById('message').value = '';
                
                if (gratitudeTree.leaves.length === 1) {
                    showSuccessMessage('🎉 Bạn đã thêm chiếc lá đầu tiên lên cây!\n\nCảm ơn bạn đã khởi đầu cho cây tri ân này! 💚', false, 5000);
                } else {
                    showSuccessMessage('🎉 Lá tri ân của bạn đã được thêm vào cây!\n\nCây đang có ' + gratitudeTree.leaves.length + ' lá tri ân. 💚', false, 4000);
                }
            } else {
                showSuccessMessage('❌ Vui lòng điền đầy đủ thông tin!', true);
            }
        });
    }
    
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('formModal');
        if (event.target === modal) {
            closeForm();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeForm();
        }
    });
});

// Cập nhật lại leaf click handlers
const originalRenderLeaves = renderLeaves;
renderLeaves = function() {
    originalRenderLeaves();
    setTimeout(setupLeafClickHandlers, 100);
};
