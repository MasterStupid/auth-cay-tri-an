// Sử dụng relative paths cho Netlify
const API_BASE = '';

class GratitudeTree {
    async loadLeaves() {
        try {
            const response = await fetch('/api/get-leaves');
            const result = await response.json();
            
            if (result.success) {
                this.leaves = result.data;
                this.renderLeaves();
            }
        } catch (error) {
            console.error('Failed to load from API:', error);
            this.loadFromLocalStorage(); // Fallback
        }
    }

    async addLeaf(name, teacher, message) {
        try {
            const response = await fetch('/api/add-leaf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name, teacher, message,
                    x: Math.floor(Math.random() * 450 + 75),
                    y: Math.floor(Math.random() * 550 + 100),
                    type: this.getRandomLeafType(),
                    gradient: this.getRandomGradient()
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.leaves.unshift(result.data);
                this.renderLeaves();
                return result.data;
            }
        } catch (error) {
            console.error('Failed to save to API:', error);
            return this.addLeafToLocalStorage(name, teacher, message);
        }
    }
}
