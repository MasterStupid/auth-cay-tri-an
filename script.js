// Thêm CSS animation cho message disappear
const style = document.createElement('style');
style.textContent = `
    @keyframes messageDisappear {
        from { 
            transform: translate(-50%, -50%) scale(1); 
            opacity: 1; 
        }
        to { 
            transform: translate(-50%, -50%) scale(0.7); 
            opacity: 0; 
        }
    }
    
    .leaf-content {
        transform: rotate(-5deg);
        line-height: 1.2;
    }
    
    .default-tree {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
    }
`;
document.head.appendChild(style);

// API endpoints configuration
const API_CONFIG = {
    baseURL: '/.netlify/functions',
    endpoints: {
        getLeaves: 'get-leaves',
        addLeaf: 'add-leaf',
        getStats: 'get-stats'
    }
};

// Enhanced GratitudeTree class với đầy đủ methods
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
        this.setupEventListeners();
        this.showLoading(false);
    }

    // Kiểm tra kết nối database
    async checkDatabaseConnection() {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/${API_CONFIG.endpoints.getLeaves}`);
            const result = await response.json();
            
            this.isOnline = result && result.success;
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
            const response = await fetch(`${API_CONFIG.baseURL}/${API_CONFIG.endpoints.getLeaves}`);
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
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
            try {
                this.leaves = JSON.parse(saved);
                this.updateUniqueSets();
                console.log(`📦 Loaded ${this.leaves.length} leaves from localStorage`);
            } catch (e) {
                console.error('Error parsing localStorage data:', e);
                this.leaves = [];
            }
        } else {
            console.log('💫 No data found, starting with empty tree');
            this.leaves = [];
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
            gradient: this.getRandomGradient(),
            created_at: new Date().toISOString()
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
            const response = await fetch(`${API_CONFIG.baseURL}/${API_CONFIG.endpoints.addLeaf}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
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
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Failed to save to database:', error);
            // Fallback to localStorage
            return this.addLeafToLocalStorage(leafData);
        }
    }

    // Thêm vào localStorage (fallback)
    addLeafToLocalStorage(leafData) {
        const newLeaf = {
            ...leafData,
            id: Date.now() + Math.random()
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
            if (leaf.name) this.uniqueStudents.add(leaf.name);
            if (leaf.teacher) this.uniqueTeachers.add(leaf.teacher);
        });
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('gratitudeLeaves', JSON.stringify(this.leaves));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
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
        const leafCount = document.getElementById('leaf-count');
        const studentCount = document.getElementById('student-count');
        const teacherCount = document.getElementById('teacher-count');
        
        if (leafCount) leafCount.textContent = this.leaves.length;
        if (studentCount) studentCount.textContent = this.uniqueStudents.size;
        if (teacherCount) teacherCount.textContent = this.uniqueTeachers.size;
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

    setupEventListeners() {
        const addButton = document.getElementById('addLeafButton');
        const closeButton = document.getElementById('closeModal');
        const form = document.getElementById('gratitudeForm');

        if (addButton) {
            addButton.addEventListener('click', this.openForm);
        }

        if (closeButton) {
            closeButton.addEventListener('click', this.closeForm);
        }

        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('formModal');
            if (event.target === modal) {
                this.closeForm();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeForm();
            }
        });
    }

    openForm() {
        document.getElementById('formModal').style.display = 'block';
    }

    closeForm() {
        document.getElementById('formModal').style.display = 'none';
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        const studentName = document.getElementById('studentName').value.trim();
        const teacherName = document.getElementById('teacherName').value.trim();
        const message = document.getElementById('message').value.trim();
        
        if (studentName && teacherName && message) {
            try {
                const newLeaf = await this.addLeaf(studentName, teacherName, message);
                
                this.closeForm();
                document.getElementById('studentName').value = '';
                document.getElementById('teacherName').value = '';
                document.getElementById('message').value = '';
                
                if (this.leaves.length === 1) {
                    showSuccessMessage('🎉 Bạn đã thêm chiếc lá đầu tiên lên cây!\n\nCảm ơn bạn đã khởi đầu cho cây tri ân này! 💚', false, 5000);
                } else {
                    showSuccessMessage('🎉 Lá tri ân của bạn đã được thêm vào cây!\n\nCây đang có ' + this.leaves.length + ' lá tri ân. 💚', false, 4000);
                }
            } catch (error) {
                showSuccessMessage('❌ Có lỗi xảy ra khi thêm lá. Vui lòng thử lại!', true);
            }
        } else {
            showSuccessMessage('❌ Vui lòng điền đầy đủ thông tin!', true);
        }
    }

    getAllLeaves() {
        return this.leaves;
    }

    getLeafById(id) {
        return this.leaves.find(leaf => leaf.id === id);
    }

    // Render leaves to the tree
    renderLeaves() {
        const container = document.getElementById('leaves-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.leaves.forEach((leaf, index) => {
            const leafElement = this.createLeafElement(leaf, index);
            container.appendChild(leafElement);
        });

        // Setup click handlers after a short delay
        setTimeout(() => this.setupLeafClickHandlers(), 100);
    }

    // Create individual leaf element
    createLeafElement(leaf, index) {
        const leafElement = document.createElement('div');
        leafElement.className = `leaf ${leaf.type || 'heart'} ${leaf.gradient || 'gradient-1'}`;
        
        leafElement.setAttribute('data-leaf-id', leaf.id);
        
        leafElement.style.left = (leaf.x || 100) + 'px';
        leafElement.style.top = (leaf.y || 100) + 'px';
        leafElement.style.animationDelay = (index * 0.1) + 's';
        
        const randomRotate = Math.random() * 360;
        leafElement.style.transform = `rotate(${randomRotate}deg)`;
        
        leafElement.innerHTML = `
            <div class="leaf-content">
                <strong>${leaf.name || 'Ẩn danh'}</strong><br>
                <small>→ ${leaf.teacher || 'Thầy/Cô'}</small>
            </div>
        `;
        
        leafElement.title = `Click để xem lời tri ân từ ${leaf.name || 'Ẩn danh'}`;
        
        return leafElement;
    }

    // Setup click handlers for leaves
    setupLeafClickHandlers() {
        const leavesContainer = document.getElementById('leaves-container');
        if (!leavesContainer) return;
        
        leavesContainer.addEventListener('click', (event) => {
            const leafElement = event.target.closest('.leaf');
            if (leafElement) {
                const leafId = leafElement.getAttribute('data-leaf-id');
                if (leafId) {
                    const leaf = this.getLeafById(leafId);
                    if (leaf) {
                        this.showLeafDetail(leaf);
                    }
                }
            }
        });
    }

    // Show leaf details
    showLeafDetail(leaf) {
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
}

// Khởi tạo ứng dụng
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
    
    if (treeContainer) {
        treeContainer.appendChild(defaultTree);
    }
}

// Global function để hiển thị thông báo
function showSuccessMessage(message, isError = false, duration = 4000) {
    const oldMsg = document.querySelector('.success-message');
    if (oldMsg) oldMsg.remove();
    
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.style.backgroundColor = isError ? '#f44336' : '#4caf50';
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
        border-radius: 50%;
        transition: background-color 0.3s;
    `;
    
    closeBtn.onclick = function() {
        successMsg.remove();
    };
    
    closeBtn.onmouseover = function() {
        this.style.backgroundColor = 'rgba(255,255,255,0.2)';
    };
    
    closeBtn.onmouseout = function() {
        this.style.backgroundColor = 'transparent';
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

// Export for global access (if needed)
window.GratitudeTree = GratitudeTree;
window.gratitudeTree = gratitudeTree;
